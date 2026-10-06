// Writes the production proxy's adapter routes from SAYA_ADAPTERS and each
// SAYA_ADAPTER_<ID>_URL / _TOKEN, the same variables the development proxy
// reads. Run it with the proxy's env file before Caddy starts:
//   bun --env-file=<saya.env> scripts/caddy-adapters.ts <adapters.caddy>
// The output holds no token; Caddy expands those from the env file itself.
import { rename, writeFile } from "node:fs/promises";
import {
  AdapterConfigError,
  adapterCaddyfile,
  adapterUpstreams,
} from "../server/adapters";

const output = process.argv[2];
if (!output) {
  console.error(
    "usage: bun --env-file=<env> scripts/caddy-adapters.ts <output>",
  );
  process.exit(2);
}

try {
  const upstreams = adapterUpstreams(process.env);
  const temporary = `${output}.tmp`;
  await writeFile(temporary, adapterCaddyfile(upstreams), { mode: 0o600 });
  await rename(temporary, output);
  console.log(
    `${output}: ${upstreams.map(({ id }) => id).join(", ") || "no adapters"}`,
  );
} catch (error) {
  if (!(error instanceof AdapterConfigError)) throw error;
  console.error(error.message);
  process.exit(1);
}
