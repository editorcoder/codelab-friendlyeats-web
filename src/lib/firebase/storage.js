/*
editorcoder
2025-10-16
SRJC CS55.13 Fall 2025
Week 8: Assignment 9: Beta Data-Driven Full-Stack App  
storage.js
*/

import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Import Storage SDK primitives
import { storage } from "@/src/lib/firebase/clientApp"; // Import initialized storage instance
import { updateRestaurantImageReference } from "@/src/lib/firebase/firestore"; // Import Firestore helper to save URL

export async function updateRestaurantImage(restaurantId, image) { // Upload image and save its URL on restaurant
  try { // Guard to handle runtime errors
    if (!restaurantId) { // Validate restaurant id
      throw new Error("No restaurant ID has been provided."); // Enforce required input
    }

    if (!image || !image.name) { // Validate image payload
      throw new Error("A valid image has not been provided."); // Enforce valid file
    }

    const publicImageUrl = await uploadImage(restaurantId, image); // Upload and get public URL
    await updateRestaurantImageReference(restaurantId, publicImageUrl); // Persist URL on Firestore

    return publicImageUrl; // Return URL for caller to update UI
  } catch (error) { // Error path
    console.error("Error processing request:", error); // Log error
  }
}

async function uploadImage(restaurantId, image) { // Upload file to Cloud Storage and return public URL
  const filePath = `images/${restaurantId}/${image.name}`; // Path within bucket
  const newImageRef = ref(storage, filePath); // Create reference to new file
  await uploadBytesResumable(newImageRef, image); // Upload with resumable API

  return await getDownloadURL(newImageRef); // Resolve public download URL
}
