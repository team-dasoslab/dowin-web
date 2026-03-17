let didPrintSwaggerUrls = false;

export async function register() {
  if (process.env.NODE_ENV !== "development" || didPrintSwaggerUrls) {
    return;
  }

  const port = process.env.PORT ?? "3000";

  console.log(`API Docs: http://localhost:${port}/api-docs`);

  didPrintSwaggerUrls = true;
}
