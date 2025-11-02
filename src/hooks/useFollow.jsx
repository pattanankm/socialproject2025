import React, { useState, useEffect } from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, addDoc, collection } from 'firebase/firestore';

export const useFollow = () => {
    const { user } = useUserAuth();

    const followUser = async (targetUserId, targetUserName, targetUserAvatar) => {
        if (!user || user.uid === targetUserId) return;

        try {
            const currentUserRef = doc(db, 'users', user.uid);
            const targetUserRef = doc(db, 'users', targetUserId);

            // Check if documents exist first
            const currentUserDoc = await getDoc(currentUserRef);
            const targetUserDoc = await getDoc(targetUserRef);

            // Update current user's following list
            if (currentUserDoc.exists()) {
                await updateDoc(currentUserRef, {
                    following: arrayUnion(targetUserId)
                });
            } else {
                // Create current user document if doesn't exist
                await setDoc(currentUserRef, {
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'User',
                    photoURL: user.photoURL || null,
                    followers: [],
                    following: [targetUserId],
                    bio: '',
                    createdAt: serverTimestamp()
                });
            }

            // Update target user's followers list (only update the followers array, nothing else)
            if (targetUserDoc.exists()) {
                await updateDoc(targetUserRef, {
                    followers: arrayUnion(user.uid)
                });
            } else {
                // Create target user document if doesn't exist (shouldn't happen usually)
                await setDoc(targetUserRef, {
                    displayName: targetUserName || 'User',
                    photoURL: targetUserAvatar || null,
                    followers: [user.uid],
                    following: [],
                    bio: '',
                    createdAt: serverTimestamp()
                });
            }

            // Create notification
            await addDoc(collection(db, 'notifications'), {
                type: 'follow',
                fromUserId: user.uid,
                fromUserName: user.displayName || user.email?.split('@')[0] || 'User',
                fromUserAvatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`,
                toUserId: targetUserId,
                createdAt: serverTimestamp(),
                read: false
            });

            console.log('Successfully followed user:', targetUserId);
            return true;
        } catch (error) {
            console.error('Error following user:', error);
            alert('Error following user: ' + error.message);
            return false;
        }
    };

    const unfollowUser = async (targetUserId) => {
        if (!user || user.uid === targetUserId) return;

        try {
            const currentUserRef = doc(db, 'users', user.uid);
            const targetUserRef = doc(db, 'users', targetUserId);

            // Check if documents exist first
            const currentUserDoc = await getDoc(currentUserRef);
            const targetUserDoc = await getDoc(targetUserRef);

            // Remove from following list only if document exists
            if (currentUserDoc.exists()) {
                await updateDoc(currentUserRef, {
                    following: arrayRemove(targetUserId)
                });
            }

            // Remove from followers list only if document exists
            if (targetUserDoc.exists()) {
                await updateDoc(targetUserRef, {
                    followers: arrayRemove(user.uid)
                });
            }

            console.log('Successfully unfollowed user:', targetUserId);
            return true;
        } catch (error) {
            console.error('Error unfollowing user:', error);
            alert('Error unfollowing user: ' + error.message);
            return false;
        }
    };

    const isFollowing = async (targetUserId) => {
        if (!user) return false;

        try {
            const currentUserRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(currentUserRef);
            
            if (userDoc.exists()) {
                const following = userDoc.data().following || [];
                return following.includes(targetUserId);
            }
            return false;
        } catch (error) {
            console.error('Error checking follow status:', error);
            return false;
        }
    };

    const getUserStats = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                return {
                    followers: data.followers?.length || 0,
                    following: data.following?.length || 0
                };
            }
            return { followers: 0, following: 0 };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return { followers: 0, following: 0 };
        }
    };

    return { followUser, unfollowUser, isFollowing, getUserStats };
};

// FollowButton Component
export function FollowButton({ targetUserId, targetUserName, targetUserAvatar, className = '' }) {
    const { user } = useUserAuth();
    const { followUser, unfollowUser, isFollowing } = useFollow();
    const [following, setFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkFollowStatus = async () => {
            const status = await isFollowing(targetUserId);
            setFollowing(status);
        };

        if (user && targetUserId) {
            checkFollowStatus();
        }
    }, [user, targetUserId, isFollowing]);

    const handleToggleFollow = async () => {
        if (loading || !user) return;

        setLoading(true);
        try {
            if (following) {
                await unfollowUser(targetUserId);
                setFollowing(false);
            } else {
                await followUser(targetUserId, targetUserName, targetUserAvatar);
                setFollowing(true);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        } finally {
            setLoading(false);
        }
    };

    // Don't show button for own profile
    if (!user || user.uid === targetUserId) return null;

    return (
        <button
            onClick={handleToggleFollow}
            disabled={loading}
            className={`follow-btn ${following ? 'following' : ''} ${className}`}
        >
            {loading ? '...' : following ? 'Following' : 'Follow'}
        </button>
    );
}

export default { useFollow, FollowButton };
