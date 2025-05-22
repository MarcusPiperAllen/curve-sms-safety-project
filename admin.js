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
// If it can’t find any subscribers, it logs an error (right now just in the console).
// It loops through the list and creates rows so I can see phone and status.
async function loadSubscribers() {
  try {
      const response = await fetch("https://e65e-2600-4040-2150-ad00-e152-29ae-bd46-ff92.ngrok-free.app/subscribers", {
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

// The admin needs to be able to pull data and see alerts from the system.
// This function fetches alert history from the server and displays each alert in a table.
// If there's a problem, it logs an error but doesn’t show anything to the user yet.
// Each alert shows message preview, time sent, and delivery status.
async function loadAlerts() {
  try {
      const response = await fetch("https://e65e-2600-4040-2150-ad00-e152-29ae-bd46-ff92.ngrok-free.app/alerts", {
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
      const response = await fetch("https://e65e-2600-4040-2150-ad00-e152-29ae-bd46-ff92.ngrok-free.app/broadcast", {
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