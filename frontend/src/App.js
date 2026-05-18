import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VerifyPage from './pages/VerifyPage';
import ImagePage from './pages/ImagePage';
import VideoPage from './pages/VideoPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TrendingPage from './pages/TrendingPage';
import DashboardPage from './pages/DashboardPage';
import ExtensionPage from './pages/ExtensionPage';
import AccountPage from './pages/AccountPage';
import ResearchWorkspace from './pages/ResearchWorkspace';
import IntelligenceLab from './pages/IntelligenceLab';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import DragDropOverlay from './components/DragDropOverlay';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LangProvider>
          <Router>
            <DragDropOverlay>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/image" element={<ImagePage />} />
                <Route path="/pdf" element={<VerifyPage />} />
                <Route path="/video" element={<VideoPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/intelligence" element={<IntelligenceLab />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/extension" element={<ExtensionPage />} />
                <Route path="/research" element={<ResearchWorkspace />} />
                <Route path="/account" element={<AccountPage />} />
              </Routes>
            </DragDropOverlay>
          </Router>
        </LangProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}