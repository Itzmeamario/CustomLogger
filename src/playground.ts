import 'dotenv/config';
import { createLogger } from './index';

const logger = createLogger({
  env: 'staging',
  serviceName: 'my-app',
  hostname: process.env.HOSTNAME,
  enableDatadog: true,
  ddApiKey: process.env.DD_API_KEY
});

// Logging examples
logger.info('Application started');
logger.error('Something went wrong', { errorDetails: 'Invalid request' });

const userLogger = logger.branch({ context: 'UserService' });

userLogger.info('Fetching user details', { userId: 123 });
userLogger.error('Failed to fetch user', { userId: 123, reason: 'Not found' });

logger.setTraceId('requestId', 'abc-123');
logger.addExtraMetadata('session', { userId: 456 });

logger.info('Processing user request');

logger.removeTraceId('requestId');
logger.removeExtraMetadata('session');

logger.info('Post');
userLogger.info('Post', { userId: 123 });

const subUserLogger = userLogger.branch({ context: 'SubUserService' });
subUserLogger.info('Fetching sub user', { userId: 999999 });

setTimeout(() => {
  console.log('4 seconds have passed!');
}, 4000);
