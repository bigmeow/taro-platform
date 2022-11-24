import utils from "axios/lib/utils";
import formDataToJSON from "axios/lib/helpers/formDataToJSON";
import toURLEncodedForm from "axios/lib/helpers/toURLEncodedForm";

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
function stringifySafely(rawValue, parser?: (s: string) => string, encoder?: (s: string) => string) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      // @ts-ignore
      if (e.name !== "SyntaxError") {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

export function defaultTransformRequest(data, headers) {
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
    // TODO 处理文件上传
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
