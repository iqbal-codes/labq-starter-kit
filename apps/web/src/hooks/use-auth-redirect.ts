import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../providers/auth-provider";

export function useAuthRedirect() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return { isAuthenticated };
}
