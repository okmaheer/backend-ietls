/**
 * Comprehensive Logging Utility
 * Provides detailed error logging with stack traces, request context, and formatted output
 */

// Log levels
const LogLevel = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  reset: '\x1b[0m'
};

// Color mapping for log levels
const levelColors = {
  ERROR: colors.red,
  WARN: colors.yellow,
  INFO: colors.blue,
  DEBUG: colors.gray,
};

/**
 * Format timestamp
 */
const getTimestamp = () => {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
};

/**
 * Format log message with colors and structure
 */
const formatLog = (level, message, context = {}) => {
  const colorCode = levelColors[level] || '';
  const timestamp = getTimestamp();

  let logOutput = `\n${colorCode}${'═'.repeat(80)}${colors.reset}\n`;
  logOutput += `${colorCode}[${timestamp}] ${level}:${colors.reset} ${message}\n`;

  if (Object.keys(context).length > 0) {
    logOutput += `${colorCode}Context:${colors.reset}\n`;
    logOutput += `${JSON.stringify(context, null, 2)}\n`;
  }

  logOutput += `${colorCode}${'═'.repeat(80)}${colors.reset}\n`;

  return logOutput;
};

/**
 * Log error with full details
 */
export const logError = (message, error, context = {}) => {
  const errorContext = {
    ...context,
    errorMessage: error?.message || error,
    errorName: error?.name,
    errorCode: error?.code,
    stack: error?.stack,
  };

  console.error(formatLog(LogLevel.ERROR, message, errorContext));

  // Also log to file or external service in production
  // TODO: Implement file logging or service like Sentry
};

/**
 * Log warning
 */
export const logWarn = (message, context = {}) => {
  console.warn(formatLog(LogLevel.WARN, message, context));
};

/**
 * Log info
 */
export const logInfo = (message, context = {}) => {
  console.log(formatLog(LogLevel.INFO, message, context));
};

/**
 * Log debug (only in development)
 */
export const logDebug = (message, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(formatLog(LogLevel.DEBUG, message, context));
  }
};

/**
 * Log API request
 */
export const logRequest = (req) => {
  const context = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
  };

  logDebug('Incoming Request', context);
};

/**
 * Log API response
 */
export const logResponse = (req, res, duration) => {
  const context = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
  };

  logDebug('Response Sent', context);
};

/**
 * Log database query
 */
export const logQuery = (query, params = {}) => {
  logDebug('Database Query', { query, params });
};

/**
 * Create middleware for request logging
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  logRequest(req);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logResponse(req, res, duration);
  });

  next();
};

export default {
  error: logError,
  warn: logWarn,
  info: logInfo,
  debug: logDebug,
  request: logRequest,
  response: logResponse,
  query: logQuery,
  requestLogger,
};
