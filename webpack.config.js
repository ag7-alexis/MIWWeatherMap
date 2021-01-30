const webpack = require("webpack");
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

/**
 * UTILISATION :
 * (normalement c'est ça)
 *
 * premiere utilisation :
 * -> npm install
 * -> npm run watch
 *
 * prochaine utlisation :
 * -> npm run watch
 */

module.exports = {
  entry: ["./src/js/script.js", "./src/css/style.css"],
  output: {
    path: path.resolve(__dirname, "./js"),
    filename: "./main.js",
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: ["*", ".js"],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "../css/style.css",
    }),
  ],
  optimization: {
    minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
  },
};
