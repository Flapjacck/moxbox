import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { LoginForm } from "../features/auth/components/LoginForm";
import { login } from "../features/auth/services/authService";
import BoxmoxLogo from "../assets/boxmox.svg";

export const AuthPage = () => {
  const navigate = useNavigate();

  // Loading state while login request is in progress
  const [isLoading, setIsLoading] = useState(false);

  // Error message to display on login failure
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles login form submission.
   * Calls the auth service and navigates to /files on success.
   */
  const handleLogin = async (username: string, password: string) => {
    // Clear any previous errors
    setError(null);
    setIsLoading(true);

    try {
      // Attempt login - token is stored automatically by authService
      await login(username, password);

      // Navigate to files dashboard on success
      navigate("/files");
    } catch (err) {
      // Display error message to user
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle gradient orb - top right */}
        <motion.div
          className="absolute -top-24 -right-24 w-96 h-96 bg-[#3D7BF0] rounded-full opacity-5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Subtle gradient orb - bottom left */}
        <motion.div
          className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#6BCB77] rounded-full opacity-5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Display the Boxmox SVG logo from assets */}
          <img
            src={BoxmoxLogo}
            alt="Boxmox logo"
            className="mx-auto mb-4 w-20 h-20"
          />

          <h1 className="text-4xl font-bold text-[#C9D1D9] mb-2">
            Mox<span className="text-[#3D7BF0]">Box</span>
          </h1>
        </motion.div>

        {/* Error message display */}
        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Login form component */}
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
      </div>
    </div>
  );
};
