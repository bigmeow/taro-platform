// Axios-miniprogram-adapter v1.0.0 Copyright (c) 2022 bigMeow(lizong9527@gmail.com) and contributors
import { request } from '@tarojs/taro';
import { AxiosError, CanceledError } from 'axios';
import buildFullPath from 'axios/lib/core/buildFullPath';
import settle from 'axios/lib/core/settle';
import buildURL from 'axios/lib/helpers/buildURL';
import utils from 'axios/lib/utils';
import AxiosHeaders from 'axios/lib/core/AxiosHeaders';
import formDataToJSON from 'axios/lib/helpers/formDataToJSON';
import toURLEncodedForm from 'axios/lib/helpers/toURLEncodedForm';

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
// encoder
function encoder(input) {
    const str = String(input);
    // initialize result and counter
    let block;
    let charCode;
    let idx = 0;
    let map = chars;
    let output = "";
    for (; 
    // if the next str index does not exist:
    //   change the mapping table to "="
    //   check if d has no fractional digits
    str.charAt(idx | 0) || ((map = "="), idx % 1); 
    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
    output += map.charAt(63 & (block >> (8 - (idx % 1) * 8)))) {
        charCode = str.charCodeAt((idx += 3 / 4));
        if (charCode > 0xff) {
            throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
        }
        block = (block << 8) | charCode;
    }
    return output;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function generateMpAdapter(request) {
    return async function mpAdapter(config) {
        return new Promise((resolve, reject) => {
            let requestTask;
            const fullPath = buildFullPath(config.baseURL, config.url);
            const url = buildURL(fullPath, config.params, config.paramsSerializer);
            const method = (config.method && config.method.toUpperCase()) || "GET";
            // @ts-ignore
            const requestHeaders = AxiosHeaders.from(config.headers).normalize();
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
                requestHeaders.set("Authorization", "Basic " + encoder(username + ":" + password));
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
                    settle(function _resolve(value) {
                        resolve(value);
                        done();
                    }, function _reject(err) {
                        reject(err);
                        done();
                    }, response);
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

/**
 * It takes a string, tries to parse it, and if it fails, it returns the stringified version
 * of the input
 *
 * @param {any} rawValue - The value to be stringified.
 * @param {Function} parser - A function that parses a string into a JavaScript object.
 * @param {Function} encoder - A function that takes a value and returns a string.
 *
 * @returns {string} A stringified version of the rawValue.
 */
function stringifySafely(rawValue, parser, encoder) {
    if (utils.isString(rawValue)) {
        try {
            (parser || JSON.parse)(rawValue);
            return utils.trim(rawValue);
        }
        catch (e) {
            // @ts-ignore
            if (e.name !== "SyntaxError") {
                throw e;
            }
        }
    }
    return (encoder || JSON.stringify)(rawValue);
}
function defaultTransformRequest(data, headers) {
    const contentType = headers.getContentType() || "";
    const hasJSONContentType = contentType.indexOf("application/json") > -1;
    const isObjectPayload = utils.isObject(data);
    // if (isObjectPayload && utils.isHTMLForm(data)) {
    //   data = new FormData(data);
    // }
    const isFormData = utils.isFormData(data);
    if (isFormData) {
        if (!hasJSONContentType) {
            return data;
        }
        return hasJSONContentType ? JSON.stringify(formDataToJSON(data)) : data;
    }
    if (utils.isArrayBuffer(data) || utils.isBuffer(data) || utils.isStream(data) || utils.isFile(data) || utils.isBlob(data)) {
        return data;
    }
    if (utils.isArrayBufferView(data)) {
        return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
        headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
        return data.toString();
    }
    // let isFileList;
    if (isObjectPayload) {
        if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
            // @ts-ignore
            return toURLEncodedForm(data, this.formSerializer).toString();
        }
        // 处理文件上传
        // if ((isFileList = utils.isFileList(data)) || contentType.indexOf('multipart/form-data') > -1) {
        //   const _FormData = this.env && this.env.FormData;
        //   return toFormData(
        //     isFileList ? {'files[]': data} : data,
        //     _FormData && new _FormData(),
        //     this.formSerializer
        //   );
        // }
    }
    if (isObjectPayload || hasJSONContentType) {
        headers.setContentType("application/json", false);
        return stringifySafely(data);
    }
    return data;
}

var index = generateMpAdapter(request);

export { index as default, defaultTransformRequest };
//# sourceMappingURL=index.js.map
