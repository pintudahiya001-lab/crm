import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const token = localStorage.getItem("token");

  // ===============================
  // CHECK AUTH TOKEN
  // ===============================

  if (!token || !token.trim()) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ===============================
  // AUTHENTICATED
  // ===============================

  return <Outlet />;
}

export default ProtectedRoute;