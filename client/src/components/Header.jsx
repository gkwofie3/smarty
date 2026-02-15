import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDesktop, FaSignOutAlt, FaArrowLeft, FaArrowRight, FaSyncAlt } from 'react-icons/fa';

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const goBack = () => {
        window.history.back();
    };

    const goForward = () => {
        window.history.forward();
    };

    const refresh = () => {
        window.location.reload();
    };

    return (
        <div className="app-header" id="header" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '50px', zIndex: 1020, background: '#ffffffff', display: 'flex', alignItems: 'center', padding: '0 20px', color: 'black' }}>
            <div style={{ flex: 1, fontSize: '18px', display: 'flex', alignItems: 'center' }}>
                <a className="navbar-brand" href="/">
                    <span className="logo"> <img src="/client.png" alt="" style={{ width: '40px', height: '40px', marginRight: '10px' }} /></span>
                    <b className="me-3px" style={{ fontWeight: 'bold' }}>Smarty</b> <span style={{ color: 'orange' }}>Viewer</span>
                </a>
                <div className="ms-4 d-flex">
                    <button className="btn btn-link text-white text-decoration-none me-3" onClick={() => navigate('/')}>Dashboard</button>
                </div>
            </div>
            <div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm d-flex align-items-center" onClick={goBack} title="Back">
                        <FaArrowLeft />
                    </button>
                    <button className="btn btn-outline-primary btn-sm d-flex align-items-center" onClick={goForward} title="Forward">
                        <FaArrowRight />
                    </button>
                    <button className="btn btn-outline-success btn-sm d-flex align-items-center" onClick={refresh} title="Refresh">
                        <FaSyncAlt />
                    </button>
                    <button className="btn btn-outline-dark btn-sm d-flex align-items-center ms-2" onClick={handleLogout}>
                        <FaSignOutAlt className="me-1" /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Header;