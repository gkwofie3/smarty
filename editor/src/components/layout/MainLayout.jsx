import React, { useEffect } from 'react';
import Header from '../Header';
import Sidebar from '../Sidebar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    useEffect(() => {
        // Initialize template scripts if available
        if (window.App) {
            window.App.init();
        }
    }, []);

    return (
        <div id="app" className="app app-header-fixed app-sidebar-fixed">
            <Header />
            <Sidebar />

            <div id="content" className="app-content bg-light">
                <Outlet />
            </div>

            <a href="#" className="btn btn-icon btn-circle btn-success btn-scroll-to-top" data-toggle="scroll-to-top"><i className="fa fa-angle-up"></i></a>
        </div>
    );
};

export default MainLayout;
