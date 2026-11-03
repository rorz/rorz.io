import { expect, mock, spyOn, test } from "bun:test";

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

const createEnvironment = (fetchAsset: Env["ASSETS"]["fetch"] = failUnexpectedCall): Env => ({
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
});

const createContext = (
  waitUntil: ExecutionContext["waitUntil"] = failUnexpectedCall,
): ExecutionContext => ({
  abort: failUnexpectedCall,
  get exports() {
    return failUnexpectedCall();
  },
  mapVirtualHost: failUnexpectedCall,
  passThroughOnException: failUnexpectedCall,
  props: undefined,
  get tracing() {
    return failUnexpectedCall();
  },
  waitUntil,
});

test("serves assets before falling back to Vinext for an asset miss", async () => {
  const fetchAsset = mock((request: Request) => {
    const isAsset = new URL(request.url).pathname === "/mark.svg";

    return Promise.resolve(
      new Response(isAsset ? "asset" : "not found", {
        status: isAsset ? okStatus : notFoundStatus,
      }),
    );
  });
  const env = createEnvironment(fetchAsset);
  const ctx = createContext();

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

test("caches analytics scripts as uncompressed JavaScript and preserves the body on a cache hit", async () => {
  const script = "globalThis.analyticsReady = true;";
  const writes: Promise<unknown>[] = [];
  let cached: Response | undefined;
  const cache = {
    match: mock(() => Promise.resolve(cached?.clone())),
    put: mock((_request: Request, response: Response) => {
      cached = response.clone();
      return Promise.resolve();
    }),
  };
  const originalCaches = Object.getOwnPropertyDescriptor(globalThis, "caches");
  Object.defineProperty(globalThis, "caches", {
    configurable: true,
    value: {
      open: mock(() => Promise.resolve(cache)),
    },
  });
  const fetchUpstream = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      (input: Parameters<typeof fetch>[0]) => {
        if (!(input instanceof Request)) {
          throw new Error("Expected an upstream Request");
        }
        expect(input.url).toBe("https://us-assets.i.posthog.com/array/test-token/config.js");
        expect(input.headers.get("accept-encoding")).toBe("identity");
        expect(input.headers.has("cookie")).toBe(false);
        return Promise.resolve(
          new Response(script, {
            headers: {
              "cache-control": "public, max-age=300",
              "content-type": "application/javascript",
              "set-cookie": "upstream=value",
            },
          }),
        );
      },
      {
        preconnect: failUnexpectedCall,
      },
    ),
  );

  try {
    const request = new Request("https://rorz.io/x/array/test-token/config.js", {
      headers: {
        "accept-encoding": "gzip, br",
        cookie: "private=value",
      },
    });
    const env = createEnvironment();
    const ctx = createContext((promise) => {
      writes.push(promise);
    });
    const fresh = await worker.fetch(request, env, ctx);
    expect(await fresh.text()).toBe(script);
    expect(fresh.headers.has("set-cookie")).toBe(false);
    await Promise.all(writes);

    const hit = await worker.fetch(request, env, ctx);
    expect(await hit.text()).toBe(script);
    expect(hit.headers.has("content-encoding")).toBe(false);
    expect(fetchUpstream).toHaveBeenCalledTimes(1);
    expect(cache.put).toHaveBeenCalledTimes(1);
  } finally {
    fetchUpstream.mockRestore();
    if (originalCaches) {
      Object.defineProperty(globalThis, "caches", originalCaches);
    } else {
      Reflect.deleteProperty(globalThis, "caches");
    }
  }
});
