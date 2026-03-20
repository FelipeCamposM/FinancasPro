import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(err);

  if (res.headersSent) return;

  if (err instanceof Error) {
    // Erros de constraint do PostgreSQL
    const pgErr = err as NodeJS.ErrnoException & {
      code?: string;
      detail?: string;
    };
    if (pgErr.code === "23505") {
      res
        .status(409)
        .json({ error: "Registro duplicado", details: [pgErr.detail ?? ""] });
      return;
    }
    if (pgErr.code === "23503") {
      res.status(409).json({
        error: "Registro referenciado não encontrado",
        details: [pgErr.detail ?? ""],
      });
      return;
    }
    res
      .status(500)
      .json({ error: "Erro interno do servidor", details: [err.message] });
    return;
  }

  res.status(500).json({ error: "Erro interno do servidor" });
};
