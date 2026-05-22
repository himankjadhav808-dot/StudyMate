import { Route, Routes } from "react-router-dom";
import React, { useEffect, Suspense, useContext } from "react";
import "./App.css";

import Welcome            from "./pages/Welcome";
import Login              from "./pages/Login";
import Signup             from "./pages/Signup";
import About              from "./pages/About";
import Layout             from "./pages/Layout";
import PageNotFound       from "./pages/PageNotFound";
import Verification       from "./pages/Verification";
import Dashboard          from "./pages/Dashboard";
import Progressboard      from "./pages/Progressboard";
import Practice           from "./pages/Pratice";
import TestUploadForm     from "./pages/TestUploadForm";
import ForgotPassword     from "./pages/ForgotPassword";
import Result             from "./pages/Result";
import Admin              from "./pages/Admin";
import Profile            from "./pages/Profile";
import ContactPage        from "./pages/ContactPage";
import AuthSelection      from "./pages/AuthSelection";
import AdminPending       from "./pages/AdminPending";
import AdminApprovalDashboard from "./pages/AdminApprovalDashboard";
import ExamContextProvider from "./contexts/ExamContextProvider";
import ProtectedRoute     from "./components/ProtectedRoute";
import AppContext          from "./contexts/AppContext";

const ExamLayout = React.lazy(() => import("./pages/ExamLayout"));

function App() {
  const {
    email,
    setEmail,
    setUser,
    setIsVerified,
    setIsAdmin,
    setRole,
    setToken,
  } = useContext(AppContext);

  const [sessionLoading, setSessionLoading] = React.useState(true);
  const BASE_URL = import.meta.env.VITE_API_URL;

  // ── Verify existing JWT cookie on first load ───────────────────────────────
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const { success, decoded } = await response.json();
        if (success && decoded) {
          setEmail(decoded.email);
          setUser(decoded.user);
          setIsVerified(true);
          setRole(decoded.role || "user");
          setIsAdmin(decoded.role === "admin");
          // token was already restored from localStorage in context
        } else {
          setIsVerified(false);
          setIsAdmin(false);
          setRole("user");
          setToken(''); // clear invalid token
        }
      } catch (err) {
        console.error("Session check failed:", err);
        setIsVerified(false);
      } finally {
        setSessionLoading(false);
      }
    };

    verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Show spinner until session is resolved ─────────────────────────────────
  if (sessionLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #0f766e",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#0f766e", fontWeight: 600 }}>Loading...</p>
      </div>
    );
  }


  return (
    <>
      <Routes>
        <Route path="/" element={<Layout email={email} />}>
          {/* ── Public routes ────────────────────────────────────────────── */}
          <Route index element={<Welcome />} />
          <Route path="about"          element={<About />} />
          <Route path="auth-select"    element={<AuthSelection />} />
          <Route path="login"          element={<Login />} />
          <Route path="signup"         element={<Signup />} />
          <Route path="verify"         element={<Verification />} />
          <Route path="forgot-password" element={<ForgotPassword />} />

          {/* ── dashboard – role-aware, always declared ───────────────────── */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute element={<RoleDashboard />} />
            }
          />

          {/* ── User-only routes ─────────────────────────────────────────── */}
          <Route
            path="practice"
            element={<ProtectedRoute roles={["user"]} element={<Practice />} />}
          />
          <Route
            path="upload"
            element={<ProtectedRoute roles={["user", "admin"]} element={<TestUploadForm />} />}
          />
          <Route
            path="result"
            element={<ProtectedRoute roles={["user"]} element={<Result />} />}
          />
          <Route
            path="result/progressboard"
            element={<ProtectedRoute roles={["user"]} element={<Progressboard />} />}
          />

          {/* ── Admin-only routes ─────────────────────────────────────────── */}
          <Route
            path="admin"
            element={<ProtectedRoute roles={["admin"]} element={<Admin />} />}
          />
          <Route
            path="profile"
            element={<ProtectedRoute roles={["user", "admin"]} element={<Profile />} />}
          />
          <Route
            path="contact"
            element={<ProtectedRoute roles={["user"]} element={<ContactPage />} />}
          />

          {/* ── Exam (any authenticated user) ─────────────────────────────── */}
          <Route
            path="exam"
            element={
              <ProtectedRoute
                element={
                  <ExamContextProvider>
                    <Suspense
                      fallback={
                        <h3 className="text-xl mt-72 w-full text-center">
                          Exam page is loading…
                        </h3>
                      }
                    >
                      <ExamLayout />
                    </Suspense>
                  </ExamContextProvider>
                }
              />
            }
          />

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </>
  );
}

// ── Role-based dashboard switcher ────────────────────────────────────────────
function RoleDashboard() {
  const { role } = useContext(AppContext);

  if (role === "admin")         return <AdminApprovalDashboard />;
  if (role === "admin_pending") return <AdminPending />;
  return <Dashboard />;           // default: 'user'
}

export default App;
