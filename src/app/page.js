/*
editorcoder
2025-10-14
SRJC CS55.13 Fall 2025
Week 7: Assignment 8: Draft Data-Driven Full-Stack App  
page.js
*/

// Import the RestaurantListings component for displaying restaurant data
import RestaurantListings from "@/src/components/RestaurantListings.jsx";
// Import the getRestaurants function to fetch restaurant data from Firestore
import { getRestaurants } from "@/src/lib/firebase/firestore.js";
// Import the getAuthenticatedAppForUser function to get authenticated Firebase app
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";
// Import getFirestore from Firebase to get Firestore instance
import { getFirestore } from "firebase/firestore";

// Export dynamic configuration to force server-side rendering
// Without this line, during the build process, next.js will treat this route as static and build a static HTML file for it
export const dynamic = "force-dynamic";

// This line also forces this route to be server-side rendered:
// export const revalidate = 0;
// When enabled Next.js treats the page as static but never cached, regenerating it on every request

// Define the default Home component as an async function that receives props
export default async function Home(props) {
  // Extract search parameters from the props object
  const searchParams = await props.searchParams;
  // Using seachParams which Next.js provides, allows the filtering to happen on the server-side, for example:
  // ?city=London&category=Indian&sort=Review
  // Get the authenticated Firebase server app and current user
  const { firebaseServerApp } = await getAuthenticatedAppForUser();
  // Fetch restaurants from Firestore using the server app and search parameters
  const restaurants = await getRestaurants(
    getFirestore(firebaseServerApp),
    searchParams
  );
  // Return the JSX for the home page with restaurant listings
  return (
    <main className="main__home">
      <RestaurantListings
        initialRestaurants={restaurants}
        searchParams={searchParams}
      />
    </main>
  );
}
