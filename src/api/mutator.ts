import axios, { type AxiosRequestConfig, type AxiosHeaders } from "axios";

// API 서버의 기본 URL
const AXIOS_INSTANCE = axios.create({
  baseURL: "http://localhost:3000", // 백엔드 서버 주소
});

export const customInstance = <T>(
  url: string,
  config: any, // Use any to allow RequestInit from Orval
): Promise<T> => {
  const source = axios.CancelToken.source();
  
  // Convert RequestInit (fetch style) to AxiosRequestConfig
  const axiosConfig: AxiosRequestConfig = {
    url,
    method: config.method,
    headers: config.headers,
    data: config.body ? JSON.parse(config.body) : undefined,
    cancelToken: source.token,
    withCredentials: true,
    ...config, // Spread the rest
  };

  const promise = AXIOS_INSTANCE(axiosConfig).then((response) => ({
    data: response.data,
    status: response.status,
    headers: response.headers,
  }));

  // @ts-ignore
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise as any as Promise<T>;
};

export default customInstance;
