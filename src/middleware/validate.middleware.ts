import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";
import { APIResponse } from "../utils/response.util";

export function validate(
  schema: ZodTypeAny,
  source: "body" | "query" | "params" = "body",
) {
  return (req: Request, res: Response<APIResponse>, next: NextFunction) => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const error = result.error as ZodError;
      const errors = error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));

      // eslint-disable-next-line no-console
      console.error("[validate] Zod validation error", {
        method: req.method,
        path: req.originalUrl,
        source,
        errors,
      });

      return res.status(400).json({
        status: "error",
        message: "Validation error",
        errors,
      });
    }

    if (source === "query") {
      const query = req.query as Record<string, unknown>;

      for (const key of Object.keys(query)) {
        delete query[key];
      }

      Object.assign(query, result.data as Record<string, unknown>);
    } else {
      (req as any)[source] = result.data;
    }

    next();
  };
}