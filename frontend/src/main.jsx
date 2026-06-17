import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemeProvider>
              <App />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: "var(--bg-glass-panel)",
                    color: "var(--color-on-surface)",
                    border: "1px solid var(--color-outline)",
                    borderRadius: "12px",
                    fontSize: "0.88rem",
                    fontWeight: 500,
                    boxShadow: "var(--shadow-premium)",
                    backdropFilter: "blur(16px)",
                  },
                  success: { iconTheme: { primary: "var(--color-success)", secondary: "#fff" } },
                  error:   { iconTheme: { primary: "#ba1a1a", secondary: "#fff" } },
                }}
              />
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
