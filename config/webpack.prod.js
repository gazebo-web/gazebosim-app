/**
 * @author: @AngularClass
 */

const helpers = require('./helpers');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev

/**
 * Webpack Plugins
 */
const DefinePlugin = require('webpack/lib/DefinePlugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const IgnorePlugin = require('webpack/lib/IgnorePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');
const NormalModuleReplacementPlugin = require('webpack/lib/NormalModuleReplacementPlugin');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');
const OptimizeJsPlugin = require('optimize-js-plugin');

/**
 * Webpack Constants
 */
const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 8080;
const API_VERSION = process.env.API_VERSION || '1.0';
const API_HOST = process.env.API_HOST || 'https://fuel.ignitionrobotics.org';
const CLOUDSIM_VERSION = process.env.CLOUDSIM_VERSION || '1.0';
const CLOUDSIM_HOST = process.env.CLOUDSIM_HOST || 'https://cloudsim.ignitionrobotics.org/';
const SUBT_PORTAL_URL = process.env.SUBT_PORTAL_URL || 'https://subtchallenge.world';
const AWS_GZ_LOGS_BUCKET = process.env.AWS_GZ_LOGS_BUCKET || 'web-cloudsim-production-logs';

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
  HMR: false,
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

module.exports = function (env) {
  return webpackMerge(commonConfig({
    env: ENV
  }), {

    /**
     * Developer tool to enhance debugging
     *
     * See: http://webpack.github.io/docs/configuration.html#devtool
     * See: https://github.com/webpack/docs/wiki/build-performance#sourcemaps
     */
    devtool: 'source-map',

    /**
     * Options affecting the output of the compilation.
     *
     * See: http://webpack.github.io/docs/configuration.html#output
     */
    output: {

      /**
       * The output directory as absolute path (required).
       *
       * See: http://webpack.github.io/docs/configuration.html#output-path
       */
      path: helpers.root('dist'),

      /**
       * Specifies the name of each output file on disk.
       * IMPORTANT: You must not specify an absolute path here!
       *
       * See: http://webpack.github.io/docs/configuration.html#output-filename
       */
      filename: '[name].bundle-[chunkhash].js',

      /**
       * The filename of the SourceMaps for the JavaScript files.
       * They are inside the output.path directory.
       *
       * See: http://webpack.github.io/docs/configuration.html#output-sourcemapfilename
       */
      sourceMapFilename: '[name].bundle.map',

      /**
       * The filename of non-entry chunks as relative path
       * inside the output.path directory.
       *
       * See: http://webpack.github.io/docs/configuration.html#output-chunkfilename
       */
      chunkFilename: '[id].chunk.js'

    },

    module: {

      rules: [

        /*
         * Extract CSS files from .src/styles directory to external CSS file
         */
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader'
          }),
          include: [helpers.root('src', 'styles')]
        },

        /*
         * Extract and compile SCSS files from .src/styles directory to external CSS file
         */
        {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader!sass-loader'
          }),
          include: [helpers.root('src', 'styles')]
        },

      ]

    },

    /**
     * Add additional plugins to the compiler.
     *
     * See: http://webpack.github.io/docs/configuration.html#plugins
     */
    plugins: [

      /**
       * Webpack plugin to optimize a JavaScript file for faster initial load
       * by wrapping eagerly-invoked functions.
       *
       * See: https://github.com/vigneshshanmugam/optimize-js-plugin
       */

      new OptimizeJsPlugin({
        sourceMap: false
      }),

      /**
       * Plugin: ExtractTextPlugin
       * Description: Extracts imported CSS files into external stylesheet
       *
       * See: https://github.com/webpack/extract-text-webpack-plugin
       */
      new ExtractTextPlugin({
        filename: '[name]-[chunkhash].css',
        allChunks: true
      }),

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
        'ENV': JSON.stringify(METADATA.ENV),
        'HMR': METADATA.HMR,
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
          'ENV': JSON.stringify(METADATA.ENV),
          'NODE_ENV': JSON.stringify(METADATA.ENV),
          'HMR': METADATA.HMR,
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
       * Plugin: UglifyJsPlugin
       * Description: Minimize all JavaScript output of chunks.
       * Loaders are switched into minimizing mode.
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
       */
      // NOTE: To debug prod builds uncomment //debug lines and comment //prod lines
      new UglifyJsPlugin({
        // beautify: true, //debug
        // mangle: false, //debug
        // dead_code: false, //debug
        // unused: false, //debug
        // deadCode: false, //debug
        // compress: {
        //   screw_ie8: true,
        //   keep_fnames: true,
        //   drop_debugger: false,
        //   dead_code: false,
        //   unused: false
        // }, // debug
        // comments: true, //debug


        beautify: false, //prod
        output: {
          comments: false
        }, //prod
        mangle: {
          screw_ie8: true
        }, //prod
        compress: {
          screw_ie8: true,
          warnings: false,
          conditionals: true,
          unused: true,
          comparisons: true,
          sequences: true,
          dead_code: true,
          evaluate: true,
          if_return: true,
          join_vars: true,
          negate_iife: false // we need this for lazy v8
        },
      }),

      /**
       * Plugin: NormalModuleReplacementPlugin
       * Description: Replace resources that matches resourceRegExp with newResource
       *
       * See: http://webpack.github.io/docs/list-of-plugins.html#normalmodulereplacementplugin
       */

      new NormalModuleReplacementPlugin(
        /angular2-hmr/,
        helpers.root('config/empty.js')
      ),

      new NormalModuleReplacementPlugin(
        /zone\.js(\\|\/)dist(\\|\/)long-stack-trace-zone/,
        helpers.root('config/empty.js')
      ),


      // AoT
      // new NormalModuleReplacementPlugin(
      //   /@angular(\\|\/)upgrade/,
      //   helpers.root('config/empty.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /@angular(\\|\/)compiler/,
      //   helpers.root('config/empty.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /@angular(\\|\/)platform-browser-dynamic/,
      //   helpers.root('config/empty.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /dom(\\|\/)debug(\\|\/)ng_probe/,
      //   helpers.root('config/empty.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /dom(\\|\/)debug(\\|\/)by/,
      //   helpers.root('config/empty.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /src(\\|\/)debug(\\|\/)debug_node/,
      //   helpers.root('config/empty.js')
      // ),
      // new NormalModuleReplacementPlugin(
      //   /src(\\|\/)debug(\\|\/)debug_renderer/,
      //   helpers.root('config/empty.js')
      // ),

      /**
       * Plugin: CompressionPlugin
       * Description: Prepares compressed versions of assets to serve
       * them with Content-Encoding
       *
       * See: https://github.com/webpack/compression-webpack-plugin
       */
      //  install compression-webpack-plugin
      // new CompressionPlugin({
      //   regExp: /\.css$|\.html$|\.js$|\.map$/,
      //   threshold: 2 * 1024
      // })

      /**
       * Plugin LoaderOptionsPlugin (experimental)
       *
       * See: https://gist.github.com/sokra/27b24881210b56bbaff7
       */
      new LoaderOptionsPlugin({
        minimize: true,
        debug: false,
        options: {

          /**
           * Html loader advanced options
           *
           * See: https://github.com/webpack/html-loader#advanced-options
           */
          // TODO: Need to workaround Angular 2's html syntax => #id [bind] (event) *ngFor
          htmlLoader: {
            minimize: true,
            removeAttributeQuotes: false,
            caseSensitive: true,
            customAttrSurround: [
              [/#/, /(?:)/],
              [/\*/, /(?:)/],
              [/\[?\(?/, /(?:)/]
            ],
            customAttrAssign: [/\)?\]?=/]
          },

        }
      }),

      /**
       * Plugin: BundleAnalyzerPlugin
       * Description: Webpack plugin and CLI utility that represents
       * bundle content as convenient interactive zoomable treemap
       *
       * `npm run build:prod -- --env.analyze` to use
       *
       * See: https://github.com/th0r/webpack-bundle-analyzer
       */

    ],

    /*
     * Include polyfills or mocks for various node stuff
     * Description: Node configuration
     *
     * See: https://webpack.github.io/docs/configuration.html#node
     */
    node: {
      global: true,
      crypto: 'empty',
      process: false,
      module: false,
      clearImmediate: false,
      setImmediate: false
    }

  });
}
