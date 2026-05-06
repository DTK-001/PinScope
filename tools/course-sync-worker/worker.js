const DATA_KEY = "published-courses";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (request.method === "GET") {
        return json(await readPublishedCourses(env));
      }

      if (request.method === "POST") {
        requireAdmin(request, env);
        const body = await request.json();
        const incomingCourses = normalizeIncomingCourses(body);
        if (!incomingCourses.length) {
          return json({ error: "No valid course data was supplied." }, 400);
        }

        const current = await readPublishedCourses(env);
        const byId = new Map((current.courses || []).map((course) => [course.id, course]));
        const now = new Date().toISOString();

        incomingCourses.forEach((course) => {
          byId.set(course.id, {
            ...course,
            source: course.source || "shared",
            geometrySource: course.geometrySource || "PinScope Cloud",
            publishedAt: body.publishedAt || now,
            updatedAt: now
          });
        });

        const next = {
          schema: "pinscope-published-courses-v1",
          updatedAt: now,
          courses: Array.from(byId.values()).sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id)))
        };

        await env.PINSCOPE_COURSES.put(DATA_KEY, JSON.stringify(next));
        return json({ ok: true, ...next });
      }

      return json({ error: "Method not allowed." }, 405);
    } catch (error) {
      return json({ error: error.message || "Course sync failed." }, error.status || 500);
    }
  }
};

async function readPublishedCourses(env) {
  const stored = await env.PINSCOPE_COURSES.get(DATA_KEY, "json");
  if (stored && Array.isArray(stored.courses)) {
    return stored;
  }
  return { schema: "pinscope-published-courses-v1", updatedAt: null, courses: [] };
}

function requireAdmin(request, env) {
  const configuredToken = env.PINSCOPE_ADMIN_TOKEN || "";
  if (!configuredToken) {
    const error = new Error("PINSCOPE_ADMIN_TOKEN is not configured on the sync worker.");
    error.status = 500;
    throw error;
  }

  const header = request.headers.get("Authorization") || "";
  const suppliedToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!suppliedToken || suppliedToken !== configuredToken) {
    const error = new Error("Admin token is missing or invalid.");
    error.status = 401;
    throw error;
  }
}

function normalizeIncomingCourses(body) {
  const courses = Array.isArray(body?.courses) ? body.courses : body?.course ? [body.course] : [];
  return courses
    .filter((course) => course && typeof course === "object" && course.id && Array.isArray(course.holes))
    .map((course) => ({
      ...course,
      source: course.source || "shared",
      geometrySource: course.geometrySource || "PinScope Cloud"
    }));
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
