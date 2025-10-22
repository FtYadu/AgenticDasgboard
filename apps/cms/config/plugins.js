module.exports = ({ env }) => {
  const endpoint = env('R2_ENDPOINT');
  const bucket = env('R2_BUCKET');
  const accessKey = env('R2_ACCESS_KEY_ID');
  const secretKey = env('R2_SECRET_ACCESS_KEY');

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    return {};
  }

  const normalizedEndpoint = endpoint.replace(/\/$/, '');

  return {
    upload: {
      config: {
        provider: '@strapi/provider-upload-aws-s3',
        providerOptions: {
          endpoint: normalizedEndpoint,
          bucket,
          region: 'auto',
          baseUrl: `${normalizedEndpoint}/${bucket}`,
          s3ForcePathStyle: true,
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
        actionOptions: {
          upload: {},
          uploadStream: {},
          delete: {},
        },
      },
    },
  };
};
