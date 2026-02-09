import React, { useEffect } from 'react';
import Header from '../Header';
import Sidebar from '../Sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    useEffect(() => {
        if (window.App) {
            window.App.init();
        }
    }, []);

    return (
        <div className="app app-header-fixed app-sidebar-fixed" id="app">
            <Header />
            <Sidebar />
            <div className="app-sidebar-bg" data-bs-theme="dark"></div>

            <div className="app-content" id="content">
                <Outlet />
            </div>

            <a
                className="btn btn-icon btn-circle btn-theme btn-scroll-to-top"
                data-toggle="scroll-to-top"
                href="#"
            >
                <i className="fa fa-angle-up"></i>
            </a>
            <div className="app-sidebar-mobile-backdrop"><a href="#" data-dismiss="app-sidebar-mobile" className="stretched-link"></a></div>
        </div>
    );
};

export default MainLayout;
