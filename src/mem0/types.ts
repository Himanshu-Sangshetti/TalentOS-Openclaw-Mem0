export type Mem0Role = "system" | "user" | "assistant";

export interface Mem0Message {
  role: Mem0Role;
  content: string;
}

export interface Mem0AddRequest {
  user_id: string;
  agent_id?: string;
  app_id?: string;
  messages: Mem0Message[];
  metadata?: Record<string, unknown>;
  infer?: boolean;
  async_mode?: boolean;
  output_format?: "v1.0" | "v1.1";
  version?: "v2";
  enable_graph?: boolean;
}

export interface Mem0AddEvent {
  id: string;
  event: "ADD" | "UPDATE" | "DELETE";
  data: {
    memory: string;
  };
}

export type Mem0FilterValue =
  | string
  | number
  | boolean
  | {
      in?: Array<string | number | boolean>;
      ne?: string | number | boolean;
      lt?: string | number;
      lte?: string | number;
      gt?: string | number;
      gte?: string | number;
      contains?: string;
      icontains?: string;
    };

export interface Mem0SearchRequest {
  query: string;
  filters: Record<string, unknown>;
  top_k?: number;
  rerank?: boolean;
  threshold?: number;
  keyword_search?: boolean;
  version?: "v2";
}

export interface Mem0SearchMemory {
  id: string;
  memory: string;
  score?: number;
  metadata?: Record<string, unknown> | null;
  categories?: string[];
  created_at?: string;
  updated_at?: string | null;
  user_id?: string;
  agent_id?: string;
}

export interface Mem0SearchResponse {
  memories: Mem0SearchMemory[];
}
