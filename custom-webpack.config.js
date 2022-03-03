const webpack = require('webpack');

/**
 * This enables us to use environment variables defined in the system.
 * They are initialized with null, and their values are set according to the corresponding
 * src/environments/environment.*.ts file.
 */
module.exports = {
  externals: {three: 'THREE'},
  plugins: [
    new webpack.EnvironmentPlugin({
      // Auth0
      AUTH0_AUDIENCE: null,
      AUTH0_CLIENT_DOMAIN: null,
      AUTH0_CLIENT_ID: null,
      AUTH0_REDIRECT: null,
      AUTH0_LOGOUT_REDIRECT: null,
      AUTH0_SCOPE: null,
      // Backend
      API_HOST: null,
      API_VERSION: null,
      CLOUDSIM_HOST: null,
      CLOUDSIM_VERSION: null,
      CREDITS_REDIRECT: null,
      // Other
      AWS_GZ_LOGS_BUCKET: null,
      SUBT_PORTAL_URL: null,
      STRIPE_PK: null,
      CREDITS_REQUIRED: null
    })
  ]
}
