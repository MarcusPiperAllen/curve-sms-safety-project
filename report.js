console.log("CurveLink Report Page loaded");

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'https://f50c3599-a652-4a6d-85e5-b28d4c6b6b42-00-2e9y10qe3rmg8.riker.replit.dev';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reportForm");
  const submitBtn = document.getElementById("submitBtn");
  const statusDiv = document.getElementById("reportStatus");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const phone = document.getElementById("phone").value.trim();
    const issue = document.getElementById("issue").value.trim();
    
    if (!phone || !issue) {
      showMessage("Please fill in all fields.", "error");
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    
    try {
      const response = await fetch(`${API_BASE}/api/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone, issue })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showMessage("Report submitted successfully! Building management has been notified.", "success");
        form.reset();
      } else {
        showMessage(result.message || "Failed to submit report. Please try again.", "error");
      }
    } catch (err) {
      console.error("Report submission error:", err);
      showMessage("Connection error. Please check your internet and try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Report";
    }
  });

  function showMessage(text, type) {
    statusDiv.textContent = text;
    statusDiv.className = `message ${type}`;
  }
});
