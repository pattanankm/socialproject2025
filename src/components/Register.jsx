import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Alert, Button } from 'react-bootstrap'
import { useUserAuth } from '../context/UserAuthContext'
import { db } from '../firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signUp } = useUserAuth();
  
  let navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await signUp(email, password);
      
      // Create user document in Firestore
      if (result && result.user) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email: email,
          displayName: email.split('@')[0],
          createdAt: serverTimestamp(),
          followers: [],
          following: [],
          bio: '',
          photoURL: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=random`
        });
      }
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    }
  };

  return (
    <div>
        <div className="row">
            <div className="col-md-6 mx-auto">
            <h2 className='mb-3'>Register</h2>
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
                <Button variant='primary' type='submit'>Sign Up</Button>
              </div>
              </Form>

              <div className="p-4 box mt-3 text-center">
                Already have an account? <Link to="/login">Log in</Link>
              </div>
            </div>
        </div>
    </div>
  );
}

export default Register;
