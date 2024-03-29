// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// Devnote: Environment variables are handled by Webpack.


export const environment = {
  production: false,
  // Auth0
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  AUTH0_CLIENT_DOMAIN: process.env.AUTH0_CLIENT_DOMAIN,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_REDIRECT: process.env.AUTH0_REDIRECT,
  AUTH0_LOGOUT_REDIRECT: process.env.AUTH0_LOGOUT_REDIRECT,
  AUTH0_SCOPE: process.env.AUTH0_SCOPE || 'openid profile email',
  // Backend
  API_HOST: process.env.API_HOST || 'http://localhost:8000',
  API_VERSION: process.env.API_VERSION || '1.0',
  CLOUDSIM_HOST: process.env.CLOUDSIM_HOST || 'http://localhost:8001',
  CLOUDSIM_VERSION: process.env.CLOUDSIM_VERSION || '1.0',
  CREDITS_REDIRECT: process.env.CREDITS_REDIRECT || '',
  // Other
  AWS_GZ_LOGS_BUCKET: process.env.AWS_GZ_LOGS_BUCKET || '',
  STRIPE_PK: process.env.STRIPE_PK || '',
  CREDITS_REQUIRED: process.env.CREDITS_REQUIRED || '0',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
