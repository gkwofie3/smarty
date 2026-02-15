import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaArrowLeft, FaArrowRight, FaSyncAlt } from 'react-icons/fa';

const Header = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { username: 'User' };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const goBack = () => window.history.back();
    const goForward = () => window.history.forward();
    const refresh = () => window.location.reload();

    return (
        <div className="app-header" id="header" style={{ height: '50px', display: 'flex', alignItems: 'center', padding: '0 20px', background: '#fff', borderBottom: '1px solid #e0e0e0' }}>
            <div className="navbar-header" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <Link className="navbar-brand" to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <span className="logo"> <img src="/logo.png" alt="" style={{ width: '40px', height: '40px', marginRight: '10px' }} /></span>
                    <b className="me-1" style={{ fontWeight: 'bold' }}>Smarty</b> Manager
                </Link>
            </div>

            <div className="d-flex gap-2 align-items-center">
                <button className="btn btn-outline-primary btn-sm d-flex align-items-center" onClick={goBack} title="Back">
                    <FaArrowLeft />
                </button>
                <button className="btn btn-outline-primary btn-sm d-flex align-items-center" onClick={goForward} title="Forward">
                    <FaArrowRight />
                </button>
                <button className="btn btn-outline-success btn-sm d-flex align-items-center" onClick={refresh} title="Refresh">
                    <FaSyncAlt />
                </button>

                <div className="navbar-item navbar-user dropdown ms-3">
                    <a
                        className="navbar-link dropdown-toggle d-flex align-items-center text-decoration-none text-dark"
                        data-bs-toggle="dropdown"
                        href="#"
                    >
                        <img alt="" src="/assets/img/user/user-13.jpg" style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '8px' }} />
                        <span>
                            <span className="d-none d-md-inline fw-bold">
                                {user.username || user.email || 'User'}
                            </span>
                            <b className="caret ms-1"></b>
                        </span>
                    </a>
                    <div className="dropdown-menu dropdown-menu-end">
                        <Link className="dropdown-item" to="/users/profile">
                            System Settings
                        </Link>
                        <div className="dropdown-divider"></div>
                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                            <FaSignOutAlt className="me-2" /> Log Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
