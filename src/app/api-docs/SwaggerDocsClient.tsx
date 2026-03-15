"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    SwaggerUIBundle?: (config: Record<string, unknown>) => unknown;
  }
}

function initializeSwaggerUi() {
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

export function SwaggerDocsClient() {
  useEffect(() => {
    const existingLink = document.querySelector<HTMLLinkElement>(
      'link[data-swagger-ui="true"]',
    );

    if (existingLink) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    link.dataset.swaggerUi = "true";
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, []);

  return (
    <>
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onReady={initializeSwaggerUi}
      />
      <div id="swagger-ui" className="min-h-[calc(100vh-140px)]" />
    </>
  );
}
