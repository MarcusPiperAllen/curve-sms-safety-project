function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    console.warn(`Section "${sectionId}" not found.`);
    return;
  }

  document.querySelectorAll("main section").forEach(sec => {
    sec.classList.add("hidden");
  });

  section.classList.remove("hidden");
}
async function loadSubscribers() {
  try {
      const response = await fetch("https://132f-2600-4040-2150-ad00-68b4-b4a7-ce5c-9cb.ngrok-free.app/subscribers", {
          method: "GET",
          headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to retrieve subscriber list.`);
      const { subscribers } = await response.json();

      const tbody = document.getElementById("subscriberList");
      tbody.innerHTML = "";
      subscribers.forEach(sub => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${sub.phone}</td><td>${sub.status}</td>`;
          tbody.appendChild(tr);
      });
  } catch (err) {
      console.error("Failed to load subscribers:", err);
  }
}

async function loadAlerts() {
  try {
      const response = await fetch("https://132f-2600-4040-2150-ad00-68b4-b4a7-ce5c-9cb.ngrok-free.app/alerts", {
          method: "GET",
          headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to retrieve alerts.`);
      const { alerts } = await response.json();

      const tbody = document.getElementById("alertList");
      tbody.innerHTML = "";
      alerts.forEach(alert => {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${alert.message}</td><td>${alert.timestamp}</td><td>${alert.sent}</td><td>${alert.delivered}</td><td>${alert.failed}</td>`;
          tbody.appendChild(tr);
      });
  } catch (err) {
      console.error("Failed to load alerts:", err);
  }
}

async function sendAlert() {
  const message = document.getElementById("alertMessage").value.trim();

  if (!message) return alert("Message cannot be empty.");
  if (message.length > 250) return alert("Message too long. Keep it under 250 characters.");

  try {
      const response = await fetch("https://132f-2600-4040-2150-ad00-68b4-b4a7-ce5c-9cb.ngrok-free.app/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${result.error || "Unknown error"}`);

      if (result.success) {
          alert(`✅ Broadcast sent to ${result.totalRecipients} subscribers.`);
          closeModal();
      } else {
          alert(`⚠️ Broadcast error: ${result.error}`);
      }
  } catch (err) {
      console.error("Broadcast failed:", err);
      alert("❌ Could not send broadcast. Check console for details.");
  }
}