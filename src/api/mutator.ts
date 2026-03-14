import axios, { type AxiosRequestConfig } from "axios";

const AXIOS_INSTANCE = axios.create();

type CancelablePromise<T> = Promise<T> & {
  cancel: () => void;
};

const normalizeHeaders = (
  headers?: HeadersInit,
): AxiosRequestConfig["headers"] => {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
};

const normalizeBody = (body?: BodyInit | null) => {
  if (typeof body !== "string") {
    return body;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

export const customInstance = <T>(
  url: string,
  config: RequestInit = {},
): CancelablePromise<T> => {
  const source = axios.CancelToken.source();
  const { body, headers, signal, ...restConfig } = config;

  const axiosConfig: AxiosRequestConfig = {
    url,
    method: config.method,
    headers: normalizeHeaders(headers),
    data: normalizeBody(body),
    cancelToken: source.token,
    ...(signal ? { signal } : {}),
    withCredentials: true,
    ...restConfig,
  };

  const promise: CancelablePromise<T> = AXIOS_INSTANCE(axiosConfig).then(
    (response) => ({
      data: response.data,
      status: response.status,
      headers: response.headers,
    }),
  ) as CancelablePromise<T>;

  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export default customInstance;
