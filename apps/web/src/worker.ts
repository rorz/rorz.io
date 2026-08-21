import vinextHandler from "vinext/server/fetch-handler";

const POSTHOG_API_ORIGIN = "https://us.i.posthog.com";
const POSTHOG_ASSET_ORIGIN = "https://us-assets.i.posthog.com";
const TRAILING_SLASHES = /\/+$/;

const getProxyPath = (apiHost: string): string | null => {
  if (!apiHost.startsWith("/")) {
    return null;
  }

  const proxyPath = apiHost.replace(TRAILING_SLASHES, "");
  return proxyPath || null;
};

const isPostHogRequest = (pathname: string, proxyPath: string): boolean =>
  pathname === proxyPath || pathname.startsWith(`${proxyPath}/`);

const proxyPostHogRequest = async (
  request: Request,
  proxyPath: string,
  ctx: ExecutionContext,
): Promise<Response> => {
  const requestUrl = new URL(request.url);
  const upstreamPath = requestUrl.pathname.slice(proxyPath.length) || "/";
  const isAssetRequest = upstreamPath.startsWith("/static/") || upstreamPath.startsWith("/array/");
  const assetCache =
    request.method === "GET" && isAssetRequest ? await caches.open("posthog") : null;

  if (assetCache) {
    const cachedResponse = await assetCache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }
  }

  const upstreamUrl = new URL(isAssetRequest ? POSTHOG_ASSET_ORIGIN : POSTHOG_API_ORIGIN);
  upstreamUrl.pathname = upstreamPath;
  upstreamUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  const clientIp = headers.get("CF-Connecting-IP");
  headers.delete("cookie");
  headers.delete("host");

  if (clientIp) {
    headers.set("X-Forwarded-For", clientIp);
  }

  const response = await fetch(
    new Request(upstreamUrl, {
      body:
        request.method === "GET" || request.method === "HEAD" ? null : await request.arrayBuffer(),
      headers,
      method: request.method,
      redirect: request.redirect,
    }),
  );
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("set-cookie");

  const proxiedResponse = new Response(response.body, {
    headers: responseHeaders,
    status: response.status,
    statusText: response.statusText,
  });

  if (assetCache && response.ok) {
    ctx.waitUntil(assetCache.put(request, proxiedResponse.clone()));
  }

  return proxiedResponse;
};

export default {
  fetch(request, env, ctx) {
    const proxyPath = getProxyPath(env.NEXT_PUBLIC_POSTHOG_HOST);

    if (proxyPath && isPostHogRequest(new URL(request.url).pathname, proxyPath)) {
      return proxyPostHogRequest(request, proxyPath, ctx);
    }

    return vinextHandler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
