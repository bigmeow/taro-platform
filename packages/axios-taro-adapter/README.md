axios 的 `Taro` 小程序请求适配器

## :star: 特性

- 支持最新版本的 [axios](https://axios-http.com/zh/docs/intro) (1.2.0 +)， 全网第一个支持 [axios](https://axios-http.com/zh/docs/intro) 正式版的适配器
- 小程序环境全平台支持
- TypeScript 优先

## :rocket: 使用指南

### 安装

```bash
npm i @taro-platform/axios-taro-adapter axios
```

### 配置

`config/index.js` :

```ts
const config = {
  // 使用插件
  plugins: ["@taro-platform/axios-taro-adapter/taro-plugin"],
  ...其他配置
};
module.exports = function (merge) {
  if (process.env.NODE_ENV === "development") {
    return merge({}, config, require("./dev"));
  }
  return merge({}, config, require("./prod"));
};
```

### 代码中使用

`request.ts`:

```ts
import axios from "axios";
import MpAdapter, { defaultTransformRequest } from "@taro-platform/axios-taro-adapter";

if (process.env.TARO_ENV !== "h5") {
  // 让小程序适配器发挥作用
  axios.defaults.adapter = MpAdapter;
  // 设置默认请求转换器
  axios.defaults.transformRequest = defaultTransformRequest;
  // 如果您有自定义的请求转换器，可以这样写：
  /*
  axios.defaults.transformRequest = [defaultTransformRequest, 您的自定义请求转换器];
  */
}

// ... 其他代码

exports default axios;
```

### 依赖版本要求

- `Taro` 版本号 ` >= 3.6.0`
- `axios` 版本号 `>= 1.2.0`

### 不支持的请求配置

下列 `axios` 请求项适配器不支持，传了会默认忽略; 不在下面列表中的选项和功能均支持。

完整请求项可查看文档： https://axios-http.com/zh/docs/req_config

```ts
{
  // `withCredentials` 表示跨域请求时是否需要使用凭证
  withCredentials: false;

  // `xsrfCookieName` 是 xsrf token 的值，被用作 cookie 的名称
  xsrfCookieName: 'XSRF-TOKEN', // 默认值

  // `xsrfHeaderName` 是带有 xsrf token 值的http 请求头名称
  xsrfHeaderName: 'X-XSRF-TOKEN', // 默认值

  // 浏览器专属
  onUploadProgress: function (progressEvent) {
    // 处理原生进度事件
  },

  // `onDownloadProgress` 允许为下载处理进度事件
  // 浏览器专属
  onDownloadProgress: function (progressEvent) {
    // 处理原生进度事件
  },

  // `maxContentLength` 定义了node.js中允许的HTTP响应内容的最大字节数
  maxContentLength: 2000,

  // `maxBodyLength`（仅Node）定义允许的http请求内容的最大字节数
  maxBodyLength: 2000,

  // `maxRedirects` 定义了在node.js中要遵循的最大重定向数。
  // 如果设置为0，则不会进行重定向
  maxRedirects: 5, // 默认值

  // `socketPath` 定义了在node.js中使用的UNIX套接字。
  // e.g. '/var/run/docker.sock' 发送请求到 docker 守护进程。
  // 只能指定 `socketPath` 或 `proxy` 。
  // 若都指定，这使用 `socketPath` 。
  socketPath: null, // default

  // `httpAgent` and `httpsAgent` define a custom agent to be used when performing http
  // and https requests, respectively, in node.js. This allows options to be added like
  // `keepAlive` that are not enabled by default.
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),

  // `proxy` 定义了代理服务器的主机名，端口和协议。
  // 您可以使用常规的`http_proxy` 和 `https_proxy` 环境变量。
  // 使用 `false` 可以禁用代理功能，同时环境变量也会被忽略。
  // `auth`表示应使用HTTP Basic auth连接到代理，并且提供凭据。
  // 这将设置一个 `Proxy-Authorization` 请求头，它会覆盖 `headers` 中已存在的自定义 `Proxy-Authorization` 请求头。
  // 如果代理服务器使用 HTTPS，则必须设置 protocol 为`https`
  proxy: {
    protocol: 'https',
    host: '127.0.0.1',
    port: 9000,
    auth: {
      username: 'mikeymike',
      password: 'rapunz3l'
    }
  },

  // `decompress` indicates whether or not the response body should be decompressed
  // automatically. If set to `true` will also remove the 'content-encoding' header
  // from the responses objects of all decompressed responses
  // - Node only (XHR cannot turn off decompression)
  decompress: true // 默认值
}
```
