/**
 * Header Component
 * 
 * Main navigation header with logo and navigation links
 */

import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, Github, Home, ScanEye } from "lucide-react";
import clsx from "clsx";

/**
 * Application header with navigation
 */
export const Header: FC = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              DeepfakeGuard
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                {
                  "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300":
                    isActive("/"),
                  "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800":
                    !isActive("/"),
                }
              )}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              to="/detect"
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                {
                  "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300":
                    isActive("/detect"),
                  "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800":
                    !isActive("/detect"),
                }
              )}
            >
              <ScanEye className="w-4 h-4" />
              <span className="hidden sm:inline">Detect</span>
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};
