import React, { useState, useEffect } from 'react'
import { useUserAuth } from '../context/UserAuthContext'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../firebase'
import { doc, getDoc, collection, query, where, onSnapshot, getDocs, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { FollowButton } from '../hooks/useFollow.jsx'
import './Profile.css'
import Landing from './Landing'

function Profile() {
  const { user, logOut } = useUserAuth()
  const navigate = useNavigate()
  const { userId } = useParams() // Get userId from URL
  
  // All hooks must be called before any return statement
  const [activeTab, setActiveTab] = useState('posts')
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 })
  const [userPosts, setUserPosts] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  
  const profileUserId = userId || user?.uid // Use URL userId or current user
  const isOwnProfile = !userId || userId === user?.uid // Check if viewing own profile

  // Load user stats with real-time updates
  useEffect(() => {
    if (!profileUserId) return;

    const userRef = doc(db, 'users', profileUserId);
    
    const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        setStats(prevStats => ({
          ...prevStats,
          followers: data.followers?.length || 0,
          following: data.following?.length || 0
        }));
      }
    });

    return () => unsubscribeUser();
  }, [profileUserId]);

  // Load user posts with real-time updates
  useEffect(() => {
    if (!profileUserId) return;

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('userId', '==', profileUserId));
    
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const posts = [];
      snapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setUserPosts(posts);
      setStats(prevStats => ({
        ...prevStats,
        posts: posts.length
      }));
    });

    return () => unsubscribePosts();
  }, [profileUserId]);

  // Load user profile from Firestore with real-time updates
  useEffect(() => {
    if (!profileUserId) {
      console.log('No profileUserId');
      return;
    }

    console.log('Loading profile for userId:', profileUserId);

    try {
      const userRef = doc(db, 'users', profileUserId);
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(userRef, 
        (userDoc) => {
          console.log('User document exists:', userDoc.exists(), userDoc.data());
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              displayName: data.displayName || data.email?.split('@')[0] || 'User',
              username: data.email?.split('@')[0] || data.displayName || 'user',
              email: data.email || '',
              bio: data.bio || 'No bio yet',
              website: data.website || '',
              location: data.location || '',
              profileImage: data.photoURL || `https://ui-avatars.com/api/?name=${data.displayName || 'User'}&background=random`
            });
          } else {
            // User document doesn't exist - show placeholder
            console.warn('User document not found for userId:', profileUserId);
            setUserProfile({
              displayName: `User ${profileUserId.substring(0, 8)}`,
              username: profileUserId.substring(0, 8),
              email: '',
              bio: 'This user has not set up their profile yet',
              website: '',
              location: '',
              profileImage: `https://ui-avatars.com/api/?name=User&background=random`
            });
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error loading user profile:', error);
          // Set fallback profile on error
          setUserProfile({
            displayName: 'User',
            username: 'user',
            email: '',
            bio: 'Unable to load profile',
            website: '',
            location: '',
            profileImage: `https://ui-avatars.com/api/?name=User&background=random`
          });
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up profile listener:', error);
      setUserProfile({
        displayName: 'User',
        username: 'user',
        email: '',
        bio: 'Error loading profile',
        website: '',
        location: '',
        profileImage: `https://ui-avatars.com/api/?name=User&background=random`
      });
      setLoading(false);
    }
  }, [profileUserId]);

  // ถ้ายังไม่ได้ login ให้แสดง Landing page (after all hooks)
  if (!user) {
    return <Landing />
  }

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await logOut();
      console.log('Logout successful, navigating to home...');
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      alert('Error logging out: ' + err.message);
    }
  }

  const handleMessage = async () => {
    if (!user || !profileUserId || !userProfile) return;

    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', user.uid)
      );
      
      const snapshot = await getDocs(q);
      let existingConversation = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(profileUserId)) {
          existingConversation = doc.id;
        }
      });

      if (existingConversation) {
        // Navigate to existing conversation
        navigate(`/chat/${existingConversation}`);
      } else {
        // Create new conversation
        const newConvId = `${user.uid}_${profileUserId}`.split('').sort().join('');
        const convRef = doc(db, 'conversations', newConvId);
        
        await setDoc(convRef, {
          participants: [user.uid, profileUserId],
          participantsData: {
            [user.uid]: {
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              photoURL: user.photoURL || null,
              email: user.email
            },
            [profileUserId]: {
              displayName: userProfile.displayName || userProfile.email?.split('@')[0] || 'User',
              photoURL: userProfile.profileImage || null,
              email: userProfile.email
            }
          },
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          lastMessageRead: true,
          createdAt: serverTimestamp()
        });

        navigate(`/chat/${newConvId}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  }

  if (loading || !userProfile) {
    return (
      <div className="profile-container content-with-bottom-nav">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          gap: '16px'
        }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #0095f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#8e8e8e', fontSize: '14px' }}>Loading profile...</p>
          <p style={{ color: '#8e8e8e', fontSize: '12px' }}>UserId: {profileUserId}</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="profile-container content-with-bottom-nav">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-username">
          {!isOwnProfile && (
            <button className="back-btn" onClick={() => navigate(-1)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          <h2>{userProfile.username}</h2>
          {isOwnProfile && (
            <div className="menu-wrapper" style={{ position: 'relative' }}>
              <button 
                className="menu-btn" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Menu button clicked! Current showMenu:', showMenu);
                  setShowMenu(prev => {
                    console.log('Toggling from', prev, 'to', !prev);
                    return !prev;
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <div 
                className="dropdown-menu" 
                style={{ 
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: '0',
                  background: 'white',
                  border: '1px solid #dbdbdb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: '200px',
                  zIndex: 10000,
                  display: showMenu ? 'block' : 'none'
                }}
                onClick={(e) => {
                  console.log('Dropdown menu div clicked');
                  e.stopPropagation();
                }}
              >
                  <button 
                    className="menu-item" 
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => { 
                      console.log('Edit Profile clicked');
                      e.stopPropagation();
                      setShowMenu(false);
                      navigate('/edit-profile'); 
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Edit Profile
                  </button>
                  <button 
                    className="menu-item danger" 
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Log Out button clicked!');
                      setShowMenu(false);
                      await handleLogout();
                    }}
                    type="button"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Log Out
                  </button>
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="profile-info">
        <div className="profile-stats-row">
          <div className="profile-image-container">
            <img src={userProfile.profileImage} alt="Profile" className="profile-image" />
          </div>
          <div className="profile-stats">
            <div className="stat">
              <div className="stat-count">{stats.posts}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="stat">
              <div className="stat-count">{stats.followers}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat">
              <div className="stat-count">{stats.following}</div>
              <div className="stat-label">Following</div>
            </div>
          </div>
        </div>

        <div className="profile-details">
          <div className="profile-name">{userProfile.displayName}</div>
          <div className="profile-bio">
            {userProfile.bio}
            {userProfile.website && (
              <>
                <br />
                <a href={userProfile.website} target="_blank" rel="noopener noreferrer">{userProfile.website}</a>
              </>
            )}
            {userProfile.location && (
              <>
                <br />
                📍 {userProfile.location}
              </>
            )}
          </div>
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <>
              <button className="btn-edit-profile" onClick={() => navigate('/edit-profile')}>Edit Profile</button>
              <button className="btn-share-profile">Share Profile</button>
            </>
          ) : (
            <>
              <FollowButton targetUserId={profileUserId} />
              <button className="btn-share-profile" onClick={handleMessage}>Message</button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </button>
        <button 
          className={`tab ${activeTab === 'tagged' ? 'active' : ''}`}
          onClick={() => setActiveTab('tagged')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </button>
      </div>

      {/* Posts Grid */}
      <div className="posts-grid">
        {activeTab === 'posts' && (
          userPosts.length > 0 ? (
            userPosts.map(post => (
              <div key={post.id} className="post-item">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="Post" />
                ) : (
                  <div className="post-text-thumbnail">
                    <p>{post.text}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-posts">
              <div className="no-posts-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <h3>No Posts Yet</h3>
              <p>When you share photos and videos, they will appear on your profile.</p>
            </div>
          )
        )}
        {activeTab === 'tagged' && (
          <div className="no-posts">
            <div className="no-posts-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <h3>Photos and videos of you</h3>
            <p>When people tag you in photos and videos, they'll appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile