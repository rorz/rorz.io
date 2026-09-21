const httpStatus = {
  badGateway: 502,
  badRequest: 400,
  forbidden: 403,
  gatewayTimeout: 504,
  methodNotAllowed: 405,
  notFound: 404,
  ok: 200,
  payloadTooLarge: 413,
  serviceUnavailable: 503,
  tooManyRequests: 429,
  unsupportedMediaType: 415,
} as const;

class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

const jsonResponse = (
  body: unknown,
  status: number = httpStatus.ok,
  headers?: HeadersInit,
): Response => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-Content-Type-Options", "nosniff");
  return Response.json(body, {
    headers: responseHeaders,
    status,
  });
};

const maxBodyBytes = 16_384;

const readJson = async (request: Request): Promise<unknown> => {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new HttpError(httpStatus.badRequest, "invalid-json", "Send a JSON request body.");
  }
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let text = "";
  try {
    let chunk = await reader.read();
    while (!chunk.done) {
      bytesRead += chunk.value.byteLength;
      if (bytesRead > maxBodyBytes) {
        await reader.cancel();
        throw new HttpError(
          httpStatus.payloadTooLarge,
          "input-too-large",
          "Keep the request below 16 KiB.",
        );
      }
      text += decoder.decode(chunk.value, {
        stream: true,
      });
      chunk = await reader.read();
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    // biome-ignore lint/style/useErrorCause: HttpError forwards its fourth argument to ErrorOptions.
    throw new HttpError(httpStatus.badRequest, "invalid-json", "Send a valid JSON request body.", {
      cause: error,
    });
  } finally {
    reader.releaseLock();
  }
};

export { HttpError, httpStatus, jsonResponse, readJson };
