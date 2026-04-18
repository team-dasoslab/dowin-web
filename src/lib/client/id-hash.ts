export function hashId(id: string | number | undefined | null): string {
  if (id === undefined || id === null) return "unknown";
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Use Math.abs to avoid negative hex values and return as hex string
  return Math.abs(hash).toString(16).padStart(8, "0");
}
