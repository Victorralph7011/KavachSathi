import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PolicyProvider } from './contexts/PolicyContext';

// Global Styles
import './App.css';
import './index.css';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TerminalAuth from './pages/TerminalAuth';
import HowItWorks from './pages/HowItWorks';
import ProtectedRoute from './components/ProtectedRoute';

// Centers
import PolicySummary from './components/centers/PolicySummary';
import BillingLedger from './components/centers/BillingLedger';
import ClaimTriggerLog from './components/centers/ClaimTriggerLog';
import AnalyticsHub from './components/centers/AnalyticsHub';
import AboutSection from './components/AboutSection';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PolicyProvider>
          <div className="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<TerminalAuth />} />
              <Route 
                path="/register" 
                element={
                  <ProtectedRoute>
                    <Register />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/policy" 
                element={
                  <ProtectedRoute>
                    <PolicySummary />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <ProtectedRoute>
                    <BillingLedger />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/claims" 
                element={
                  <ProtectedRoute>
                    <ClaimTriggerLog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/how-it-works" 
                element={<HowItWorks />} 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <AnalyticsHub />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/about" 
                element={
                  <ProtectedRoute>
                    <AboutSection />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </PolicyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
