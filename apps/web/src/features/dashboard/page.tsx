import { Navigate } from "react-router-dom";

export function ShellHomePage() {
  return <Navigate to="/overview" replace />;
}
