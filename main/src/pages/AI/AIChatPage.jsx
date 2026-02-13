import React from 'react';
import ChatWindow from '../../components/AI/ChatWindow';

const AIChatPage = () => {
    return (
        <div className="container-fluid p-4 h-100">
            <div className="row h-100">
                <div className="col-12 h-100">
                    <ChatWindow />
                </div>
            </div>
        </div>
    );
};

export default AIChatPage;
