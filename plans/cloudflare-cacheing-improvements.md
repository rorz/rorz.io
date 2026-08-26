# Cloudflare cache incident — 26 August 2026

## Summary

After `My Friend Aaron` reached the Hacker News front page, some visitors saw:

```text
Unable to render the site
Failed to fetch dynamically imported module:
https://rorz.io/_next/static/chunks/link-CKkD60iF.js
```

The `reply` suffix shown in one copied HN comment belonged to the HN interface;
it was not part of the requested asset URL.

This was not a React rendering exception and the JavaScript file was not
universally absent. Cloudflare zone analytics showed the exact same URL being
served simultaneously as:

- a cached `200 text/javascript` from LHR, North American, and Asian PoPs; and
- a cached `404 text/html` from European PoPs including FRA, VIE, ZRH, ARN,
  OSL, WAW, and TXL.

The contradictory cached responses persisted for hours. Static assets are
served directly by Cloudflare, before the Worker, so there was no corresponding
Worker exception to find. Zone HTTP analytics was the useful log source.

## Cause

The initial trigger was a transient, PoP-specific Cloudflare Workers Assets
miss after deployment. The available evidence points to asset routing or
propagation, but does not establish which internal Cloudflare mechanism caused
that first miss.

The prolonged failure has a definite cause. Vinext generated this rule:

```text
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

The Worker uses `not_found_handling: "404-page"`. `_headers` rules match the
requested path, not the response status, so a missing `*.js` request received
the HTML 404 page with the same one-year immutable cache policy. Cloudflare
edges and visitors' browsers were therefore allowed to retain the bad 404.
Browsers then rejected that HTML response as a dynamically imported JavaScript
module.

## Fix deployed

`apps/web/public/_headers` now overrides Vinext's generated wildcard with:

```text
/_next/static/*
  Cache-Control: public, max-age=0, must-revalidate
```

This is Cloudflare's default Static Assets policy. Assets can still be cached,
and their `ETag` lets browsers validate an unchanged file without downloading
it again, but a response must be revalidated before reuse. A transient 404 can
therefore recover instead of remaining fresh for a year.

Deployment `fc62b2aa-4295-44c0-b313-6014b7c11072` replaced the affected chunk
with `link-CmAXFEKW.js`. After deployment:

- the article referenced the new chunk;
- the new chunk returned `200 text/javascript`;
- the old chunk returned an uncached `404` with `max-age=0, must-revalidate`;
- a real-browser load rendered the complete article with no console errors;
- 30 out of 30 European probes returned `200 text/javascript`, including the
  previously affected FRA, VIE, ZRH, ARN, OSL, WAW, and TXL edges.

## Possible later optimisation — not implemented

The present policy is deliberately conservative. It preserves Cloudflare's
automatic edge caching but requires a conditional request on repeat browser
visits. That was the right trade-off during an active incident and has little
effect on a burst dominated by first-time visitors.

If repeat-visit latency becomes important, retain immutable caching only with
status-aware zone rules:

1. Review and likely remove Wrangler's separate `cache.enabled` Workers Caching
   opt-in. Native Static Assets caching is already automatic and free; Workers
   Caching has different request accounting.
2. Restore the one-year immutable `_headers` rule for hashed assets.
3. Add a Cache Rule for `/_next/static/*`: cache successful responses for one
   year, but use `no-store` for `4xx` and `5xx` responses.
4. Add a Response Header Transform Rule for the same path and status codes,
   setting `Cache-Control: no-store` for browsers. Response transforms happen
   after Cloudflare's cache decision, so both rules are required.
5. Test both an existing chunk and a deliberately missing chunk from several
   regions before deployment is considered complete.

Cloudflare Free includes ten Cache Rules and ten Transform Rules. Do not route
all chunk requests through the Worker merely to make the header conditional;
that would turn free Static Assets requests into Worker invocations.

## Copy-ready Hacker News update

> Fixed. This turned out to be a Cloudflare edge-cache problem rather than a
> Vercel or React rendering error. After a deployment, some European Cloudflare
> PoPs returned a 404 HTML page for one hashed JavaScript chunk while other PoPs
> returned the correct JavaScript for the identical URL. Vinext's generated
> cache rule marked every `/_next/static/*` response immutable for a year,
> which unintentionally included that 404 and made the failure persist. I've
> overridden the rule so these assets revalidate, redeployed, and verified the
> article and its JavaScript from 30 European probes, including the affected
> locations. Sorry to everyone who hit it, and thanks for reporting it.

## References

- [Cloudflare Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/)
- [Cloudflare Static Assets caching](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cache TTL by status code](https://developers.cloudflare.com/cache/how-to/configure-cache-status-code/)
- [Response Header Transform Rules](https://developers.cloudflare.com/rules/transform/response-header-modification/)
