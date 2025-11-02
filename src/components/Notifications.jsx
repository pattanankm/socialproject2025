import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { FollowButton } from '../hooks/useFollow.jsx';
import './Notifications.css';

function Notifications() {
    const { user } = useUserAuth();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!user) return;

        // Listen to notifications for current user
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('toUserId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notificationsData = [];
            snapshot.forEach((doc) => {
                notificationsData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort in JavaScript instead of Firestore
            notificationsData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis() || 0;
                const timeB = b.createdAt?.toMillis() || 0;
                return timeB - timeA; // Descending order (newest first)
            });
            
            setNotifications(notificationsData);
        });

        return () => unsubscribe();
    }, [user]);

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'just now';
        const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return `${Math.floor(seconds / 604800)}w`;
    };

    const getTimeCategory = (timestamp) => {
        if (!timestamp) return 'new';
        const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
        
        if (seconds < 604800) return 'week'; // Less than 1 week
        return 'month';
    };

    const newNotifications = notifications.filter(n => !n.read);
    const thisWeek = notifications.filter(n => getTimeCategory(n.createdAt) === 'week');
    const thisMonth = notifications.filter(n => getTimeCategory(n.createdAt) === 'month');

    return (
        <div className="notifications-container content-with-bottom-nav">
            {/* Header */}
            <div className="notifications-header">
                <h2>Notifications</h2>
            </div>

            {/* Notifications List */}
            <div className="notifications-content">
                {notifications.length === 0 ? (
                    <div className="no-notifications">
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    <>
                        {/* New Section */}
                        {newNotifications.length > 0 && (
                            <div className="notifications-section">
                                <h3 className="section-title">New</h3>
                                {newNotifications.map(notification => (
                                    <NotificationItem 
                                        key={notification.id} 
                                        notification={notification}
                                        formatTimeAgo={formatTimeAgo}
                                    />
                                ))}
                            </div>
                        )}

                        {/* This Week Section */}
                        {thisWeek.length > 0 && (
                            <div className="notifications-section">
                                <h3 className="section-title">This Week</h3>
                                {thisWeek.map(notification => (
                                    <NotificationItem 
                                        key={notification.id} 
                                        notification={notification}
                                        formatTimeAgo={formatTimeAgo}
                                    />
                                ))}
                            </div>
                        )}

                        {/* This Month Section */}
                        {thisMonth.length > 0 && (
                            <div className="notifications-section">
                                <h3 className="section-title">This Month</h3>
                                {thisMonth.map(notification => (
                                    <NotificationItem 
                                        key={notification.id} 
                                        notification={notification}
                                        formatTimeAgo={formatTimeAgo}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function NotificationItem({ notification, formatTimeAgo }) {
    const navigate = useNavigate();
    const { type, fromUserId, postImage, commentText, createdAt, read } = notification;
    const [userProfile, setUserProfile] = useState({
        displayName: notification.fromUserName || 'User',
        photoURL: notification.fromUserAvatar || null
    });

    // Real-time user profile updates
    useEffect(() => {
        if (!fromUserId) return;

        const userRef = doc(db, 'users', fromUserId);
        const unsubscribe = onSnapshot(userRef, (userDoc) => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserProfile({
                    displayName: data.displayName || data.email?.split('@')[0] || 'User',
                    photoURL: data.photoURL || `https://ui-avatars.com/api/?name=${data.displayName || 'User'}&background=random`
                });
            } else {
                // Fallback to notification data
                setUserProfile({
                    displayName: notification.fromUserName || 'User',
                    photoURL: notification.fromUserAvatar || `https://ui-avatars.com/api/?name=${notification.fromUserName || 'User'}&background=random`
                });
            }
        });

        return () => unsubscribe();
    }, [fromUserId, notification.fromUserName, notification.fromUserAvatar]);

    const getMessage = () => {
        switch (type) {
            case 'like':
                return 'liked your post.';
            case 'comment':
                return `commented: "${commentText}"`;
            case 'follow':
                return 'started following you.';
            default:
                return '';
        }
    };

    const handleProfileClick = () => {
        if (fromUserId) {
            navigate(`/profile/${fromUserId}`);
        }
    };

    return (
        <div className={`notification-item ${!read ? 'new' : ''}`}>
            <img 
                src={userProfile.photoURL} 
                alt={userProfile.displayName} 
                className="notification-avatar"
                onClick={handleProfileClick}
                style={{ cursor: 'pointer' }}
            />
            <div className="notification-content">
                <p className="notification-text">
                    <strong 
                        onClick={handleProfileClick}
                        style={{ cursor: 'pointer' }}
                    >
                        {userProfile.displayName}
                    </strong> {getMessage()} <span className="notification-time">{formatTimeAgo(createdAt)}</span>
                </p>
            </div>
            {postImage ? (
                <img src={postImage} alt="Post" className="notification-post-image" />
            ) : type === 'follow' ? (
                <FollowButton 
                    targetUserId={fromUserId}
                    targetUserName={userProfile.displayName}
                    targetUserAvatar={userProfile.photoURL}
                />
            ) : null}
        </div>
    );
}

export default Notifications;
