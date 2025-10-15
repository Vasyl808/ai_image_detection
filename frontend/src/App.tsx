/**
 * Main Application Component
 * 
 * Root component with routing for the Deepfake Detector application
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components";
import { LandingPage, DetectionPage } from "./pages";

/**
 * Main application component with routing
 */
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/detect" element={<DetectionPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
