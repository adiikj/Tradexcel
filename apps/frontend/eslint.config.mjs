import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// `next lint` was removed in Next 16 - ESLint runs directly with Next's flat configs.
const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", ".next-*/**", "node_modules/**", "next-env.d.ts"] },
  {
    rules: {
      // Check deps of our effect wrapper like useEffect's.
      "react-hooks/exhaustive-deps": ["warn", { additionalHooks: "useAsyncEffect" }],
    },
  },
];

export default config;
