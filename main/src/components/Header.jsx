import React from 'react';

const Header = () => {
    return (
        <div className="app-header" id="header">
            <div className="navbar-header">
                <a className="navbar-brand" href="/">
                    <span className="logo"> <img src="/assets/img/logo/logo.png" alt="" /></span>
                    <b className="me-3px">Smarty</b> Manager
                </a>
                <button
                    className="navbar-mobile-toggler"
                    type="button"
                    data-toggle="app-sidebar-mobile"
                >
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                    <span className="icon-bar"></span>
                </button>
            </div>

            <div className="navbar-nav">
                <div className="navbar-item navbar-form">
                    <form action="" method="POST" name="search">
                        <div className="form-group">
                            <input
                                className="form-control"
                                placeholder="Enter keyword"
                                type="text"
                            />
                            <button className="btn btn-search" type="submit">
                                <i className="fa fa-search"></i>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="navbar-item dropdown">
                    <a
                        className="navbar-link dropdown-toggle icon"
                        data-bs-toggle="dropdown"
                        href="#"
                    >
                        <i className="fa fa-bell"></i>
                        <span className="badge">5</span>
                    </a>
                    <div className="dropdown-menu media-list dropdown-menu-end">
                        <div className="dropdown-header">NOTIFICATIONS (5)</div>
                        {/* ... truncated for brevity, can add back later or keep simple ... */}
                        <div className="dropdown-footer text-center">
                            <a className="text-decoration-none" href="#">
                                View more
                            </a>
                        </div>
                    </div>
                </div>

                <div className="navbar-item navbar-user dropdown">
                    <a
                        className="navbar-link dropdown-toggle d-flex align-items-center"
                        data-bs-toggle="dropdown"
                        href="#"
                    >
                        <img alt="" src="/assets/img/user/user-13.jpg" />
                        <span>
                            <span className="d-none d-md-inline fw-bold">
                                User
                            </span>
                            <b className="caret"></b>
                        </span>
                    </a>
                    <div className="dropdown-menu dropdown-menu-end me-1">
                        <a className="dropdown-item" href="#">
                            Edit Profile
                        </a>
                        <div className="dropdown-divider"></div>
                        <a className="dropdown-item" href="/login" onClick={() => localStorage.clear()}>
                            Log Out
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
