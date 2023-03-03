import { type AxiosAdapter, AxiosError, type AxiosRequestConfig, CanceledError } from "axios";
import buildFullPath from "axios/lib/core/buildFullPath";
import settle from "axios/lib/core/settle";
import buildURL from "axios/lib/helpers/buildURL";
import utils from "axios/lib/utils";
import AxiosHeaders from "axios/lib/core/AxiosHeaders";
import encode from "./encode";

// eslint-disable-next-line @typescript-eslint/ban-types
export function generateMpAdapter<R extends Function>(request: R): AxiosAdapter {
  return async function mpAdapter(config: AxiosRequestConfig) {
    return new Promise((resolve, reject) => {
      let requestTask;
      const fullPath = buildFullPath(config.baseURL, config.url);

      const url = buildURL(fullPath, config.params, config.paramsSerializer);
      const method = (config.method && config.method.toUpperCase()) || "GET";
      // @ts-ignore
      const requestHeaders = AxiosHeaders.from({ ...config.headers }).normalize();
      const requestData = config.data;
      const { responseType } = config;
      // console.log("序列化后的请求头:", requestHeaders);

      let onCanceled;
      function done() {
        if (config.cancelToken) {
          // @ts-ignore
          config.cancelToken.unsubscribe(onCanceled);
        }

        if (config.signal) {
          // @ts-ignore
          config.signal.removeEventListener("abort", onCanceled);
        }
      }

      if (config.cancelToken || config.signal) {
        // Handle cancellation
        onCanceled = (cancel) => {
          if (!requestTask) {
            return;
          }
          // @ts-ignore
          reject(!cancel || cancel.type ? new CanceledError(undefined, config, requestTask) : cancel);
          requestTask.abort();
          requestTask = undefined;
        };
        // @ts-ignore
        config.cancelToken && config.cancelToken.subscribe(onCanceled);
        if (config.signal) {
          // @ts-ignore
          // 小程序下想使用 signal, 需要安装 https://github.com/mo/abortcontroller-polyfill
          config.signal.aborted ? onCanceled() : config.signal.addEventListener("abort", onCanceled);
        }
      }

      if (config.auth) {
        const username = config.auth.username || "";
        const password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : "";
        requestHeaders.set("Authorization", "Basic " + encode(username + ":" + password));
      }

      if (utils.isFormData(requestData)) {
        requestHeaders.setContentType(false); // Let the browser set it
      }

      // Remove Content-Type if data is undefined
      requestData === undefined && requestHeaders.setContentType(null);

      requestTask = request({
        method,
        url,
        header: requestHeaders.toJSON(),
        timeout: config.timeout,
        responseType: responseType && responseType !== "json" ? config.responseType : "text",
        data: requestData,
        success(res) {
          const response = {
            data: res.data,
            status: res.statusCode,
            statusText: res.errMsg,
            headers: res.header,
            config,
            request: requestTask
          };
          settle(
            function _resolve(value) {
              resolve(value);
              done();
            },
            function _reject(err) {
              reject(err);
              done();
            },
            response
          );
          requestTask = undefined;
        },
        fail(err) {
          // 微信 2.24.0 开始返回错误码 errno
          reject(new AxiosError(err.errMsg || "Request aborted", err.errno || AxiosError.ECONNABORTED, config, requestTask));
          requestTask = undefined;
        }
      });
    });
  };
}
