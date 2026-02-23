import type { AuthBindings } from "@refinedev/core";

const AUTH_TOKEN_KEY = "erp_assistant_token";
const AUTH_USER_KEY = "erp_assistant_user";

export const authProvider: AuthBindings = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_IAM_URL || "http://localhost:8080"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: { name: "LoginError", message: "Invalid credentials" },
        };
      }

      const data = await response.json();
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      return { success: true, redirectTo: "/" };
    } catch {
      return {
        success: false,
        error: { name: "LoginError", message: "Network error occurred" },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      redirectTo: "/login",
      error: { name: "Unauthorized", message: "Please login" },
    };
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      };
    }
    return null;
  },

  getPermissions: async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};
