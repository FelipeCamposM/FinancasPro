import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate =
  (schema: ZodSchema, target: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = (result.error as ZodError).errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      );
      res.status(422).json({ error: "Dados inválidos", details });
      return;
    }
    req[target] = result.data;
    next();
  };
