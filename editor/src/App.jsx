import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import MainLayout from './components/layout/MainLayout';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        {/* Dashboard uses MainLayout (Template) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
        </Route>

        {/* Editor is Standalone (Full Screen) */}
        <Route path="/editor/:pageId" element={<Editor />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
