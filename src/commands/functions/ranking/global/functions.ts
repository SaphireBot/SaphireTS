export function position(length: number, num: number): string {
  const n = `${num}`;
  if (length <= 0) return n;
  return "0".repeat(length - n.length) + n;
}