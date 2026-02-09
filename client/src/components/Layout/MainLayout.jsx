import React, { useEffect } from 'react';
import Header from '../Header';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
    return (
        <div className="app app-header-fixed" id="app">
            <Header />
            <div className="app-content" id="content" style={{ marginLeft: 0, paddingTop: '60px', height: '100vh', paddingBottom: 0 }}>
                <Outlet />
            </div>
        </div>
    );
};

export default MainLayout;
