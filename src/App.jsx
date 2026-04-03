import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Global Styles
import './App.css';
import './index.css';

// Pages
import Home from './pages/Home';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TerminalAuth from './pages/TerminalAuth';
import ProtectedRoute from './components/ProtectedRoute';

// Centers
import PolicySummary from './components/centers/PolicySummary';
import BillingLedger from './components/centers/BillingLedger';
import ClaimTriggerLog from './components/centers/ClaimTriggerLog';
import AnalyticsHub from './components/centers/AnalyticsHub';

function App() {
  return (
    <Router>
      <AuthProvider>
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
              element={
                <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-['Inter',sans-serif]"><h1 className="text-2xl font-bold text-[#0F172A]/40 tracking-widest uppercase">How It Works <span className="text-[#FF6B00]">Coming Soon</span></h1></div>
              } 
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
                <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-['Inter',sans-serif]"><h1 className="text-2xl font-bold text-[#0F172A]/40 tracking-widest uppercase">Brand Profile <span className="text-[#FF6B00]">Under Construction</span></h1></div>
              } 
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
