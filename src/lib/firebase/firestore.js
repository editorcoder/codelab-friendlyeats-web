/*
editorcoder
2025-10-16
SRJC CS55.13 Fall 2025
Week 8: Assignment 9: Beta Data-Driven Full-Stack App  
firestore.js
*/

// Import function to generate fake restaurant and review data for testing
import { generateFakeRestaurantsAndReviews } from "@/src/lib/fakeRestaurants.js"; // Utilities to seed data

// Import Firestore functions for database operations
import { // Firestore SDK imports
  collection, // Obtain a collection reference
  onSnapshot, // Subscribe to realtime updates
  query, // Build Firestore queries
  getDocs, // Fetch query results once
  doc, // Create a document reference
  getDoc, // Fetch a single document once
  updateDoc, // Update fields of a document
  orderBy, // Sort query results by field
  Timestamp, // Server timestamp type
  runTransaction, // Execute atomic transactions
  where, // Add filters to queries
  addDoc, // Add a new document with auto-ID
  getFirestore, // Get Firestore instance (for server contexts)
} from "firebase/firestore";

// Import the Firestore database instance from the client app configuration
import { db } from "@/src/lib/firebase/clientApp"; // Client-side Firestore instance

// Export an async function to update a restaurant's image reference
export async function updateRestaurantImageReference(
  restaurantId, // ID of the restaurant document
  publicImageUrl // Public URL of the uploaded image
) {
  // Create a document reference for the specific restaurant
  const restaurantRef = doc(collection(db, "restaurants"), restaurantId); // Build doc ref
  // Check if the restaurant reference exists
  if (restaurantRef) { // If a valid reference is formed
    // Update the restaurant document with the new photo URL
    await updateDoc(restaurantRef, { photo: publicImageUrl }); // Persist new photo URL
  }
}

// Define an async function to update restaurant rating
const updateWithRating = async (
  transaction, // Firestore transaction instance
  docRef, // Reference to restaurant document
  newRatingDocument, // Reference for new rating doc
  review // Review payload provided by user
) => {
  const restaurant = await transaction.get(docRef); // Read current restaurant doc within transaction
  const data = restaurant.data(); // Obtain current data
  const newNumRatings = data?.numRatings ? data.numRatings + 1 : 1; // Increment rating count
  const newSumRating = (data?.sumRating || 0) + Number(review.rating); // Add to rating sum
  const newAverage = newSumRating / newNumRatings; // Compute new average

  transaction.update(docRef, { // Update aggregate fields on restaurant
    numRatings: newNumRatings, // Total number of ratings
    sumRating: newSumRating, // Sum of all ratings
    avgRating: newAverage, // Average rating
    // per Instructor, add new field for userId of person making review (security check)
    lastReviewUserId: review.userId, // Track last reviewer id
  });

  transaction.set(newRatingDocument, { // Create new rating document entry
    ...review, // Persist review payload
    timestamp: Timestamp.fromDate(new Date()), // Normalize timestamp to Firestore
  });
};

// Export an async function to add a review to a restaurant
export async function addReviewToRestaurant(db, restaurantId, review) { // Add a review atomically and update aggregates
  if (!restaurantId) { // Validate restaurant id
    throw new Error("No restaurant ID has been provided."); // Enforce required argument
  }

  if (!review) { // Validate review payload
    throw new Error("A valid review has not been provided."); // Enforce required payload
  }

  try {
    const docRef = doc(collection(db, "restaurants"), restaurantId); // Restaurant doc ref
    const newRatingDocument = doc(
      collection(db, `restaurants/${restaurantId}/ratings`)
    ); // New rating doc ref inside subcollection

    // corrected line
    await runTransaction(db, (transaction) => // Run transactional update
      updateWithRating(transaction, docRef, newRatingDocument, review) // Apply changes within transaction
    );
  } catch (error) { // Surface and rethrow errors
    console.error(
      "There was an error adding the rating to the restaurant",
      error
    ); // Log for diagnostics
    throw error; // Propagate error to caller
  }
}

