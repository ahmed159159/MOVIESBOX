// BotInterface.js
// Logic: parse user query (genre, year, range, rating, actor, director) -> call TMDB -> return summary + movies[]
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

/**
 * lightweight parser to extract filters from a user query
 */
function parseQuery(q) {
  const text = (q || "").toLowerCase();
  const result = {
    type: "movie", // default
    genre: null,
    year: null,
    year_after: null,
    year_before: null,
    min_rating: null,
    actor: null,
    director: null,
    summary: null,
  };

  // genres map (common)
  const GENRES = {
    action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80,
    documentary: 99, drama: 18, family: 10751, fantasy: 14, history: 36,
    horror: 27, music: 10402, mystery: 9648, romance: 10749,
    "sci-fi": 878, scifi: 878, thriller: 53, war: 10752, western: 37
  };

  // detect tv/movie keywords
  if (/\b(tv|series|show|episode|season)\b/.test(text)) result.type = "tv";

  // detect genre
  for (const g of Object.keys(GENRES)) {
    if (text.includes(g)) {
      result.genre = GENRES[g];
      break;
    }
  }

  // detect explicit year or range like 2010-2015
  const rangeMatch = text.match(/(19|20)\d{2}\s*[-to]+\s*(19|20)\d{2}/);
  if (rangeMatch) {
    const parts = rangeMatch[0].split(/[-to]+/).map(s => s.replace(/\D/g,'').trim());
    if (parts[0]) result.year_after = parts[0];
    if (parts[1]) result.year_before = parts[1];
  } else {
    const afterMatch = text.match(/\b(after|since)\s+(19|20)\d{2}\b/);
    if (afterMatch) result.year_after = afterMatch[2] ? afterMatch[0].match(/\d{4}/)[0] : null;
    const beforeMatch = text.match(/\b(before|until)\s+(19|20)\d{2}\b/);
    if (beforeMatch) result.year_before = beforeMatch[0].match(/\d{4}/)[0];
    const exactYear = text.match(/\b(19|20)\d{2}\b/);
    if (exactYear) result.year = exactYear[0];
  }

  // rating >7 or rating >=7 etc
  const ratingMatch = text.match(/(rating|rated)?\s*(>=|<=|>|<)?\s*([0-9](?:\.\d)?)/);
  if (ratingMatch) {
    // choose numeric group
    const num = parseFloat(ratingMatch[3]);
    if (!isNaN(num)) result.min_rating = num;
  }

  // actor/director detection (simple heuristics)
  const actorMatch = text.match(/\b(with|starring|featuring|starred by|actor)\s+([a-zA-Z .'-]{3,})/);
  if (actorMatch) result.actor = actorMatch[2].trim();
  // "Tom Cruise" alone commonly — try "actor name" heuristics (Name capitalized common) fallback:
  // We'll also check patterns "movies *Tom Cruise*" or "Tom Cruise movies"
  const namePattern = text.match(/(?:movies|movie|films|film|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/);
  if (!result.actor && namePattern) result.actor = namePattern[1];

  // director
  const directorMatch = text.match(/\b(directed by|director|by)\s+([a-zA-Z .'-]{3,})/);
  if (directorMatch) result.director = directorMatch[2].trim();

  // final summary
  result.summary = `Searching ${result.type === "tv" ? "TV shows" : "movies"}`
    + (result.genre ? ` in genre ${result.genre}` : "")
    + (result.year ? ` from ${result.year}` : "")
    + (result.year_after ? ` after ${result.year_after}` : "")
    + (result.year_before ? ` before ${result.year_before}` : "")
    + (result.min_rating ? ` with rating ≥ ${result.min_rating}` : "")
    + (result.actor ? ` starring ${result.actor}` : "")
    + (result.director ? ` directed by ${result.director}` : "");

  // If summary too technical, make short
  result.summary = result.summary.replace(/\s+/g,' ').trim();

  return result;
}

/** helper: get person id by name */
async function getPersonId(name) {
  if (!name) return null;
  const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}&page=1`;
  const r = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  return (j.results && j.results[0] && j.results[0].id) || null;
}

/** helper: fetch credits for person and filter */
async function getPersonCredits(pid, type = "movie") {
  try {
    const url = `https://api.themoviedb.org/3/person/${pid}/${type}_credits?api_key=${TMDB_KEY}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const j = await r.json();
    const list = [...(j.cast||[]), ...(j.crew||[])];
    // unique by id
    const seen = new Set();
    return list.filter(it => {
      if (!it || !it.id) return false;
      if (seen.has(it.id)) return false;
      seen.add(it.id);
      return true;
    });
  } catch (e) {
    return [];
  }
}

/** build discover query and call TMDB */
async function discover(filters) {
  const type = filters.type === "tv" ? "tv" : "movie";
  const base = `https://api.themoviedb.org/3/discover/${type}`;
  const url = new URL(base);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("page","1");
  if (filters.min_rating) url.searchParams.set("vote_average.gte", String(filters.min_rating));
  if (filters.genre) url.searchParams.set("with_genres", String(filters.genre));
  if (filters.year) {
    if (type === "tv") url.searchParams.set("first_air_date_year", filters.year);
    else url.searchParams.set("primary_release_year", filters.year);
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
  return j.results || [];
}

/**
 * Primary exported function:
 * - input: user query string
 * - returns { summary, movies: [...] }
 */
export default async function PopcornInterface(query) {
  const filters = parseQuery(query);

  // Priority: if actor -> use discover with with_cast (but need id)
  let movies = [];
  try {
    if (filters.actor) {
      const pid = await getPersonId(filters.actor);
      if (pid) {
        // use discover with_cast param
        const url = new URL(`https://api.themoviedb.org/3/discover/movie`);
        url.searchParams.set("api_key", TMDB_KEY);
        url.searchParams.set("with_cast", String(pid));
        url.searchParams.set("sort_by","popularity.desc");
        url.searchParams.set("page","1");
        if (filters.genre) url.searchParams.set("with_genres", String(filters.genre));
        if (filters.min_rating) url.searchParams.set("vote_average.gte", String(filters.min_rating));
        const r = await fetch(url.toString());
        if (r.ok) {
          const j = await r.json();
          movies = j.results || [];
        }
      }
    } else if (filters.director) {
      const pid = await getPersonId(filters.director);
      if (pid) {
        // get person credits and filter director jobs
        const all = await getPersonCredits(pid, "movie");
        // filter crew with job Director
        movies = all.filter(m => (m.job && m.job.toLowerCase().includes("director")) || (m.known_for_department && m.known_for_department.toLowerCase()==="directing"));
      }
    }

    // fallback to discover
    if (!movies || movies.length === 0) {
      movies = await discover(filters);
    }

    // apply client-side extra filters (genre_id, year ranges, rating)
    movies = (movies || []).filter(m => {
      // year_after / year_before checks
      const date = (m.release_date || m.first_air_date || "").slice(0,4);
      if (filters.year_after && date && Number(date) <= Number(filters.year_after)) return false;
      if (filters.year_before && date && Number(date) >= Number(filters.year_before)) return false;
      if (filters.min_rating && (m.vote_average || 0) < Number(filters.min_rating)) return false;
      if (filters.genre && Array.isArray(m.genre_ids) && m.genre_ids.length && !m.genre_ids.includes(Number(filters.genre))) return false;
      return true;
    });

    // Take top 12, map fields to consistent shape
    const top = (movies || []).slice(0, 12).map(m => ({
      id: m.id,
      title: m.title || m.name,
      overview: m.overview,
      poster_path: m.poster_path,
      vote_average: m.vote_average,
      release_date: m.release_date || m.first_air_date
    }));

    const summary = filters.summary || `Searching movies for "${query}"`;
    return { summary, movies: top };
  } catch (err) {
    console.error("PopcornInterface error:", err);
    return { summary: "Error fetching results", movies: [] };
  }
}
