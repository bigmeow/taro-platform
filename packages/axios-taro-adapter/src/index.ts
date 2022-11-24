import { request } from "@tarojs/taro";
import { generateMpAdapter } from "./core/adapter";
export { defaultTransformRequest } from "./core/defaultTransformRequest";

export default generateMpAdapter(request);
