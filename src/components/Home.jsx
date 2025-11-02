import React, { useState, useEffect } from "react";
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";

// Import new components
import Menu from './Menu';
import PostForm from './PostForm';
import PostList from './PostList';
import Stories from './Stories';
import FeedPost from './FeedPost';
import './Home.css';

function Home() {
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [text, setText] = useState("");
    const [posts, setPosts] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("Setting up Firestore listener");
        try {
            // Create the query
            const postsRef = collection(db, "posts");
            const q = query(
                postsRef,
                orderBy("createdAt", "desc"),
                limit(50)
            );

            // Set up real-time listener
            const unsub = onSnapshot(q, 
                (snapshot) => {
                    console.log("Received Firestore update:", snapshot.docs.length, "documents");
                    const newPosts = [];
                    snapshot.forEach((doc) => {
                        newPosts.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    console.log("Posts data:", newPosts);
                    setPosts(newPosts);
                    setError(null);
                },
                (err) => {
                    console.error("Firestore error:", err);
                    setError("Error loading posts. Please try again later.");
                }
            );

            // Cleanup subscription
            return () => unsub();
        } catch (err) {
            console.error("Setup error:", err);
            setError("Error setting up database connection.");
        }
    }, []);

    return (
        <div className="home-container content-with-bottom-nav">
            {/* Instagram-style Header */}
            <header className="home-header">
                <h1 className="app-logo">SocialApp</h1>
                <div className="header-actions">
                    <button 
                        className="header-btn" 
                        onClick={() => navigate('/notifications')}
                        title="Notifications"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <button className="header-btn" onClick={() => navigate('/messages')} title="Messages">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13"></path>
                            <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
                        </svg>
                    </button>
                </div>
            </header>

            <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

            {/* Feed Content */}
            <div className="feed-content">
                {/* Stories */}
                <Stories />

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                {/* Posts Feed */}
                {posts.length > 0 ? (
                    posts.map(post => (
                        <FeedPost key={post.id} post={post} />
                    ))
                ) : !error ? (
                    <div className="no-posts-message">
                        <div className="no-posts-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </div>
                        <h3>No Posts Yet</h3>
                        <p>When people you follow share photos, you'll see them here.</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default Home