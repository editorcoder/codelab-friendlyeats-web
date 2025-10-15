/*
editorcoder
2025-10-14
SRJC CS55.13 Fall 2025
Week 7: Assignment 8: Draft Data-Driven Full-Stack App  
Header.jsx
*/

// Mark this component as a client component for Next.js
"use client";
// Import React and useEffect hook for component lifecycle management
import React, { useEffect } from "react";
// Import Link component from Next.js for client-side navigation
import Link from "next/link";
// Import authentication functions from Firebase auth module
import {
  signInWithGoogle,
  signOut,
  onIdTokenChanged,
} from "@/src/lib/firebase/auth.js";
// Import function to add fake restaurants and reviews for testing
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";
// Import cookie management functions for session handling
import { setCookie, deleteCookie } from "cookies-next";

// Custom hook to manage user session state and authentication changes
function useUserSession(initialUser) {
  // Set up effect to listen for authentication state changes
  useEffect(() => {
    // Return the unsubscribe function from onIdTokenChanged
    return onIdTokenChanged(async (user) => {
      // If user is authenticated, get their ID token and set it as a cookie
      if (user) {
        // Get the user's ID token from Firebase
        const idToken = await user.getIdToken();
        // Set the ID token as a session cookie
        await setCookie("__session", idToken);
      } else {
        // If user is not authenticated, delete the session cookie
        await deleteCookie("__session");
      }
      // If the user hasn't changed, don't reload the page
      if (initialUser?.uid === user?.uid) {
        return;
      }
      // Reload the page to reflect authentication state changes
      window.location.reload();
    });
  }, [initialUser]); // Depend on initialUser to re-run effect when it changes

  // Return the initial user value
  return initialUser;
}

// Define the Header component as the default export
export default function Header({ initialUser }) {
  // Use the custom hook to manage user session state
  const user = useUserSession(initialUser);

  // Event handler for sign out action
  const handleSignOut = (event) => {
    // Prevent the default link behavior
    event.preventDefault();
    // Call the signOut function from Firebase auth
    signOut();
  };

  // Event handler for sign in action
  const handleSignIn = (event) => {
    // Prevent the default link behavior
    event.preventDefault();
    // Call the signInWithGoogle function from Firebase auth
    signInWithGoogle();
  };

  return (
    <header>
      <Link href="/" className="logo">
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        Friendly Eats
      </Link>
      {user ? (
        <>
          <div className="profile">
            <p>
              <img
                className="profileImage"
                src={user.photoURL || "/profile.svg"}
                alt={user.email}
              />
              {user.displayName}
            </p>

            <div className="menu">
              ...
              <ul>
                <li>{user.displayName}</li>

                <li>
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                <li>
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="profile">
          <a href="#" onClick={handleSignIn}>
            <img src="/profile.svg" alt="A placeholder user image" />
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  );
}
