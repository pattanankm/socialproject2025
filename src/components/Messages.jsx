import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, or } from 'firebase/firestore';
import './Messages.css';

function Messages() {
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Load conversations where user is participant
        const conversationsRef = collection(db, 'conversations');
        const q = query(
            conversationsRef,
            where('participants', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = [];
            snapshot.forEach((doc) => {
                convos.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by lastMessageTime in JavaScript instead of Firestore
            convos.sort((a, b) => {
                const timeA = a.lastMessageTime?.toMillis() || 0;
                const timeB = b.lastMessageTime?.toMillis() || 0;
                return timeB - timeA; // Descending order
            });
            
            setConversations(convos);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const getOtherUser = (conversation) => {
        return conversation.participants.find(uid => uid !== user.uid);
    };

    const getOtherUserData = (conversation) => {
        const otherUserId = getOtherUser(conversation);
        return conversation.participantsData?.[otherUserId] || {};
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) { // Less than 24 hours
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diff < 604800000) { // Less than 7 days
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="messages-container content-with-bottom-nav">
            {/* Header */}
            <div className="messages-header">
                <button className="back-btn" onClick={() => navigate('/home')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <h2>Messages</h2>
                <button className="new-message-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                    </svg>
                </button>
            </div>

            {/* Conversations List */}
            <div className="conversations-list">
                {loading ? (
                    <div className="loading-state">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                        <h3>No messages yet</h3>
                        <p>Start a conversation with people you follow</p>
                    </div>
                ) : (
                    conversations.map((conversation) => {
                        const otherUserData = getOtherUserData(conversation);
                        return (
                            <div 
                                key={conversation.id} 
                                className="conversation-item"
                                onClick={() => navigate(`/chat/${conversation.id}`)}
                            >
                                <img 
                                    src={otherUserData.photoURL || `https://ui-avatars.com/api/?name=${otherUserData.displayName || 'User'}&background=random`}
                                    alt={otherUserData.displayName}
                                    className="conversation-avatar"
                                />
                                <div className="conversation-info">
                                    <div className="conversation-header">
                                        <span className="conversation-name">{otherUserData.displayName || 'User'}</span>
                                        <span className="conversation-time">{formatTime(conversation.lastMessageTime)}</span>
                                    </div>
                                    <div className="conversation-preview">
                                        <span className={conversation.lastMessageRead === false ? 'unread' : ''}>
                                            {conversation.lastMessage || 'Start a conversation'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default Messages;
