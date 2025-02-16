import pino, { Logger } from 'pino';

jest.mock('../src', () => {
  const actualModule = jest.requireActual('../src');

  return {
    ...actualModule,
    createLogger: jest.fn(() => {
      const realLogger = actualModule.createLogger({
        serviceName: 'test-service',
        env: 'test'
      });

      return {
        ...realLogger,
        info: jest.spyOn(realLogger, 'info'),
        warn: jest.spyOn(realLogger, 'warn'),
        error: jest.spyOn(realLogger, 'error'),
        fatal: jest.spyOn(realLogger, 'fatal'),
        debug: jest.spyOn(realLogger, 'debug'),
        trace: jest.spyOn(realLogger, 'trace'),
        silent: jest.spyOn(realLogger, 'silent'),
        child: jest.fn(realLogger.child)
      };
    })
  };
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = require('../src').createLogger();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Section 1: Input Validation
  describe('Input Validation', () => {
    test('Throws error for invalid input types', () => {
      expect(() => logger.info(123)).toThrow('Invalid log input. Must be a string or an object.');
    });

    test('Accepts a simple string message', () => {
      expect(() => logger.info('Server started')).not.toThrow();
    });

    test('Accepts a message with structured data', () => {
      expect(() => logger.warn('Cache miss', { key: 'user:123' })).not.toThrow();
    });

    test('Accepts structured data without a message', () => {
      const logData = { a: 1, b: 2, c: { a: 11, b: 12 } };
      expect(() => logger.info(logData)).not.toThrow();
    });
  });

  // Section 2: Output Validation
  describe('Output Validation', () => {
    test('Logs a simple message', () => {
      logger.info('Server started');

      const [loggedMsg, loggedObject] = (logger.info as jest.Mock).mock.calls[0];

      expect(loggedMsg).toBe('Server started');
      expect(loggedObject).toBeUndefined();
    });

    test('Logs a message with structured data', () => {
      logger.warn('Cache miss', { key: 'user:123' });

      const [loggedMsg, loggedObject] = (logger.warn as jest.Mock).mock.calls[0];

      expect(loggedMsg).toBe('Cache miss');
      expect(loggedObject).toEqual(expect.objectContaining({ key: 'user:123' }));
    });

    test('Logs an error message with structured data', () => {
      logger.error('DB connection failed', { errorCode: 'DB_CONN_ERR', retry: true });

      const [loggedMsg, loggedObject] = (logger.error as jest.Mock).mock.calls[0];

      expect(loggedMsg).toBe('DB connection failed');
      expect(loggedObject).toEqual(
        expect.objectContaining({ errorCode: 'DB_CONN_ERR', retry: true })
      );
    });

    test('Logs a message with a nested object', () => {
      logger.info('Nested object test', { a: 1, b: 2, c: { a: 11, b: 12 } });

      const [loggedMsg, loggedObject] = (logger.info as jest.Mock).mock.calls[0];

      expect(loggedMsg).toBe('Nested object test');
      expect(loggedObject).toEqual(expect.objectContaining({ a: 1, b: 2, c: { a: 11, b: 12 } }));
    });

    test('Logs an object directly', () => {
      const logData = { a: 1, b: 2, c: { a: 11, b: 12 } };
      logger.info(logData);

      const [loggedObject] = (logger.info as jest.Mock).mock.calls[0];

      expect(loggedObject).toEqual(expect.objectContaining(logData));
    });
  });
});
