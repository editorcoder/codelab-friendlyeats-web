/*
editorcoder
2025-10-14
SRJC CS55.13 Fall 2025
Week 7: Assignment 8: Draft Data-Driven Full-Stack App  
serverApp.js
*/

// Import server-only module to ensure this code only runs on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

// Import cookies function from Next.js headers for accessing request cookies
import { cookies } from "next/headers";
// Import Firebase app initialization functions
import { initializeServerApp, initializeApp } from "firebase/app";

// Import getAuth function from Firebase Auth
import { getAuth } from "firebase/auth";

// Returns an authenticated client SDK instance for use in Server Side Rendering and Static Site Generation
export async function getAuthenticatedAppForUser() {
  // Get the authentication ID token from the session cookie
  const authIdToken = (await cookies()).get("__session")?.value;

  // Firebase Server App is a new feature in the JS SDK that allows you to instantiate the SDK with credentials retrieved from the client & has other affordances for use in server environments.
  // Initialize the Firebase server app with the ID token
  const firebaseServerApp = initializeServerApp(
    // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
    // Initialize a base Firebase app first
    initializeApp(),
    {
      // Pass the authentication ID token to the server app
      authIdToken,
    }
  );

  // Get the authentication instance from the server app
  const auth = getAuth(firebaseServerApp);
  // Wait for the authentication state to be ready
  await auth.authStateReady();

  // Return both the server app instance and the current user
  return { firebaseServerApp, currentUser: auth.currentUser };
}
