import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../backend/schema.graphql",
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
