// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// Devnote: Environment variables are handled by Webpack.
// Guard against missing `process` in browser environments (e.g. Karma tests).
const env: Record<string, string | undefined> =
  (typeof process !== 'undefined' && process.env) ? process.env : {};


export const environment = {
  production: false,
  // Auth0
  AUTH0_AUDIENCE: env.AUTH0_AUDIENCE || 'https://fuel.gazebosim.org',
  AUTH0_CLIENT_DOMAIN: env.AUTH0_CLIENT_DOMAIN || 'gazebo.auth0.com',
  AUTH0_CLIENT_ID: env.AUTH0_CLIENT_ID || 'placeholder-client-id',
  AUTH0_REDIRECT: env.AUTH0_REDIRECT || 'http://localhost:4200/callback',
  AUTH0_LOGOUT_REDIRECT: env.AUTH0_LOGOUT_REDIRECT || 'http://localhost:4200',
  AUTH0_SCOPE: env.AUTH0_SCOPE || 'openid profile email',
  // Backend
  API_HOST: env.API_HOST || 'http://localhost:8000',
  API_VERSION: env.API_VERSION || '1.0',
  CLOUDSIM_HOST: env.CLOUDSIM_HOST || 'http://localhost:8001',
  CLOUDSIM_VERSION: env.CLOUDSIM_VERSION || '1.0',
  CREDITS_REDIRECT: env.CREDITS_REDIRECT || '',
  // Other
  AWS_GZ_LOGS_BUCKET: env.AWS_GZ_LOGS_BUCKET || '',
  STRIPE_PK: env.STRIPE_PK || '',
  CREDITS_REQUIRED: env.CREDITS_REQUIRED || '0',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
