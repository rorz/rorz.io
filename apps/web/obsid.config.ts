import process from "node:process";
import { defineConfig } from "obsid/config";

export default defineConfig({
  login: {
    email: process.env.OBSID_EMAIL ?? "",
    password: process.env.OBSID_PASSWORD ?? "",
  },
  vaults: [
    {
      encryptionPassword: process.env.OBSID_VAULT_PRIMARY_PASSWORD ?? "",
      name: "rorz.io",
    },
    {
      encryptionPassword: process.env.OBSID_VAULT_ALT_PASSWORD ?? "",
      name: "rorz.io--alt",
    },
  ],
});
