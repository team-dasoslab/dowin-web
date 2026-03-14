import { defineConfig } from "orval";

export default defineConfig({
  wig: {
    input: {
      target: "./src/api-spec/openapi.yaml",
    },
    output: {
      target: "./src/api/generated/wig.ts",
      mode: "tags-split",
      client: "react-query",
      baseUrl: "/api",
      override: {
        mutator: {
          path: "./src/api/mutator.ts",
          name: "customInstance",
        },
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          useInfiniteQueryParam: "cursor",
        },
      },
    },
  },
});
