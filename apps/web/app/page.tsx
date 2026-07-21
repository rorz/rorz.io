import { getVault } from "obsid/renderer";
import obsidConfig from "../obsid.config.ts";

const Page = async () => {
  const vault = getVault(obsidConfig, "rorz.io");
  const file = await vault.getFile("Welcome");
  return (
    <main>
      <p>Rory McMeekin</p>
      {(file?.Content && <file.Content />) ?? null}
    </main>
  );
};

export default Page;
