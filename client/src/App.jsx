import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Auth/Login';
import PageView from './pages/Preview/PageView';
import DeviceList from './pages/Devices/DeviceList';
import RegisterList from './pages/Devices/RegisterList';
import PointGroupList from './pages/Points/PointGroupList';
import PointList from './pages/Points/PointList';

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
          <Route path="/view/:pageId" element={<PageView />} />
          <Route path="/devices" element={<DeviceList />} />
          <Route path="/devices/:deviceId/registers" element={<RegisterList />} />
          <Route path="/point-groups" element={<PointGroupList />} />
          <Route path="/point-groups/:groupId/points" element={<PointList />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
