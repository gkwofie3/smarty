import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaArrowRight, FaSyncAlt } from 'react-icons/fa';

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const goBack = () => window.history.back();
    const goForward = () => window.history.forward();
    const refresh = () => window.location.reload();

    return (
        <div className="app-header" id="header" style={{ height: '50px', zIndex: 1020, background: '#fff', display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #e0e0e0' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Link className="navbar-brand" to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <span className="logo"> <img src="/script.png" alt="" style={{ width: '40px', height: '40px', marginRight: '10px' }} /></span>
                    <b className="me-1" style={{ fontWeight: 'bold' }}>Smarty</b> <span style={{ color: 'orange' }}>Script</span>
                </Link>
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
