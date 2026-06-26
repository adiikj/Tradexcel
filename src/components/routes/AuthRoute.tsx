"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

const AuthRoute = ({ children }) => {
  const navigate = useRouter();
  const [authChecked, setAuthChecked] = useState<any>(false);

  useEffect(() => {
    const token = Cookies.get('accessToken'); // Check if accessToken exists in cookies
    if (!token) {
      navigate.push('/signin');  // Redirect to sign-in page if token is not found
    } else {
      setAuthChecked(true);  // Allow access to children (protected routes) if token exists
    }
  }, [navigate]);

  if (!authChecked) return null; // Or a loading spinner, if needed

  return children; // Render protected route if authenticated
};

export default AuthRoute;
