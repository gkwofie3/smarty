import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import DashboardPage from './pages/DashboardPage';

import LoginPage from './pages/LoginPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/editor" element={<EditorPage />} />
            </Routes>
        </Router>
    );
}

export default App;
