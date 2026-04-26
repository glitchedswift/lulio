// Content loader — fetches and caches JSON from /content. Uses relative paths so
// it works under GitHub Pages project sites (e.g. /<repo>/).

const cache = new Map();

async function fetchJson(path) {
  if (cache.has(path)) return cache.get(path);
  const promise = fetch(path).then((r) => {
    if (!r.ok) throw new Error("Failed to fetch " + path + ": " + r.status);
    return r.json();
  });
  cache.set(path, promise);
  try {
    const data = await promise;
    cache.set(path, data);
    return data;
  } catch (err) {
    cache.delete(path);
    throw err;
  }
}

export function loadIndex() {
  return fetchJson("content/index.json");
}

export function loadLesson(lessonId) {
  return fetchJson(`content/lessons/${lessonId}.json`);
}
