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

<<<<<<< HEAD
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src="/logoBoba.jpeg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>polliessssssss</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
=======
  return <AppContent />
>>>>>>> prem
}

export default App
