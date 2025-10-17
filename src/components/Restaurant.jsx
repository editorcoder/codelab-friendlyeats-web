/*
editorcoder
2025-10-16
SRJC CS55.13 Fall 2025
Week 8: Assignment 9: Beta Data-Driven Full-Stack App  
Restaurant.jsx
*/

"use client"; // Mark this component as a Client Component

// This components shows one individual restaurant
// It receives data from src/app/restaurant/[id]/page.jsx

import { React, useState, useEffect, Suspense } from "react"; // Import React and hooks
import dynamic from "next/dynamic"; // Import Next.js dynamic import utility
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js"; // Import Firestore listener util
import { useUser } from "@/src/lib/getUser"; // Import custom hook to get user
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx"; // Import details component
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js"; // Import storage updater

const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx")); // Lazy-load dialog component

export default function Restaurant({
  id,
  initialRestaurant,
  initialUserId,
  children,
}) {
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant); // State for current restaurant
  const [isOpen, setIsOpen] = useState(false); // Controls review dialog visibility

  // The only reason this component needs to know the user ID is to associate a review with the user, and to know whether to show the review dialog
  const userId = useUser()?.uid || initialUserId; // Use live user ID or initial fallback
  const [review, setReview] = useState({ // Local review being composed
    rating: 0, // Default rating
    text: "", // Default text
  });

  const onChange = (value, name) => { // Generic handler to update review fields
    setReview({ ...review, [name]: value }); // Merge changed field into state
  };

  async function handleRestaurantImage(target) { // Handle image input change/upload
    const image = target.files ? target.files[0] : null; // Get first selected file
    if (!image) { // If no file selected
      return; // Exit early
    }

    const imageURL = await updateRestaurantImage(id, image); // Upload and get URL
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL }); // Update UI with new photo
  }

  const handleClose = () => { // Close the dialog and reset draft review
    setIsOpen(false); // Hide dialog
    setReview({ rating: 0, text: "" }); // Reset local review state
  };

  useEffect(() => { // Subscribe to live updates for this restaurant
    return getRestaurantSnapshotById(id, (data) => { // Listen and return unsubscribe
      setRestaurantDetails(data); // Update state when snapshot changes
    });
  }, [id]); // Re-subscribe when ID changes

  return (
    <>
      <RestaurantDetails
        restaurant={restaurantDetails}
        userId={userId}
        handleRestaurantImage={handleRestaurantImage}
        setIsOpen={setIsOpen}
        isOpen={isOpen}
      >
        {children}
      </RestaurantDetails>
      {userId && (
        <Suspense fallback={<p>Loading...</p>}>
          <ReviewDialog
            isOpen={isOpen}
            handleClose={handleClose}
            review={review}
            onChange={onChange}
            userId={userId}
            id={id}
          />
        </Suspense>
      )}
    </>
  );
}
