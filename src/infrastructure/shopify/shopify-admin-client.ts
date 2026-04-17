/**
 * Minimal Shopify Admin GraphQL client.
 *
 * Reads credentials from env (SHOPIFY_SHOP_DOMAIN, SHOPIFY_ADMIN_API_TOKEN)
 * and exposes a typed `query<TData>` helper that throws on transport errors,
 * GraphQL `errors`, and explicit `userErrors` returned by mutations (when
 * `expectUserErrorsField` is provided).
 *
 * Rate-limit strategy: Shopify returns `429` for throttled calls. We honor
 * the `Retry-After` header when present (bounded to 5s) and retry up to two
 * times. Beyond that we surface the error so the caller can decide.
 */

const DEFAULT_API_VERSION = "2024-07";

export interface ShopifyAdminClientConfig {
  shopDomain: string;
  adminApiToken: string;
  apiVersion?: string;
  fetchImpl?: typeof fetch;
}

export interface ShopifyGraphQLResponse<TData> {
  data?: TData;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
  extensions?: Record<string, unknown>;
}

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public readonly detail?: {
      status?: number;
      graphqlErrors?: ShopifyGraphQLResponse<unknown>["errors"];
      userErrors?: Array<{ field?: string[] | null; message: string; code?: string }>;
    }
  ) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

function getEnvConfig(): ShopifyAdminClientConfig {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN?.trim();
  const adminApiToken = process.env.SHOPIFY_ADMIN_API_TOKEN?.trim();

  if (!shopDomain) throw new ShopifyApiError("SHOPIFY_SHOP_DOMAIN is not configured");
  if (!adminApiToken) throw new ShopifyApiError("SHOPIFY_ADMIN_API_TOKEN is not configured");

  return {
    shopDomain,
    adminApiToken,
    apiVersion: process.env.SHOPIFY_ADMIN_API_VERSION?.trim() || DEFAULT_API_VERSION
  };
}

function buildEndpoint(config: ShopifyAdminClientConfig): string {
  const version = config.apiVersion || DEFAULT_API_VERSION;
  return `https://${config.shopDomain}/admin/api/${version}/graphql.json`;
}

export class ShopifyAdminClient {
  private readonly shopDomain: string;
  private readonly adminApiToken: string;
  private readonly apiVersion: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config?: Partial<ShopifyAdminClientConfig>) {
    const envConfig = config?.shopDomain && config?.adminApiToken ? null : getEnvConfig();
    this.shopDomain = config?.shopDomain ?? envConfig!.shopDomain;
    this.adminApiToken = config?.adminApiToken ?? envConfig!.adminApiToken;
    this.apiVersion = config?.apiVersion ?? envConfig?.apiVersion ?? DEFAULT_API_VERSION;
    this.fetchImpl = config?.fetchImpl ?? fetch;
  }

  async query<TData>(input: {
    query: string;
    variables?: Record<string, unknown>;
    /**
     * If set, after the GraphQL call succeeds the client reads
     * `data[<field>].userErrors` and throws if it contains entries.
     * Pattern example: "discountCodeBasicCreate".
     */
    expectUserErrorsField?: string;
    /** Max retry attempts on 429/5xx. Default 2 (so up to 3 total tries). */
    maxRetries?: number;
  }): Promise<TData> {
    const maxRetries = input.maxRetries ?? 2;
    const endpoint = buildEndpoint({
      shopDomain: this.shopDomain,
      adminApiToken: this.adminApiToken,
      apiVersion: this.apiVersion
    });

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt += 1;

      const response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.adminApiToken,
          Accept: "application/json"
        },
        body: JSON.stringify({ query: input.query, variables: input.variables ?? {} })
      });

      if (response.status === 429 || (response.status >= 500 && response.status <= 599)) {
        if (attempt > maxRetries) {
          throw new ShopifyApiError(
            `Shopify API request failed after ${attempt} attempts (status ${response.status})`,
            { status: response.status }
          );
        }
        const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
        await sleep(retryAfter);
        continue;
      }

      if (!response.ok) {
        throw new ShopifyApiError(
          `Shopify API responded with status ${response.status}`,
          { status: response.status }
        );
      }

      const json = (await response.json()) as ShopifyGraphQLResponse<TData>;

      if (json.errors && json.errors.length > 0) {
        throw new ShopifyApiError("Shopify GraphQL returned errors", {
          graphqlErrors: json.errors
        });
      }

      if (!json.data) {
        throw new ShopifyApiError("Shopify GraphQL response is missing data");
      }

      if (input.expectUserErrorsField) {
        const scoped = (json.data as unknown as Record<string, unknown>)[
          input.expectUserErrorsField
        ];
        const userErrors = extractUserErrors(scoped);
        if (userErrors.length > 0) {
          throw new ShopifyApiError("Shopify mutation returned userErrors", {
            userErrors
          });
        }
      }

      return json.data;
    }
  }
}

function parseRetryAfter(header: string | null): number {
  if (!header) return 500;
  const n = Number(header);
  if (Number.isFinite(n) && n > 0) return Math.min(n * 1000, 5000);
  return 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractUserErrors(
  scoped: unknown
): Array<{ field?: string[] | null; message: string; code?: string }> {
  if (!scoped || typeof scoped !== "object") return [];
  const raw = (scoped as { userErrors?: unknown }).userErrors;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
    .map((e) => ({
      field: Array.isArray(e.field)
        ? (e.field as unknown[]).filter((x): x is string => typeof x === "string")
        : null,
      message: typeof e.message === "string" ? e.message : "Unknown user error",
      code: typeof e.code === "string" ? e.code : undefined
    }));
}
