import { useState } from 'react'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Profile from './components/Profile'
import Register from './components/Register'
import Search from './components/Search'
import CreatePost from './components/CreatePost'
import Notifications from './components/Notifications'
import EditProfile from './components/EditProfile'
import Messages from './components/Messages'
import Chat from './components/Chat'
import BottomNav from './components/BottomNav'
import FloatingAddButton from './components/FloatingAddButton'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ProtectedRoute from './auth/ProtectedRoute'


function AppContent() {
  const location = useLocation();
  const showFloatingButton = !['/login', '/register', '/add', '/messages'].includes(location.pathname) && !location.pathname.startsWith('/chat');

  return (
    <>
HEAD
      <Routes>
        <Route path="/" element={<Profile />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route 
          path="/search" 
          element={
            <ProtectedRoute>
              <Search />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add" 
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/notifications" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-profile" 
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:userId" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/chat/:conversationId" 
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showFloatingButton && <FloatingAddButton />}
      <BottomNav />
    </>
  );
}

function App() {
  const [count, setCount] = useState(0)

  return <AppContent />
}

export default App
