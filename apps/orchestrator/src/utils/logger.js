const namespace = 'orchestrator';

function format(level, message, context) {
  const payload = context && Object.keys(context).length ? ` ${JSON.stringify(context)}` : '';
  return `[${new Date().toISOString()}] [${namespace}] [${level.toUpperCase()}] ${message}${payload}`;
}

export const logger = {
  info(message, context) {
    console.log(format('info', message, context));
  },
  warn(message, context) {
    console.warn(format('warn', message, context));
  },
  error(message, context) {
    console.error(format('error', message, context));
  },
};
