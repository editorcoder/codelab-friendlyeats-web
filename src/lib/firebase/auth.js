/*
editorcoder
2025-10-14
SRJC CS55.13 Fall 2025
Week 7: Assignment 8: Draft Data-Driven Full-Stack App  
auth.js
*/

// Import Firebase authentication functions and providers
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged as _onAuthStateChanged,
  onIdTokenChanged as _onIdTokenChanged,
} from "firebase/auth";

// Import the Firebase auth instance from the client app configuration
import { auth } from "@/src/lib/firebase/clientApp";

// Export a wrapper function for onAuthStateChanged that uses the configured auth instance
export function onAuthStateChanged(cb) {
  // Call the Firebase onAuthStateChanged function with the auth instance and callback
  return _onAuthStateChanged(auth, cb);
}

// Export a wrapper function for onIdTokenChanged that uses the configured auth instance
export function onIdTokenChanged(cb) {
  // Call the Firebase onIdTokenChanged function with the auth instance and callback
  return _onIdTokenChanged(auth, cb);
}

// Export an async function to handle Google sign-in
export async function signInWithGoogle() {
  // Create a new Google authentication provider instance
  const provider = new GoogleAuthProvider();

  // Attempt to sign in with Google using popup authentication
  try {
    // Call Firebase signInWithPopup with the auth instance and Google provider
    await signInWithPopup(auth, provider);
  } catch (error) {
    // Log any errors that occur during the sign-in process
    console.error("Error signing in with Google", error);
  }
}

// Export an async function to handle user sign-out
export async function signOut() {
  // Attempt to sign out the current user
  try {
    // Call the signOut method on the auth instance and return the result
    return auth.signOut();
  } catch (error) {
    // Log any errors that occur during the sign-out process
    console.error("Error signing out with Google", error);
  }
}
