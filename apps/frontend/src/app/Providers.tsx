"use client";
import React from 'react';
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import store from "../redux/store";
import { ThemeProvider } from "../context/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          {children}
        </GoogleOAuthProvider>
      </Provider>
    </ThemeProvider>
  );
}
