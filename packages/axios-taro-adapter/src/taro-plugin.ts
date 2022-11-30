import { IPluginContext } from "@tarojs/service";
import resolvePath from "resolve";

export default function (ctx: IPluginContext) {
  const { printLog, processTypeEnum } = ctx.helper;

  const npmCached = {};
  function resolveNpmSync(pluginName, root) {
    if (!npmCached[pluginName]) {
      const res = resolvePath.sync(pluginName, { basedir: root });
      return res;
    }
    return npmCached[pluginName];
  }

  ctx.modifyWebpackChain(({ chain }) => {
    chain.plugin("providerPlugin").tap((args) => {
      printLog(processTypeEnum.REMIND, "@taro-platform/axios-taro-adapter: 在小程序运行时注入全局的 FormData、Blob对象（目前Taro未实现，代码中使用的上述2个全局对象将会被替换成undefined）\r\n");
      args[0]["FormData"] = ["@tarojs/runtime", "FormData"];
      args[0]["Blob"] = ["@tarojs/runtime", "Blob"];
      return args;
    });

    // 设置 alias
    const realpathArr = [
      "axios/lib/core/buildFullPath",
      "axios/lib/core/settle",
      "axios/lib/helpers/buildURL",
      "axios/lib/utils",
      "axios/lib/helpers/formDataToJSON",
      "axios/lib/helpers/toURLEncodedForm",
      "axios/lib/core/AxiosHeaders"
    ].map((namePath) => {
      return {
        key: namePath,
        value: resolveNpmSync(namePath, process.cwd())
      };
    });
    realpathArr.forEach(({ key, value }) => {
      chain.resolve.alias.set(key, value);
    });

    printLog(processTypeEnum.REMIND, "@taro-platform/axios-taro-adapter: 移除 axios 中不适用小程序环境的默认适配器\r\n");
    /** 限定匹配范围在axios模块中 */
    const inAxiosReg = /node_modules\/axios\//;
    // 将 axios 库内部引用的 2个默认 适配器去除掉
    chain.merge({
      externals: [
        ({ context, request }, callback) => {
          if (inAxiosReg.test(context)) {
            if (request.includes("http.js") || request.includes("xhr.js")) {
              return callback(null, "var undefined");
            }
          }
          callback();
        }
      ]
    });
  });

  ctx.modifyRunnerOpts(({ opts }) => {
    if (!opts?.compiler) return;
    const { compiler } = opts;
    if (compiler.type === "webpack5") {
      compiler.prebundle ||= {};
      const prebundleOptions = compiler.prebundle;

      if (prebundleOptions.enable === false) return;
      prebundleOptions.exclude ||= [];
      prebundleOptions.exclude.push("axios", "@taro-platform/axios-taro-adapter");
      printLog(processTypeEnum.REMIND, "@taro-platform/axios-taro-adapter: 将 axios 和 @taro-platform/axios-taro-adapter 从预编译中排除\r\n");
    }
  });
}
