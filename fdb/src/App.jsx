import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<EditorPage />} />
                <Route path="/editor" element={<EditorPage />} />
            </Routes>
        </Router>
    );
}

export default App;
