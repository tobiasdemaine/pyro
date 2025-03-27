import type { Configuration } from "webpack";
import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";

export const mainConfig: Configuration = {
  entry: "./src/index.ts",
  target: "electron-main", // Explicitly target Electron's main process
  module: {
    rules: [
      ...rules, // Keep your existing rules
      // Add a rule for native modules if not already present
      {
        test: /\.node$/,
        loader: "@vercel/webpack-asset-relocator-loader",
        options: {
          output: "native_modules", // Where to place native files
        },
      },
    ],
  },
  plugins,
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
  },
  externals: {
    // Exclude native modules from bundling
    "@serialport/bindings-cpp": "commonjs @serialport/bindings-cpp",
    serialport: "commonjs serialport", // If you're using the full serialport package
  },
};
