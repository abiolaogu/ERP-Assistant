import { useState, useEffect } from "react";
import type { AuthUser, AuthState } from "@/types/auth.types";

const AUTH_TOKEN_KEY = "erp_assistant_token";
const AUTH_USER_KEY = "erp_assistant_user";

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userStr = localStorage.getItem(AUTH_USER_KEY);

    if (token && userStr) {
      try {
        const user: AuthUser = JSON.parse(userStr);
        setState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
        });
      } catch {
        setState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
      }
    } else {
      setState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
    }
  }, []);

  return state;
}
