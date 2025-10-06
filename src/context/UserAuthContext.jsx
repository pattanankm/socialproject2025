import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "firebase/auth"

import { auth } from '../firebase'

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

        const unsubscrube = onAuthStateChanged(auth, (currentuser) =>{
            console.log("Auth", currentuser);
            setUser(currentuser);
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