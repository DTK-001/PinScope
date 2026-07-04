import { supabaseConfig } from "./supabase-config.js";
import {
  clearAnonymousState,
  hasStateForAccount,
  loadState,
  loadStateForAccount,
  rememberStateAccount,
  saveState,
  useStateAccount
} from "./storage.js";

const DELETE_QUEUE_PREFIX = "pinscope:cloud-round-deletions:v1:";
const AUTH_SESSION_KEY = "pinscope:supabase-auth-session:v1";
const SYNC_DELAY_MS = 1200;
const AUTH_REFRESH_LEEWAY_MS = 60000;

let client = null;
let currentUser = null;
let hydratedUserId = "";
let hydrationPromise = null;
let syncTimer = null;
let syncPromise = null;
let callbacks = {
  getState: () => null,
  onState: () => {},
  onStatus: () => {}
};
let status = {
  phase: "loading",
  email: "",
  message: "Connecting account...",
  lastSyncAt: ""
};

export function accountStatus() {
  return { ...status, signedIn: Boolean(currentUser), userId: currentUser?.id || "" };
}

export async function initializeAccountSync(options = {}) {
  callbacks = { ...callbacks, ...options };
  setStatus({ phase: "loading", message: "Connecting account..." });
  try {
    client = createSupabaseRestClient();
    client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => handleSession(session).catch(handleAccountError), 0);
    });
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw error;
    }
    await handleSession(data.session);
  } catch (error) {
    handleAccountError(error);
  }
}

export async function sendAccountMagicLink(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !client) {
    throw new Error(client ? "Enter your email address." : "Account service is still loading.");
  }
  setStatus({ phase: "sending", email: normalized, message: "Sending sign-in email..." });
  const redirectTo = accountEmailRedirectUrl();
  const { error } = await client.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true }
  });
  if (error) {
    handleAccountError(error);
    throw error;
  }
  setStatus({
    phase: "email-sent",
    email: normalized,
    message: "Check your email and open the PinScope sign-in link."
  });
}

