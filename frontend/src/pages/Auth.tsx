import { motion } from "motion/react";
import { LoginForm } from "../features/auth/components/LoginForm";
import BoxmoxLogo from "../assets/boxmox.svg";

export const AuthPage = () => {
  // Login handler — uses username and password
  const handleLogin = (username: string, password: string) => {
    console.log("Login attempt:", { username, password });
    // TODO: Implement actual authentication logic
    alert(`Login attempt with username: ${username}`);
  };

  // Forgot password handler removed; this flow is not in the UI

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

        {/* Login form component */}
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
};
