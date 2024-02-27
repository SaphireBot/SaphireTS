import { env } from "process";
export const YouTubeAPIKeys = new Set<string>();

for (let i = 1; i < 100; i++) {
  const key = env[`YOUTUBE_API_KEY_${i}`];
  if (key) YouTubeAPIKeys.add(key);
  else break;
}

export function getRandomAPIKey() {
  return Array.from(YouTubeAPIKeys).random();
}