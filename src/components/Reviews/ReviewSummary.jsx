/*
editorcoder
2025-10-16
SRJC CS55.13 Fall 2025
Week 8: Assignment 9: Beta Data-Driven Full-Stack App  
ReviewSummary.jsx
*/

import { gemini20Flash, googleAI } from "@genkit-ai/googleai"; // Import Gemini model and plugin
import { genkit } from "genkit"; // Import Genkit orchestrator
import { getReviewsByRestaurantId } from "@/src/lib/firebase/firestore.js"; // Import data accessor
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp"; // Import server-side auth context
import { getFirestore } from "firebase/firestore"; // Import Firestore admin client

export async function GeminiSummary({ restaurantId }) { // Server component that summarizes reviews
  const { firebaseServerApp } = await getAuthenticatedAppForUser(); // Get authenticated server app
  const reviews = await getReviewsByRestaurantId( // Fetch recent reviews for restaurant
    getFirestore(firebaseServerApp), // Pass Firestore instance bound to server app
    restaurantId // Target restaurant ID
  );

  // prompt text contains any and all reviews in text format
  const reviewSeparator = "@"; // Separator token between reviews in prompt
  const prompt = `
    Based on the following restaurant reviews, 
    where each review is separated by a '${reviewSeparator}' character, 
    create a one-sentence summary of what people think of the restaurant. 

    Here are the reviews: ${reviews.map((review) => review.text).join(reviewSeparator)}
  `;

  try {
    if (!process.env.GEMINI_API_KEY) { // Ensure required API key exists
      // Make sure GEMINI_API_KEY environment variable is set:
      // https://firebase.google.com/docs/genkit/get-started
      throw new Error(
        'GEMINI_API_KEY not set. Set it with "firebase apphosting:secrets:set GEMINI_API_KEY"'
      ); // Provide actionable setup hint
    }

    // Configure a Genkit instance.
    const ai = genkit({ // Initialize Genkit with Google provider
      plugins: [googleAI()], // Register Google AI plugin
      model: gemini20Flash, // set default model
    });

    const { text } = await ai.generate(prompt); // Generate summary text

    // return summary text within 'restaurant__review_summary' container div
    return (
      <div className="restaurant__review_summary">
        <p>{text}</p>
        <p>✨ Summarized with Gemini</p>
      </div>
    );
  } catch (e) { // Handle any errors during generation
    console.error(e); // Log error for debugging
    return <p>Error summarizing reviews.</p>; // Render fallback UI
  }
}

export function GeminiSummarySkeleton() { // Fallback skeleton while loading
  return (
    <div className="restaurant__review_summary">
      <p>✨ Summarizing reviews with Gemini...</p>
    </div>
  );
}
