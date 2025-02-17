import { createPinoLogger } from './loggers/pinoLogger';

const logger = createPinoLogger({
  env: 'staging',
  serviceName: 'my-app',
  hostname: process.env.HOSTNAME,
  datadog: {
    apiKey: process.env.DD_API_KEY!
  },
  lightMode: true
});

// Basic logging
logger.info('Application started.');
logger.error('Error occurred', { error: new Error('Oops!') });

logger.info('Application started');
logger.fatal('Something went wrong', { errorDetails: 'Invalid request' });

const userLogger = logger.branch({ scope: 'UserService' });

userLogger.info('Fetching user details', { userId: 123 });
userLogger.error('Failed to fetch user', { userId: 123, reason: 'Not found' });

userLogger.addAdditionalTraceContext('requestId', 'abc-123');
logger.addMetadata('session', { userId: 456 });

logger.info('Processing user request');

logger.info('Post');
userLogger.info('Post', { userId: 123 });

const subUserLogger = userLogger.branch({ scope: 'SubUserService' });
subUserLogger.info('Fetching sub user', { userId: 999999 });
