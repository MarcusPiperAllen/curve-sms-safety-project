console.log("CurveLink Command Center loaded");

let pendingBroadcastMessage = null;
let pendingReportId = null;

function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) {
    console.warn(`Section "${sectionId}" not found.`);
    return;
  }

  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  section.classList.remove("hidden");

  if (sectionId === "dashboard") loadDashboardStats();
  if (sectionId === "subscribers") loadSubscribers();
  if (sectionId === "alerts") loadAlerts();
  if (sectionId === "inbox") loadReports();
}

function showModal(modalId) {
  document.getElementById(modalId).classList.remove("hidden");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add("hidden");
  if (modalId === "passwordModal") {
    document.getElementById("adminPasswordInput").value = "";
    document.getElementById("passwordError").classList.add("hidden");
    pendingBroadcastMessage = null;
    pendingReportId = null;
  }
  if (modalId === "newAlertModal") {
    document.getElementById("alertMessage").value = "";
    document.getElementById("charCount").textContent = "0";
  }
}

async function loadDashboardStats() {
  try {
    const [subsRes, reportsRes, alertsRes] = await Promise.all([
      fetch("/subscribers"),
      fetch("/reports"),
      fetch("/alerts")
    ]);
    
    const subscribers = (await subsRes.json()).subscribers || [];
    const reports = (await reportsRes.json()).reports || [];
    const alerts = (await alertsRes.json()).messages || [];
    
    const pendingReports = reports.filter(r => r.status === "pending");
    
    document.getElementById("stat-subscribers").textContent = subscribers.length;
    document.getElementById("stat-pending").textContent = pendingReports.length;
    document.getElementById("stat-broadcasts").textContent = alerts.length;
    
    updateInboxBadge(pendingReports.length);
  } catch (err) {
    console.error("Failed to load dashboard stats:", err);
  }
}

function updateInboxBadge(count) {
  const badge = document.getElementById("inbox-badge");
  badge.textContent = count;
  badge.style.display = count > 0 ? "inline" : "none";
}

async function loadSubscribers() {
  try {
    const response = await fetch("/subscribers");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
    tr.innerHTML = `<td colspan="3" style="text-align: center; color: #52525b;">No subscribers found</td>`;
    tbody.appendChild(tr);
    return;
  }

  subscribers.forEach(sub => {
    const tr = document.createElement("tr");
    const status = sub.status === "active" ? "Active" : "Inactive";
    const statusClass = sub.status === "active" ? "color: #22c55e" : "color: #ef4444";
    const optInDate = sub.created_at ? new Date(sub.created_at).toLocaleDateString() : "N/A";
    tr.innerHTML = `
      <td>${sub.phone}</td>
      <td>${optInDate}</td>
      <td style="${statusClass}; font-weight: 600">${status}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadAlerts() {
  try {
    const response = await fetch("/alerts");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
    tr.innerHTML = `<td colspan="5" style="text-align: center; color: #52525b;">No broadcasts sent yet</td>`;
    tbody.appendChild(tr);
    return;
  }

  messages.forEach(msg => {
    const tr = document.createElement("tr");
    const timestamp = msg.created_at ? new Date(msg.created_at).toLocaleString() : "N/A";
    const messagePreview = msg.body ? (msg.body.length > 50 ? msg.body.substring(0, 50) + "..." : msg.body) : "—";
    tr.innerHTML = `
      <td>${messagePreview}</td>
      <td>${timestamp}</td>
      <td style="color: #22c55e">${msg.total_recipients || 0}</td>
      <td style="color: #3b82f6">${msg.delivered || 0}</td>
      <td style="color: #ef4444">${msg.failed || 0}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadReports() {
  try {
    const response = await fetch("/reports");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const reports = Array.isArray(data.reports) ? data.reports : [];
    renderReportsList(reports);
    updateInboxBadge(reports.filter(r => r.status === "pending").length);
  } catch (err) {
    console.error("Failed to load reports:", err);
    renderReportsList([]);
  }
}

function renderReportsList(reports) {
  const container = document.getElementById("reportsList");
  container.innerHTML = "";

  const pendingReports = reports.filter(r => r.status === "pending");
  
  if (pendingReports.length === 0) {
    container.innerHTML = `<div class="empty-state">No pending reports. Your community is all clear!</div>`;
    return;
  }

  pendingReports.forEach(report => {
    const card = document.createElement("div");
    card.className = "report-card";
    const time = report.created_at ? new Date(report.created_at).toLocaleString() : "N/A";
    card.innerHTML = `
      <div class="report-content">
        <div class="report-phone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          ${report.phone}
        </div>
        <div class="report-issue">${escapeHtml(report.issue)}</div>
        <div class="report-time">Reported: ${time}</div>
      </div>
      <div class="report-actions">
        <button class="btn-primary" onclick="approveAndBroadcast(${report.id}, '${escapeHtml(report.issue).replace(/'/g, "\\'")}')">
          Approve & Send to All
        </button>
        <button class="btn-secondary" onclick="dismissReport(${report.id})">
          Dismiss
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function approveAndBroadcast(reportId, issue) {
  pendingBroadcastMessage = `ALERT: ${issue}`;
  pendingReportId = reportId;
  showModal("passwordModal");
}

async function confirmBroadcast() {
  const password = document.getElementById("adminPasswordInput").value;
  const errorEl = document.getElementById("passwordError");
  
  if (!password) {
    errorEl.textContent = "Please enter your admin password.";
    errorEl.classList.remove("hidden");
    return;
  }
  
  try {
    const response = await fetch("/admin/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: pendingBroadcastMessage,
        reportId: pendingReportId,
        adminPassword: password
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        errorEl.textContent = "Invalid password. Please try again.";
        errorEl.classList.remove("hidden");
        return;
      }
      throw new Error(result.error || "Broadcast failed");
    }
    
    closeModal("passwordModal");
    alert(`Broadcast sent to ${result.totalRecipients} residents.`);
    loadReports();
    loadDashboardStats();
  } catch (err) {
    console.error("Broadcast failed:", err);
    errorEl.textContent = err.message || "Broadcast failed. Please try again.";
    errorEl.classList.remove("hidden");
  }
}

async function dismissReport(reportId) {
  const password = prompt("Enter admin password to dismiss this report:");
  if (!password) return;
  
  try {
    const response = await fetch(`/reports/${reportId}/dismiss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: password })
    });
    
    if (response.status === 401) {
      alert("Invalid admin password.");
      return;
    }
    
    if (!response.ok) throw new Error("Failed to dismiss report");
    
    loadReports();
    loadDashboardStats();
  } catch (err) {
    console.error("Failed to dismiss report:", err);
    alert("Failed to dismiss report. Please try again.");
  }
}

