import { loadConfig } from "obsid/config";
import { sync } from "obsid/sync";
import path from "path";

const main = async () => {
  console.log("RUNNING SYNC");

  const config = await loadConfig(path.resolve("../../private/example-config.json"));

  await sync(config);
};

void main();
