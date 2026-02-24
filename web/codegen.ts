import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: [
    {
      [process.env.VITE_HASURA_URL ?? "http://localhost:19110/v1/graphql"]: {
        headers: {
          "X-Hasura-Admin-Secret":
            process.env.HASURA_ADMIN_SECRET ?? "hasura-admin-secret",
        },
      },
    },
  ],
  documents: ["src/**/*.{ts,tsx}"],
  generates: {
    "./src/types/generated.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
      ],
      config: {
        skipTypename: true,
        enumsAsTypes: true,
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
