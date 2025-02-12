import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import Personnel from './pages/Personnel';
import MonthlyIncome from './pages/MonthlyIncome';
import Vault from './pages/Vault';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <CssBaseline />
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/personnel" element={<Personnel />} />
              <Route path="/monthly-income" element={<MonthlyIncome />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 