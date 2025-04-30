document.addEventListener("DOMContentLoaded", function () {
    showSection('dashboard');
    loadSubscribers();
    loadAlerts();
  
    // Wire up filter input
    const filterInput = document.getElementById('filter');
    if (filterInput) {
      filterInput.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#subscriberList tr').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }
  });
  
  function showSection(sectionId) {
    document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");
  }
  
  function loadSubscribers() {
    const subscribers = [
      { name: "Marcus Piper", phone: "+1 210-392-2392", date: "2025-04-29 14:00Z", status: "Subscribed" },
      { name: "Jane Doe",   phone: "+1 555-123-4567", date: "2025-04-28 09:30Z", status: "Unsubscribed" }
    ];
    const tbody = document.getElementById("subscriberList");
    tbody.innerHTML = "";
    subscribers.forEach(sub => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${sub.name}</td>
        <td>${sub.phone}</td>
        <td>${sub.date}</td>
        <td>${sub.status}</td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  function loadAlerts() {
    const alerts = [
      { message: "Water off at Bldg 2",        timestamp: "2025-04-29 15:20Z", sent: 50, delivered: 49, failed: 1 },
      { message: "Pool closed for cleaning",   timestamp: "2025-04-29 12:05Z", sent: 50, delivered: 50, failed: 0 }
    ];
    const tbody = document.getElementById("alertList");
    tbody.innerHTML = "";
    alerts.forEach(alert => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${alert.message}</td>
        <td>${alert.timestamp}</td>
        <td>${alert.sent}</td>
        <td>${alert.delivered}</td>
        <td>${alert.failed}</td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  function refreshSubscribers() {
    console.log('Refreshing subscribers…');
    loadSubscribers();
  }
  
  function exportSubscribers() {
    const rows = Array.from(document.querySelectorAll('#subscriberList tr'))
      .map(r => Array.from(r.children).map(td => `"${td.textContent}"`).join(','));
    const csv  = ['Name,Phone,Date Opted-In,Status', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function showNewAlertModal() {
    document.getElementById("newAlertModal").classList.remove("hidden");
  }
  
  function closeModal() {
    document.getElementById("newAlertModal").classList.add("hidden");
  }
  
  function sendAlert() {
    const message = document.getElementById("alertMessage").value;
    console.log(`Sending alert: ${message}`);
    closeModal();
  }
  
  function scheduleAlert() {
    const message = document.getElementById("alertMessage").value;
    const time    = document.getElementById("scheduleTime").value;
    console.log(`Scheduling alert: ${message} at ${time}`);
    closeModal();
  }
  