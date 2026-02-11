import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="app-sidebar" data-bs-theme="dark" id="sidebar">
            <div className="app-sidebar-content" data-height="100%" data-scrollbar="true" >
                <div className="menu">
                    <div className="menu-profile">
                        <a className="menu-profile-link" data-bs-toggle="collapse" href="#appSidebarProfileMenu"
                            role="button" aria-expanded="false"
                        >
                            <div className="menu-profile-cover with-shadow"></div>
                            <div className="menu-profile-image">
                                <img alt="" src="/assets/img/user/user-13.jpg" />
                            </div>
                            <div className="menu-profile-info">
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1"></div>
                                    <div className="menu-caret ms-auto"></div>
                                </div>
                                <small>Frontend developer</small>
                            </div>
                        </a>
                    </div>

                    {/* ... profile menu ... */}

                    <div className="menu-header">Navigation</div>

                    <div className="menu-item">
                        <Link className="menu-link" to="/">
                            <div className="menu-icon">
                                <i className="fa fa-sitemap"></i>
                            </div>
                            <div className="menu-text">Dashboard</div>
                        </Link>
                    </div>

                    <div className="menu-item">
                        <Link className="menu-link" to="/users">
                            <div className="menu-icon">
                                <i className="fa fa-users"></i>
                            </div>
                            <div className="menu-text">User Management</div>
                        </Link>
                    </div>

                    <div className="menu-item has-sub">
                        <a className="menu-link" href="#">
                            <div className="menu-icon">
                                <i className="fa fa-microchip"></i>
                            </div>
                            <div className="menu-text">Devices</div>
                            <div className="menu-caret"></div>
                        </a>
                        <div className="menu-submenu">
                            <div className="menu-item">
                                <Link className="menu-link" to="/devices">
                                    <div className="menu-text">Devices</div>
                                </Link>
                            </div>
                            <div className="menu-item">
                                <Link className="menu-link" to="/io-groups">
                                    <div className="menu-text">IO Groups</div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="menu-item">
                        <Link className="menu-link" to="/modules">
                            <div className="menu-icon">
                                <i className="fa fa-cubes"></i>
                            </div>
                            <div className="menu-text">Modules</div>
                        </Link>
                    </div>

                    <div className="menu-item has-sub">
                        <a className="menu-link" href="#">
                            <div className="menu-icon">
                                <i className="fa fa-code-branch"></i>
                            </div>
                            <div className="menu-text">Program</div>
                            <div className="menu-caret"></div>
                        </a>
                        <div className="menu-submenu">
                            <div className="menu-item">
                                <Link className="menu-link" to="/program/fbd">
                                    <div className="menu-text">FBD</div>
                                </Link>
                            </div>
                            <div className="menu-item">
                                <Link className="menu-link" to="/program/script">
                                    <div className="menu-text">Script</div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="menu-item d-flex">
                        <a
                            className="app-sidebar-minify-btn ms-auto d-flex align-items-center text-decoration-none"
                            data-bs-toggle="app-sidebar-minify"
                            href="#"
                        >
                            <i className="fa fa-angle-double-left"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
