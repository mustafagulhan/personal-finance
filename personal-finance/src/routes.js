import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

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
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import Debts from './pages/Debts';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        !isAuthenticated ? <Login /> : <Navigate to="/" />
      } />
      <Route path="/register" element={
        !isAuthenticated ? <Register /> : <Navigate to="/" />
      } />
      
      {/* Protected Routes */}
      {isAuthenticated ? (
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/personnel" element={<Personnel />} />
          <Route path="/monthly-income" element={<MonthlyIncome />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/notes/:id" element={<NoteDetail />} />
          <Route path="/debts" element={<Debts />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

export default AppRoutes; 