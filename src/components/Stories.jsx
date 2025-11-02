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
                
                // Always add "Your Story" first
                const yourStory = {
                    id: 'your-story',
                    username: 'Your Story',
                    displayName: userData?.displayName || 'You',
                    avatar: userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.displayName || 'You'}&background=random`,
                    isOwn: true,
                    hasStory: false // Change to true when user has active story
                };

                // Get following list
                const following = userData?.following || [];

                // For now, just show "Your Story" since we don't have stories collection yet
                // In the future, query stories from following users
                setStories([yourStory]);
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
                        <div className={`story-avatar-wrapper ${story.hasStory ? 'has-story' : ''}`}>
                            <img 
                                src={story.avatar} 
                                alt={story.username}
                                className="story-avatar"
                            />
                            {story.isOwn && !story.hasStory && (
                                <div className="add-story-btn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="3">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                </div>
                            )}
                        </div>
                        <span className="story-username">{story.username}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Stories;
