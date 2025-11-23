import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "./pages/Auth";
import { FileDashboard } from "./pages/FileDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/files" element={<FileDashboard />} />
        <Route path="/" element={<Navigate to="/files" replace />} />
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;