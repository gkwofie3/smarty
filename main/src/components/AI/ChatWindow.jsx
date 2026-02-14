import React, { useState, useRef, useEffect } from 'react';
import { chatWithAI, getChatHistory } from '../../services/aiService';
import { FaRobot, FaUser, FaPaperPlane, FaStop } from 'react-icons/fa';
// import ReactMarkdown from 'react-markdown'; // Assuming installed, or use plain text for now

const ChatWindow = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentResponse, setCurrentResponse] = useState('');
    const [conversationId, setConversationId] = useState(localStorage.getItem('smarty_ai_conv_id'));
    const messagesEndRef = useRef(null);

    // Initial Load: History
    useEffect(() => {
        const loadHistory = async () => {
            if (conversationId) {
                try {
                    const data = await getChatHistory(conversationId);
                    if (data.messages && data.messages.length > 0) {
                        setMessages(data.messages);
                    } else {
                        // Fallback if history is empty
                        setMessages([{ role: 'assistant', content: 'Hello! I am your AI Assistant. How can I help you today?' }]);
                    }
                } catch (err) {
                    console.error("Failed to load history", err);
                    setMessages([{ role: 'assistant', content: 'Hello! I am your AI Assistant. How can I help you today?' }]);
                }
            } else {
                setMessages([{ role: 'assistant', content: 'Hello! I am your AI Assistant. How can I help you today?' }]);
            }
        };
        loadHistory();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentResponse]);

    const formatMessage = (content) => {
        // Simple line break handling if markdown not available
        return content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setCurrentResponse('');

        await chatWithAI(
            userMsg.content,
            conversationId,
            (chunk) => {
                setCurrentResponse(prev => prev + chunk);
            },
            (fullText) => {
                setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
                setCurrentResponse('');
                setIsLoading(false);
            },
            (error) => {
                setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
                setIsLoading(false);
            },
            (newConvId) => {
                if (!conversationId) {
                    setConversationId(newConvId);
                    localStorage.setItem('smarty_ai_conv_id', newConvId);
                }
            }
        );
    };

    const startNewChat = () => {
        localStorage.removeItem('smarty_ai_conv_id');
        setConversationId(null);
        setMessages([{ role: 'assistant', content: 'Hello! I am your AI Assistant. How can I help you today?' }]);
        setInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="card h-100 d-flex flex-column shadow-sm">
            <div className="card-header bg-dark text-white d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                    <FaRobot className="me-2" />
                    <h5 className="mb-0">System Assistant</h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-light" onClick={startNewChat} title="New Chat">
                        Clear
                    </button>
                    <span className="badge bg-success">Online</span>
                </div>
            </div>

            <div className="card-body overflow-auto flex-grow-1" style={{ maxHeight: '70vh', backgroundColor: '#f8f9fa' }}>
                {messages.map((msg, index) => (
                    <div key={index} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                        <div className={`d-flex max-w-75 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`rounded-circle p-2 d-flex align-items-center justify-content-center mx-2 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-white'}`} style={{ width: 40, height: 40, minWidth: 40 }}>
                                {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                            </div>
                            <div className={`p-3 rounded shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border'}`}>
                                {formatMessage(msg.content)}
                            </div>
                        </div>
                    </div>
                ))}

                {currentResponse && (
                    <div className="d-flex mb-3 justify-content-start">
                        <div className="d-flex max-w-75 flex-row">
                            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center mx-2 bg-secondary text-white" style={{ width: 40, height: 40, minWidth: 40 }}>
                                <FaRobot />
                            </div>
                            <div className="p-3 rounded shadow-sm bg-white border">
                                {formatMessage(currentResponse)}
                                <span className="spinner-grow spinner-grow-sm ms-1 text-primary" role="status" aria-hidden="true" style={{ width: '0.5rem', height: '0.5rem' }}></span>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && !currentResponse && (
                    <div className="text-muted small ms-5 ps-3">Thinking...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="card-footer bg-white">
                <div className="input-group">
                    <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Ask about alarms, points, or troubleshooting..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        disabled={isLoading && !currentResponse}
                    ></textarea>
                    <button className="btn btn-primary" onClick={handleSend} disabled={isLoading && !currentResponse}>
                        <FaPaperPlane />
                    </button>
                </div>
                <div className="text-muted small mt-1">
                    <i className="fa fa-info-circle me-1"></i>
                    AI actions usually require confirmation.
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
