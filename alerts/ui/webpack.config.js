const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const webpack = require("webpack")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const pkg = require("./package.json")
const outputRegex = /(.+)\/([^/]+)/
const appProps = require("../../helpers/appProps")

if (!pkg.source)
  throw new Error(
    'No source found in package.json. Please add "source": "src/index.js" to package.json'
  )

if (!outputRegex.test(pkg.module))
  throw new Error(
    'package.json: module not found or its format does not match "DIR/FILE.js"'
  )

const [_, buildDir, filename] = pkg.module.match(outputRegex)
const externals = {}
for (let key in pkg.peerDependencies) externals[key] = key

module.exports = (_, argv) => {
  const mode = argv.mode
  const isDevelopment = mode === "development"
  const IGNORE_EXTERNALS = process.env.IGNORE_EXTERNALS === "true"

  return {
    experiments: {
      outputModule: true,
    },

    devtool: isDevelopment && "source-map",
    //Where we put the production code
    entry: path.resolve(__dirname, pkg.source),
    //Where we put the production code
    output: {
      path: path.resolve(__dirname, buildDir),
      // main file
      filename,
      // async chunks which are imported asynchronous "import('...').then(...)"
      chunkFilename: "[contenthash].js",
      // result as esm
      library: { type: "module" },
      // expose files imported asynchronous as chunks
      asyncChunks: true,
      clean: true,
    },
    externalsType: "module",
    externals: IGNORE_EXTERNALS || isDevelopment ? {} : externals,
    // This says to webpack that we are in development mode and write the code in webpack file in different way
    mode: "development",
    module: {
      rules: [
        //Allows use javascript
        {
          test: /\.(js|jsx|m?js)$/,
          type: "javascript/auto",
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.css$/i,
          use: [
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [require("tailwindcss"), require("autoprefixer")],
                },
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          use: [
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [require("tailwindcss"), require("autoprefixer")],
                },
              },
            },
            "sass-loader",
          ],
        },
        // config for background svgs in jsx. IMPORTANT: to differentiate between svgs that are to be used as bg images and those that are to be loaded
        // as components we have to add a query parameter `?url` to the images to be loaded as url for use in background images in jsx files
        //. example for import statement: import heroImage from "./img/app_bg_example.svg?url"
        // type "asset" chooses automatically between inline embed or loading as file depending on file size, similar to previously using url-loader and limit
        {
          test: /\.svg$/i,
          type: "asset",
          resourceQuery: /url/, // import filename: *.svg?url
        },
        // svg config for svgs as components in jsx files
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          resourceQuery: { not: [/url/] }, // exclude react component if import filename *.svg?url
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                svgo: false,
              },
            },
          ],
        },
        // config for background svgs in css
        // type "asset" chooses automatically between inline embed or loading as file depending on file size, similar to previously using url-loader and limit
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          issuer: /\.s?css$/,
          type: "asset",
        },
        //Allows use of images
        {
          test: /\.(png|jpg)$/i,
          type: "asset",
        },
      ],
    },
    resolve: {
      extensions: [".js", ".json"],
      fallback: {
        path: require.resolve("path-browserify"),
        os: require.resolve("os-browserify/browser"),
        util: require.resolve("util/"),
        assert: require.resolve("assert/"),
        fs: false,
        module: false,
      },
    },
    optimization: {
      // DO NOT USE splitChunks!!! It splits code in to files and can't
      // be loaded as a widget.
      // splitChunks: { chunks: "all" },

      // Minimize just in production.
      minimize: !isDevelopment,
      // Default minimizer for JAVASCRIPT is also included, no need to define a new one BUT do NOT REMOVE `...` to
      // not override default minimizers
      minimizer: [`...`, new CssMinimizerPlugin()],
    },
    plugins: [
      new webpack.ProvidePlugin({
        process: require.resolve("process/browser"),
        Buffer: require.resolve("buffer/"),
      }),

      //Allows to create an index.html in our build folder
      new HtmlWebpackPlugin({
        // do not inject script tags into html
        inject: false,
        template: path.resolve(__dirname, "public/index.html"), //we put the file that we created in public folder
        favicon: path.resolve(__dirname, "public/favicon.ico"),
        templateParameters: {
          // provide output filename to the template
          MAIN_FILENAME: filename,
          // merge props from package.json and secretProps.json
          // package.json -> appProps contains metadata like value and description
          // to get only the value we use the reduce function on keys array
          PROPS: JSON.stringify(appProps()),
        },
      }),
    ].filter(Boolean),
    //Config for webpack-dev-server module version 4.x
    devServer: {
      static: {
        directory: path.resolve(__dirname, "dist"),
      },
      port: process.env.PORT,
      host: "0.0.0.0",

      historyApiFallback: true,
      allowedHosts: "all",
      // Enable hot reloading server. It will provide WDS_SOCKET_PATH endpoint
      // for the WebpackDevServer client so it can learn when the files were
      // updated. The WebpackDevServer client is included as an entry point
      // in the webpack development configuration. Note that only changes
      // to CSS are currently hot reloaded. JS changes will refresh the browser.
      hot: true,
      // quiet: true,
      // Use 'ws' instead of 'sockjs-node' on server since we're using native
      // websockets in `webpackHotDevClient`.
      webSocketServer: "ws",
      client: {
        webSocketURL: "ws://0.0.0.0:80/ws",
      },
    },

  }
}
