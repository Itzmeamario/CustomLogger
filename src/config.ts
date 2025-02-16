import dotenv from 'dotenv';
dotenv.config();

export const config = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info', // Log level (debug, info, warn, error)
  USE_PRETTY_LOGS: process.env.NODE_ENV !== 'production' // Pretty logs in dev
};
