export interface APIResponse<T = unknown> {
  status: "success" | "error";
  message: string;
  data?: T;
  errors?: unknown;
}