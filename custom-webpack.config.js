const webpack = require("webpack");

// Load variables from a .env file into process.env at build time so that
// `npm start` picks them up without requiring the shell to export them first.
// Silent if no .env file is present (production/staging set vars in the
// environment instead).
try {
  require("dotenv").config();
} catch (_e) {
  // dotenv is optional; proceed without it.
}

/**
 * This enables us to use environment variables defined in the system.
 * They are initialized with null, and their values are set according to the corresponding
 * src/environments/environment.*.ts file.
 */
module.exports = {
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
      AI_BUILDER_HOST: null,
      // Other
      AWS_GZ_LOGS_BUCKET: null,
      STRIPE_PK: null,
      CREDITS_REQUIRED: null,
    }),
  ],
};
