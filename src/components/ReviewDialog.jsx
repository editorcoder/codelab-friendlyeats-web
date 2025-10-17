/*
editorcoder
2025-10-16
SRJC CS55.13 Fall 2025
Week 8: Assignment 9: Beta Data-Driven Full-Stack App  
ReviewDialog.jsx
*/

"use client"; // Mark this component to run on the client

// This components handles the review dialog and uses a next.js feature known as Server Actions to handle the form submission

import { useEffect, useLayoutEffect, useRef } from "react"; // Import React hooks used by this component
import RatingPicker from "@/src/components/RatingPicker.jsx"; // Import rating selector component
import { handleReviewFormSubmission } from "@/src/app/actions.js"; // Import server action to handle form submission

const ReviewDialog = ({
  // Define the review dialog component
  isOpen, // Whether the dialog is open
  handleClose, // Function to close the dialog
  review, // Current review data
  onChange, // Setter for review changes
  userId, // Current user ID
  id, // Restaurant ID
}) => {
  const dialog = useRef(); // Ref to the <dialog> element

  // dialogs only render their backdrop when called with `showModal`
  useLayoutEffect(() => {
    // Open/close the native dialog when state changes
    if (isOpen) {
      // If open flag is true
      dialog.current.showModal(); // Show the modal with backdrop
    } else {
      // Otherwise
      dialog.current.close(); // Ensure dialog is closed
    }
  }, [isOpen, dialog]); // Re-run when open state or ref changes

  const handleClick = (e) => {
    // Handle outside-click to close dialog
    // close if clicked outside the modal
    if (e.target === dialog.current) {
      // Clicked on the backdrop area
      handleClose(); // Close the dialog
    }
  };

  return (
    <dialog ref={dialog} onMouseDown={handleClick}>
      <form
        action={handleReviewFormSubmission} // Use server action to process submit
        onSubmit={() => {
          // When form submits
          handleClose(); // Close dialog immediately
        }}
      >
        <header>
          <h3>Add your review</h3>
        </header>
        <article>
          <RatingPicker />

          <p>
            <input
              type="text"
              name="text"
              id="review"
              placeholder="Write your thoughts here"
              required
              value={review.text}
              onChange={(e) => onChange(e.target.value, "text")}
            />
          </p>

          <input type="hidden" name="restaurantId" value={id} />
          <input type="hidden" name="userId" value={userId} />
        </article>
        <footer>
          <menu>
            <button
              autoFocus
              type="reset"
              onClick={handleClose}
              className="button--cancel"
            >
              Cancel
            </button>
            <button type="submit" value="confirm" className="button--confirm">
              Submit
            </button>
          </menu>
        </footer>
      </form>
    </dialog>
  );
};

export default ReviewDialog; // Export component as default
