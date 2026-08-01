// src/main.jsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "16px",
          background: "#ffffff",
          color: "#24344D",
          boxShadow:
            "0 20px 40px rgba(15, 23, 42, 0.12)",
          padding: "16px 18px",
          fontSize: "14px",
          fontWeight: "500",
        },
        success: {
          iconTheme: {
            primary: "#10B981",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#ffffff",
          },
        },
      }}
    />
  </StrictMode>
);