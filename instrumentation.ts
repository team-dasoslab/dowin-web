import { serverRuntimeConfig } from "./src/config/server-runtime-config";

let didPrintSwaggerUrls = false;

export async function register() {
  if (!serverRuntimeConfig.isDevelopment || didPrintSwaggerUrls) {
    return;
  }

  console.log(`API Docs: http://localhost:${serverRuntimeConfig.port}/api-docs`);

  didPrintSwaggerUrls = true;
}
