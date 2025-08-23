import { ClientConfig, HttpHeaders, HttpResponse } from "../IntegrationTypes";
import { AuthError, RateLimitError, ServerError, HttpError } from "../IntegrationErrors";

export class MoySkladClient {
  constructor(private readonly config: ClientConfig) {}

  public async getJson<T = unknown>(
    path: string,
    params?: Record<string, any>,
    headers?: HttpHeaders
  ): Promise<HttpResponse<T>> {
    const method: "GET" = "GET";

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const baseHeaders = this.buildDefaultHeaders();

    const mergedHeaders = { ...baseHeaders, ...(headers ?? {}) };

    const finalHeaders = this.toLowercaseHeaders(mergedHeaders);

    return this.sendWithRetry<T>(method, normalizedPath, params, finalHeaders);
  }


  private async sendWithRetry<T>(
    method: "GET",
    path: string,
    params?: Record<string, any>,
    headers?: HttpHeaders
  ): Promise<HttpResponse<T>> {
    const base = (this.config.baseURL || "").replace(/\/+$/, "");

    const timeoutMs = this.config.timeoutMs ?? 10_000;

    const maxRetries = this.config.maxRetries ?? 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const url = this.buildUrl(base, path, params);

      try {
        const { status, headers: respHeaders, data, statusText } =
          await this.attemptOnce(url, method, this.toLowercaseHeaders(headers ?? {}), timeoutMs);

        if (status >= 200 && status < 300) {
          return { status, headers: respHeaders, data: data as T };
        }

        const message = this.pickErrorMessage(data, statusText);

        if (this.shouldRetry(status)) {
          if (attempt < maxRetries) {
            const delay = this.computeBackoffMs(status, respHeaders, attempt);

            await this.sleep(delay);

            continue;
          }
        }

        const retryAfterMs = this.parseRetryDelayMs(respHeaders) ?? undefined;

        this.classifyAndThrow(status, message, retryAfterMs);

      } catch (err: any) {
        const isAbort = err?.name === "AbortError";

        const isNetworkLike =
          isAbort ||
          err?.name === "TypeError" ||
          /network/i.test(String(err?.message || ""));

        if (isNetworkLike && attempt < maxRetries) {
          const delay = this.computeBackoffMs(0, {}, attempt);

          await this.sleep(delay);

          continue;
        }

        throw new ServerError(0, isAbort ? "Request timeout" : (err?.message || "Network error"));
      }
    }

    throw new ServerError(0, "Unexpected retry loop exit");
  }

 
  private buildUrl(baseURL: string, path: string, params?: Record<string, any>): string {
    const querySet = this.buildQuery(params);
    return querySet ? `${baseURL}${path}?${querySet}` : `${baseURL}${path}`;
  }

  private buildQuery(params?: Record<string, any>): string {
    if (!params || typeof params !== "object") return "";

    const parts: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;

      if (Array.isArray(value)) {

        for (const item of value) {
          if (item == null) continue;

          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
        }
      } else {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }
    return parts.join("&");
  }

  private async attemptOnce(
    url: string,
    method: "GET",
    headers: HttpHeaders,
    timeoutMs: number
  ): Promise<{ status: number; statusText: string; headers: HttpHeaders; data: any }> {
    const controller = new AbortController();

    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        signal: controller.signal,
      });

      const rawHeaders = Object.fromEntries(response.headers.entries());
      
      const normalizedHeaders = this.toLowercaseHeaders(rawHeaders);

      let data: any = null;
      const ct = normalizedHeaders["content-type"] || "";
      try {
        if (ct.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();

          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
      } catch {
      }

      return {
        status: response.status,
        statusText: response.statusText || "",
        headers: normalizedHeaders,
        data,
      };
    } finally {

      clearTimeout(timer);
    }
  }

  private pickErrorMessage(data: any, statusText: string): string {
    if (data && typeof data === "object") {
      return (
        data?.errors?.[0]?.error ||
        data?.errors?.[0]?.message ||
        data?.message ||
        data?.error ||
        statusText ||
        ""
      );
    }
    return statusText || "";
  }

  private shouldRetry(status: number): boolean {
    if (status === 429) return true;

    if (status >= 500 && status <= 599) return true;

    return false;
  }


  private computeBackoffMs(status: number, headers: HttpHeaders, attempt: number): number {
    const fromHeaders = this.parseRetryDelayMs(headers);

    if (status === 429 || status === 503) {
      if (fromHeaders != null) return fromHeaders;

      return Math.min(1000 * (attempt + 1), 3000);
    }

    const backoff = Math.min(150 * Math.pow(2, attempt), 1000);

    const jitter = Math.floor(Math.random() * 100);

    return backoff + jitter;
  }

  private classifyAndThrow(status: number, message: string, retryAfterMs?: number): never {
    if (status === 401 || status === 403) {
      throw new AuthError(message, status as 401 | 403);
    }

    if (status === 429) {
      throw new RateLimitError(message, retryAfterMs);
    }

    if (status >= 500 && status <= 599) {
      throw new ServerError(status, message);
    }

    throw new HttpError(status, message);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }


  private buildAuthHeader(): HttpHeaders {
    const { token, basic } = this.config;

    if (token && token.trim().length > 0) {
      const tokenBearer = token.trim();
      return {
        authorization: tokenBearer.toLowerCase().startsWith("bearer ") ? tokenBearer : `Bearer ${tokenBearer}`,
      };
    }
    if (basic?.user && basic?.pass) {
      const raw = `${basic.user}:${basic.pass}`;

      const encoded = Buffer.from(raw, "utf8").toString("base64");

      return { authorization: `Basic ${encoded}` };
    }

    throw new AuthError("Missing credentials", 401);
  }

  private buildDefaultHeaders(): HttpHeaders {
    return {
      "accept-encoding": "gzip",
      accept: "application/json",
      ...this.buildAuthHeader(),
    };
  }

  private toLowercaseHeaders(raw: any): HttpHeaders {
    const out: HttpHeaders = {};

    if (raw && typeof raw === "object") {
      for (const [key, value] of Object.entries(raw)) {
        if (value == null) continue;

        out[String(key).toLowerCase()] = Array.isArray(value) ? String(value[0]) : String(value);
      }
    }

    return out;
  }

  private parseRetryDelayMs(headers: HttpHeaders): number | null {

    const timeinterval = headers["x-lognex-retry-timeinterval"];

    if (timeinterval) {
      const ms = Number(timeinterval);

      if (Number.isFinite(ms) && ms >= 0) return ms;
    }

    const lognexAfter = headers["x-lognex-retry-after"];

    if (lognexAfter) {
      const sec = Number(lognexAfter);

      if (Number.isFinite(sec) && sec >= 0) return sec * 1000;
    }

    const retryAfter = headers["retry-after"];

    if (retryAfter) {
      const num = Number(retryAfter);

      if (Number.isFinite(num) && num >= 0) return num * 1000;

      const when = Date.parse(retryAfter);

      if (!Number.isNaN(when)) {
        const delta = when - Date.now();

        if (delta > 0) return delta;
      }
    }
    return null;
    }
}
