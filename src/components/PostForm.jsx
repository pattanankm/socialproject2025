import React, { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useUserAuth } from '../context/UserAuthContext';

function PostForm() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useUserAuth();

    async function handleSubmit(e) {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || loading) return;
        
        setLoading(true);
        
        try {
            await addDoc(collection(db, "posts"), {
                uid: user?.uid ?? null,
                author: user?.email ?? user?.displayName ?? "anonymous",
                text: trimmed,
                createdAt: serverTimestamp(),
            });
            setText("");
        } catch (err) {
            console.error("Error posting:", err);
            alert("Failed to post. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey && !loading) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <Card className="mb-3">
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        placeholder="Post something..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <div className="d-flex justify-content-end mt-2">
                        <Button type="submit" disabled={!text.trim() || loading}>
                            {loading ? "Posting..." : "Post"}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default PostForm;