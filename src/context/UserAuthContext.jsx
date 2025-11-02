import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "firebase/auth"

import { auth, db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const userAuthContext =createContext();

export function UserAuthContextProvider({ children }) {

    const [user, setUser] = useState({});

    function logIn(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function signUp(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function logOut() {
        return signOut(auth);
    }

    useEffect(() => {

        const unsubscrube = onAuthStateChanged(auth, async (currentuser) =>{
            console.log("Auth", currentuser);
            setUser(currentuser);
            
            // Check and create user document if doesn't exist
            if (currentuser) {
                try {
                    const userRef = doc(db, 'users', currentuser.uid);
                    const userDoc = await getDoc(userRef);
                    
                    if (!userDoc.exists()) {
                        console.log('Creating user document for:', currentuser.uid);
                        await setDoc(userRef, {
                            email: currentuser.email,
                            displayName: currentuser.displayName || currentuser.email?.split('@')[0] || 'User',
                            photoURL: currentuser.photoURL || `https://ui-avatars.com/api/?name=${currentuser.email?.split('@')[0] || 'User'}&background=random`,
                            bio: '',
                            website: '',
                            location: '',
                            followers: [],
                            following: [],
                            createdAt: serverTimestamp()
                        });
                        console.log('User document created successfully');
                    }
                } catch (error) {
                    console.error('Error checking/creating user document:', error);
                }
            }
        })

        return () => {
            unsubscrube();
        }

    }, [])

  return (
    <userAuthContext.Provider value={{ user, logIn, signUp, logOut }}>
        {children}
    </userAuthContext.Provider>
  )
}

export function useUserAuth() {
    return useContext(userAuthContext);
}
// export default UserAuthContextProvider