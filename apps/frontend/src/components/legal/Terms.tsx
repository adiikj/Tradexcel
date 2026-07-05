"use client";
import React from "react";
import LegalPage, { LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  {
    heading: "About Tradexcel",
    body: [
      "Tradexcel is a gamified stock-trading simulator built for learning and entertainment. All trading on the platform uses virtual money. No real funds are ever deposited, traded, or withdrawn, and nothing on Tradexcel constitutes financial, investment, or trading advice.",
    ],
  },
  {
    heading: "Eligibility & accounts",
    body: [
      "You must provide accurate information when creating an account and are responsible for keeping your login credentials secure. You are responsible for all activity that happens under your account.",
      "We may suspend or terminate accounts that abuse the platform, attempt to manipulate leaderboards, or violate these terms.",
    ],
  },
  {
    heading: "Virtual money & no real value",
    body: [
      "Your virtual balance, holdings, and returns exist only inside Tradexcel. They have no monetary value, cannot be redeemed, transferred, or exchanged for real money or goods, and may be reset or adjusted as the product evolves.",
    ],
  },
  {
    heading: "Market data",
    body: [
      "Stock prices and market information are provided for simulation purposes and may be delayed, incomplete, or inaccurate. Tradexcel is not responsible for any decisions made based on data shown on the platform.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "You agree not to disrupt the service, reverse engineer it, scrape it at scale, or use it for any unlawful purpose. Automated trading bots or exploits intended to game contests and leaderboards are not permitted.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "We may update these terms from time to time. Continued use of Tradexcel after changes are posted means you accept the updated terms.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions about these terms? Reach us at contact@tradexcel.app.",
    ],
  },
];

function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="June 27, 2026"
      intro="These terms govern your use of Tradexcel. Tradexcel is a portfolio project and a virtual trading simulator, please read these terms before using the platform."
      sections={sections}
    />
  );
}

export default Terms;
