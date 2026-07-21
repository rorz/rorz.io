import { resolve } from "node:path";
import { loadConfig } from "obsid/config";
import { sync } from "obsid/sync";

const main = async () => {
  const config = await loadConfig(resolve(import.meta.dir, "../../../apps/web/obsid.config.ts"));

  await sync(config);
};

await main();