function showNewAlertModal() {
  showModal("newAlertModal");
}

async function sendAlert() {
  const message = document.getElementById("alertMessage").value.trim();

  if (!message) return alert("Message cannot be empty.");
  if (message.length > 250) return alert("Message too long. Keep it under 250 characters.");

  pendingBroadcastMessage = message;
  pendingReportId = null;
  closeModal("newAlertModal");
  showModal("passwordModal");
}

function refreshSubscribers() {
  loadSubscribers();
}

function exportSubscribers() {
  alert("Export CSV feature coming soon.");
}

function saveApiKey() {
  const apiKeyInput = document.getElementById("apiKeyInput");
  const key = apiKeyInput.value.trim();
  if (!key) {
    alert("Please enter an API key.");
    return;
  }
  localStorage.setItem("curve_admin_api_key", key);
  alert("API key saved.");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Command Center initialized");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showSection(btn.dataset.section);
    });
  });

  document.getElementById("tab-dashboard")?.classList.add("active");

  document.getElementById("refreshSubscribersBtn")?.addEventListener("click", refreshSubscribers);
  document.getElementById("exportSubscribersBtn")?.addEventListener("click", exportSubscribers);
  document.getElementById("refreshReportsBtn")?.addEventListener("click", loadReports);
  document.getElementById("newAlertBtn")?.addEventListener("click", showNewAlertModal);
  document.getElementById("saveApiKeyBtn")?.addEventListener("click", saveApiKey);

  const savedApiKey = localStorage.getItem("curve_admin_api_key");
  if (savedApiKey) {
    const apiKeyInput = document.getElementById("apiKeyInput");
    if (apiKeyInput) apiKeyInput.value = savedApiKey;
  }

  document.getElementById("sendAlertBtn")?.addEventListener("click", sendAlert);
  document.getElementById("cancelModalBtn")?.addEventListener("click", () => closeModal("newAlertModal"));
  
  document.getElementById("confirmBroadcastBtn")?.addEventListener("click", confirmBroadcast);
  document.getElementById("cancelPasswordBtn")?.addEventListener("click", () => closeModal("passwordModal"));

  const alertMessage = document.getElementById("alertMessage");
  const charCount = document.getElementById("charCount");
  if (alertMessage && charCount) {
    alertMessage.addEventListener("input", () => {
      charCount.textContent = alertMessage.value.length;
    });
  }

  loadDashboardStats();
});
