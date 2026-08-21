import { expect, test } from "bun:test";
import { getCloudflareThumbnailAttributes } from "./thumbnail.ts";
import {
  handleThumbnailRequest,
  type ImageFetcher,
  isThumbnailRequest,
} from "./thumbnail-worker.ts";

const badRequestStatus = 400;

const getThumbnailRequestUrl = (source: string, width: string): URL => {
  const url = new URL("/_images/thumbnail", "https://rorz.io");
  url.searchParams.set("src", source);
  url.searchParams.set("w", width);
  return url;
};

test("builds responsive thumbnail URLs for assets.rorz.io", () => {
  const attributes = getCloudflareThumbnailAttributes(
    "https://assets.rorz.io/videos/nara.thumbnail.png?version=2",
  );

  expect(attributes).not.toBeNull();

  if (!attributes) {
    throw new Error("Expected Cloudflare thumbnail attributes");
  }

  const sourceUrl = new URL(attributes.src, "https://rorz.io");

  expect(attributes.sizes).toBe("(min-width: 1024px) 20rem, 50vw");
  expect(sourceUrl.pathname).toBe("/_images/thumbnail");
  expect(sourceUrl.searchParams.get("src")).toBe("/videos/nara.thumbnail.png?version=2");
  expect(sourceUrl.searchParams.get("w")).toBe("640");
  expect(attributes.srcSet.split(", ").map((candidate) => candidate.split(" ").at(-1))).toEqual([
    "256w",
    "384w",
    "640w",
  ]);
});

test("does not proxy thumbnails from another origin", () => {
  expect(
    getCloudflareThumbnailAttributes("https://images.example.com/nara.thumbnail.png"),
  ).toBeNull();
});

test("transforms an allowed thumbnail request", async () => {
  let fetchedSource: string | undefined;
  let fetchedInit: RequestInit<RequestInitCfProperties> | undefined;
  const fetchImage: ImageFetcher = (source, init) => {
    fetchedSource = source;
    fetchedInit = init;
    return Promise.resolve(new Response("transformed"));
  };
  const request = new Request(getThumbnailRequestUrl("/videos/nara.thumbnail.png", "384"), {
    headers: new Headers({
      accept: "image/avif,image/webp,image/*",
    }),
  });

  expect(isThumbnailRequest(new URL(request.url))).toBe(true);
  expect(await (await handleThumbnailRequest(request, fetchImage)).text()).toBe("transformed");
  expect(fetchedSource).toBe("https://assets.rorz.io/videos/nara.thumbnail.png");
  expect(fetchedInit).toEqual({
    cf: {
      image: {
        anim: false,
        fit: "scale-down",
        format: "avif",
        metadata: "none",
        quality: 80,
        width: 384,
      },
    },
  });
});

test("rejects arbitrary origins and transform widths", async () => {
  const disallowedOrigin = await handleThumbnailRequest(
    new Request(getThumbnailRequestUrl("https://images.example.com/image.png", "384")),
  );
  const disallowedWidth = await handleThumbnailRequest(
    new Request(getThumbnailRequestUrl("/image.png", "1200")),
  );

  expect(disallowedOrigin.status).toBe(badRequestStatus);
  expect(disallowedWidth.status).toBe(badRequestStatus);
});
