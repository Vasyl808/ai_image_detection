/**
 * Header Component
 * 
 * Main navigation header with logo and navigation links
 */

import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Github, Home, ScanEye } from "lucide-react";
import clsx from "clsx";
import styles from "./Header.module.css";

/**
 * Application header with navigation
 */
export const Header: FC = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          {/* Logo */}
          <Link
            to="/"
            className={styles.logo}
          >
            <div className={styles.logoIcon}>
              <Shield className={styles.logoIconImage} />
            </div>
            <span className={styles.logoText}>
              DeepfakeGuard
            </span>
          </Link>

          {/* Navigation Links */}
          <div className={styles.navLinks}>
            <Link
              to="/"
              className={clsx(
                styles.navLink,
                {
                  [styles.navLinkActive]: isActive("/"),
                  [styles.navLinkInactive]: !isActive("/"),
                }
              )}
            >
              <Home className={styles.navLinkIcon} />
              <span className={styles.navLinkText}>Home</span>
            </Link>

            <Link
              to="/detect"
              className={clsx(
                styles.navLink,
                {
                  [styles.navLinkActive]: isActive("/detect"),
                  [styles.navLinkInactive]: !isActive("/detect"),
                }
              )}
            >
              <ScanEye className={styles.navLinkIcon} />
              <span className={styles.navLinkText}>Detect</span>
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              <Github className={styles.navLinkIcon} />
              <span className={styles.navLinkText}>GitHub</span>
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};
