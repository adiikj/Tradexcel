import React from "react";

// App-shell pages render their own <main> (next to the sidebar), so this
// wrapper adds no landmark of its own - a nested <main> confuses screen readers.
const NoHeaderFooterLayout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default NoHeaderFooterLayout;
