import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File size too large'
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: 'Unexpected file field'
      });
      return;
    }
  }

  // File type validation errors from multer fileFilter
  if (err instanceof multer.MulterError || err.message?.includes('Only spreadsheet files are allowed')) {
    res.status(400).json({
      success: false,
      error: err.message || 'Invalid file upload'
    });
    return;
  }

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry - record already exists'
    });
    return;
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    res.status(400).json({
      success: false,
      error: 'Referenced record does not exist or is in use'
    });
    return;
  }

  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
