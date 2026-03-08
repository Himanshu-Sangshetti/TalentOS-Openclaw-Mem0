import type {
  Mem0AddEvent,
  Mem0AddRequest,
  Mem0SearchRequest,
  Mem0SearchResponse
} from "./types.js";

interface Mem0ClientOptions {
  apiKey: string;
  baseUrl: string;
}

export class Mem0Client {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: Mem0ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
  }

  async addMemories(payload: Mem0AddRequest): Promise<Mem0AddEvent[]> {
    const response = await fetch(`${this.baseUrl}/v1/memories/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mem0 addMemories failed (${response.status}): ${errorText}`);
    }

    return (await response.json()) as Mem0AddEvent[];
  }

  async searchMemories(payload: Mem0SearchRequest): Promise<Mem0SearchResponse> {
    const response = await fetch(`${this.baseUrl}/v2/memories/search/`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mem0 searchMemories failed (${response.status}): ${errorText}`);
    }

    const result = (await response.json()) as unknown;

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

  private getHeaders(): HeadersInit {
    return {
      Authorization: `Token ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };
  }
}
