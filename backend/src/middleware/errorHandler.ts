import { Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: unknown,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
}

export function notFoundHandler(_req: unknown, res: Response): void {
  res.status(404).json({
    success: false,
    error: '请求的资源不存在'
  });
}