function accountEmailRedirectUrl() {
  const configured = normalizeRedirectUrl(supabaseConfig.authRedirectUrl);
  const current = normalizeRedirectUrl(`${window.location.origin}${window.location.pathname}`);
  if (configured) {
    return configured;
  }
  return current || configured || window.location.href.split(/[?#]/)[0];
}

function normalizeRedirectUrl(value) {
  try {
    const url = new URL(String(value || ""), window.location.href);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function createSupabaseRestClient() {
  const listeners = new Set();
  let session = null;

  const notify = (event, nextSession) => {
    listeners.forEach((listener) => listener(event, nextSession));
  };

  const setSession = (nextSession, event = "SIGNED_IN") => {
    session = nextSession;
    if (session) {
      writeAuthSession(session);
    } else {
      clearAuthSession();
    }
    notify(event, session);
  };

  const auth = {
    onAuthStateChange(listener) {
      listeners.add(listener);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(listener)
          }
        }
      };
    },
    async getSession() {
      try {
        const redirectSession = readAuthRedirectSession();
        if (redirectSession) {
          session = await completeAuthSession(redirectSession);
          writeAuthSession(session);
          return { data: { session }, error: null };
        }

        session = readAuthSession();
        if (session?.refresh_token && authSessionNeedsRefresh(session)) {
          session = await refreshAuthSession(session.refresh_token);
          writeAuthSession(session);
        } else if (session?.access_token && !session.user) {
          session = await completeAuthSession(session);
          writeAuthSession(session);
        }
        return { data: { session }, error: null };
      } catch (error) {
        clearAuthSession();
        session = null;
        return { data: { session: null }, error };
      }
    },
    async signInWithOtp({ email, options = {} }) {
      try {
        await authRequest("otp", {
          method: "POST",
          query: options.emailRedirectTo ? { redirect_to: options.emailRedirectTo } : null,
          body: {
            email,
            create_user: options.shouldCreateUser !== false
          }
        });
        return { data: {}, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    async signOut() {
      try {
        if (session?.access_token) {
          await authRequest("logout", {
            method: "POST",
            token: session.access_token
          });
        }
        setSession(null, "SIGNED_OUT");
        return { error: null };
      } catch (error) {
        return { error };
      }
    }
  };

  return {
    auth,
    from(table) {
      return createRestTableClient(table, () => session);
    }
  };
}

function createRestTableClient(table, getSession) {
  return {
    select(columns = "*") {
      return createRestQuery(table, getSession, {
        method: "GET",
        query: { select: columns }
      });
    },
    upsert(body, options = {}) {
      const query = options.onConflict ? { on_conflict: options.onConflict } : {};
      return restRequest(table, getSession, {
        method: "POST",
        query,
        body,
        prefer: "resolution=merge-duplicates"
      });
    },
    delete() {
      return createRestQuery(table, getSession, { method: "DELETE" });
    }
  };
}

function createRestQuery(table, getSession, options) {
  const query = { ...(options.query || {}) };
  const api = {
    eq(column, value) {
      query[column] = `eq.${value}`;
      return api;
    },
    in(column, values) {
      query[column] = `in.(${(values || []).map(restFilterValue).join(",")})`;
      return api;
    },
    maybeSingle() {
      return restRequest(table, getSession, { ...options, query })
        .then((result) => ({
          ...result,
          data: Array.isArray(result.data) ? result.data[0] || null : result.data || null
        }));
    },
    then(resolve, reject) {
      return restRequest(table, getSession, { ...options, query }).then(resolve, reject);
    },
    catch(reject) {
      return restRequest(table, getSession, { ...options, query }).catch(reject);
    }
  };
  return api;
}

async function restRequest(table, getSession, { method, query = {}, body, prefer = "" }) {
  try {
    const session = getSession();
    const url = supabaseUrl(`rest/v1/${table}`, query);
    const response = await fetch(url, {
      method,
      headers: supabaseHeaders(session?.access_token, {
        Prefer: prefer,
        ...(method === "GET" ? {} : { "Content-Type": "application/json" })
      }),
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await readSupabaseResponse(response);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

async function authRequest(path, { method = "GET", query = null, body, token = "" } = {}) {
  const response = await fetch(supabaseUrl(`auth/v1/${path}`, query), {
    method,
    headers: supabaseHeaders(token, method === "GET" ? {} : { "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return readSupabaseResponse(response);
}

async function readSupabaseResponse(response) {
  let payload = null;
  const text = await response.text().catch(() => "");
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  if (!response.ok) {
    const message = typeof payload === "string"
      ? payload
      : payload?.msg || payload?.message || payload?.error_description || payload?.error || `Account request failed (${response.status}).`;
    throw new Error(message);
  }
  return payload;
}

function supabaseUrl(path, query = null) {
  const url = new URL(path, `${supabaseConfig.url.replace(/\/+$/, "")}/`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

function supabaseHeaders(token = "", extra = {}) {
  const headers = {
    apikey: supabaseConfig.publishableKey,
    Authorization: `Bearer ${token || supabaseConfig.publishableKey}`
  };
  Object.entries(extra).forEach(([key, value]) => {
    if (value) {
      headers[key] = value;
    }
  });
  return headers;
}

function readAuthRedirectSession() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const params = new URLSearchParams(hash);
  if (params.get("error") || params.get("error_description")) {
    clearAuthRedirectHash();
    throw new Error(params.get("error_description") || params.get("error") || "Sign-in link could not be used.");
  }
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) {
    return null;
  }
  const expiresIn = Number(params.get("expires_in") || 3600);
  clearAuthRedirectHash();
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: params.get("token_type") || "bearer",
    expires_at: Math.floor(Date.now() / 1000) + (Number.isFinite(expiresIn) ? expiresIn : 3600)
  };
}

function clearAuthRedirectHash() {
  window.history.replaceState(null, "", `${window.location.origin}${window.location.pathname}${window.location.search}`);
}

async function completeAuthSession(value) {
  const user = await authRequest("user", { token: value.access_token });
  return {
    ...value,
    user,
    expires_at: Number(value.expires_at) || Math.floor(Date.now() / 1000) + 3600
  };
}

async function refreshAuthSession(refreshToken) {
  const session = await authRequest("token", {
    method: "POST",
    query: { grant_type: "refresh_token" },
    body: { refresh_token: refreshToken }
  });
  return completeAuthSession(session);
}

function authSessionNeedsRefresh(session) {
  const expiresAt = Number(session?.expires_at || 0) * 1000;
  return expiresAt > 0 && expiresAt - Date.now() <= AUTH_REFRESH_LEEWAY_MS;
}

function readAuthSession() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || "null");
    return parsed?.access_token && parsed?.refresh_token ? parsed : null;
  } catch {
    return null;
  }
}

function writeAuthSession(session) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function restFilterValue(value) {
  return String(value ?? "").replaceAll('"', '\\"');
}

export async function signOutAccount() {
  if (!client) {
    return;
  }
  const { error } = await client.auth.signOut();
  if (error) {
    handleAccountError(error);
    throw error;
  }
  await handleSession(null);
}

export function scheduleAccountSync() {
  if (!currentUser || !hydratedUserId) {
    return;
  }
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncAccountNow().catch(handleAccountError);
  }, SYNC_DELAY_MS);
}

export async function syncAccountNow() {
  if (!client || !currentUser || !navigator.onLine) {
    return false;
  }
  if (!hydratedUserId) {
    await hydrateAccount(currentUser);
    return true;
  }
  if (syncPromise) {
    return syncPromise;
  }
  syncPromise = performSync()
    .finally(() => {
      syncPromise = null;
    });
  return syncPromise;
}

export function queueCloudRoundDeletion(roundId) {
  if (!currentUser || !roundId) {
    return;
  }
  const queue = readDeleteQueue(currentUser.id);
  if (!queue.includes(roundId)) {
    writeDeleteQueue(currentUser.id, [...queue, roundId]);
  }
  scheduleAccountSync();
}

async function handleSession(session) {
  const user = session?.user || null;
  if (!user) {
    currentUser = null;
    hydratedUserId = "";
    hydrationPromise = null;
    rememberStateAccount("");
    callbacks.onState(loadState());
    setStatus({ phase: "signed-out", email: "", message: "Sign in to sync your PinScope data.", lastSyncAt: "" });
    return;
  }

  currentUser = user;
  if (hydratedUserId === user.id) {
    setStatus({ phase: "signed-in", email: user.email || "", message: "Your PinScope data is synced." });
    return;
  }
  if (!hydrationPromise) {
    hydrationPromise = hydrateAccount(user)
      .finally(() => {
        hydrationPromise = null;
      });
  }
  await hydrationPromise;
}

async function hydrateAccount(user) {
  setStatus({ phase: "syncing", email: user.email || "", message: "Loading your PinScope data..." });
  const anonymousState = callbacks.getState();
  const hadAccountState = hasStateForAccount(user.id);
  const accountState = loadStateForAccount(user.id);
  rememberStateAccount(user.id);
  if (hadAccountState) {
    callbacks.onState(accountState);
  }

  try {
    await flushDeleteQueue(user.id);
    const remote = await fetchRemoteState(user.id);
    let nextState;
    if (remote.hasData) {
      nextState = mergeRemoteState(accountState, remote);
      await pushState(user.id, nextState, false);
    } else {
      nextState = hadAccountState ? accountState : anonymousState;
      saveState(nextState);
      await pushState(user.id, nextState, true);
      if (!hadAccountState) {
        clearAnonymousState();
      }
    }
    useStateAccount(user.id);
    saveState(nextState);
    hydratedUserId = user.id;
    callbacks.onState(nextState);
    setStatus({
      phase: "signed-in",
      email: user.email || "",
      message: "Your PinScope data is synced.",
      lastSyncAt: new Date().toISOString()
    });
  } catch (error) {
    if (hadAccountState) {
      useStateAccount(user.id);
      callbacks.onState(accountState);
    } else {
      rememberStateAccount("");
      callbacks.onState(anonymousState);
    }
    throw error;
  }
}

async function fetchRemoteState(userId) {
  const [settingsResult, roundsResult] = await Promise.all([
    client
      .from("user_settings")
      .select("selected_course_id,active_round_id,clubs,settings,profile_data,updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("user_rounds")
      .select("round_id,round_data,updated_at")
      .eq("user_id", userId)
  ]);
  if (settingsResult.error) {
    throw settingsResult.error;
  }
  if (roundsResult.error) {
    throw roundsResult.error;
  }
  return {
    settings: settingsResult.data || null,
    rounds: roundsResult.data || [],
    hasData: Boolean(settingsResult.data || roundsResult.data?.length)
  };
}

function mergeRemoteState(localState, remote) {
  const localRounds = new Map((localState.rounds || []).map((round) => [round.id, round]));
  (remote.rounds || []).forEach((row) => {
    const cloudRound = row.round_data;
    const localRound = localRounds.get(row.round_id);
    if (!localRound || roundTime(cloudRound, row.updated_at) >= roundTime(localRound)) {
      localRounds.set(row.round_id, cloudRound);
    }
  });
  const rounds = Array.from(localRounds.values()).sort((a, b) => roundTime(b) - roundTime(a));
  const settings = remote.settings;
  const profile = settings?.profile_data && typeof settings.profile_data === "object"
    ? settings.profile_data
    : {};
  const activeRoundId = rounds.some((round) => round.id === settings?.active_round_id && round.status === "active")
    ? settings.active_round_id
    : "";
  return {
    ...localState,
    selectedCourseId: settings?.selected_course_id || localState.selectedCourseId,
    activeRoundId,
    clubs: Array.isArray(settings?.clubs) && settings.clubs.length ? settings.clubs : localState.clubs,
    settings: settings?.settings && typeof settings.settings === "object" ? settings.settings : localState.settings,
    activeBagId: profile.activeBagId || localState.activeBagId,
    bags: Array.isArray(profile.bags) && profile.bags.length ? profile.bags : localState.bags,
    rounds
  };
}

async function performSync() {
  const userId = currentUser.id;
  setStatus({ phase: "syncing", message: "Syncing changes..." });
  await flushDeleteQueue(userId);
  const state = callbacks.getState();
  await pushState(userId, state, false);
  const now = new Date().toISOString();
  setStatus({ phase: "signed-in", message: "Your PinScope data is synced.", lastSyncAt: now });
  return true;
}

async function pushState(userId, state, forceRounds) {
  const now = new Date().toISOString();
  const settingsResult = await client.from("user_settings").upsert({
    user_id: userId,
    selected_course_id: state.selectedCourseId || null,
    active_round_id: state.activeRoundId || null,
    clubs: state.clubs || [],
    settings: state.settings || {},
    profile_data: {
      activeBagId: state.activeBagId || "",
      bags: state.bags || [],
      clubs: state.clubs || [],
      settings: state.settings || {}
    },
    updated_at: now
  }, { onConflict: "user_id" });
  if (settingsResult.error) {
    throw settingsResult.error;
  }

  const rounds = state.rounds || [];
  if (!rounds.length) {
    return;
  }
  let roundsToPush = rounds;
  if (!forceRounds) {
    const remoteResult = await client
      .from("user_rounds")
      .select("round_id,updated_at")
      .eq("user_id", userId);
    if (remoteResult.error) {
      throw remoteResult.error;
    }
    const remoteTimes = new Map((remoteResult.data || []).map((row) => [row.round_id, Date.parse(row.updated_at) || 0]));
    roundsToPush = rounds.filter((round) => roundTime(round) > (remoteTimes.get(round.id) || 0));
  }
  if (!roundsToPush.length) {
    return;
  }
  const roundRows = roundsToPush.map((round) => ({
    user_id: userId,
    round_id: round.id,
    round_data: round,
    updated_at: roundDate(round)
  }));
  const roundsResult = await client
    .from("user_rounds")
    .upsert(roundRows, { onConflict: "user_id,round_id" });
  if (roundsResult.error) {
    throw roundsResult.error;
  }
}

async function flushDeleteQueue(userId) {
  const queue = readDeleteQueue(userId);
  if (!queue.length || !client || !navigator.onLine) {
    return;
  }
  const result = await client
    .from("user_rounds")
    .delete()
    .eq("user_id", userId)
    .in("round_id", queue);
  if (result.error) {
    throw result.error;
  }
  writeDeleteQueue(userId, []);
}

function roundTime(round, fallback = "") {
  return Date.parse(round?.updatedAt || round?.completedAt || round?.startedAt || fallback || "") || 0;
}

function roundDate(round) {
  const timestamp = round?.updatedAt || round?.completedAt || round?.startedAt;
  return Number.isFinite(Date.parse(timestamp || "")) ? timestamp : new Date().toISOString();
}

function readDeleteQueue(userId) {
  try {
    const value = JSON.parse(localStorage.getItem(`${DELETE_QUEUE_PREFIX}${userId}`) || "[]");
    return Array.isArray(value) ? value.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeDeleteQueue(userId, queue) {
  localStorage.setItem(`${DELETE_QUEUE_PREFIX}${userId}`, JSON.stringify(queue));
}

function handleAccountError(error) {
  const raw = String(error?.message || error || "Account sync failed.");
  const message = /failed to fetch|networkerror|load failed/i.test(raw)
    ? "Could not reach the PinScope account service. Check your connection and try again."
    : /user_settings|user_rounds|relation .* does not exist/i.test(raw)
      ? "Account database is not ready. Run supabase/schema.sql in the Supabase SQL Editor."
      : raw;
  setStatus({ phase: "error", message });
}

function setStatus(update) {
  status = { ...status, ...update };
  callbacks.onStatus(accountStatus());
}

window.addEventListener("online", () => {
  syncAccountNow().catch(handleAccountError);
});
