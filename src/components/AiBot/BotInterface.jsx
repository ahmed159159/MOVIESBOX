// --- BotInterface.jsx ---
// Works 100% on Vercel using Gemini REST API

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

const MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
  GEMINI_KEY;

const SYSTEM_PROMPT = `
You are Popcorn — a movie analysis assistant.
Your job is to extract structured filters from the user's request.
Return ONLY JSON:
{
 "summary": "one sentence human-friendly summary",
 "type": "movie" or "tv",
 "genre": "<name or null>",
 "year": "<exact or null>",
 "year_after": "<min year or null>",
 "year_before": "<max year or null>",
 "actor": "<name or null>",
 "director": "<name or null>",
 "min_rating": "<number or null>"
}
`;

export default async function PopcornInterface(userText) {
  try {
    // 1) Send request to Gemini REST
    const aiRes = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "user", parts: [{ text: userText }] }
        ],
      }),
    });

    const aiData = await aiRes.json();

    const reply = aiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let parsed;
    try {
      parsed = JSON.parse(cleanJson(reply));
    } catch (e) {
      parsed = { summary: "Sorry, I couldn't understand.", type: "movie" };
    }

    // 2) Fetch TMDB results
    const movies = await fetchTMDB(parsed);

    return {
      summary: parsed.summary || "Here’s what I found:",
      movies: movies || [],
    };
  } catch (err) {
    console.error("BotInterface error:", err);
    return {
      summary: "⚠️ Something went wrong.",
      movies: [],
    };
  }
}

// -------- Helper Functions --------

function cleanJson(txt) {
  const t = txt.trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  return t.substring(s, e + 1);
}

async function fetchTMDB(filters) {
  const type = filters.type === "tv" ? "tv" : "movie";

  const url = new URL(`https://api.themoviedb.org/3/discover/${type}`);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("sort_by", "popularity.desc");

  if (filters.year) url.searchParams.set("primary_release_year", filters.year);
  if (filters.year_after)
    url.searchParams.set("primary_release_date.gte", `${filters.year_after}-01-01`);
  if (filters.year_before)
    url.searchParams.set("primary_release_date.lte", `${filters.year_before}-12-31`);
  if (filters.min_rating)
    url.searchParams.set("vote_average.gte", filters.min_rating);

  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}
