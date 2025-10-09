// src/components/PostList.js
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useUserAuth } from '../context/UserAuthContext';
import Like from './Like'; // ✅ เพิ่มบรรทัดนี้

function PostList({ posts }) {
  const { user } = useUserAuth();

  async function removePost(id, ownerUid) {
    if (!user || ownerUid !== user.uid) return;
    await deleteDoc(doc(db, "posts", id));
  }

  const fmt = (ts) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date();
      return d.toLocaleString();
    } catch {
      return "";
    }
  };

  return (
    <>
      {posts.map((p) => (
        <Card key={p.id} className="mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div className="fw-bold">{p.author}</div>
                <div>{p.text}</div>
                <small className="text-muted">{fmt(p.createdAt)}</small>

                {/* ✅ ปุ่มไลค์ */}
                <div className="mt-2">
                  <Like />
                </div>
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
    </>
  );
}

export default PostList;
