// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// Devnote: Environment variables are handled with a custom Webpack configuration.

export const environment = {
  production: true,
  // Auth0
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  AUTH0_CLIENT_DOMAIN: process.env.AUTH0_CLIENT_DOMAIN,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_REDIRECT: process.env.AUTH0_REDIRECT,
  AUTH0_LOGOUT_REDIRECT: process.env.AUTH0_LOGOUT_REDIRECT,
  AUTH0_SCOPE: process.env.AUTH0_SCOPE || 'openid profile email',
  // Backend
  API_HOST: process.env.API_HOST || 'https://fuel.ignitionrobotics.org',
  API_VERSION: process.env.API_VERSION || '1.0',
  CLOUDSIM_HOST: process.env.CLOUDSIM_HOST || 'https://cloudsim.ignitionrobotics.org',
  CLOUDSIM_VERSION: process.env.CLOUDSIM_VERSION || '1.0',
  CREDITS_REDIRECT: process.env.CREDITS_REDIRECT || '',
  // Other
  AWS_GZ_LOGS_BUCKET: process.env.AWS_GZ_LOGS_BUCKET || 'web-cloudsim-production-logs',
  SUBT_PORTAL_URL: process.env.SUBT_PORTAL_URL || 'https://subtchallenge.world',
  STRIPE_PK: process.env.STRIPE_PK || '',
  CREDITS_REQUIRED: process.env.CREDITS_REQUIRED || '0',
};