// Define a function to apply query filters to a Firestore query
function applyQueryFilters(q, { category, city, price, sort }) { // Enrich a base query with filters and sorting
  // Add category filter if specified
  if (category) { // Filter by category equality
    // Add where clause to filter by category
    q = query(q, where("category", "==", category));
  }
  // Add city filter if specified
  if (city) { // Filter by city equality
    // Add where clause to filter by city
    q = query(q, where("city", "==", city));
  }
  // Add price filter if specified
  if (price) { // Filter by price length (maps "$" to numeric)
    // Add where clause to filter by price (using price string length)
    q = query(q, where("price", "==", price.length));
  }
  // Add sorting based on sort parameter
  if (sort === "Rating" || !sort) { // Default sort by average rating
    // Sort by average rating in descending order (default)
    q = query(q, orderBy("avgRating", "desc"));
  } else if (sort === "Review") { // Alternative sort by number of ratings
    // Sort by number of ratings in descending order
    q = query(q, orderBy("numRatings", "desc"));
  }
  // Return the modified query
  return q; // Return composed query
}

// Export an async function to get restaurants from Firestore
export async function getRestaurants(db = db, filters = {}) { // Fetch restaurants once with optional filters
  // Create a base query for the restaurants collection
  let q = query(collection(db, "restaurants")); // Start with base collection query

  // Apply any specified filters to the query
  q = applyQueryFilters(q, filters); // Apply provided filters
  // Execute the query and get the results
  const results = await getDocs(q); // Execute query
  // Map the results to an array of restaurant objects
  return results.docs.map((doc) => { // Map documents to plain objects
    return {
      // Include the document ID
      id: doc.id, // Document identifier
      // Spread all document data
      ...doc.data(), // All other fields from Firestore
      // Only plain objects can be passed to Client Components from Server Components
      // Convert Firestore timestamp to JavaScript Date object
      timestamp: doc.data().timestamp.toDate(), // Convert Firestore timestamp to Date
    };
  });
}

// Export a function to get restaurants with real-time updates via snapshot
export function getRestaurantsSnapshot(cb, filters = {}) { // Subscribe to restaurants with realtime updates
  // Validate that the callback is a function
  if (typeof cb !== "function") { // Ensure callback is valid
    // Log error and return early if callback is not a function
    console.log("Error: The callback parameter is not a function"); // Warn and abort
    return;
  }

  // Create a base query for the restaurants collection
  let q = query(collection(db, "restaurants")); // Base collection query
  // Apply any specified filters to the query
  q = applyQueryFilters(q, filters); // Apply filters and sort

  // Set up a real-time listener that returns an unsubscribe function
  return onSnapshot(q, (querySnapshot) => { // Start listener and return unsubscribe
    // Map the snapshot results to an array of restaurant objects
    const results = querySnapshot.docs.map((doc) => { // Transform snapshot docs
      return {
        // Include the document ID
        id: doc.id, // Document identifier
        // Spread all document data
        ...doc.data(), // All fields
        // Only plain objects can be passed to Client Components from Server Components
        // Convert Firestore timestamp to JavaScript Date object
        timestamp: doc.data().timestamp.toDate(), // Timestamp normalized to Date
      };
    });

    // Call the provided callback with the results
    cb(results); // Invoke caller callback with mapped results
  });
}

// Export an async function to get a single restaurant by its ID
export async function getRestaurantById(db, restaurantId) { // Fetch a single restaurant by id
  // Validate that restaurantId is provided
  if (!restaurantId) { // Validate input
    // Log error and return early if no ID is provided
    console.log("Error: Invalid ID received: ", restaurantId); // Warn and abort
    return;
  }
  // Create a document reference for the specific restaurant
  const docRef = doc(db, "restaurants", restaurantId); // Document reference
  // Get the document snapshot
  const docSnap = await getDoc(docRef); // Fetch document snapshot
  // Return the restaurant data with converted timestamp
  return {
    // Spread all document data
    ...docSnap.data(), // Spread document fields
    // Convert Firestore timestamp to JavaScript Date object
    timestamp: docSnap.data().timestamp.toDate(), // Normalize timestamp
  };
}

