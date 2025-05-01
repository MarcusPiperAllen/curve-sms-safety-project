document.addEventListener("DOMContentLoaded", function () {
    showSection("dashboard");
    loadSubscribers();
    loadAlerts();
  
    const filterInput = document.getElementById("filter");
    if (filterInput) {
      filterInput.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll("#subscriberList tr").forEach((row) => {
          row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }
  });
  
  function showSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
      console.warn(`Section "${sectionId}" not found.`);
      return;
    }
    document.querySelectorAll("main section").forEach((sec) =>
      sec.classList.add("hidden")
    );
    section.classList.remove("hidden");
  }
  
  async function loadSubscribers() {
    try {
      const response = await fetch("https://YOUR_NGROK_URL_HERE.ngrok.io/subscribers");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to retrieve subscriber list.`);
      }
  
      const subscribers = await response.json();
  
      if (!Array.isArray(subscribers)) {
        console.warn("Invalid subscriber data received.");
        return;
      }
  
      const tbody = document.getElementById("subscriberList");
      tbody.innerHTML = "";
      subscribers.forEach((sub) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${sub.name}</td>
          <td>${sub.phone}</td>
          <td>${sub.date}</td>
          <td>${sub.status}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Failed to load subscribers:", err);
    }
  }
  
  async function loadAlerts() {
    try {
      const response = await fetch("https://YOUR_NGROK_URL_HERE.ngrok.io/alerts");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to retrieve alerts.`);
      }
  
      const alerts = await response.json();
      if (!Array.isArray(alerts)) {
        console.warn("Invalid alerts data received.");
        return;
      }
  
      const tbody = document.getElementById("alertList");
      tbody.innerHTML = "";
      alerts.forEach((alert) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${alert.message}</td>
          <td>${alert.timestamp}</td>
          <td>${alert.sent}</td>
          <td>${alert.delivered}</td>
          <td>${alert.failed}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  }
  
  function refreshSubscribers() {
    loadSubscribers();
  }
  
  function exportSubscribers() {
    const rows = Array.from(document.querySelectorAll("#subscriberList tr")).map((r) =>
      Array.from(r.children)
        .map((td) => `"${td.textContent}"`)
        .join(",")
    );
    const csv = ["Name,Phone,Date Opted-In,Status", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function showNewAlertModal() {
    document.getElementById("newAlertModal").classList.remove("hidden");
  }
  
  function closeModal() {
    document.getElementById("newAlertModal").classList.add("hidden");
  }
  
  async function sendAlert() {
    const message = document.getElementById("alertMessage").value.trim();
  
    if (!message) {
      alert("Message cannot be empty.");
      return;
    }
  
    if (message.length > 250) {
      alert("Message too long. Keep it under 250 characters.");
      return;
    }
  
    try {
      const response = await fetch("https://YOUR_NGROK_URL_HERE.ngrok.io/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "YOUR_API_KEY_HERE",
        },
        body: JSON.stringify({ message }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || "Unknown error"}`);
      }
  
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
  
  async function scheduleAlert() {
    const message = document.getElementById("alertMessage").value.trim();
    const time = document.getElementById("scheduleTime").value;
  
    if (!message || !time) {
      alert("Both message and schedule time are required.");
      return;
    }
  
    if (message.length > 250) {
      alert("Message too long. Keep it under 250 characters.");
      return;
    }
  
    try {
      const response = await fetch("https://YOUR_NGROK_URL_HERE.ngrok.io/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "YOUR_API_KEY_HERE",
        },
        body: JSON.stringify({ message, scheduleTime: time }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${result.error || "Unknown error"}`);
      }
  
      if (result.success) {
        alert("📅 Alert successfully scheduled.");
        closeModal();
      } else {
        alert(`⚠️ Schedule error: ${result.error}`);
      }
    } catch (err) {
      console.error("Scheduling failed:", err);
      alert("❌ Could not schedule alert. Check console for details.");
    }
  }
  