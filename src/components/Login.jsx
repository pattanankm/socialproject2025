import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Alert, Button } from 'react-bootstrap'
import { useUserAuth } from '../context/UserAuthContext'
import './Login.css'


function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { logIn } = useUserAuth();

  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await logIn(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-box">
          <h2>BOBA Login</h2>
          {error && <Alert variant='danger'>{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className='mb-3' controlId='formBasicEmail'>
              <Form.Control
                type='email'
                placeholder='Email address'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
          </Form.Group>
          <Form.Group className='mb-3' controlId='formBasicPassword'>
              <Form.Control
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
          </Form.Group>
            <div className="d-grid gap-2">
              <Button variant='primary' type='submit'>Sign In</Button>
            </div>
            </Form>
            <div className="p-4 box mt-3 text-center">
              Don't have an account? <Link to="/register">Sign up</Link>
            </div>
          </div>
    </div>
  )
}

export default Login