// BotInterface.js
// Uses Gemini REST API to extract intent, then uses TMDB to fetch results.
// Exports default async function PopcornInterface(query)

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
// Optional base for internal links fallback to your domain
const SITE_BASE = import.meta.env.VITE_SITE_BASE || "https://moviesbox-delta.vercel.app";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
  GEMINI_KEY;

const SYSTEM_PROMPT = `
You are Dobby, a smart movie assistant. Analyze the user's request and return ONLY valid JSON with this exact shape:

{
  "summary": "<short human-friendly summary>",
  "type": "movie" or "tv",
  "genre_name": "<genre name or null>",
  "genre_id": <tmdb genre id number or null>,
  "actor": "<actor name or null>",
  "director": "<director name or null>",
  "year": <exact year or null>,
  "year_after": <min year or null>,
  "year_before": <max year or null>,
  "min_rating": <minimum rating number or null>,
  "limit": <number of results requested or null>
}

Make JSON strict and nothing else. If the user asked for "top 20" set "limit":20. If no number requested, do not set limit (null).
`;

// small genre map fallback (same ids as TMDB)
const GENRE_MAP = {
  action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
  documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
  horror: 27, music: 10402, mystery: 9648, romance: 10749,
  sci_fi: 878, scifi: 878, "sci-fi": 878, thriller: 53, war: 10752, western: 37
};

function safeParseJSON(str) {
  try {
    // remove code fences if any
    let t = String(str || "");
    if (t.startsWith("```")) {
      t = t.split("```").slice(1).join("```");
    }
    const s = t.indexOf("{");
    const e = t.lastIndexOf("}");
    if (s === -1 || e === -1) return null;
    const js = t.slice(s, e + 1);
    return JSON.parse(js);
  } catch (err) {
    return null;
  }
}

async function callGemini(userQuery) {
  const body = {
    contents: [
      { role: "system", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "user", parts: [{ text: userQuery }] },
    ],
    // keep temperature low, we want structured JSON
    temperature: 0.2,
    max_output_tokens: 1024,
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Gemini error: " + res.status + " " + txt);
  }

  const data = await res.json();
  // Attempt to extract text candidate
  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    data?.candidates?.[0]?.content?.[0]?.text ||
    data?.output?.[0]?.content?.[0]?.text ||
    "";

  return reply;
}

// TMDB helpers
async function getPersonId(name) {
  if (!name) return null;
  const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}&page=1`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  return j.results?.[0]?.id || null;
}

async function discoverTMDB(filters, limit = 10) {
  // prefer discover endpoint; TMDB returns up to 20 per page
  const type = filters.type === "tv" ? "tv" : "movie";
  const url = new URL(`https://api.themoviedb.org/3/discover/${type}`);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("page", "1");

  if (filters.genre_id) url.searchParams.set("with_genres", String(filters.genre_id));
  if (filters.min_rating) url.searchParams.set("vote_average.gte", String(filters.min_rating));
  if (filters.year) {
    if (type === "tv") url.searchParams.set("first_air_date_year", String(filters.year));
    else url.searchParams.set("primary_release_year", String(filters.year));
  }
  if (filters.year_after) {
    const key = type === "tv" ? "first_air_date.gte" : "primary_release_date.gte";
    url.searchParams.set(key, `${filters.year_after}-01-01`);
  }
  if (filters.year_before) {
    const key = type === "tv" ? "first_air_date.lte" : "primary_release_date.lte";
    url.searchParams.set(key, `${filters.year_before}-12-31`);
  }

  const r = await fetch(url.toString());
  if (!r.ok) return [];
  const j = await r.json();
  return (j.results || []).slice(0, limit);
}

