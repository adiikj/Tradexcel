import Home from "@/components/landingPage/Home";
import MainLayout from "@/components/layout/HeaderFooterLayout";

// Logged-in visitors are redirected to /dashboard by src/proxy.ts.
export default function Page() {
  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
}
