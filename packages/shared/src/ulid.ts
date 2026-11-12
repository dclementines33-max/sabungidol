// ULID (PRD §3): 10 characters of time (ms) + 16 random, Crockford base32. Sorts by creation time.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(now = Date.now(), randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n))): string {
  let time = "";
  for (let t = now, i = 0; i < 10; i++, t = Math.floor(t / 32)) time = ALPHABET[t % 32] + time;
  // 256 is a multiple of 32, so byte % 32 picks every character equally often.
  return time + Array.from(randomBytes(16), (b) => ALPHABET[b % 32]).join("");
}
