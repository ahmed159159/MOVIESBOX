// ===========================
// 🔥 Popcorn AI Bot 
// ===========================

const FIREWORKS_API_KEY = import.meta.env.VITE_FIREWORKS_API_KEY;
const FIREWORKS_MODEL = import.meta.env.VITE_FIREWORKS_MODEL;
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

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
  war: 10752,
  western: 37
};

// ------------ MEMORY (context awareness)
let memory = {
  type: "movie",
  genre: null,
  actor: null,
  director: null,
  year: null,
  year_after: null,
  year_before: null,
  rating: null,
  limit: 10
};

// ------------ FIREWORKS SMART JSON PROMPT
let conversation = [
  {
    role: "system",
    content: `
You are Dobby, an intelligent movie assistant.  
You ALWAYS reply using ONLY CLEAN JSON (never text outside JSON).

USE THIS EXACT FORMAT:
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

RULES:
- If user gives follow-up info (e.g. "from 2015", "with Tom Cruise"), MERGE it with previous memory.
- If spelling is wrong (e.g. "tom coures"), auto-correct to the nearest real actor.
- Never apologize.
- Never ask questions.
- NEVER output anything except VALID JSON.
`
  }
];

// ------------ FIREWORKS API CALL
async function askFireworks(prompt) {
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
      max_tokens: 300,
      temperature: 0.1
    })
  });

  const data = await res.json();
  let out = data?.choices?.[0]?.message?.content || "";

  // remove "```json ...```"
  out = out.trim();
  if (out.startsWith("```")) {
    out = out.substring(out.indexOf("{"), out.lastIndexOf("}") + 1);
  }

  return JSON.parse(out);
}

// ------------ TMDB FUNCTIONS
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
    const genreId = GENRES[filters.genre.toLowerCase()];
    if (genreId) url.searchParams.set("with_genres", genreId);
  }

  if (filters.year)
    url.searchParams.set("primary_release_year", filters.year);

  if (filters.year_after)
    url.searchParams.set("primary_release_date.gte", `${filters.year_after}-01-01`);

  if (filters.year_before)
    url.searchParams.set("primary_release_date.lte", `${filters.year_before}-12-31`);

  if (filters.rating)
    url.searchParams.set("vote_average.gte", filters.rating);

  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// ------------ MAIN BOT HANDLER
export default async function BotInterface(query) {
  try {
    // 1) Ask Fireworks for structured JSON
    const parsed = await askFireworks(query);

    // 2) Update memory (context handling)
    memory = { ...memory, ...parsed };

    // 3) Fetch movies
    let movies = [];

    if (memory.actor) {
      const id = await getActorId(memory.actor);
      if (id) movies = await getActorMovies(id);
    } else {
      movies = await discoverMovies(memory);
    }

    // 4) Limit results
    movies = movies.slice(0, memory.limit || 10);

    // 5) Attach your website link
    movies = movies.map((m) => ({
      ...m,
      link: `https://moviesbox-delta.vercel.app/info?id=${m.id}`
    }));

    return {
      summary: parsed.summary,
      movies
    };
  } catch (e) {
    console.error("🔥 BOT ERROR:", e);
    return {
      summary: "⚠️ Error — Could not fetch results",
      movies: []
    };
  }
}
