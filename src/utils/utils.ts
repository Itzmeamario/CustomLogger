export const createLogMessage = (
  level: string,
  msgOrData: string | Record<string, any>,
  data?: Record<string, any>
) => {
  const errorRegex = /(error|fatal)/i;

  if (errorRegex.test(level)) {
    if (typeof msgOrData === 'string') {
      return {
        message: msgOrData,
        ...(data && Object.keys(data).length > 0 && { ...data })
      };
    } else if (msgOrData && typeof msgOrData === 'object') {
      return {
        message: `Logging error directly`,
        ...(msgOrData && Object.keys(msgOrData).length > 0 && { ...msgOrData })
      };
    } else {
      throw new Error('Invalid log input. Must be a string or an object.');
    }
  }

  if (typeof msgOrData === 'string') {
    return {
      message: msgOrData,
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
