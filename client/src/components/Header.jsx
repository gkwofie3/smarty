import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDesktop, FaSignOutAlt } from 'react-icons/fa';

const Header = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="app-header" id="header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', zIndex: 1020, background: '#2d353c', display: 'flex', alignItems: 'center', padding: '0 20px', color: 'white' }}>
            <div style={{ flex: 1, fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <span className="logo me-2"><FaDesktop /></span>
                Smarty Viewer
                <div className="ms-4 d-flex">
                    <button className="btn btn-link text-white text-decoration-none me-3" onClick={() => navigate('/')}>Dashboard</button>
                    <button className="btn btn-link text-white text-decoration-none me-3" onClick={() => navigate('/devices')}>Devices</button>
                    <button className="btn btn-link text-white text-decoration-none me-3" onClick={() => navigate('/point-groups')}>IO Groups</button>
                    <button className="btn btn-link text-white text-decoration-none me-3" onClick={() => navigate('/programs/fbd')}>Programs</button>
                    <button className="btn btn-link text-white text-decoration-none me-3" onClick={() => navigate('/programs/scripts')}>Scripts</button>
                    <button className="btn btn-link text-white text-decoration-none" onClick={() => navigate('/programs/bindings')}>Bindings</button>
                </div>
            </div>
            <div>
                <button className="btn btn-outline-light btn-sm d-flex align-items-center" onClick={handleLogout}>
                    <FaSignOutAlt className="me-1" /> Logout
                </button>
            </div>
        </div>
    );
};

export default Header;
