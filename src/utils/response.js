// utils/response.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'storage', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Laravel-style log format
const laravelFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    log += '\n' + JSON.stringify(meta, null, 2);
  }
  
  return log + '\n' + '-'.repeat(80) + '\n';
});

// Create Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    laravelFormat
  ),
  transports: [
    // All logs
    new DailyRotateFile({
      filename: path.join(logsDir, 'laravel-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    // Error logs only
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

// Add console in development only
if (process.env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level}: ${message}`;
        })
      ),
    })
  );
}

// Success response
export const success = (res, data = null, message = "Success", code = 200) => {
  return res.status(code).json({ 
    success: true, 
    message, 
    data 
  });
};

// Error response with automatic logging
export const error = (res, error = "Something went wrong", code = 500) => {
  const isErrorObject = error instanceof Error;
  
  const errorResponse = {
    success: false,
    message: isErrorObject ? error.message : error,
    timestamp: new Date().toISOString(),
  };

  // Prepare log metadata
  const logMeta = {
    statusCode: code,
    errorType: isErrorObject ? error.name : 'String Error',
  };

  // Add error details to logs
  if (isErrorObject) {
    logMeta.stack = error.stack;
    logMeta.errorCode = error.code;
  }

  // Write to log file based on severity
  if (code >= 500) {
    logger.error(`Server Error: ${isErrorObject ? error.message : error}`, logMeta);
  } else if (code >= 400) {
    logger.warn(`Client Error: ${isErrorObject ? error.message : error}`, logMeta);
  }

  // Show full error in development only
  if (process.env.NODE_ENV === "development" && isErrorObject) {
    errorResponse.fullError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return res.status(code).json(errorResponse);
};