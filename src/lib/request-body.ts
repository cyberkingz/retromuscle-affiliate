// H-09: Use streaming body reads so we abort as soon as the limit is exceeded,
// instead of buffering the entire body into memory first.
// The Content-Length pre-check is kept as a fast-path for honest clients.
export async function readJsonBodyWithLimit(
  request: Request,
  options: { maxBytes: number }
): Promise<unknown> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > options.maxBytes) {
      throw new Error("PAYLOAD_TOO_LARGE");
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error("INVALID_JSON");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > options.maxBytes) {
        reader.cancel().catch(() => undefined);
        throw new Error("PAYLOAD_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const text = new TextDecoder().decode(
    chunks.length === 1 ? chunks[0] : Buffer.concat(chunks)
  );

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("INVALID_JSON");
  }
}
