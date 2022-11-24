import { type AxiosAdapter } from "axios";
export declare function generateMpAdapter<R extends Function>(request: R): AxiosAdapter;
