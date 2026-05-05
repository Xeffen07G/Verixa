import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VerifyPage from './pages/VerifyPage';
import ImagePage from './pages/ImagePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TrendingPage from './pages/TrendingPage';
import DashboardPage from './pages/DashboardPage';
import ExtensionPage from './pages/ExtensionPage';
import AccountPage from './pages/AccountPage';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import DragDropOverlay from './components/DragDropOverlay';


export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <Router>

        <DragDropOverlay>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="/image" element={<ImagePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/extension" element={<ExtensionPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </DragDropOverlay>
      </Router>
      </LangProvider>
    </AuthProvider>
  );
}