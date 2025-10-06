// import React from 'react'
import React, {useState,useEffect} from "react";
import { useNavigate } from 'react-router-dom'
import { useUserAuth } from '../context/UserAuthContext'
import { Button, Offcanvas, ListGroup ,Card ,Form } from 'react-bootstrap'

import { db } from "../firebase";
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot, deleteDoc, doc, limit
} from "firebase/firestore";

function Home() {
    
    const { logOut, user } = useUserAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [text, setText] = useState("");
    const [posts, setPosts] = useState([]);
    
    console.log(user);
    //post realtime
    
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

      //send post

      async function submitPost(e) {
        e.preventDefault();
        if (!text.trim()) return;
        await addDoc(collection(db, "posts"), {
          uid: user?.uid ?? null,
          author: user?.email ?? user?.displayName ?? "anonymous",
          text: text.trim(),
          createdAt: serverTimestamp(),
        });
        setText("");
      }

      //delete post

      async function removePost(id, ownerUid) {
        if (!user || ownerUid !== user.uid) return;
        await deleteDoc(doc(db, "posts", id));
      }

    const handleLogout = async () => {
        try {
            await logOut();
            navigate('/');
        } catch(err) {
            console.log(err.message);
        }
    };
    const fmt = (ts) => {
        try {
          const d = ts?.toDate ? ts.toDate() : new Date();
          return d.toLocaleString();
        } catch { return ""; }
    };


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
        <Offcanvas
            id="main-menu"
            show={menuOpen}
            onHide={() => setMenuOpen(false)}
            placement="start"
            backdrop
            scroll
        >
        <Offcanvas.Header closeButton>
            <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
            <ListGroup variant="flush">
                <ListGroup.Item
                    action
                    onClick={() => { navigate('/home'); setMenuOpen(false); }}>
                    comming soon
                </ListGroup.Item>
                <ListGroup.Item
                    action
                    onClick={() => { navigate('/home'); setMenuOpen(false); }}>
                    comming soon
                </ListGroup.Item>
                <ListGroup.Item
                    action
                    onClick={() => { navigate('/home'); setMenuOpen(false); }}>
                    comming soon
                </ListGroup.Item>
                <ListGroup.Item
                    action
                    onClick={() => { navigate('/home'); setMenuOpen(false); }}>
                    comming soon
                </ListGroup.Item>
                </ListGroup>

                <hr />

                <Button onClick={handleLogout} variant="danger" className="w-100">
                    Logout
                </Button>
            </Offcanvas.Body>
        </Offcanvas>

        <h2>Welcome to home</h2>
        <p>Hi, {user?.email ?? 'guest'}</p>
        {/* <Button onClick={handleLogout} variant='danger'>Logout</Button> */}
    {/* กล่องโพสต์ */}
    <Card className="mb-3">
        <Card.Body>
          <Form onSubmit={submitPost}>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Post something..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="d-flex justify-content-end mt-2">
              <Button type="submit" disabled={!text.trim()}>
                Post
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* รายการโพสต์ */}
      {posts.map((p) => (
        <Card key={p.id} className="mb-2">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-bold">{p.author}</div>
                <div>{p.text}</div>
                <small className="text-muted">{fmt(p.createdAt)}</small>
              </div>
              {p.uid === user?.uid && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removePost(p.id, p.uid)}
                >
                  delete
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export default Home