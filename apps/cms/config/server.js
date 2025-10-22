module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', ['k1', 'k2', 'k3', 'k4']),
  },
  url: env('CMS_URL'),
});