export default async function PopcornInterface(userQuery) {
  try {
    // 1) Ask Gemini to produce strict JSON intent
    const raw = await callGemini(userQuery);
    const parsed = safeParseJSON(raw);

    // fallback if parsing failed — do a small heuristic fallback
    let intent = parsed;
    if (!intent) {
      // simple fallback parser (very small): extract numbers and genre words
      const q = userQuery.toLowerCase();
      const numberMatch = q.match(/\b([0-9]{1,2})\b/);
      const limit = numberMatch ? Number(numberMatch[1]) : null;
      let genre_id = null;
      for (const g of Object.keys(GENRE_MAP)) {
        if (q.includes(g)) {
          genre_id = GENRE_MAP[g];
          break;
        }
      }
      intent = {
        summary: `Searching for movies matching: ${userQuery}`,
        type: /tv|series|show/.test(q) ? "tv" : "movie",
        genre_name: null,
        genre_id,
        actor: null,
        director: null,
        year: null,
        year_after: null,
        year_before: null,
        min_rating: null,
        limit: limit,
      };
    }

    // 2) normalize genre id if genre_name present
    if (intent.genre_name && !intent.genre_id) {
      const key = intent.genre_name.toLowerCase().replace(/\s+/g, "_");
      intent.genre_id = GENRE_MAP[key] || null;
    }

    // 3) determine limit (default 10)
    let limit = 10;
    if (intent.limit && Number.isFinite(Number(intent.limit))) {
      limit = Math.max(1, Math.min(50, Number(intent.limit))); // clamp 1..50
    } else {
      // if user query contains a number (like "top 20"), use it
      const nm = userQuery.match(/\b([0-9]{1,2})\b/);
      if (nm) limit = Math.max(1, Math.min(50, Number(nm[1])));
    }

    // 4) fetch movies using prioritized strategy: actor -> director -> discover
    let movies = [];
    if (intent.actor) {
      const pid = await getPersonId(intent.actor);
      if (pid) {
        // use discover with_cast
        const url = new URL("https://api.themoviedb.org/3/discover/movie");
        url.searchParams.set("api_key", TMDB_KEY);
        url.searchParams.set("with_cast", String(pid));
        url.searchParams.set("sort_by", "popularity.desc");
        const r = await fetch(url.toString());
        if (r.ok) {
          const j = await r.json();
          movies = j.results || [];
        }
      }
    } else if (intent.director) {
      const pid = await getPersonId(intent.director);
      if (pid) {
        // fetch credits and get directed works
        const url = `https://api.themoviedb.org/3/person/${pid}/movie_credits?api_key=${TMDB_KEY}`;
        const r = await fetch(url);
        if (r.ok) {
          const j = await r.json();
          // crew entries with job Director
          movies = (j.crew || []).filter((c) => c.job && c.job.toLowerCase().includes("director"));
        }
      }
    }

    // fallback to discover if still empty
    if (!movies || movies.length === 0) {
      movies = await discoverTMDB(intent, limit);
    }

    // 5) client-side final filtering & sorting by relevance approximation
    movies = (movies || []).filter((m) => {
      // filter by rating
      if (intent.min_rating && (m.vote_average || 0) < Number(intent.min_rating)) return false;
      // filter by year constraints
      const y = (m.release_date || m.first_air_date || "").slice(0, 4);
      if (intent.year && y && Number(y) !== Number(intent.year)) return false;
      if (intent.year_after && y && Number(y) <= Number(intent.year_after)) return false;
      if (intent.year_before && y && Number(y) >= Number(intent.year_before)) return false;
      // genre filter handled by discover, but double-check
      if (intent.genre_id && Array.isArray(m.genre_ids) && m.genre_ids.length && !m.genre_ids.includes(Number(intent.genre_id))) return false;
      return true;
    });

    // 6) sort: prefer higher vote_average and then popularity
    movies.sort((a, b) => {
      const av = a.vote_average || 0;
      const bv = b.vote_average || 0;
      if (bv !== av) return bv - av;
      const ap = a.popularity || 0;
      const bp = b.popularity || 0;
      return bp - ap;
    });

    // limit results
    const top = (movies || []).slice(0, limit).map(m => ({
      id: m.id,
      title: m.title || m.name,
      overview: m.overview || "",
      poster_path: m.poster_path,
      vote_average: m.vote_average,
      release_date: m.release_date || m.first_air_date,
      tmdb: `https://www.themoviedb.org/${m.media_type || "movie"}/${m.id}`,
      local: `${SITE_BASE}/info?id=${m.id}` // link to your site
    }));

    return {
      summary: intent.summary || `Searching for "${userQuery}"`,
      movies: top
    };
  } catch (err) {
    console.error("PopcornInterface error", err);
    return {
      summary: "⚠️ Error: could not fetch results right now.",
      movies: []
    };
  }
}
