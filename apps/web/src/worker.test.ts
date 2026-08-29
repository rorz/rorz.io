import { expect, mock, test } from "bun:test";

const notFoundStatus = 404;
const okStatus = 200;
const fetchVinext = mock(() => Promise.resolve(new Response("vinext")));
const failUnexpectedCall = (): never => {
  throw new Error("Unexpected platform API call");
};

mock.module("vinext/server/fetch-handler", () => ({
  default: {
    fetch: fetchVinext,
  },
}));

const { default: worker } = await import("./worker.ts");

test("serves assets before falling back to Vinext for an asset miss", async () => {
  const fetchAsset = mock((request: Request) => {
    const isAsset = new URL(request.url).pathname === "/mark.svg";

    return Promise.resolve(
      new Response(isAsset ? "asset" : "not found", {
        status: isAsset ? okStatus : notFoundStatus,
      }),
    );
  });
  const env: Env = {
    // biome-ignore lint/style/useNamingConvention: Binding names follow wrangler.jsonc.
    ASSETS: {
      connect: failUnexpectedCall,
      fetch: fetchAsset,
    },
    // biome-ignore lint/style/useNamingConvention: Binding names follow wrangler.jsonc.
    get IMAGES() {
      return failUnexpectedCall();
    },
    // biome-ignore lint/style/useNamingConvention: Binding names follow wrangler.jsonc.
    NEXT_PUBLIC_POSTHOG_HOST: "/x",
    // biome-ignore lint/style/useNamingConvention: Binding names follow wrangler.jsonc.
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "test-token",
  };
  const ctx: ExecutionContext = {
    abort: failUnexpectedCall,
    get exports() {
      return failUnexpectedCall();
    },
    passThroughOnException: failUnexpectedCall,
    props: undefined,
    get tracing() {
      return failUnexpectedCall();
    },
    waitUntil: failUnexpectedCall,
  };

  const assetResponse = await worker.fetch(new Request("https://rorz.io/mark.svg"), env, ctx);

  expect(assetResponse.status).toBe(okStatus);
  expect(await assetResponse.text()).toBe("asset");
  expect(fetchVinext).not.toHaveBeenCalled();

  const missingResponse = await worker.fetch(new Request("https://rorz.io/sitemap.xml"), env, ctx);

  expect(missingResponse.status).toBe(okStatus);
  expect(await missingResponse.text()).toBe("vinext");
  expect(fetchVinext).toHaveBeenCalledTimes(1);
  expect(fetchAsset).toHaveBeenCalledTimes(2);
});
