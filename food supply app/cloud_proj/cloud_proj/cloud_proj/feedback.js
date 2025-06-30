// feedback.js
import { db, addDoc, collection } from './firebase.js';

console.log("✅ feedback.js loaded");

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedback-form");
  const status = document.getElementById("status");
  const cropId = new URLSearchParams(window.location.search).get("crop") || "unknown";

  if (!form) {
    console.error("❌ feedback-form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("🚀 Form submitted");

    const name = document.getElementById("name").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !message) {
      status.innerText = "❌ Please fill in all fields.";
      status.style.color = "red";
      return;
    }

    try {
      await addDoc(collection(db, "feedback"), {
        cropId,
        name,
        message,
        timestamp: new Date()
      });

      status.innerText = "✅ Feedback submitted!";
      status.style.color = "green";
      form.reset();
    } catch (err) {
      console.error("❌ Submission failed", err);
      status.innerText = "❌ Submission failed. Try again.";
      status.style.color = "red";
    }
  });
});
