const webpack = require("webpack");
const path = require("path");

/**
 * UTILISATION :
 * (normalement c'est ça)
 *
 * premiere utilisation :
 * -> npm install
 * -> npm run watch
 *
 * prochaine utlisation :
 * -> run watch
 */

let config = {
  entry: "./src/js/script.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
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
  },
  resolve: {
    extensions: ["*", ".js"],
  },
};
module.exports = config;
