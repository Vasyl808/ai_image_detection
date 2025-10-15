/**
 * Footer Component
 * 
 * Application footer with links and information
 */

import { FC } from "react";
import { Heart, Shield } from "lucide-react";
import { APP_METADATA } from "../../constants";

/**
 * Application footer
 */
export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                DeepfakeGuard
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Advanced AI-powered deepfake detection with visual explanations using
              Grad-CAM technology.
            </p>
          </div>

          {/* Technology */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Technology
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• EfficientNet-B0 Architecture</li>
              <li>• PyTorch Deep Learning</li>
              <li>• Grad-CAM Visualization</li>
              <li>• FastAPI Backend</li>
              <li>• React + TypeScript</li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              About
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Built with modern web technologies and best practices for production-ready
              deployment.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Version {APP_METADATA.version}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} DeepfakeGuard. Built for detecting AI-manipulated content.
            </p>
            <p className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for a safer
              digital world
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
