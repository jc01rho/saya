import { useEffect, useState } from "react";
import type { HttpClient } from "../../transport/http";

const asked = new WeakMap<HttpClient, Promise<number | null>>();

/**
 * `POST /upload`'s limit as the core's `/health` declares it, or null where
 * the core answers no upload (the macOS build, an older Windows build) or
 * could not be asked. Only a declared limit is kept; a null is asked again.
 */
export function coreUploadLimit(http: HttpClient): Promise<number | null> {
  const held = asked.get(http);
  if (held) return held;
  const answer = http
    .request({
      path: "/health",
      signal: new AbortController().signal,
      generationKey: "health:features",
    })
    .then(
      (outcome) =>
        outcome.kind === "success"
          ? (outcome.data.features?.upload?.maxBytes ?? null)
          : null,
      () => null,
    );
  asked.set(http, answer);
  void answer.then((limit) => {
    if (limit === null) asked.delete(http);
  });
  return answer;
}

export function useCoreUploadLimit(http: HttpClient): number | null {
  const [limit, setLimit] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void coreUploadLimit(http).then((value) => {
      if (live) setLimit(value);
    });
    return () => {
      live = false;
    };
  }, [http]);
  return limit;
}
