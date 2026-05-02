console.log("CurveLink Report Page loaded");

const API_BASE = '';

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
