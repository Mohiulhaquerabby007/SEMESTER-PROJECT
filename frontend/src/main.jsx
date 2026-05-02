import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(255,255,255,0.92)",
                color: "#181c1e",
                border: "1px solid rgba(107,70,193,0.15)",
                borderRadius: "12px",
                fontSize: "0.88rem",
                fontWeight: 500,
                boxShadow: "0 8px 24px rgba(83,42,168,0.12)",
                backdropFilter: "blur(16px)",
              },
              success: { iconTheme: { primary: "#15803D", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#ba1a1a", secondary: "#fff" } },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
