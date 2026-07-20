import { getFile } from "obsidian-oxide/renderer";

const Page = async () => {
  const file = await getFile("rorz.io", "Welcome");
  return (
    <main>
      <p>Rory McMeekin</p>
      {(file?.Content && <file.Content />) ?? null}
    </main>
  );
};

export default Page;
