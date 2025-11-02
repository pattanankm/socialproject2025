import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './CreatePost.css';

function CreatePost() {
    const { user } = useUserAuth();
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: select, 2: edit, 3: caption
    const [userProfile, setUserProfile] = useState(null);

    // Load user profile from Firestore
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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setStep(2);
        }
    };

    const handleSubmit = async () => {
        if (!caption.trim() && !image) {
            alert('Please add some text or an image');
            return;
        }

        setLoading(true);
        try {
            let imageUrl = null;

            // Upload image to Firebase Storage if exists
            if (image) {
                const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${image.name}`);
                await uploadBytes(storageRef, image);
                imageUrl = await getDownloadURL(storageRef);
            }

            // Get display name from Firestore profile or fallback to email
            const displayName = userProfile?.displayName || user.displayName || user.email?.split('@')[0] || user.email || 'User';
            const userAvatar = userProfile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`;

            // Save post to Firestore
            await addDoc(collection(db, 'posts'), {
                text: caption,
                imageUrl: imageUrl,
                userId: user.uid,
                userEmail: user.email,
                displayName: displayName,
                userAvatar: userAvatar,
                createdAt: serverTimestamp(),
                likes: [],
                location: ''
            });

            // Reset form
            setCaption('');
            setImage(null);
            setImagePreview(null);
            setStep(1);
            alert('Post created successfully!');
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 3 && !image) {
            // If text-only post, go back to step 1
            setStep(1);
            setCaption('');
        } else if (step === 3) {
            setStep(2);
        } else if (step === 2) {
            setStep(1);
            setImage(null);
            setImagePreview(null);
        }
    };

    const handleNext = () => {
        if (step === 2) setStep(3);
    };

    return (
        <div className="create-post-container content-with-bottom-nav">
            {/* Header */}
            <div className="create-post-header">
                {step > 1 && (
                    <button className="back-btn" onClick={handleBack}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                )}
                <h2 className="header-title">
                    {step === 1 && 'Create new post'}
                    {step === 2 && 'Edit'}
                    {step === 3 && 'New post'}
                </h2>
                {step === 2 && (
                    <button className="next-btn" onClick={handleNext}>
                        Next
                    </button>
                )}
                {step === 3 && (
                    <button 
                        className="share-btn" 
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Sharing...' : 'Share'}
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="create-post-content">
                {/* Step 1: Select Image or Write Text */}
                {step === 1 && (
                    <div className="select-image">
                        <div className="upload-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="77" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </div>
                        <h3>Create a new post</h3>
                        <label className="select-btn">
                            Select photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <button 
                            className="text-only-btn" 
                            onClick={() => setStep(3)}
                        >
                            Write text only
                        </button>
                    </div>
                )}

                {/* Step 2: Edit Image */}
                {step === 2 && imagePreview && (
                    <div className="edit-image">
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                    </div>
                )}

                {/* Step 3: Add Caption */}
                {step === 3 && (
                    <div className="add-caption">
                        {imagePreview && (
                            <div className="caption-image">
                                <img src={imagePreview} alt="Preview" />
                            </div>
                        )}
                        <div className="caption-form" style={!imagePreview ? { flex: 1 } : {}}>
                            <div className="user-info">
                                <img 
                                    src={userProfile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${userProfile?.displayName || user.displayName || 'User'}&background=random`}
                                    alt="User"
                                    className="user-avatar"
                                />
                                <span className="username">
                                    {userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'User'}
                                </span>
                            </div>
                            <textarea
                                placeholder={imagePreview ? "Write a caption..." : "What's on your mind?"}
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="caption-textarea"
                                style={!imagePreview ? { minHeight: '200px' } : {}}
                                maxLength={2200}
                            />
                            <div className="caption-counter">
                                {caption.length}/2,200
                            </div>
                            <div className="post-options">
                                <div className="option-item">
                                    <span>Add location</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                </div>
                                <div className="option-item">
                                    <span>Accessibility</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                </div>
                                <div className="option-item">
                                    <span>Advanced settings</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreatePost;
