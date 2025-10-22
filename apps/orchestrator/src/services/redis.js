import Redis from 'ioredis';

let client;

export function createRedisClient() {
  if (client) {
    return client;
  }

  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    throw new Error('REDIS_HOST and REDIS_PORT must be configured');
  }

  client = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_DISABLE_TLS === 'true' ? undefined : {
      rejectUnauthorized: false,
    },
  });

  client.on('error', (error) => {
    console.error('[redis] connection error', error);
  });

  return client;
}
