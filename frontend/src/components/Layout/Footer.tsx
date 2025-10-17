/**
 * Footer Component
 * 
 * Application footer with links and information
 */

import { FC } from "react";
import { Heart, Shield } from "lucide-react";
import { APP_METADATA } from "../../constants";
import styles from "./Footer.module.css";

/**
 * Application footer
 */
export const Footer: FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          {/* Brand */}
          <div className={styles.brandSection}>
            <div className={styles.brandHeader}>
              <div className={styles.brandIcon}>
                <Shield className={styles.brandIconImage} />
              </div>
              <span className={styles.brandName}>
                DeepfakeGuard
              </span>
            </div>
            <p className={styles.brandDescription}>
              Advanced AI-powered deepfake detection with visual explanations using
              Grad-CAM technology.
            </p>
          </div>

          {/* Technology */}
          <div className={styles.techSection}>
            <h3 className={styles.sectionTitle}>
              Technology
            </h3>
            <ul className={styles.techList}>
              <li>• EfficientNet-B0 Architecture</li>
              <li>• PyTorch Deep Learning</li>
              <li>• Grad-CAM Visualization</li>
              <li>• FastAPI Backend</li>
              <li>• React + TypeScript</li>
            </ul>
          </div>

          {/* About */}
          <div className={styles.aboutSection}>
            <h3 className={styles.sectionTitle}>
              About
            </h3>
            <p className={styles.aboutText}>
              Built with modern web technologies and best practices for production-ready
              deployment.
            </p>
            <p className={styles.version}>
              Version {APP_METADATA.version}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {currentYear} DeepfakeGuard. Built for detecting AI-manipulated content.
            </p>
            <p className={styles.madeWith}>
              Made with <Heart className={styles.heartIcon} /> for a safer
              digital world
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
