import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import './Stories.css';

function Stories() {
    const { user } = useUserAuth();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const loadStories = async () => {
            try {
                // Get current user info
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();
                
                // Always add "You" first
                const yourStory = {
                    id: 'your-story',
                    username: 'You',
                    displayName: userData?.displayName || 'You',
                    avatar: userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.displayName || 'You'}&background=random`,
                    isOwn: true,
                    hasStory: false
                };

                // Get following list
                const following = userData?.following || [];

                // Fetch following users data
                let followingUsers = [];
                if (following.length > 0) {
                    const followingDocs = await Promise.all(
                        following.map(userId => getDoc(doc(db, 'users', userId)))
                    );
                    
                    followingUsers = followingDocs
                        .map((doc, index) => {
                            if (doc.exists()) {
                                return {
                                    id: following[index],
                                    username: doc.data().displayName || doc.data().email?.split('@')[0] || 'User',
                                    displayName: doc.data().displayName,
                                    avatar: doc.data().photoURL || `https://ui-avatars.com/api/?name=${doc.data().displayName || 'User'}&background=random`,
                                    isOwn: false,
                                    hasStory: false
                                };
                            }
                            return null;
                        })
                        .filter(user => user !== null);
                }

                // Combine: You first, then following users
                setStories([yourStory, ...followingUsers]);
                setLoading(false);
            } catch (error) {
                console.error('Error loading stories:', error);
                setLoading(false);
            }
        };

        loadStories();
    }, [user]);

    const handleStoryClick = (story) => {
        if (story.isOwn && !story.hasStory) {
            console.log('Create new story');
            // TODO: Open story creation
        } else {
            console.log('View story:', story.username);
            // TODO: Open story viewer
        }
    };

    // Show loading or nothing while loading
    if (loading) {
        return null;
    }
    
    // Always show at least "Your Story"
    if (stories.length === 0) {
        return null;
    }

    return (
        <div className="stories-container">
            <div className="stories-scroll">
                {stories.map(story => (
                    <div 
                        key={story.id} 
                        className="story-item"
                        onClick={() => handleStoryClick(story)}
                    >
                        <div className={`story-avatar-wrapper ${story.isOwn ? 'own-story' : ''}`}>
                            <img 
                                src={story.avatar} 
                                alt={story.username}
                                className="story-avatar"
                            />
                        </div>
                        <span className="story-username">{story.username}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Stories;
