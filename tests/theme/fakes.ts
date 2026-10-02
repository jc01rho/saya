import type { ThemeRoot } from "../../src/features/theme/store";

/** localStorage stand-in; `broken` throws like a blocked or full store. */
export function memoryStorage(broken = false) {
  const items = new Map<string, string>();
  return {
    items,
    getItem(key: string) {
      if (broken) throw new Error("SecurityError");
      return items.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (broken) throw new Error("QuotaExceededError");
      items.set(key, value);
    },
  };
}

/** The document root as far as theming touches it. */
export function fakeRoot() {
  const props = new Map<string, string>();
  const root: ThemeRoot & { props: Map<string, string> } = {
    props,
    dataset: {},
    style: {
      setProperty(name: string, value: string | null) {
        props.set(name, value ?? "");
      },
      removeProperty(name: string) {
        const old = props.get(name) ?? "";
        props.delete(name);
        return old;
      },
    },
  };
  return root;
}
