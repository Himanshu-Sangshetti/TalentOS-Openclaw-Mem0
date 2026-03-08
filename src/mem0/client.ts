import type {
  Mem0AddEvent,
  Mem0AddRequest,
  Mem0SearchRequest,
  Mem0SearchResponse
} from "./types.js";

interface Mem0ClientOptions {
  apiKey: string;
  baseUrl: string;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class Mem0HttpError extends Error {
  public readonly status: number;
  public readonly responseBody: string;

  constructor(message: string, status: number, responseBody: string) {
    super(message);
    this.name = "Mem0HttpError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export class Mem0Client {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: Mem0ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? 12000;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 400;
  }

  async addMemories(payload: Mem0AddRequest): Promise<Mem0AddEvent[]> {
    const result = await this.requestJson<unknown>("/v1/memories/", payload);
    if (Array.isArray(result)) {
      return result as Mem0AddEvent[];
    }
    return [];
  }

  async searchMemories(payload: Mem0SearchRequest): Promise<Mem0SearchResponse> {
    const result = await this.requestJson<unknown>("/v2/memories/search/", payload);

    if (Array.isArray(result)) {
      return { memories: result as Mem0SearchResponse["memories"] };
    }

    if (
      typeof result === "object" &&
      result !== null &&
      "memories" in result &&
      Array.isArray((result as { memories: unknown }).memories)
    ) {
      return result as Mem0SearchResponse;
    }

    return { memories: [] };
  }

  private async requestJson<T>(path: string, body: unknown): Promise<T> {
    let attempt = 0;
    let lastError: unknown;

    while (attempt <= this.maxRetries) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(body),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Mem0HttpError(
            `Mem0 request failed (${response.status}) for ${path}`,
            response.status,
            errorText
          );
          if (!this.isRetryableStatus(response.status) || attempt === this.maxRetries) {
            throw error;
          }
          lastError = error;
          await sleep(this.retryDelayMs * (attempt + 1));
          attempt += 1;
          continue;
        }

        return (await response.json()) as T;
      } catch (error) {
        lastError = error;
        if (attempt === this.maxRetries || !this.isRetryableError(error)) {
          throw error;
        }
        await sleep(this.retryDelayMs * (attempt + 1));
        attempt += 1;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Mem0 request failed");
  }

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Token ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
  }

  private isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
  }

  private isRetryableError(error: unknown): boolean {
    return (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "AbortError")
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
