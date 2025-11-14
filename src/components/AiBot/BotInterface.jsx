// BotInterface.jsx
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- AI Prompt ---
const ANALYSIS_PROMPT = `
You are Popcorn, a smart movie assistant.
Analyze the user's message and extract meaning.

Respond ONLY with valid JSON:
{
 "summary": "<short helpful summary>",
 "movie_query": "<search keywords or null>",
 "actor": "<actor name or null>",
 "director": "<director name or null>",
 "genre": "<genre or null>",
 "year": "<year or null>",
 "min_rating": "<rating or null>"
}
`;

function cleanJSON(text) {
  try {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    return text.substring(s, e + 1);
  } catch {
    return "{}";
  }
}

// ----- AI Analysis -----
async function analyzeQuestion(userMessage) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    { role: "system", parts: [{ text: ANALYSIS_PROMPT }] },
    { role: "user", parts: [{ text: userMessage }] }
  ]);

  const raw = result.response.text();
  const json = cleanJSON(raw);
  return JSON.parse(json);
}

// ----- TMDB Search -----
async function searchTMDB(params) {
  const q = params.movie_query || params.actor || params.director || "movie";

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("query", q);

  const res = await fetch(url);
  const data = await res.json();

  return data.results?.slice(0, 8) || [];
}

// ----- Main Function -----
export default async function PopcornInterface(userMessage) {
  try {
    const analysis = await analyzeQuestion(userMessage);
    const movies = await searchTMDB(analysis);

    return {
      summary: analysis.summary,
      movies
    };
  } catch (err) {
    console.error("Popcorn Error:", err);
    return {
      summary: "⚠️ Something went wrong. Try again.",
      movies: []
    };
  }
}
