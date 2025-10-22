module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'admin_jwt_secret_here'),
  },
  url: env('CMS_URL'),
});
