"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "16px",
          background: "#2B2D42",
          color: "#FFFFFF",
          fontSize: "13px",
          fontWeight: 600,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        },
        success: {
          iconTheme: {
            primary: "#FB6F92",
            secondary: "#FFFFFF",
          },
        },
        error: {
          iconTheme: {
            primary: "#EF4444",
            secondary: "#FFFFFF",
          },
        },
      }}
    />
  );
}
