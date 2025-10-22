module.exports = [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      origin: [process.env.APP_URL, process.env.API_URL],
      headers: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  },
  'strapi::security',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
