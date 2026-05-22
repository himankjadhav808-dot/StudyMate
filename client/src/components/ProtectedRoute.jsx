/* eslint-disable react/prop-types */
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AppContext from "../contexts/AppContext";

/**
 * ProtectedRoute – wraps a page element with auth + role checks.
 *
 * Props:
 *   element   – the JSX element to render when allowed
 *   roles     – optional array of allowed roles e.g. ['user'] or ['admin']
 *               if omitted, any authenticated user is allowed
 */
function ProtectedRoute({ element, roles }) {
  const { email, role } = useContext(AppContext);

  // Not logged in → send to login
  if (!email) return <Navigate to="/login" replace />;

  // Role check (if roles array provided)
  if (roles && !roles.includes(role)) {
    // Redirect to their correct dashboard instead of 404
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}

export default ProtectedRoute;
