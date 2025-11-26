/*
@file admin.js
@description Frontend logic for SMS admin panel

PSEUDOCODE:

1. Grab references to UI elements (buttons, input fields)
2. Listen for:
   - Form submissions (e.g., new subscriber)
   - Button clicks (e.g., send alert)
3. When user submits or clicks:
   - Collect form/input data
   - Send data to server using fetch()
   - Display success/error response in UI
4. Display subscriber list or alerts dynamically if needed
5. (Optional) Add loading indicators or disable buttons while sending
*/
// Finds a section by ID and shows it while hiding all others
// If the ID doesn't match any section, logs a warning and exits
console.log("✅ admin.js loaded");

function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    console.warn(`Section "${sectionId}" not found.`);
    return;
  }

  // Hide all sections
  document.querySelectorAll("main section").forEach(sec => {
    sec.classList.add("hidden");
  });

  // ✅ Unhide the selected one
  section.classList.remove("hidden");

  console.log("Trying to show section:", sectionId);

  // Refresh data when switching to these sections
  if (sectionId === "subscribers") loadSubscribers();
  if (sectionId === "alerts") loadAlerts();

  // Log current state of all sections
  console.log("All sections found:");
  document.querySelectorAll("main section").forEach(sec => {
    console.log(sec);
  });
}

/*
  PSEUDOCODE: showNewAlertModal()

  1. Get the modal element for creating a new alert
  2. Remove the "hidden" class to make it visible
*/

function showNewAlertModal() {
  document.getElementById("newAlertModal").classList.remove("hidden");
}

/*
  PSEUDOCODE: closeModal()

  1. Get the modal element
  2. Add the "hidden" class to hide it from the screen
*/

function closeModal() {
  document.getElementById("newAlertModal").classList.add("hidden");
}

// As the admin, I want to know how many subscribers I have at any given time.
// This function gets the subscriber data from the server and prints it inside the table.
// If it can't find any subscribers, it logs an error (right now just in the console).
// It loops through the list and creates rows so I can see phone and status.
async function loadSubscribers() {
  try {
      const response = await fetch("/subscribers");

      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to retrieve subscriber list.`);
      const data = await response.json();
      const subscribers = Array.isArray(data.subscribers) ? data.subscribers : [];

      renderSubscribersTable(subscribers);
  } catch (err) {
      console.error("Failed to load subscribers:", err);
      renderSubscribersTable([]);
  }
}

function renderSubscribersTable(subscribers) {
  const tbody = document.getElementById("subscriberList");
  tbody.innerHTML = "";

  if (subscribers.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="4" style="text-align: center;">No subscribers found</td>`;
      tbody.appendChild(tr);
      return;
  }

  subscribers.forEach(sub => {
      const tr = document.createElement("tr");
      const status = sub.status === "active" ? "Active" : "Inactive";
      const optInDate = sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "N/A";
      tr.innerHTML = `
          <td>—</td>
          <td>${sub.phone}</td>
          <td>${optInDate}</td>
          <td>${status}</td>
      `;
      tbody.appendChild(tr);
  });
}

