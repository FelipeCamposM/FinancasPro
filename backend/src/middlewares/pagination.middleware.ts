import { Request, Response, NextFunction } from "express";

export const paginate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit as string) || 10),
  );
  const offset = (page - 1) * limit;
  req.pagination = { page, limit, offset };
  next();
};
