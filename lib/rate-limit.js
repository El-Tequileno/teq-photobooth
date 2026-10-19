const WINDOW_MS = 10 * 60 * 1000;
const MAX_KEYS = 5000;
const attempts = new Map();

export function allowAttempt(key, limit) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return false;
  }
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > MAX_KEYS) {
    for (const [storedKey, times] of attempts) {
      if (times.every(time => now - time >= WINDOW_MS)) attempts.delete(storedKey);
    }
  }
  return true;
}
