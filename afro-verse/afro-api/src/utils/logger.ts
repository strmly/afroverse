import winston from 'winston';

/**
 * Logger Configuration
 * 
 * Centralized logging with Winston.
 */

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'afro-api' },
  transports: [
    new winston.transports.Console({
      format: process.env.LOG_FORMAT === 'pretty' ? consoleFormat : logFormat,
    }),
  ],
});

// In production, add file transports (but not in serverless environments like Vercel)
// Vercel sets VERCEL=1, and serverless environments have read-only filesystems
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
if (process.env.NODE_ENV === 'production' && !isServerless) {
  try {
    logger.add(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
      })
    );
    logger.add(
      new winston.transports.File({
        filename: 'logs/combined.log',
      })
    );
  } catch (error) {
    // If file transports fail (e.g., read-only filesystem), just use console
    console.warn('File logging disabled - using console only');
  }
}

export default logger;







