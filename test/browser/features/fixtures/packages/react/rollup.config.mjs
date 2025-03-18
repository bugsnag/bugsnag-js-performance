import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import path from "path";
import url from "url";

import baseConfig, { isCdnBuild } from "../rollup.config.mjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const cdnConfig = {
  // mark everything other than 'src/index.jsx' as an external module when
  // using the CDN build
  // this stops rollup trying to resolve these modules as we don't run
  // 'npm install' when using the CDN build to avoid accidentally testing
  // against NPM packages
  external: (id) =>
    id !== "src/index.jsx" &&
    !id.endsWith("packages/react/src/index.jsx"),
  output: {
    ...baseConfig.output,
    globals: {
      ...baseConfig.output.globals,
      react: "React",
      "react-dom/client": "ReactDom",
      "@bugsnag/react-router-performance": "BugsnagReactRouterPerformance",
    },
  },
};

export default {
  ...baseConfig,
  input: "src/index.jsx",
  plugins: [
    nodeResolve({
      browser: true,
      jail: path.resolve(`${__dirname}/../..`),
      extensions: [".mjs", ".js", ".json", ".node", ".jsx"],
    }),
    commonjs(),
    babel({ babelHelpers: "bundled" }),
    replace({
      preventAssignment: true,
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    }),
  ],
  ...(isCdnBuild ? cdnConfig : {}),
};
