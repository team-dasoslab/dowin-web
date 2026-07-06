export function initializeSwaggerUi() {
  const root = document.getElementById("swagger-ui");

  if (!root || root.childElementCount > 0 || !window.SwaggerUIBundle) {
    return;
  }

  window.SwaggerUIBundle({
    url: "/api/openapi",
    dom_id: "#swagger-ui",
    deepLinking: true,
    docExpansion: "list",
    displayRequestDuration: true,
    persistAuthorization: true,
  });
}
