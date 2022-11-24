import typescript from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import autoExternal from "rollup-plugin-auto-external";
import bundleSize from "rollup-plugin-bundle-size";
import packageJson from "./package.json";

const namedInput = "./src/index.ts";

const buildConfig = ({ browser = true, minified = false, ...config }) => {
  const banner = `// Axios-miniprogram-adapter v${packageJson.version} Copyright (c) ${new Date().getFullYear()} ${packageJson.author} and contributors`;
  const build = () => ({
    input: namedInput,
    output: [
      {
        file: packageJson.main,
        format: "esm",
        sourcemap: true,
        banner,
        exports: "named"
      }
    ],
    ...config,
    plugins: [json(), resolve({ browser }), commonjs({ transformMixedEsModules: true }), minified && terser(), minified && bundleSize(), autoExternal(), ...(config.plugins || [])],
    external: [
      "@tarojs/taro",
      "@tarojs/service",
      "resolve",
      "semver",
      "axios/lib/core/buildFullPath",
      "axios/lib/core/settle",
      "axios/lib/helpers/buildURL",
      "axios/lib/utils",
      "axios/lib/helpers/formDataToJSON",
      "axios/lib/helpers/toURLEncodedForm",
      "axios/lib/core/AxiosHeaders"
    ]
  });

  const configs = [build()];

  return configs;
};

export default async () => {
  return [
    ...buildConfig({ browser: true, plugins: [typescript({ tsconfig: "tsconfig.json", tsconfigDefaults: { compilerOptions: { declaration: true } }, useTsconfigDeclarationDir: true })] }),

    ...buildConfig({
      input: "./src/taro-plugin.ts",
      output: [
        {
          file: "./taro-plugin/index.js",
          format: "cjs",
          sourcemap: false
        }
      ],
      browser: false,
      plugins: [typescript({ tsconfigDefaults: { compilerOptions: { declaration: false } } })]
    })
  ];
};
