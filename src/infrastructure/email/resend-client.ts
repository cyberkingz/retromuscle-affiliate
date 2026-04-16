import { Resend } from "resend";

let _client: Resend | null = null;

export function getResendClient(): Resend {
  if (!_client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    _client = new Resend(apiKey);
  }
  return _client;
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
