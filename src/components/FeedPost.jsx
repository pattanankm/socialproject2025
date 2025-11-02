import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, query, onSnapshot, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';
import './FeedPost.css';

function FeedPost({ post }) {
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comment, setComment] = useState('');
    const [likes, setLikes] = useState(post.likes || []);
    const [comments, setComments] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [postAuthorProfile, setPostAuthorProfile] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(post.text || '');
    
    // Get userId from post (handle old posts with 'uid' field)
    const postUserId = post.userId || post.uid;

    // Load current user profile from Firestore
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

    // Load post author profile from Firestore with real-time updates
    useEffect(() => {
        if (!postUserId) {
            console.warn('Post missing userId/uid:', post);
            setPostAuthorProfile({
                displayName: post.displayName || post.author || 'Unknown User',
                userAvatar: post.userAvatar || `https://ui-avatars.com/api/?name=User&background=random`,
                email: post.userEmail || ''
            });
            return;
        }

        const userRef = doc(db, 'users', postUserId);
        
        const unsubscribe = onSnapshot(userRef, (userDoc) => {
            if (userDoc.exists()) {
                const data = userDoc.data();
                setPostAuthorProfile({
                    displayName: data.displayName || data.email?.split('@')[0] || post.displayName || post.userEmail?.split('@')[0] || 'User',
                    userAvatar: data.photoURL || post.userAvatar || `https://ui-avatars.com/api/?name=${data.displayName || data.email?.split('@')[0] || 'User'}&background=random`,
                    email: data.email || post.userEmail
                });
            } else {
                // Fallback to post data or show User with ID
                setPostAuthorProfile({
                    displayName: post.displayName || post.userEmail?.split('@')[0] || post.userEmail || `User ${post.userId?.substring(0, 8)}`,
                    userAvatar: post.userAvatar || `https://ui-avatars.com/api/?name=${post.displayName || 'User'}&background=random`,
                    email: post.userEmail || ''
                });
            }
        }, (error) => {
            console.error('Error loading post author:', error);
            // Error fallback
            setPostAuthorProfile({
                displayName: post.displayName || post.userEmail?.split('@')[0] || post.userEmail || `User ${post.userId?.substring(0, 8)}`,
                userAvatar: post.userAvatar || `https://ui-avatars.com/api/?name=${post.displayName || 'User'}&background=random`,
                email: post.userEmail || ''
            });
        });

        return () => unsubscribe();
    }, [postUserId, post.displayName, post.userAvatar, post.userEmail, post.author]);

    // Check if user already liked and load comments
    useEffect(() => {
        if (user && post.id) {
            // Check if user liked this post
            setLiked(likes.includes(user.uid));

            // Load comments for this post
            const commentsRef = collection(db, 'posts', post.id, 'comments');
            const q = query(commentsRef, orderBy('createdAt', 'asc'));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const commentsData = [];
                snapshot.forEach((doc) => {
                    commentsData.push({ id: doc.id, ...doc.data() });
                });
                setComments(commentsData);
            });

            return () => unsubscribe();
        }
    }, [post.id, user, likes]);

    const handleLike = async () => {
        if (!user || !post.id) return;

        const postRef = doc(db, 'posts', post.id);
        
        try {
            if (liked) {
                // Unlike
                await updateDoc(postRef, {
                    likes: arrayRemove(user.uid)
                });
                setLikes(prev => prev.filter(uid => uid !== user.uid));
                setLiked(false);
            } else {
                // Like
                await updateDoc(postRef, {
                    likes: arrayUnion(user.uid)
                });
                setLikes(prev => [...prev, user.uid]);
                setLiked(true);

                // Create notification
                if (postUserId && postUserId !== user.uid) {
                    await addDoc(collection(db, 'notifications'), {
                        type: 'like',
                        fromUserId: user.uid,
                        fromUserName: user.displayName || user.email?.split('@')[0] || 'User',
                        fromUserAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`,
                        toUserId: postUserId,
                        postId: post.id,
                        postImage: post.imageUrl || null,
                        createdAt: serverTimestamp(),
                        read: false
                    });
                }
            }
        } catch (error) {
            console.error('Error updating like:', error);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim() || !user || !post.id) return;

        try {
            const displayName = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || user.email || 'User';
            const userAvatar = userProfile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

            const commentsRef = collection(db, 'posts', post.id, 'comments');
            await addDoc(commentsRef, {
                text: comment,
                userId: user.uid,
                userEmail: user.email,
                displayName: displayName,
                userAvatar: userAvatar,
                createdAt: serverTimestamp()
            });

            // Create notification
            if (postUserId && postUserId !== user.uid) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'comment',
                    fromUserId: user.uid,
                    fromUserName: displayName,
                    fromUserAvatar: userAvatar,
                    toUserId: postUserId,
                    postId: post.id,
                    postImage: post.imageUrl || null,
                    commentText: comment,
                    createdAt: serverTimestamp(),
                    read: false
                });
            }

            setComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return 'just now';
        const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return `${Math.floor(seconds / 604800)}w`;
    };

    const handleEditPost = async () => {
        if (!editedText.trim() || !post.id) return;

        try {
            const postRef = doc(db, 'posts', post.id);
            await updateDoc(postRef, {
                text: editedText
            });
            setIsEditing(false);
            setShowMenu(false);
        } catch (error) {
            console.error('Error editing post:', error);
            alert('Error editing post: ' + error.message);
        }
    };

    const handleDeletePost = async () => {
        if (!post.id || !user) return;
        
        // Check if user is the owner
        if (postUserId !== user.uid) {
            alert('You can only delete your own posts');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const postRef = doc(db, 'posts', post.id);
            await deleteDoc(postRef);
            setShowMenu(false);
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Error deleting post: ' + error.message);
        }
    };

    return (
        <article className="feed-post">
            {/* Header */}
            <header className="post-header">
                <div className="post-author" onClick={() => postUserId && navigate(`/profile/${postUserId}`)} style={{ cursor: postUserId ? 'pointer' : 'default' }}>
                    <img 
                        src={postAuthorProfile?.userAvatar || post.userAvatar || `https://ui-avatars.com/api/?name=${post.displayName || 'User'}&background=random`} 
                        alt={postAuthorProfile?.displayName || post.displayName} 
                        className="author-avatar"
                    />
                    <div className="author-info">
                        <span className="author-name">{postAuthorProfile?.displayName || post.displayName || post.userEmail || 'User'}</span>
                        <span className="post-location">{post.location || ''}</span>
                    </div>
                </div>
                <button className="post-options" onClick={() => setShowMenu(!showMenu)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="12" cy="5" r="1"></circle>
                        <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                </button>
                
                {/* Post Menu */}
                {showMenu && postUserId === user?.uid && (
                    <div className="post-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="menu-item" onClick={() => setIsEditing(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                        </button>
                        <button className="menu-item danger" onClick={handleDeletePost}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Delete
                        </button>
                    </div>
                )}
            </header>

            {/* Post Image/Content */}
            <div className="post-content">
                {isEditing ? (
                    <div className="edit-post">
                        <textarea 
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="edit-textarea"
                        />
                        <div className="edit-actions">
                            <button onClick={handleEditPost} className="btn-save">Save</button>
                            <button onClick={() => setIsEditing(false)} className="btn-cancel">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {post.imageUrl ? (
                            <img src={post.imageUrl} alt="Post" className="post-image" />
                        ) : post.text ? (
                            <div className="post-text-content">
                                <p>{post.text}</p>
                            </div>
                        ) : null}
                    </>
                )}
            </div>

            {/* Actions */}
            <div className="post-actions">
                <div className="actions-left">
                    <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                        {liked ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="red" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        )}
                    </button>
                    <button className="action-btn" onClick={() => setShowComments(!showComments)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                    </button>
                    <button className="action-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
                <button className={`action-btn ${saved ? 'saved' : ''}`} onClick={() => setSaved(!saved)}>
                    {saved ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    )}
                </button>
            </div>

            {/* Likes */}
            <div className="post-likes">
                <strong>{Array.isArray(likes) ? likes.length : 0} likes</strong>
            </div>

            {/* Caption */}
            {post.text && (
                <div className="post-caption">
                    <strong 
                        onClick={() => postUserId && navigate(`/profile/${postUserId}`)} 
                        style={{ cursor: postUserId ? 'pointer' : 'default' }}
                    >
                        {postAuthorProfile?.displayName || post.displayName || post.userEmail || 'User'}
                    </strong> {post.text}
                </div>
            )}

            {/* View all comments */}
            {comments.length > 0 && !showComments && (
                <button className="view-comments" onClick={() => setShowComments(true)}>
                    View all {comments.length} comments
                </button>
            )}

            {/* Comments */}
            {showComments && comments.length > 0 && (
                <div className="comments-section">
                    {comments.map((commentData) => (
                        <div key={commentData.id} className="comment">
                            <img 
                                src={commentData.userAvatar || `https://ui-avatars.com/api/?name=${commentData.displayName || commentData.userEmail || 'User'}&background=random`}
                                alt={commentData.displayName || commentData.userEmail}
                                className="comment-avatar"
                            />
                            <div className="comment-content">
                                <strong>{commentData.displayName || commentData.userEmail || 'User'}</strong> {commentData.text}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Timestamp */}
            <div className="post-timestamp">
                {formatTimeAgo(post.createdAt)}
            </div>

            {/* Comment Input */}
            <form className="comment-form" onSubmit={handleComment}>
                <input
                    type="text"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="comment-input"
                />
                {comment.trim() && (
                    <button type="submit" className="post-comment-btn">
                        Post
                    </button>
                )}
            </form>
        </article>
    );
}

export default FeedPost;
