/**
 * @author: @AngularClass
 */

const helpers = require('./helpers');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const webpackMergeDll = webpackMerge.strategy({plugins: 'replace'});
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev

/**
 * Webpack Plugins
 */
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'test';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;
const HMR = helpers.hasProcessFlag('hot');
const API_VERSION = process.env.API_VERSION || '1.0';
const API_HOST = process.env.API_HOST || 'http://localhost:8000';
const CLOUDSIM_VERSION = process.env.CLOUDSIM_VERSION || '1.0';
const CLOUDSIM_HOST = process.env.CLOUDSIM_HOST || 'http://localhost:8001';
const SUBT_PORTAL_URL = process.env.SUBT_PORTAL_URL || 'https://staging.subtchallenge.world';
const AWS_GZ_LOGS_BUCKET = process.env.AWS_GZ_LOGS_BUCKET || 'web-cloudsim-staging-logs';

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE
const AUTH0_CLIENT_DOMAIN = process.env.AUTH0_CLIENT_DOMAIN
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID
const AUTH0_LOGOUT_REDIRECT = process.env.AUTH0_LOGOUT_REDIRECT
const AUTH0_REDIRECT = process.env.AUTH0_REDIRECT
const AUTH0_SCOPE = process.env.AUTH0_SCOPE || 'openid profile email'

const METADATA = webpackMerge(commonConfig({env: ENV}).metadata, {
  host: HOST,
  port: PORT,
  ENV: ENV,
  HMR: HMR,
  API_VERSION: API_VERSION,
  API_HOST: API_HOST,
  CLOUDSIM_VERSION: CLOUDSIM_VERSION,
  CLOUDSIM_HOST: CLOUDSIM_HOST,
  SUBT_PORTAL_URL: SUBT_PORTAL_URL,
  AWS_GZ_LOGS_BUCKET: AWS_GZ_LOGS_BUCKET,
  AUTH0_AUDIENCE : AUTH0_AUDIENCE,
  AUTH0_CLIENT_DOMAIN : AUTH0_CLIENT_DOMAIN,
  AUTH0_CLIENT_ID : AUTH0_CLIENT_ID,
  AUTH0_LOGOUT_REDIRECT: AUTH0_LOGOUT_REDIRECT,
  AUTH0_REDIRECT : AUTH0_REDIRECT,
  AUTH0_SCOPE : AUTH0_SCOPE
});


