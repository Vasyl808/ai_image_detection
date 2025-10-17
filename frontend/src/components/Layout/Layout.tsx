/**
 * Layout Component
 * 
 * Main layout wrapper with header and footer
 */

import { FC, ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import styles from "./Layout.module.css";

export interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component that wraps all pages
 */
export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
};
