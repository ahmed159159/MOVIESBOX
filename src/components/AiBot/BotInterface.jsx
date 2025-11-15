// ===========================
// 🔥 Popcorn AI Bot (Fireworks) — FIXED
// ===========================

const FIREWORKS_API_KEY = import.meta.env.VITE_FIREWORKS_API_KEY;
const FIREWORKS_MODEL = import.meta.env.VITE_FIREWORKS_MODEL;
const TMDB_KEY = import.meta.env.VITE_TMDB_KEY;

// TMDB GENRE MAP
const GENRES = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  sci_fi: 878,
  thriller: 53,
  war: 10752
};

// ----------- Conversation memory -----------
let memoryFilters = {};

let conversation = [
  {
    role: "system",
    content: `
You are Dobby, a smart movie assistant.
You ALWAYS reply with a single clean JSON object only.

FORMAT:
{
 "type": "movie",
 "genre": "<genre or null>",
 "actor": "<actor name or null>",
 "director": "<director name or null>",
 "year": "<exact year or null>",
 "year_after": "<minimum year or null>",
 "year_before": "<maximum year or null>",
 "rating": "<minimum rating or null>",
 "limit": "<number or null>",
 "summary": "<short English summary>"
}

Rules:
- If user gives new detail like "from 2015", merge it with previous filters.
- Never ask questions.
- Never talk outside JSON.
`
  }
];

// ----------- FIREWORKS REQUEST -----------
async function fireworksQuery(prompt) {
  conversation.push({ role: "user", content: prompt });

  const res = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIREWORKS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: FIREWORKS_MODEL,
      messages: conversation,
      max_tokens: 200,
      temperature: 0.2
    })
  });

  const data = await res.json();
  let txt = data?.choices?.[0]?.message?.content || "";

  // clean JSON
  txt = txt.trim();
  if (txt.startsWith("```")) {
    txt = txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1);
  }

  try {
    return JSON.parse(txt);
  } catch (e) {
    return null; // we will handle it safely
  }
}

// ----------- TMDB HELPERS -----------

async function getActorId(name) {
  const res = await fetch(
    `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}`
  );
  const data = await res.json();
  return data.results?.[0]?.id || null;
}

async function getActorMovies(id) {
  const res = await fetch(
    `https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${TMDB_KEY}`
  );
  const data = await res.json();
  return data.cast || [];
}

async function discoverMovies(filters) {
  const url = new URL("https://api.themoviedb.org/3/discover/movie");
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("sort_by", "popularity.desc");

  if (filters.genre) {
    const num = GENRES[filters.genre.toLowerCase()];
    if (num) url.searchParams.set("with_genres", num);
  }
  if (filters.year) url.searchParams.set("primary_release_year", filters.year);
  if (filters.year_after)
    url.searchParams.set("primary_release_date.gte", `${filters.year_after}-01-01`);
  if (filters.year_before)
    url.searchParams.set("primary_release_date.lte", `${filters.year_before}-12-31`);
  if (filters.rating) url.searchParams.set("vote_average.gte", filters.rating);

  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// ----------- MAIN FUNCTION -----------

export default async function BotInterface(query) {
  try {
    const parsed = await fireworksQuery(query);

    if (!parsed || typeof parsed !== "object") {
      return {
        summary: "Sorry — I couldn’t understand that.",
        movies: []
      };
    }

    // merge with memory
    memoryFilters = { ...memoryFilters, ...parsed };

    const limit = memoryFilters.limit ? Number(memoryFilters.limit) : 10;

    let movies = [];

    if (memoryFilters.actor) {
      const id = await getActorId(memoryFilters.actor);
      if (id) movies = await getActorMovies(id);
    } else {
      movies = await discoverMovies(memoryFilters);
    }

    return {
      summary: parsed.summary,
      movies: movies.slice(0, limit)
    };
  } catch (e) {
    console.error("BOT ERROR:", e);
    return {
      summary: "⚠️ Error — could not fetch results.",
      movies: []
    };
  }
}
