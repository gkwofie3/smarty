import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import DashboardPage from './pages/DashboardPage';

import LoginPage from './pages/LoginPage';

import Header from './components/Header';

function App() {
    return (
        <Router>
            <div className="vh-100 d-flex flex-column h-100">
                <Header />
                <div className="flex-grow-1 overflow-auto">
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/editor" element={<EditorPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
