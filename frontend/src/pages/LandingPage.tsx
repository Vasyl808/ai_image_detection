/**
 * Landing Page
 * 
 * Home page with hero section and features
 */

import { FC } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Eye,
  Zap,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import styles from "./LandingPage.module.css";

/**
 * Landing page component
 */
export const LandingPage: FC = () => {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        {/* Background Effects */}
        <div className={styles.backgroundGradient} />
        <div className={`${styles.blob} ${styles.blobPrimary}`} />
        <div className={`${styles.blob} ${styles.blobPurple}`} />
        <div className={`${styles.blob} ${styles.blobPink}`} />

        <div className={styles.heroContent}>
          <div className={styles.heroInner}>
            {/* Badge */}
            <div className={styles.badge}>
              <Sparkles className={styles.badgeIcon} />
              AI-Powered Detection Technology
            </div>

            {/* Heading */}
            <h1 className={styles.heroTitle}>
              Detect Deepfakes
            </h1>

            {/* Description */}
            <p className={styles.heroDescription}>
              Advanced neural network technology that analyzes images to detect
              AI-generated or manipulated content. Get instant results with visual
              explanations powered by Grad-CAM.
            </p>

            {/* CTA Buttons */}
            <div className={styles.ctaButtons}>
              <Link
                to="/detect"
                className={styles.ctaPrimary}
              >
                <Shield className={styles.ctaIcon} />
                Start Detection
                <ArrowRight className={styles.ctaIconAnimate} />
              </Link>

              <a
                href="#features"
                className={styles.ctaSecondary}
              >
                Learn More
                <Eye className={styles.ctaIcon} />
              </a>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  95%+
                </div>
                <div className={styles.statLabel}>
                  Detection Accuracy
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  &lt;2s
                </div>
                <div className={styles.statLabel}>
                  Analysis Time
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  100%
                </div>
                <div className={styles.statLabel}>Free to Use</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Powerful Features
            </h2>
            <p className={styles.sectionDescription}>
              Built with cutting-edge technology to provide the most accurate deepfake
              detection
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {/* Feature 1 */}
            <div className={`${styles.featureCard} ${styles.featureCardPrimary}`}>
              <div className={`${styles.featureIcon} ${styles.featureIconPrimary}`}>
                <Shield className={styles.featureIconImage} />
              </div>
              <h3 className={styles.featureTitle}>
                AI Detection
              </h3>
              <p className={styles.featureDescription}>
                EfficientNet-B0 neural network trained on thousands of images for accurate
                detection
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`${styles.featureCard} ${styles.featureCardPurple}`}>
              <div className={`${styles.featureIcon} ${styles.featureIconPurple}`}>
                <Eye className={styles.featureIconImage} />
              </div>
              <h3 className={styles.featureTitle}>
                Visual Explanations
              </h3>
              <p className={styles.featureDescription}>
                Grad-CAM heatmaps show exactly which regions influenced the detection
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`${styles.featureCard} ${styles.featureCardPink}`}>
              <div className={`${styles.featureIcon} ${styles.featureIconPink}`}>
                <Zap className={styles.featureIconImage} />
              </div>
              <h3 className={styles.featureTitle}>
                Lightning Fast
              </h3>
              <p className={styles.featureDescription}>
                Get results in seconds with optimized inference and efficient processing
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`${styles.featureCard} ${styles.featureCardBlue}`}>
              <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>
                <Lock className={styles.featureIconImage} />
              </div>
              <h3 className={styles.featureTitle}>
                Privacy First
              </h3>
              <p className={styles.featureDescription}>
                Images are processed securely and never stored permanently on our servers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorksSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              How It Works
            </h2>
            <p className={styles.sectionDescription}>
              Three simple steps to detect deepfakes in your images
            </p>
          </div>

          <div className={styles.stepsGrid}>
            {/* Step 1 */}
            <div className={styles.stepContainer}>
              <div className={`${styles.stepNumber} ${styles.stepNumberPrimary}`}>
                <span className={styles.stepNumberText}>1</span>
              </div>
              <h3 className={styles.stepTitle}>
                Upload Image
              </h3>
              <p className={styles.stepDescription}>
                Drag and drop or click to upload any image you want to analyze
              </p>
            </div>

            {/* Step 2 */}
            <div className={styles.stepContainer}>
              <div className={`${styles.stepNumber} ${styles.stepNumberPurple}`}>
                <span className={styles.stepNumberText}>2</span>
              </div>
              <h3 className={styles.stepTitle}>
                AI Analysis
              </h3>
              <p className={styles.stepDescription}>
                Our neural network analyzes the image for signs of manipulation
              </p>
            </div>

            {/* Step 3 */}
            <div className={styles.stepContainer}>
              <div className={`${styles.stepNumber} ${styles.stepNumberPink}`}>
                <span className={styles.stepNumberText}>3</span>
              </div>
              <h3 className={styles.stepTitle}>
                Get Results
              </h3>
              <p className={styles.stepDescription}>
                View results and visual explanations of the detection
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>
            Ready to Detect Deepfakes?
          </h2>
          <p className={styles.ctaDescription}>
            Start analyzing images now with our advanced AI detection system
          </p>
          <Link
            to="/detect"
            className={styles.ctaButton}
          >
            <Shield className={styles.ctaIcon} />
            Start Detection Now
            <ArrowRight className={styles.ctaIcon} />
          </Link>
        </div>
      </section>
    </div>
  );
};
