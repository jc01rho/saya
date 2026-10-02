/** Every adapter's fallback is its declared name's initial, never its id. */
export function adapterMark(name: string): string {
  return [...name][0]?.toLocaleUpperCase("ko-KR") ?? "?";
}
