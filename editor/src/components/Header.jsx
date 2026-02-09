import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();

    return (
        <div id="header" className="app-header">
            <div className="navbar-header">
                <Link to="/" className="navbar-brand">
                    <span className="navbar-logo"></span>
                    <b className="me-1">Smarty</b> Editor
                </Link>
                <button type="button" className="navbar-mobile-toggler" data-toggle="app-sidebar-mobile">
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                </button>
            </div>

            <div className="navbar-nav">
                <div className="navbar-item navbar-user dropdown">
                    <a href="#" className="navbar-link dropdown-toggle d-flex align-items-center" data-bs-toggle="dropdown">
                        <span>
                            <span className="d-none d-md-inline">Admin</span>
                            <b className="caret"></b>
                        </span>
                    </a>
                    <div className="dropdown-menu dropdown-menu-end me-1">
                        <a href="#" className="dropdown-item" onClick={() => {
                            localStorage.removeItem('token');
                            navigate('/login');
                        }}>Log Out</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
