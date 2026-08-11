import type { RequestHandler } from "express";

type AsyncRequestHandler = (
  ...args: Parameters<RequestHandler>
) => Promise<unknown>;

export function catchAsync(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
