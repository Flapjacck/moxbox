import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/Auth";
import { FileDashboard } from "./pages/FileDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <FileDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;