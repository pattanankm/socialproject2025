import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import './CreatePost.css';

function CreatePost() {
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [caption, setCaption] = useState('');
    const [loading, setLoading] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    // Load user profile from Firestore
    useEffect(() => {
        const loadUserProfile = async () => {
            if (!user) return;

            try {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
            }
        };

        loadUserProfile();
    }, [user]);

    const handleSubmit = async () => {
        if (!caption.trim()) {
            alert('Please write something');
            return;
        }

        setLoading(true);
        try {
            // Get display name from Firestore profile or fallback to email
            const displayName = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || user.email || 'User';
            const userAvatar = userProfile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

            // Save post to Firestore
            await addDoc(collection(db, 'posts'), {
                text: caption,
                userId: user.uid,
                userEmail: user.email,
                displayName: displayName,
                userAvatar: userAvatar,
                createdAt: serverTimestamp(),
                likes: [],
                location: ''
            });

            // Reset form
            setCaption('');
            alert('Post created successfully!');
            navigate('/home');
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/home');
    };

    return (
        <div className="create-post-container content-with-bottom-nav">
            {/* Header */}
            <div className="create-post-header">
                <button className="back-btn" onClick={handleCancel}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <h2 className="header-title">New post</h2>
                <button 
                    className="share-btn" 
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Posting...' : 'Post'}
                </button>
            </div>

            {/* Content */}
            <div className="create-post-content">
                <div className="add-caption">
                    <div className="user-info">
                        <img 
                            src={userProfile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.displayName || user.displayName || 'User'}&background=random`}
                            alt="User"
                            className="user-avatar"
                        />
                        <span className="username">
                            {userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'User'}
                        </span>
                    </div>
                    <textarea
                        placeholder="What's on your mind?"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="caption-textarea"
                        style={{ minHeight: '200px' }}
                        maxLength={2200}
                    />
                    <div className="caption-counter">
                        {caption.length}/2,200
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreatePost;
