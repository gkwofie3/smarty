import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<EditorPage />} />
                <Route path="/editor" element={<EditorPage />} />
                {/* Helper route to catch params if passed via query string */}
            </Routes>
        </Router>
    );
}

export default App;
