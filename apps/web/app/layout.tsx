import type { ReactNode } from "react";
import "./styles.css";

interface RootLayoutProps {
  readonly children: ReactNode;
}

const RootLayout = async ({ children }: RootLayoutProps) => (
  <html lang="en">
    <body className="size-full grid grid-cols-12">
      <nav className="col-span-2">
        <a href="/">nav link</a>
      </nav>
      <main className="col-span-8">{children}</main>
    </body>
  </html>
);

export default RootLayout;
