import { assetImageOrigin, thumbnailPath, thumbnailWidths } from "./thumbnail.ts";

type ImageFetcher = (
  source: string,
  init: RequestInit<RequestInitCfProperties>,
) => Promise<Response>;

const allowedWidths = new Set<number>(thumbnailWidths);
const digits = /^\d+$/u;

const defaultImageFetcher: ImageFetcher = (source, init) => fetch(source, init);

const isThumbnailRequest = (url: URL): boolean => url.pathname === thumbnailPath;

const badRequest = (): Response =>
  new Response("Invalid thumbnail request", {
    status: 400,
  });

const getOutputFormat = (
  accept: string | null,
): RequestInitCfPropertiesImage["format"] | undefined => {
  if (accept?.includes("image/avif")) {
    return "avif";
  }

  if (accept?.includes("image/webp")) {
    return "webp";
  }
};

const parseThumbnailRequest = (
  request: Request,
): {
  readonly source: string;
  readonly width: number;
} | null => {
  const requestUrl = new URL(request.url);
  const allowedParameterNames = new Set([
    "src",
    "w",
  ]);

  for (const name of requestUrl.searchParams.keys()) {
    if (!allowedParameterNames.has(name) || requestUrl.searchParams.getAll(name).length !== 1) {
      return null;
    }
  }

  const sourcePath = requestUrl.searchParams.get("src")?.replaceAll("\\", "/");
  const widthParameter = requestUrl.searchParams.get("w");

  if (
    !sourcePath?.startsWith("/") ||
    sourcePath.startsWith("//") ||
    !widthParameter ||
    !digits.test(widthParameter)
  ) {
    return null;
  }

  const width = Number(widthParameter);

  if (!(Number.isSafeInteger(width) && allowedWidths.has(width))) {
    return null;
  }

  const sourceUrl = new URL(sourcePath, assetImageOrigin);

  if (sourceUrl.origin !== assetImageOrigin) {
    return null;
  }

  return {
    source: sourceUrl.toString(),
    width,
  };
};

const handleThumbnailRequest = (
  request: Request,
  fetchImage: ImageFetcher = defaultImageFetcher,
): Promise<Response> => {
  if (request.method !== "GET") {
    return Promise.resolve(
      new Response("Method not allowed", {
        headers: new Headers({
          allow: "GET",
        }),
        status: 405,
      }),
    );
  }

  const thumbnailRequest = parseThumbnailRequest(request);

  if (!thumbnailRequest) {
    return Promise.resolve(badRequest());
  }

  const format = getOutputFormat(request.headers.get("Accept"));

  return fetchImage(thumbnailRequest.source, {
    cf: {
      image: {
        anim: false,
        fit: "scale-down",
        ...(format
          ? {
              format,
            }
          : {}),
        metadata: "none",
        quality: 80,
        width: thumbnailRequest.width,
      },
    },
  });
};

export type { ImageFetcher };
export { handleThumbnailRequest, isThumbnailRequest };
