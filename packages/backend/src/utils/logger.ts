import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.simple(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Create transports
const transports: winston.transport[] = [
  // Always log to console
  new winston.transports.Console({
    format: isDevelopment ? consoleFormat : logFormat,
    level: logLevel,
  }),
];

// Add file transports in production
if (!isDevelopment) {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );
}

// Create the logger
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
  exitOnError: false,
});

// Create a stream for HTTP request logging
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger; 