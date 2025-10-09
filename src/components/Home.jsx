import React, { useState, useEffect } from "react";
import { Button } from 'react-bootstrap';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";

// Import new components
import Menu from './Menu';
import PostForm from './PostForm';
import PostList from './PostList';

function Home() {
    const { user } = useUserAuth();
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
        <div className="p-3">
            <Button
                variant="secondary"
                onClick={() => setMenuOpen(true)}
                aria-controls="main-menu"
                aria-expanded={menuOpen}
            >
                ☰ Menu
            </Button>

            <Menu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

            <h2>Welcome to home</h2>
            <p>Hi, {user?.email ?? 'guest'}</p>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <PostForm />
            {posts.length > 0 ? (
                <PostList posts={posts} />
            ) : !error ? (
                <p className="text-center mt-3">No posts yet. Be the first to post!</p>
            ) : null}
        </div>
    );
}

export default Home