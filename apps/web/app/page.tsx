import { ObsidianMarkdown } from "obsid/react";
import { getVault } from "obsid/vault";
import obsidConfig from "../obsid.config.ts";

const Page = async () => {
  const vault = getVault(obsidConfig, "rorz.io");
  const file = await vault.getFile("Welcome");
  return (
    <main>
      <p>Rory McMeekin</p>
      {file !== null && <ObsidianMarkdown file={file} />}
    </main>
  );
};

export default Page;
