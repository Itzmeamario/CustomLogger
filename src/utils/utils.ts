import util from 'util';

const MAX_MESSAGE_LENGTH = 5000;

const truncateMessage = (message: string) =>
  message.length > MAX_MESSAGE_LENGTH
    ? `${message.substring(0, MAX_MESSAGE_LENGTH)}... [truncated]`
    : message;

const truncateInspect = (obj: any) => {
  const inspected = util.inspect(obj, { depth: null });
  return inspected.length > MAX_MESSAGE_LENGTH
    ? `${inspected.substring(0, MAX_MESSAGE_LENGTH)}... [truncated]`
    : inspected;
};

export const createLogMessage = (
  level: string,
  msgOrData: string | Record<string, any>,
  data?: Record<string, any>
) => {
  const errorRegex = /(error|fatal)/i;

  if (errorRegex.test(level)) {
    if (typeof msgOrData === 'string') {
      return {
        message: truncateMessage(msgOrData),
        ...(data && { error: truncateInspect(data) })
      };
    } else if (msgOrData && typeof msgOrData === 'object') {
      return {
        message: `Logging error directly`,
        ...(msgOrData && { error: truncateInspect(msgOrData) })
      };
    } else {
      throw new Error('Invalid log input. Must be a string or an object.');
    }
  }

  if (typeof msgOrData === 'string') {
    return {
      message: truncateMessage(msgOrData),
      ...(data && Object.keys(data).length > 0 && { logInfo: data })
    };
  } else if (msgOrData && typeof msgOrData === 'object') {
    return {
      message: `Logging object directly`,
      ...(msgOrData && Object.keys(msgOrData).length > 0 && { logInfo: msgOrData })
    };
  } else {
    throw new Error('Invalid log input. Must be a string or an object.');
  }
};
