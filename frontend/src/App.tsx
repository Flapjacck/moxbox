import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/Auth";
import { FileDashboard } from "./pages/FileDashboard";
import { Trash } from "./pages/Trash";
import { ProtectedRoute } from "./components/ProtectedRoute";

/**
 * App Component
 * ==============
 * Main application router with protected routes.
 * Routes:
 *   /login    - Authentication page
 *   /files    - File dashboard (protected)
 *   /trash    - Trash bin for deleted files (protected)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected routes */}
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <FileDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trash"
          element={
            <ProtectedRoute>
              <Trash />
            </ProtectedRoute>
          }
        />

        {/* Redirects */}
        <Route path="/dashboard" element={<Navigate to="/files" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;