/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function (options) {
  return {

    /**
     * Source map for Karma from the help of karma-sourcemap-loader &  karma-webpack
     *
     * Do not change, leave as is or it wont work.
     * See: https://github.com/webpack/karma-webpack#source-maps
     */
    devtool: 'inline-source-map',

    /**
     * Options affecting the resolving of modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#resolve
     */
    resolve: {

      /**
       * An array of extensions that should be used to resolve modules.
       *
       * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
       */
      extensions: ['.ts', '.js'],

      /**
       * Make sure root is src
       */
      modules: [helpers.root('src'), 'node_modules']

    },

    /**
     * Options affecting the normal modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#module
     *
     * 'use:' revered back to 'loader:' as a temp. workaround for #1188
     * See: https://github.com/AngularClass/angular2-webpack-starter/issues/1188#issuecomment-262872034
     */
    module: {

      rules: [

        /**
         * Source map loader support for *.js files
         * Extracts SourceMaps for source files that as added as sourceMappingURL comment.
         *
         * See: https://github.com/webpack/source-map-loader
         */
        {
          enforce: 'pre',
          test: /\.js$/,
          loader: 'source-map-loader',
          exclude: [
            // these packages have problems with their sourcemaps
            helpers.root('node_modules/rxjs'),
            helpers.root('node_modules/@angular')
          ]
        },

        /**
         * Typescript loader support for .ts and Angular 2 async routes via .async.ts
         *
         * See: https://github.com/s-panferov/awesome-typescript-loader
         */
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'awesome-typescript-loader',
              query: {
                // use inline sourcemaps for "karma-remap-coverage" reporter
                sourceMap: false,
                inlineSourceMap: true,
                compilerOptions: {

                  // Remove TypeScript helpers to be injected
                  // below by DefinePlugin
                  removeComments: true

                }
              },
            },
            'angular2-template-loader'
          ],
          exclude: [/\.e2e\.ts$/]
        },

        /**
         * Json loader support for *.json files.
         *
         * See: https://github.com/webpack/json-loader
         */
        {
          test: /\.json$/,
          loader: 'json-loader',
          exclude: [helpers.root('src/index.html')]
        },

        /**
         * Raw loader support for *.css files
         * Returns file content as string
         *
         * See: https://github.com/webpack/raw-loader
         */
        {
          test: /\.css$/,
          loader: ['to-string-loader', 'css-loader'],
          exclude: [helpers.root('src/index.html')]
        },

        /**
         * Raw loader support for *.scss files
         *
         * See: https://github.com/webpack/raw-loader
         */
        {
            test: /\.scss$/,
            loader: ['raw-loader', 'sass-loader'],
            exclude: [helpers.root('src/index.html')]
        },

        /**
         * Raw loader support for *.html
         * Returns file content as string
         *
         * See: https://github.com/webpack/raw-loader
         */
        {
          test: /\.html$/,
          loader: 'raw-loader',
          exclude: [helpers.root('src/index.html')]
        },

        /**
         * Instruments JS files with Istanbul for subsequent code coverage reporting.
         * Instrument only testing sources.
         *
         * See: https://github.com/deepsweet/istanbul-instrumenter-loader
         */
        {
          enforce: 'post',
          test: /\.(js|ts)$/,
          loader: 'istanbul-instrumenter-loader',
          include: helpers.root('src'),
          exclude: [
            /\.(e2e|spec)\.ts$/,
            /node_modules/
          ]
        }

      ]
    },

    /**
     * Add additional plugins to the compiler.
     *
     * See: http://webpack.github.io/docs/configuration.html#plugins
     */
    plugins: [

      /**
       * Plugin: DefinePlugin
       * Description: Define free variables.
       * Useful for having development builds with debug logging or adding global constants.
       *
       * Environment helpers
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
       */
      // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
      new DefinePlugin({
        'ENV': JSON.stringify(ENV),
        'HMR': false,
        'API_VERSION': JSON.stringify(METADATA.API_VERSION),
        'API_HOST': JSON.stringify(METADATA.API_HOST),
        'CLOUDSIM_VERSION': JSON.stringify(METADATA.CLOUDSIM_VERSION),
        'CLOUDSIM_HOST': JSON.stringify(METADATA.CLOUDSIM_HOST),
        'SUBT_PORTAL_URL': JSON.stringify(METADATA.SUBT_PORTAL_URL),
        'AWS_GZ_LOGS_BUCKET': JSON.stringify(METADATA.AWS_GZ_LOGS_BUCKET),
        'AUTH0_AUDIENCE' : JSON.stringify(METADATA.AUTH0_AUDIENCE),
        'AUTH0_CLIENT_DOMAIN' : JSON.stringify(METADATA.AUTH0_CLIENT_DOMAIN),
        'AUTH0_CLIENT_ID' : JSON.stringify(METADATA.AUTH0_CLIENT_ID),
        'AUTH0_LOGOUT_REDIRECT' : JSON.stringify(METADATA.AUTH0_LOGOUT_REDIRECT),
        'AUTH0_REDIRECT' : JSON.stringify(METADATA.AUTH0_REDIRECT),
        'AUTH0_SCOPE' : JSON.stringify(METADATA.AUTH0_SCOPE),
        'process.env': {
          'ENV': JSON.stringify(ENV),
          'NODE_ENV': JSON.stringify(ENV),
          'HMR': false,
          'API_VERSION': JSON.stringify(METADATA.API_VERSION),
          'API_HOST': JSON.stringify(METADATA.API_HOST),
          'CLOUDSIM_VERSION': JSON.stringify(METADATA.CLOUDSIM_VERSION),
          'CLOUDSIM_HOST': JSON.stringify(METADATA.CLOUDSIM_HOST),
          'SUBT_PORTAL_URL': JSON.stringify(METADATA.SUBT_PORTAL_URL),
          'AWS_GZ_LOGS_BUCKET': JSON.stringify(METADATA.AWS_GZ_LOGS_BUCKET),
          'AUTH0_AUDIENCE' : JSON.stringify(METADATA.AUTH0_AUDIENCE),
          'AUTH0_CLIENT_DOMAIN' : JSON.stringify(METADATA.AUTH0_CLIENT_DOMAIN),
          'AUTH0_CLIENT_ID' : JSON.stringify(METADATA.AUTH0_CLIENT_ID),
          'AUTH0_LOGOUT_REDIRECT' : JSON.stringify(METADATA.AUTH0_LOGOUT_REDIRECT),
          'AUTH0_REDIRECT' : JSON.stringify(METADATA.AUTH0_REDIRECT),
          'AUTH0_SCOPE' : JSON.stringify(METADATA.AUTH0_SCOPE),
        }
      }),

      /**
       * Plugin: ContextReplacementPlugin
       * Description: Provides context to Angular's use of System.import
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#contextreplacementplugin
       * See: https://github.com/angular/angular/issues/11580
       */
      new ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        helpers.root('src'), // location of your src
        {
          // your Angular Async Route paths relative to this root directory
        }
      ),

      /**
       * Plugin LoaderOptionsPlugin (experimental)
       *
       * See: https://gist.github.com/sokra/27b24881210b56bbaff7
       */
      new LoaderOptionsPlugin({
        debug: false,
        options: {
          // legacy options go here
        }
      }),

    ],

    /**
     * Disable performance hints
     *
     * See: https://github.com/a-tarasyuk/rr-boilerplate/blob/master/webpack/dev.config.babel.js#L41
     */
    performance: {
      hints: false
    },

    /**
     * Include polyfills or mocks for various node stuff
     * Description: Node configuration
     *
     * See: https://webpack.github.io/docs/configuration.html#node
     */
    node: {
      global: true,
      process: false,
      crypto: 'empty',
      module: false,
      clearImmediate: false,
      setImmediate: false
    }

  };
}
