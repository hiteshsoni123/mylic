let bulkCustomers = [];
let selectedIds = new Set();
let attachedImageFile = null;
let queue = [];
let queueIndex = 0;

async function loadPicker(query = "") {
  const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : "/api/customers";
  const data = await api(url);
  bulkCustomers = data.customers || [];
  renderPicker(bulkCustomers);
}

function renderPicker(customers) {
  const list = document.getElementById("pickerList");
  if (customers.length === 0) {
    list.innerHTML = `<div class="empty-state"><p>Koi customer nahi mila.</p></div>`;
    return;
  }
  list.innerHTML = customers
    .map(
      (c) => `
    <label class="picker-row">
      <input type="checkbox" data-id="${c.id}" ${selectedIds.has(c.id) ? "checked" : ""} onchange="toggleSelect(${c.id}, this.checked)" />
      <span>${c.name} <span style="color:var(--muted);font-size:12.5px;">(${c.mobile})</span></span>
    </label>`
    )
    .join("");
  updateSelectedCount();
}

function toggleSelect(id, checked) {
  if (checked) selectedIds.add(id);
  else selectedIds.delete(id);
  updateSelectedCount();
}

function updateSelectedCount() {
  document.getElementById("selectedCount").textContent = `${selectedIds.size} customers selected`;
}

document.getElementById("selectAllBtn").addEventListener("click", () => {
  bulkCustomers.forEach((c) => selectedIds.add(c.id));
  renderPicker(bulkCustomers);
});
document.getElementById("clearAllBtn").addEventListener("click", () => {
  selectedIds.clear();
  renderPicker(bulkCustomers);
});

let pickerTimer;
document.getElementById("pickerSearch").addEventListener("input", (e) => {
  clearTimeout(pickerTimer);
  pickerTimer = setTimeout(() => loadPicker(e.target.value), 250);
});

// ---- Image attach ----
document.getElementById("bulkImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  attachedImageFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById("imagePreview").src = ev.target.result;
    document.getElementById("imagePreviewWrap").style.display = "block";
  };
  reader.readAsDataURL(file);
});
document.getElementById("removeImageBtn").addEventListener("click", () => {
  attachedImageFile = null;
  document.getElementById("bulkImage").value = "";
  document.getElementById("imagePreviewWrap").style.display = "none";
});

// ---- Queue ----
document.getElementById("startQueueBtn").addEventListener("click", () => {
  const template = document.getElementById("bulkMessage").value.trim();
  if (selectedIds.size === 0) return toast("Pehle customers select karein");
  if (!template) return toast("Message likhein");

  queue = bulkCustomers.filter((c) => selectedIds.has(c.id));
  queueIndex = 0;
  document.getElementById("queueCard").style.display = "block";
  document.getElementById("queueCard").scrollIntoView({ behavior: "smooth" });
  renderQueueStep();
});

function currentTemplate() {
  return document.getElementById("bulkMessage").value;
}

function renderQueueStep() {
  const progressEl = document.getElementById("queueProgress");
  const currentEl = document.getElementById("queueCurrent");
  if (queueIndex >= queue.length) {
    progressEl.textContent = `✅ Done! ${queue.length} of ${queue.length} processed.`;
    currentEl.innerHTML = "";
    document.getElementById("sendNextBtn").style.display = "none";
    document.getElementById("skipBtn").style.display = "none";
    return;
  }
  const c = queue[queueIndex];
  progressEl.textContent = `${queueIndex + 1} of ${queue.length}`;
  currentEl.innerHTML = `Next up: <b>${c.name}</b> (${c.mobile})`;
  document.getElementById("sendNextBtn").style.display = "inline-flex";
  document.getElementById("skipBtn").style.display = "inline-flex";
}

document.getElementById("sendNextBtn").addEventListener("click", async () => {
  if (queueIndex >= queue.length) return;
  const c = queue[queueIndex];
  const personalized = currentTemplate().replaceAll("{name}", c.name);

  api("/api/messages", { method: "POST", body: JSON.stringify({ customer_id: c.id, message: personalized }) }).catch(() => {});

  if (attachedImageFile && navigator.canShare && navigator.canShare({ files: [attachedImageFile] })) {
    try {
      await navigator.share({ text: personalized, files: [attachedImageFile] });
    } catch (err) {
      // user cancelled share or unsupported - fall back to WhatsApp text link
      window.open(waLink(c.mobile, personalized), "_blank");
    }
  } else {
    window.open(waLink(c.mobile, personalized), "_blank");
  }

  queueIndex++;
  renderQueueStep();
  loadHistory();
});

document.getElementById("skipBtn").addEventListener("click", () => {
  queueIndex++;
  renderQueueStep();
});

document.getElementById("stopQueueBtn").addEventListener("click", () => {
  document.getElementById("queueCard").style.display = "none";
  queue = [];
  queueIndex = 0;
});

// ---- History ----
async function loadHistory() {
  const data = await api("/api/messages");
  const body = document.getElementById("historyTableBody");
  const empty = document.getElementById("emptyHistory");
  const messages = data.messages || [];
  if (messages.length === 0) {
    body.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  body.innerHTML = messages
    .map(
      (m) => `
    <tr>
      <td>${m.name}</td>
      <td>${m.mobile}</td>
      <td style="white-space:normal;max-width:320px;">${m.message.replace(/</g, "&lt;")}</td>
      <td>${formatDateTime(m.sent_at)}</td>
    </tr>`
    )
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {
  loadPicker();
  loadHistory();
});
