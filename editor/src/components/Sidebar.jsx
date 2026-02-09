import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);

    useEffect(() => {
        // Load modules for menu if needed, or just static linkage
        // Since dashboard loads modules, maybe Sidebar just links to dashboard?
        // Or lists modules!
        loadModules();
    }, []);

    const loadModules = async () => {
        try {
            const res = await api.get('modules/');
            setModules(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <React.Fragment>
            <div id="sidebar" className="app-sidebar">
                <div className="app-sidebar-content" data-scrollbar="true" data-height="100%">
                    <div className="menu">
                        <div className="menu-profile">
                            <a href="#" className="menu-profile-link" data-toggle="app-sidebar-profile" data-target="#appSidebarProfileMenu">
                                <div className="menu-profile-cover with-shadow"></div>
                                <div className="menu-profile-image">
                                    <div className="ratio ratio-1x1 rounded-circle bg-white d-flex align-items-center justify-content-center text-dark fw-bold">
                                        ADM
                                    </div>
                                </div>
                                <div className="menu-profile-info">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            Admin
                                        </div>
                                    </div>
                                    <small>Smarty Editor</small>
                                </div>
                            </a>
                        </div>

                        <div className="menu-header">Navigation</div>

                        <div className={`menu-item ${location.pathname === '/' ? 'active' : ''}`}>
                            <Link to="/" className="menu-link">
                                <div className="menu-icon">
                                    <i className="fa fa-th-large"></i>
                                </div>
                                <div className="menu-text">Dashboard</div>
                            </Link>
                        </div>

                        <div className="menu-header">Modules</div>
                        {modules.map(mod => (
                            <div key={mod.id} className="menu-item">
                                <a href="#" className="menu-link" onClick={(e) => {
                                    e.preventDefault();
                                    navigate(`/?module=${mod.id}`);
                                }}>
                                    <div className="menu-icon">
                                        <i className="fa fa-cube"></i>
                                    </div>
                                    <div className="menu-text">{mod.name}</div>
                                </a>
                            </div>
                        ))}

                        <div className="menu-item d-flex">
                            <a href="#" className="app-sidebar-minify-btn ms-auto" data-toggle="app-sidebar-minify"><i className="fa fa-angle-double-left"></i></a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="app-sidebar-bg"></div>
            <div className="app-sidebar-mobile-backdrop"><a href="#" data-dismiss="app-sidebar-mobile" className="stretched-link"></a></div>
        </React.Fragment>
    );
};

export default Sidebar;
