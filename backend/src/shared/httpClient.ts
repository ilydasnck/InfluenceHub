import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import { Result } from "./result";
import { logger } from "./logger";

export interface HttpError {
  readonly status: number;
  readonly message: string;
  readonly data?: unknown;
}

const toHttpError = (error: unknown): HttpError => {
  if (error instanceof AxiosError) {
    return {
      status: error.response?.status ?? 0,
      message: error.message,
      data: error.response?.data,
    };
  }
  return { status: 0, message: String(error) };
};

export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<Result<T, HttpError>>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<Result<T, HttpError>>;
}

export const createHttpClient = (baseURL: string, timeout = 15_000): HttpClient => {
  const instance: AxiosInstance = axios.create({ baseURL, timeout });

  instance.interceptors.request.use((config) => {
    logger.info(`${config.method?.toUpperCase()} ${config.url}`, "HttpClient");
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      logger.error(
        `Request failed: ${error.message}`,
        "HttpClient",
        { status: error.response?.status, url: error.config?.url },
      );
      return Promise.reject(error);
    },
  );

  return {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<Result<T, HttpError>> {
      try {
        const response = await instance.get<T>(url, config);
        return Result.ok(response.data);
      } catch (error) {
        return Result.fail(toHttpError(error));
      }
    },

    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<Result<T, HttpError>> {
      try {
        const response = await instance.post<T>(url, data, config);
        return Result.ok(response.data);
      } catch (error) {
        return Result.fail(toHttpError(error));
      }
    },
  };
};
