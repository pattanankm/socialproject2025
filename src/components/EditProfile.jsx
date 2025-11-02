import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import './EditProfile.css';

function EditProfile() {
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        website: '',
        location: ''
    });

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;

            try {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setFormData({
                        displayName: data.displayName || '',
                        bio: data.bio || '',
                        website: data.website || '',
                        location: data.location || ''
                    });
                    // Set the profile photo from Firestore
                    setProfilePhoto(data.photoURL || null);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            const newDisplayName = formData.displayName.trim() || user.email?.split('@')[0] || 'User';
            
            // Update user profile
            await setDoc(userRef, {
                displayName: newDisplayName,
                email: user.email,
                bio: formData.bio.trim(),
                website: formData.website.trim(),
                location: formData.location.trim(),
                photoURL: profilePhoto || user.photoURL || null,
                followers: [],
                following: [],
                createdAt: new Date()
            }, { merge: true });

            // Update user data in all conversations where this user is a participant
            try {
                const conversationsRef = collection(db, 'conversations');
                const q = query(
                    conversationsRef,
                    where('participants', 'array-contains', user.uid)
                );
                
                const snapshot = await getDocs(q);
                snapshot.forEach(async (convDoc) => {
                    const convRef = doc(db, 'conversations', convDoc.id);
                    const participantsData = convDoc.data().participantsData || {};
                    
                    // Update this user's data in the conversation
                    participantsData[user.uid] = {
                        displayName: newDisplayName,
                        photoURL: profilePhoto || user.photoURL || null,
                        email: user.email
                    };
                    
                    await updateDoc(convRef, {
                        participantsData: participantsData
                    });
                });
            } catch (error) {
                console.error('Error updating conversations:', error);
                // Continue even if there's an error updating conversations
            }

            alert('Profile updated successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    const handleProfileImageChange = async (e) => {
        console.log('Profile image change handler called');
        const file = e?.target?.files?.[0];
        console.log('File selected:', file);
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        if (!user) {
            console.log('User not logged in');
            alert('You must be logged in to change your profile picture');
            return;
        }

        try {
            console.log('Starting upload process...');
            setUploadingImage(true);

            // Read the file and convert to base64
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    console.log('File reading completed');
                    const dataUrl = event.target?.result;
                    console.log('Data URL created, length:', dataUrl?.length);
                    
                    if (!dataUrl) {
                        throw new Error('Failed to read image data');
                    }
                    
                    // Check if data URL is too large (Firestore has 1MB document size limit)
                    if (dataUrl.length > 500000) {
                        alert('Image is too large. Please select a smaller image.');
                        setUploadingImage(false);
                        return;
                    }
                    
                    // Update user profile in Firestore with the data URL
                    const userRef = doc(db, 'users', user.uid);
                    console.log('Updating Firestore document for user:', user.uid);
                    
                    await updateDoc(userRef, {
                        photoURL: dataUrl
                    });

                    console.log('Firestore updated successfully');

                    // Update local state
                    setProfilePhoto(dataUrl);

                    console.log('Local state updated');
                    alert('Profile picture updated successfully!');
                    setUploadingImage(false);
                } catch (error) {
                    console.error('Error updating profile picture:', error);
                    console.error('Error code:', error.code);
                    console.error('Error details:', error.message);
                    alert('Failed to update profile picture: ' + error.message);
                    setUploadingImage(false);
                }
            };

            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                alert('Failed to read the image file.');
                setUploadingImage(false);
            };

            console.log('Starting to read file as data URL...');
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error processing profile picture:', error);
            alert('Failed to process profile picture: ' + error.message);
            setUploadingImage(false);
        }
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="edit-profile-container content-with-bottom-nav">
            {/* Header */}
            <div className="edit-profile-header">
                <button className="back-btn" onClick={handleCancel}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <h2 className="header-title">Edit Profile</h2>
                <button 
                    className="save-btn" 
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Done'}
                </button>
            </div>

            {/* Content */}
            <div className="edit-profile-content">
                {/* Profile Photo */}
                <div className="profile-photo-section">
                    <img 
                        src={profilePhoto || user.photoURL || `https://ui-avatars.com/api/?name=${formData.displayName || 'User'}&background=random`}
                        alt="Profile"
                        className="profile-photo"
                        style={{ opacity: uploadingImage ? 0.5 : 1, transition: 'opacity 0.2s' }}
                    />
                    {uploadingImage && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#0095f6',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}>
                            Uploading...
                        </div>
                    )}
                    <label 
                        htmlFor="profileImageInput"
                        className="change-photo-btn"
                        style={{ cursor: 'pointer' }}
                    >
                        Change Photo
                    </label>
                    <input
                        id="profileImageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        disabled={uploadingImage}
                        style={{ display: 'none' }}
                    />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-group">
                        <label htmlFor="displayName">Name</label>
                        <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={formData.displayName}
                            onChange={handleChange}
                            placeholder={user.email?.split('@')[0] || 'Your name'}
                            maxLength={30}
                        />
                        <small className="form-help">
                            Help people discover your account by using the name you're known by.
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Bio</label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Tell us about yourself"
                            maxLength={150}
                            rows={3}
                        />
                        <small className="char-count">{formData.bio.length}/150</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="website">Website</label>
                        <input
                            type="url"
                            id="website"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Your location"
                            maxLength={50}
                        />
                    </div>

                    <div className="form-section">
                        <h3>Account Info</h3>
                        <div className="info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{user.email}</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditProfile;
