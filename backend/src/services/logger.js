const winston = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const transports = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  }),
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: combine(timestamp(), errors({ stack: true }), logFormat),
    maxsize: 10 * 1024 * 1024, // 10 MB
    maxFiles: 5,
    tailable: true,
  }),
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: combine(timestamp(), errors({ stack: true }), logFormat),
    maxsize: 10 * 1024 * 1024,
    maxFiles: 10,
    tailable: true,
  }),
];

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(process.cwd(), 'logs', 'exceptions.log') }),
  ],
});

module.exports = { logger };
