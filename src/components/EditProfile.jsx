import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import './EditProfile.css';

function EditProfile() {
    const { user } = useUserAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
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
            await setDoc(userRef, {
                displayName: formData.displayName.trim() || user.email?.split('@')[0] || 'User',
                email: user.email,
                bio: formData.bio.trim(),
                website: formData.website.trim(),
                location: formData.location.trim(),
                photoURL: user.photoURL || null,
                followers: [],
                following: [],
                createdAt: new Date()
            }, { merge: true });

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
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${formData.displayName || 'User'}&background=random`}
                        alt="Profile"
                        className="profile-photo"
                    />
                    <button className="change-photo-btn">Change Photo</button>
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
