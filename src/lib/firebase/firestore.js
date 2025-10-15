/*
editorcoder
2025-10-14
SRJC CS55.13 Fall 2025
Week 7: Assignment 8: Draft Data-Driven Full-Stack App  
firestore.js
*/

// Import function to generate fake restaurant and review data for testing
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js";

// Import Firestore functions for database operations
import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  runTransaction,
  where,
  addDoc,
  getFirestore,
} from "firebase/firestore";

// Import the Firestore database instance from the client app configuration
import { db } from "@/src/lib/firebase/clientApp";

// Export an async function to update a restaurant's image reference
export async function updateRestaurantImageReference(
  restaurantId,
  publicImageUrl
) {
  // Create a document reference for the specific restaurant
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId);
  // Check if the restaurant reference exists
  if (restaurantRef) {
    // Update the restaurant document with the new photo URL
    await updateDoc(restaurantRef, { photo: publicImageUrl });
  }
}

// Define an async function to update restaurant rating (currently not implemented)
const updateWithRating = async (
  transaction,
  docRef,
  newRatingDocument,
  review
) => {
  // Function body is empty - returns undefined
  return;
};

// Export an async function to add a review to a restaurant (currently not implemented)
export async function addReviewToRestaurant(db, restaurantId, review) {
  // Function body is empty - returns undefined
  return;
}

// Define a function to apply query filters to a Firestore query
function applyQueryFilters(q, { category, city, price, sort }) {
  // Add category filter if specified
  if (category) {
    // Add where clause to filter by category
    q = query(q, where("category", "==", category));
  }
  // Add city filter if specified
  if (city) {
    // Add where clause to filter by city
    q = query(q, where("city", "==", city));
  }
  // Add price filter if specified
  if (price) {
    // Add where clause to filter by price (using price string length)
    q = query(q, where("price", "==", price.length));
  }
  // Add sorting based on sort parameter
  if (sort === "Rating" || !sort) {
    // Sort by average rating in descending order (default)
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") {
    // Sort by number of ratings in descending order
    q = query(q, orderBy("numRatings", "desc"));
  }
  // Return the modified query
  return q;
}

// Export an async function to get restaurants from Firestore
export async function getRestaurants(db = db, filters = {}) {
  // Create a base query for the restaurants collection
  let q = query(collection(db, "restaurants"));

  // Apply any specified filters to the query
  q = applyQueryFilters(q, filters);
  // Execute the query and get the results
  const results = await getDocs(q);
  // Map the results to an array of restaurant objects
  return results.docs.map((doc) => {
    return {
      // Include the document ID
      id: doc.id,
      // Spread all document data
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      // Convert Firestore timestamp to JavaScript Date object
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// Export a function to get restaurants with real-time updates via snapshot
export function getRestaurantsSnapshot(cb, filters = {}) {
  // Validate that the callback is a function
  if (typeof cb !== "function") {
    // Log error and return early if callback is not a function
    console.log("Error: The callback parameter is not a function");
    return;
  }

  // Create a base query for the restaurants collection
  let q = query(collection(db, "restaurants"));
  // Apply any specified filters to the query
  q = applyQueryFilters(q, filters);

  // Set up a real-time listener that returns an unsubscribe function
  return onSnapshot(q, (querySnapshot) => {
    // Map the snapshot results to an array of restaurant objects
    const results = querySnapshot.docs.map((doc) => {
      return {
        // Include the document ID
        id: doc.id,
        // Spread all document data
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        // Convert Firestore timestamp to JavaScript Date object
        timestamp: doc.data().timestamp.toDate(),
      };
    });

    // Call the provided callback with the results
    cb(results);
  });
}


// Export an async function to get a single restaurant by its ID
export async function getRestaurantById(db, restaurantId) {
  // Validate that restaurantId is provided
  if (!restaurantId) {
    // Log error and return early if no ID is provided
    console.log("Error: Invalid ID received: ", restaurantId);
    return;
  }
  // Create a document reference for the specific restaurant
  const docRef = doc(db, "restaurants", restaurantId);
  // Get the document snapshot
  const docSnap = await getDoc(docRef);
  // Return the restaurant data with converted timestamp
  return {
    // Spread all document data
    ...docSnap.data(),
    // Convert Firestore timestamp to JavaScript Date object
    timestamp: docSnap.data().timestamp.toDate(),
  };
}

// Export a function to get a restaurant snapshot by ID (currently not implemented)
export function getRestaurantSnapshotById(restaurantId, cb) {
  // Function body is empty - returns undefined
  return;
}

// Export an async function to get reviews for a specific restaurant
export async function getReviewsByRestaurantId(db, restaurantId) {
  // Validate that restaurantId is provided
  if (!restaurantId) {
    // Log error and return early if no restaurant ID is provided
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // Create a query for the ratings subcollection, ordered by timestamp descending
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );

  // Execute the query and get the results
  const results = await getDocs(q);
  // Map the results to an array of review objects
  return results.docs.map((doc) => {
    return {
      // Include the document ID
      id: doc.id,
      // Spread all document data
      ...doc.data(),
      // Only plain objects can be passed to Client Components from Server Components
      // Convert Firestore timestamp to JavaScript Date object
      timestamp: doc.data().timestamp.toDate(),
    };
  });
}

// Export a function to get reviews for a restaurant with real-time updates via snapshot
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) {
  // Validate that restaurantId is provided
  if (!restaurantId) {
    // Log error and return early if no restaurant ID is provided
    console.log("Error: Invalid restaurantId received: ", restaurantId);
    return;
  }

  // Create a query for the ratings subcollection, ordered by timestamp descending
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"),
    orderBy("timestamp", "desc")
  );
  // Set up a real-time listener that returns an unsubscribe function
  return onSnapshot(q, (querySnapshot) => {
    // Map the snapshot results to an array of review objects
    const results = querySnapshot.docs.map((doc) => {
      return {
        // Include the document ID
        id: doc.id,
        // Spread all document data
        ...doc.data(),
        // Only plain objects can be passed to Client Components from Server Components
        // Convert Firestore timestamp to JavaScript Date object
        timestamp: doc.data().timestamp.toDate(),
      };
    });
    // Call the provided callback with the results
    cb(results);
  });
}

// Export an async function to add fake restaurants and reviews for testing
export async function addFakeRestaurantsAndReviews() {
  // Generate fake restaurant and review data
  const data = await generateFakeRestaurantsAndReviews();
  // Iterate through each restaurant and its ratings
  for (const { restaurantData, ratingsData } of data) {
    // Wrap database operations in try-catch for error handling
    try {
      // Add the restaurant document to the restaurants collection
      const docRef = await addDoc(
        collection(db, "restaurants"),
        restaurantData
      );

      // Add each rating to the restaurant's ratings subcollection
      for (const ratingData of ratingsData) {
        // Add rating document to the ratings subcollection
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"),
          ratingData
        );
      }
    } catch (e) {
      // Log error messages if document addition fails
      console.log("There was an error adding the document");
      console.error("Error adding document: ", e);
    }
  }
}