// Export a function to get a restaurant snapshot by ID (currently not implemented)
// Provided by instructor via Week 9 Sharing + Support Discussion
export function getRestaurantSnapshotById(restaurantId, cb) { // Subscribe to a single restaurant by id
  if (!restaurantId) { // Validate input
    console.log("Error: Invalid ID received: ", restaurantId); // Warn and abort
    return; // Exit early
  }

  if (typeof cb !== "function") { // Ensure callback is callable
    console.log("Error: The callback parameter is not a function"); // Warn and abort
    return; // Exit early
  }

  const docRef = doc(db, "restaurants", restaurantId); // Document reference to observe
  return onSnapshot(docRef, (docSnap) => { // Subscribe to realtime updates
    cb({ // Invoke caller with mapped data
      ...docSnap.data(), // Spread fields
      timestamp: docSnap.data().timestamp.toDate(), // Normalize timestamp to Date
    });
  });
}

// Export an async function to get reviews for a specific restaurant
export async function getReviewsByRestaurantId(db, restaurantId) { // Fetch latest reviews for a restaurant
  // Validate that restaurantId is provided
  if (!restaurantId) { // Validate input
    // Log error and return early if no restaurant ID is provided
    console.log("Error: Invalid restaurantId received: ", restaurantId); // Warn and abort
    return;
  }

  // Create a query for the ratings subcollection, ordered by timestamp descending
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"), // Subcollection path
    orderBy("timestamp", "desc") // Newest first
  ); // Build query

  // Execute the query and get the results
  const results = await getDocs(q); // Execute the query
  // Map the results to an array of review objects
  return results.docs.map((doc) => { // Map documents to plain review objects
    return {
      // Include the document ID
      id: doc.id, // Document identifier
      // Spread all document data
      ...doc.data(), // All review fields
      // Only plain objects can be passed to Client Components from Server Components
      // Convert Firestore timestamp to JavaScript Date object
      timestamp: doc.data().timestamp.toDate(), // Normalize timestamp
    };
  });
}

// Export a function to get reviews for a restaurant with real-time updates via snapshot
export function getReviewsSnapshotByRestaurantId(restaurantId, cb) { // Subscribe to live reviews for a restaurant
  // Validate that restaurantId is provided
  if (!restaurantId) { // Validate input
    // Log error and return early if no restaurant ID is provided
    console.log("Error: Invalid restaurantId received: ", restaurantId); // Warn and abort
    return;
  }

  // Create a query for the ratings subcollection, ordered by timestamp descending
  const q = query(
    collection(db, "restaurants", restaurantId, "ratings"), // Subcollection path
    orderBy("timestamp", "desc") // Newest first
  ); // Build query
  // Set up a real-time listener that returns an unsubscribe function
  return onSnapshot(q, (querySnapshot) => { // Start realtime listener
    // Map the snapshot results to an array of review objects
    const results = querySnapshot.docs.map((doc) => { // Transform snapshot docs
      return {
        // Include the document ID
        id: doc.id, // Review id
        // Spread all document data
        ...doc.data(), // Spread review fields
        // Only plain objects can be passed to Client Components from Server Components
        // Convert Firestore timestamp to JavaScript Date object
        timestamp: doc.data().timestamp.toDate(), // Normalize timestamp
      };
    });
    // Call the provided callback with the results
    cb(results); // Deliver results to consumer
  });
}

// Export an async function to add fake restaurants and reviews for testing
export async function addFakeRestaurantsAndReviews() { // Seed database with fake restaurants and ratings
  // Generate fake restaurant and review data
  const data = await generateFakeRestaurantsAndReviews(); // Generate seed payloads
  // Iterate through each restaurant and its ratings
  for (const { restaurantData, ratingsData } of data) { // Iterate restaurants
    // Wrap database operations in try-catch for error handling
    try { // Attempt to add documents for this restaurant
      // Add the restaurant document to the restaurants collection
      const docRef = await addDoc(
        collection(db, "restaurants"), // Restaurants collection
        restaurantData // Restaurant fields
      ); // Create restaurant doc

      // Add each rating to the restaurant's ratings subcollection
      for (const ratingData of ratingsData) { // For each rating payload
        // Add rating document to the ratings subcollection
        await addDoc(
          collection(db, "restaurants", docRef.id, "ratings"), // Ratings subcollection
          ratingData // Rating fields
        ); // Create rating doc
      }
    } catch (e) { // Catch write errors
      // Log error messages if document addition fails
      console.log("There was an error adding the document"); // General message
      console.error("Error adding document: ", e); // Detailed error output
    }
  }
}
