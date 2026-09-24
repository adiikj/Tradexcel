"use client";
import React from 'react';
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import store from "../redux/store";
import { ThemeProvider } from "../context/ThemeContext";
import ChatWidget from "../components/chat/ChatWidget";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <Toaster position="top-center" />
          {children}
          <ChatWidget />
        </GoogleOAuthProvider>
      </Provider>
    </ThemeProvider>
  );
}
