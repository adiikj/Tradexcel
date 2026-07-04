"use client";
import React from "react";
import LegalPage, { LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  {
    heading: "Information we collect",
    body: [
      "When you create an account we collect basic details such as your name, email address, and phone number. We also store your in-app activity, virtual portfolio, trades, and preferences so the simulator works for you.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "We use your information to operate your account, run the trading simulation, power leaderboards and contests, secure the platform, and communicate important updates. We do not sell your personal data.",
    ],
  },
  {
    heading: "Authentication & OTP",
    body: [
      "We use one-time passcodes sent over SMS or email to verify your identity. Phone numbers and email addresses are used for verification, account recovery, and essential notifications.",
    ],
  },
  {
    heading: "Cookies & sessions",
    body: [
      "We use cookies and similar technologies to keep you signed in and to remember your preferences. You can clear these through your browser, though some features may stop working if you do.",
    ],
  },
  {
    heading: "Data security",
    body: [
      "Passwords are hashed and access tokens are signed. We take reasonable measures to protect your data, but no system is perfectly secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can update your profile details at any time, and you may request deletion of your account by contacting us. Because Mocket uses only virtual money, deleting your account removes your simulated portfolio with no financial impact.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "For privacy questions or data requests, email contact@mocket.app.",
    ],
  },
];

function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="June 27, 2026"
      intro="Your privacy matters. This policy explains what information Mocket collects, how we use it, and the choices you have. Mocket is a virtual trading simulator and never handles real money."
      sections={sections}
    />
  );
}

export default Privacy;
