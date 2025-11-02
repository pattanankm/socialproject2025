import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { FollowButton } from '../hooks/useFollow.jsx';
import './Search.css';

function Search() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useUserAuth();

    // Mock data for explore grid
    const explorePosts = Array.from({ length: 30 }, (_, i) => ({
        id: i + 1,
        imageUrl: `https://picsum.photos/400/400?random=${i + 1}`,
        likes: Math.floor(Math.random() * 10000),
        comments: Math.floor(Math.random() * 500),
    }));

    // Load recent users
    useEffect(() => {
        const loadRecentUsers = async () => {
            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, orderBy('createdAt', 'desc'), limit(5));
                const snapshot = await getDocs(q);
                
                const users = [];
                snapshot.forEach((doc) => {
                    if (user && doc.id !== user.uid) {
                        users.push({ id: doc.id, ...doc.data() });
                    }
                });
                setRecentSearches(users);
            } catch (error) {
                console.error('Error loading recent users:', error);
            }
        };

        if (user) {
            loadRecentUsers();
        }
    }, [user]);

    // Search users by email or displayName
    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                const usersRef = collection(db, 'users');
                
                // Search by email
                const emailQuery = query(
                    usersRef,
                    where('email', '>=', searchQuery.toLowerCase()),
                    where('email', '<=', searchQuery.toLowerCase() + '\uf8ff'),
                    limit(10)
                );
                
                // Search by displayName
                const nameQuery = query(
                    usersRef,
                    where('displayName', '>=', searchQuery),
                    where('displayName', '<=', searchQuery + '\uf8ff'),
                    limit(10)
                );

                const [emailSnapshot, nameSnapshot] = await Promise.all([
                    getDocs(emailQuery),
                    getDocs(nameQuery)
                ]);

                const usersMap = new Map();
                
                emailSnapshot.forEach((doc) => {
                    if (!user || doc.id !== user.uid) {
                        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
                    }
                });
                
                nameSnapshot.forEach((doc) => {
                    if (!user || doc.id !== user.uid) {
                        usersMap.set(doc.id, { id: doc.id, ...doc.data() });
                    }
                });

                setSearchResults(Array.from(usersMap.values()));
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, user]);

    return (
        <div className="search-container content-with-bottom-nav">
            {/* Search Header */}
            <div className="search-header">
                <div className="search-input-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button 
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Search Results or Recent */}
            {searchQuery ? (
                <div className="search-results">
                    <div className="results-section">
                        <h3>Accounts</h3>
                        {loading ? (
                            <p className="loading-text">Searching...</p>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(userData => (
                                <div key={userData.id} className="user-result">
                                    <div 
                                        className="user-result-clickable"
                                        onClick={() => navigate(`/profile/${userData.id}`)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flex: 1 }}
                                    >
                                        <img 
                                            src={userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName}&background=random`} 
                                            alt={userData.displayName} 
                                            className="user-avatar" 
                                        />
                                        <div className="user-info">
                                            <div className="username">{userData.displayName}</div>
                                            <div className="user-detail">{userData.email}</div>
                                        </div>
                                    </div>
                                    <FollowButton 
                                        targetUserId={userData.id}
                                        targetUserName={userData.displayName}
                                        targetUserAvatar={userData.photoURL}
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="no-results">No users found</p>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Recent Users */}
                    {recentSearches.length > 0 && (
                        <div className="recent-searches">
                            <div className="recent-header">
                                <h3>Suggested</h3>
                            </div>
                            {recentSearches.map(userData => (
                                <div key={userData.id} className="user-result">
                                    <div 
                                        className="user-result-clickable"
                                        onClick={() => navigate(`/profile/${userData.id}`)}
                                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flex: 1 }}
                                    >
                                        <img 
                                            src={userData.photoURL || `https://ui-avatars.com/api/?name=${userData.displayName}&background=random`} 
                                            alt={userData.displayName} 
                                            className="user-avatar" 
                                        />
                                        <div className="user-info">
                                            <div className="username">{userData.displayName}</div>
                                            <div className="user-detail">{userData.email}</div>
                                        </div>
                                    </div>
                                    <FollowButton 
                                        targetUserId={userData.id}
                                        targetUserName={userData.displayName}
                                        targetUserAvatar={userData.photoURL}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Explore Grid */}
                    <div className="explore-section">
                        <h3 className="explore-title">Explore</h3>
                        <div className="explore-grid">
                            {explorePosts.map(post => (
                                <div key={post.id} className="explore-item">
                                    <img src={post.imageUrl} alt="Post" />
                                    <div className="explore-overlay">
                                        <div className="explore-stats">
                                            <span className="stat">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                </svg>
                                                {post.likes.toLocaleString()}
                                            </span>
                                            <span className="stat">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                </svg>
                                                {post.comments}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Search;