// The admin needs to be able to pull data and see alerts from the system.
// This function fetches alert history from the server and displays each alert in a table.
// If there's a problem, it logs an error but doesn't show anything to the user yet.
// Each alert shows message preview, time sent, and delivery status.
async function loadAlerts() {
  try {
      const response = await fetch("/alerts");

      if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to retrieve alerts.`);
      const data = await response.json();
      const messages = Array.isArray(data.messages) ? data.messages : [];

      renderAlertsTable(messages);
  } catch (err) {
      console.error("Failed to load alerts:", err);
      renderAlertsTable([]);
  }
}

function renderAlertsTable(messages) {
  const tbody = document.getElementById("alertList");
  tbody.innerHTML = "";

  if (messages.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" style="text-align: center;">No alerts sent yet</td>`;
      tbody.appendChild(tr);
      return;
  }

  messages.forEach(msg => {
      const tr = document.createElement("tr");
      const timestamp = msg.created_at ? new Date(msg.created_at).toLocaleString() : "N/A";
      const messagePreview = msg.body ? (msg.body.length > 60 ? msg.body.substring(0, 60) + "..." : msg.body) : "—";
      tr.innerHTML = `
          <td>${messagePreview}</td>
          <td>${timestamp}</td>
          <td>${msg.total_recipients || 0}</td>
          <td>${msg.delivered || 0}</td>
          <td>${msg.failed || 0}</td>
      `;
      tbody.appendChild(tr);
  });
}
/**PSEUDOCODE: sendAlert() 
 * Get the message input from the alert testarea
 * Validate : Ensure it is not empty , Ensure its under the character limit
 * 3. Send a POST request with the message to the server
  4. If successful:
     - Show success alert with number of recipients
     - Close the modal
  5. If failure:
     - Show error alert
     - Log error to console
*/
async function sendAlert() {
  const message = document.getElementById("alertMessage").value.trim();

  if (!message) return alert("Message cannot be empty.");
  if (message.length > 250) return alert("Message too long. Keep it under 250 characters.");

  try {
      const response = await fetch("/broadcast", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "x-api-key": localStorage.getItem("curve_admin_api_key") || ""
          },
          body: JSON.stringify({ message })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${result.error || "Unknown error"}`);

      if (result.success) {
          alert(`✅ Broadcast sent to ${result.totalRecipients} subscribers.`);
          document.getElementById("alertMessage").value = ""; // Clear textarea
          closeModal();
          loadAlerts(); // Refresh alerts table
      } else {
          alert(`⚠️ Broadcast error: ${result.error}`);
      }
  } catch (err) {
      console.error("Broadcast failed:", err);
      alert("❌ Could not send broadcast. Check console for details.");
  }
}

// Stub functions referenced by admin.html buttons
function refreshSubscribers() {
  loadSubscribers();
}

function exportSubscribers() {
  alert("Export CSV feature coming soon.");
}

function scheduleAlert() {
  alert("Schedule feature coming soon.");
}

function saveApiKey() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const key = apiKeyInput.value.trim();
  if (!key) {
    alert("Please enter an API key.");
    return;
  }
  localStorage.setItem("curve_admin_api_key", key);
  alert("✅ API key saved.");
}

// Initialize data on page load
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Admin dashboard initialized");

  // Attach nav button listeners
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Update active tab styling
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showSection(btn.dataset.section);
    });
  });

  // Set Dashboard tab as active by default
  document.getElementById("tab-dashboard")?.classList.add("active");

  // Logout button
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    console.log("Logout clicked");
    alert("Logout functionality coming soon.");
  });

  // Subscribers section buttons
  document.getElementById("refreshSubscribersBtn")?.addEventListener("click", refreshSubscribers);
  document.getElementById("exportSubscribersBtn")?.addEventListener("click", exportSubscribers);

  // Alerts section buttons
  document.getElementById("newAlertBtn")?.addEventListener("click", showNewAlertModal);

  // Settings section buttons
  document.getElementById("saveApiKeyBtn")?.addEventListener("click", saveApiKey);

  // Prefill API key if exists
  const savedApiKey = localStorage.getItem("curve_admin_api_key");
  if (savedApiKey) {
    const apiKeyInput = document.getElementById("apiKeyInput");
    if (apiKeyInput) apiKeyInput.value = savedApiKey;
  }

  // Modal buttons
  document.getElementById("sendAlertBtn")?.addEventListener("click", sendAlert);
  document.getElementById("scheduleAlertBtn")?.addEventListener("click", scheduleAlert);
  document.getElementById("cancelModalBtn")?.addEventListener("click", closeModal);

  // Load initial data
  loadSubscribers();
  loadAlerts();
});