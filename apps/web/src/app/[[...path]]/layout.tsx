import type { ReactNode } from "react";
import { SiteLayout } from "@/components/site-layout.tsx";

const Layout = ({ children }: { readonly children: ReactNode }) => (
  <SiteLayout>{children}</SiteLayout>
);

export default Layout;
