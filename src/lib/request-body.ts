import { Buffer } from "node:buffer";

export async function readJsonBodyWithLimit<T>(
  request: Request,
  options: { maxBytes: number }
): Promise<T> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > options.maxBytes) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > options.maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

