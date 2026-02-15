import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import { UserList } from './pages/Users/UserList';
import Login from './pages/Auth/Login';

import DevicesPage from './pages/Devices/DevicesPage';
import IOGroupsPage from './pages/Devices/IOGroupsPage';
import ModulesPage from './pages/Modules/ModulesPage';
import PageView from './pages/Preview/PageView';
import FBDProgramsPage from './pages/Programs/FBDProgramsPage';
import FBDViewerPage from './pages/Programs/FBDViewerPage';
import ScriptsPage from './pages/Programs/ScriptsPage';
import AIChatPage from './pages/AI/AIChatPage';


// Auth Guard
const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

function App() {

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/io-groups" element={<IOGroupsPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/view/:pageId" element={<PageView />} />
          <Route path="/program/fbd" element={<FBDProgramsPage />} />
          <Route path="/program/fbd/view/:id" element={<FBDViewerPage />} />
          <Route path="/program/script" element={<ScriptsPage />} />
          <Route path="/ai" element={<AIChatPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
