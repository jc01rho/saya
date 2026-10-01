/**
 * Marks that a messenger's initial cannot tell apart: two adapters can share
 * a first letter, so the one that came second is given its own short mark.
 */
const MARKS: Readonly<Record<string, string>> = { "discord-user": "Dp" };

/** The mark drawn for an adapter: its own short mark, else its name's initial. */
export function adapterMark(id: string, name: string): string {
  return MARKS[id] ?? [...name][0]?.toLocaleUpperCase("ko-KR") ?? "?";
}
