import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, setDoc } from 'firebase/firestore';
import './Chat.css';

function Chat() {
    const { conversationId } = useParams();
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Load conversation and other user data
    useEffect(() => {
        const loadConversation = async () => {
            if (!user || !conversationId) return;

            try {
                const convRef = doc(db, 'conversations', conversationId);
                const convDoc = await getDoc(convRef);

                if (convDoc.exists()) {
                    const convData = convDoc.data();
                    const otherUserId = convData.participants.find(uid => uid !== user.uid);
                    
                    if (otherUserId) {
                        const userRef = doc(db, 'users', otherUserId);
                        const userDoc = await getDoc(userRef);
                        
                        if (userDoc.exists()) {
                            setOtherUser({ id: otherUserId, ...userDoc.data() });
                        }
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error('Error loading conversation:', error);
                setLoading(false);
            }
        };

        loadConversation();
    }, [conversationId, user]);

    // Load messages
    useEffect(() => {
        if (!conversationId) return;

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() });
            });
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [conversationId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            // Add message to subcollection
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            await addDoc(messagesRef, {
                text: newMessage,
                senderId: user.uid,
                createdAt: serverTimestamp()
            });

            // Update conversation last message
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                lastMessage: newMessage,
                lastMessageTime: serverTimestamp(),
                lastMessageRead: false
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    if (loading) {
        return <div className="chat-container content-with-bottom-nav">Loading...</div>;
    }

    return (
        <div className="chat-container content-with-bottom-nav">
            {/* Header */}
            <div className="chat-header">
                <button className="back-btn" onClick={() => navigate('/messages')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div 
                    className="chat-user-info"
                    onClick={() => otherUser && navigate(`/profile/${otherUser.id}`)}
                    style={{ cursor: 'pointer' }}
                >
                    <img 
                        src={otherUser?.photoURL || `https://ui-avatars.com/api/?name=${otherUser?.displayName || 'User'}&background=random`}
                        alt={otherUser?.displayName}
                        className="chat-avatar"
                    />
                    <span className="chat-username">{otherUser?.displayName || 'User'}</span>
                </div>
                <button className="info-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="messages-area">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>No messages yet. Say hi! 👋</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div 
                            key={message.id} 
                            className={`message ${message.senderId === user.uid ? 'sent' : 'received'}`}
                        >
                            <div className="message-bubble">
                                <p>{message.text}</p>
                                <span className="message-time">{formatMessageTime(message.createdAt)}</span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="message-input"
                />
                <button 
                    type="submit" 
                    className="send-btn"
                    disabled={!newMessage.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
}

export default Chat;
