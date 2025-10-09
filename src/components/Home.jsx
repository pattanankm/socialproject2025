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

    useEffect(() => {
        const q = query(
            collection(db, "posts"),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        const unsub = onSnapshot(q, (snap) => {
            setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return unsub;
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

            <PostForm />
            <PostList posts={posts} />
        </div>
    );
}

export default Home