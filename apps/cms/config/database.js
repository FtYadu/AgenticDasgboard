module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: env('POSTGRES_URL'),
    pool: { min: 2, max: 10 },
  },
});
