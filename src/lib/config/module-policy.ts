import { env, type AuthPolicy } from "@/lib/config/env";

export const modulePolicy = {
  name: "ERP-Assistant",
  slug: "assistant",
  authPolicy: env.authPolicy as AuthPolicy,
  notes: "",
  altUrls: "http://localhost:5173",
};
