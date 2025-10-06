import { useState } from 'react'
import './App.css'
import Home from './components/Home'
import Login from './components/Login'
import Profile from './components/Profile'
import Register from './components/Register'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from './auth/ProtectedRoute'


function App() {
  const [count, setCount] = useState(0)

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
        {/* <Route path="/" element={<Profile />} /> */}
        <Route path="login" element={<Login />} />
        {/* <Route path="profile" element={<Profile />} /> */}
        <Route path="register" element={<Register />} />
        <Route path="home" element={<Home />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
