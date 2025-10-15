/**
 * Layout Component
 * 
 * Main layout wrapper with header and footer
 */

import { FC, ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component that wraps all pages
 */
export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
