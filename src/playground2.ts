import { createWinstonLogger } from './loggers/winstonLogger';

const logger = createWinstonLogger({
  env: 'staging',
  level: 'info',
  serviceName: 'my-app',
  hostname: process.env.HOSTNAME,
  enableDatadog: true,
  ddApiKey: process.env.DD_API_KEY,
  // lightMode: true,
  newLineEOL: true
});

// Basic logging
logger.info('Application started.');
logger.info('Application started.', {});

logger.error({ error: new Error('Oops!') });

logger.error('Error occurred', { error: new Error('Oops!') });

logger.info('Application started', {
  session: {
    id: 'abc-123',
    isActive: false,
    expiresAt: new Date(Date.now() + 3600000)
  }
});
logger.error('Something went wrong', { errorDetails: 'Invalid request' });

const userLogger = logger.branch({ scope: 'UserService' });

userLogger.info('Fetching user details', {
  userId: 123,
  profile: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 35,
    verified: true,
    lastLogin: new Date(),
    preferences: {
      notifications: ['email', 'sms'],
      theme: 'dark'
    }
  },
  session: {
    id: 'abc-123',
    isActive: false,
    expiresAt: new Date(Date.now() + 3600000)
  },
  nullableField: null,
  undefinedField: undefined,
  roles: ['admin', 'editor'],
  loginAttempts: 3,
  isLocked: false,
  metadataVersion: 1
});

userLogger.debug({
  profile: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 35,
    verified: true,
    lastLogin: new Date(),
    preferences: {
      notifications: ['email', 'sms'],
      theme: 'dark'
    }
  },
  loginAttempts: 3,
  isLocked: false,
  metadataVersion: 1
});

userLogger.fatal('Testing log only');

userLogger.fatal('Error occurred', { error: new Error('Oops!') });

userLogger.addDdtags(['region:us-east-1', 'feature:beta']);
userLogger.error('Failed to fetch user', { userId: 123, reason: 'Not found' });

logger.addAdditionalTraceContext('requestId', 'abc-123');
logger.addMetadata('session', { userId: 456 });

logger.info('Processing user request');

logger.info('Post');
userLogger.info('Post', { userId: 123 });

const subUserLogger = userLogger.branch({ scope: 'SubUserService' });
subUserLogger.info('Fetching sub user', { userId: 999999 });
