import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'movies.json');

function readDb() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(movies) {
  var dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(movies, null, 2));
}

export function getAllMovies() {
  return readDb().sort(function(a, b) {
    return (b.rating || 0) - (a.rating || 0) || new Date(b.watch_date || 0) - new Date(a.watch_date || 0);
  });
}

export function getMovie(id) {
  return readDb().find(function(m) { return m.id === id; }) || null;
}

export function createMovie(data) {
  var movies = readDb();
  var maxId = movies.reduce(function(max, m) { return Math.max(max, m.id || 0); }, 0);
  var movie = { id: maxId + 1 };
  for (var key in data) { if (data.hasOwnProperty(key)) movie[key] = data[key]; }
  movie.created_at = new Date().toISOString();
  movies.push(movie);
  writeDb(movies);
  return movie;
}

export function updateMovie(id, data) {
  var movies = readDb();
  var idx = movies.findIndex(function(m) { return m.id === id; });
  if (idx === -1) return null;
  for (var key in data) { if (data.hasOwnProperty(key)) movies[idx][key] = data[key]; }
  movies[idx].id = id;
  writeDb(movies);
  return movies[idx];
}

export function deleteMovie(id) {
  var movies = readDb();
  var idx = movies.findIndex(function(m) { return m.id === id; });
  if (idx === -1) return false;
  movies.splice(idx, 1);
  writeDb(movies);
  return true;
}
