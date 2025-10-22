#!/usr/bin/env node

const email = process.env.STRAPI_ADMIN_EMAIL;
const password = process.env.STRAPI_ADMIN_PASSWORD;
const cmsUrl = process.env.CMS_URL || process.env.STRAPI_URL || 'http://127.0.0.1:1337';

if (!email || !password) {
  console.error('STRAPI_ADMIN_EMAIL and STRAPI_ADMIN_PASSWORD must be provided.');
  process.exit(1);
}

async function bootstrapAdmin() {
  const response = await fetch(`${cmsUrl.replace(/\/$/, '')}/admin/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      firstname: email.split('@')[0] || 'Admin',
      lastname: 'User',
      password,
    }),
  });

  if (!response.ok && response.status !== 400) {
    const text = await response.text();
    throw new Error(`Failed to bootstrap admin (${response.status}): ${text}`);
  }

  console.log('Admin bootstrap attempted. If the user already exists the request may return 400.');
}

bootstrapAdmin().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
