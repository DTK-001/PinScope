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

const SUPABASE_SDK_URL = "https://esm.sh/@supabase/supabase-js@2.108.2?bundle";
const DELETE_QUEUE_PREFIX = "pinscope:cloud-round-deletions:v1:";
const SYNC_DELAY_MS = 1200;

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
    const module = await import(SUPABASE_SDK_URL);
    client = module.createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
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
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
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
      .select("selected_course_id,active_round_id,clubs,settings,updated_at")
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
  const activeRoundId = rounds.some((round) => round.id === settings?.active_round_id && round.status === "active")
    ? settings.active_round_id
    : "";
  return {
    ...localState,
    selectedCourseId: settings?.selected_course_id || localState.selectedCourseId,
    activeRoundId,
    clubs: Array.isArray(settings?.clubs) && settings.clubs.length ? settings.clubs : localState.clubs,
    settings: settings?.settings && typeof settings.settings === "object" ? settings.settings : localState.settings,
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
  const message = /user_settings|user_rounds|relation .* does not exist/i.test(raw)
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
