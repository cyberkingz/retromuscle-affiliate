const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN;

/**
 * Tell Cloudflare Stream to pull and transcode a video from a signed URL.
 * Returns the CF Stream UID on success, null on any failure.
 * Always fire-and-forget — never throw.
 */
export async function ingestVideoToStream(
  videoId: string,
  signedUrl: string
): Promise<string | null> {
  if (!CF_ACCOUNT_ID || !CF_TOKEN) return null;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/copy`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: signedUrl, meta: { name: videoId } })
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as { result?: { uid?: string }; success?: boolean };
    return data.success && data.result?.uid ? data.result.uid : null;
  } catch {
    return null;
  }
}
