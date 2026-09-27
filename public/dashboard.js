let allCustomers = [];

async function loadCustomers(query = "") {
  const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : "/api/customers";
  const data = await api(url);
  allCustomers = data.customers || [];
  renderCustomerTable(allCustomers);
  renderBirthdays(allCustomers);
  renderStats(allCustomers);
}

function renderStats(customers) {
  document.getElementById("statTotal").textContent = customers.length;
  const todayCount = customers.filter((c) => daysUntilBirthday(c.birthday) === 0).length;
  const weekCount = customers.filter((c) => daysUntilBirthday(c.birthday) <= 7).length;
  document.getElementById("statBdayToday").textContent = todayCount;
  document.getElementById("statBdayWeek").textContent = weekCount;

  api("/api/calls").then((data) => {
    const today = new Date();
    const y = today.getFullYear(), m = today.getMonth(), d = today.getDate();
    const count = (data.calls || []).filter((c) => {
      const dt = new Date(c.called_at.replace(" ", "T") + "Z");
      return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
    }).length;
    document.getElementById("statCallsToday").textContent = count;
  }).catch(() => {});
}

function renderBirthdays(customers) {
  const list = customers
    .map((c) => ({ ...c, daysLeft: daysUntilBirthday(c.birthday) }))
    .filter((c) => c.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const container = document.getElementById("bdayList");
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="big">🎂</div><p>Agle 7 dino me koi birthday nahi hai.</p></div>`;
    return;
  }

  container.innerHTML = list
    .map((c) => {
      const badge =
        c.daysLeft === 0
          ? `<span class="badge badge-today">🎉 Today!</span>`
          : `<span class="badge badge-upcoming">in ${c.daysLeft} day${c.daysLeft > 1 ? "s" : ""}</span>`;
      return `
      <div class="bday-item">
        <div class="who">
          <div class="avatar">${initials(c.name)}</div>
          <div>
            <div style="font-weight:600;">${escapeHtml(c.name)}</div>
            <div style="font-size:13px;color:var(--muted);">${formatDateOnly(c.birthday)} &middot; ${escapeHtml(c.mobile)} ${badge}</div>
          </div>
        </div>
        <button class="btn btn-wa btn-sm" onclick="wishBirthday(${c.id}, '${escapeAttr(c.name)}', '${escapeAttr(c.mobile)}')">💬 Wish on WhatsApp</button>
      </div>`;
    })
    .join("");
}

function renderCustomerTable(customers) {
  const body = document.getElementById("customerTableBody");
  const emptyState = document.getElementById("emptyState");
  if (customers.length === 0) {
    body.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";
  body.innerHTML = customers
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.name)}</td>
      <td>${escapeHtml(c.mobile)}</td>
      <td>${formatDateOnly(c.birthday)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-call btn-sm" onclick="callCustomer(${c.id}, '${escapeAttr(c.mobile)}')">📞 Call</button>
          <button class="btn btn-wa btn-sm" onclick="wishBirthday(${c.id}, '${escapeAttr(c.name)}', '${escapeAttr(c.mobile)}')">💬</button>
          <button class="btn btn-outline btn-sm" onclick="openEditModal(${c.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCustomer(${c.id})">🗑️</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
function escapeAttr(str) {
  return String(str || "").replace(/'/g, "\\'");
}

async function callCustomer(id, mobile) {
  try {
    await api("/api/calls", { method: "POST", body: JSON.stringify({ customer_id: id }) });
  } catch (e) {
    console.warn("call log failed", e);
  }
  window.location.href = telLink(mobile);
}

function wishBirthday(id, name, mobile) {
  const msg = birthdayWishMessage(name);
  api("/api/messages", { method: "POST", body: JSON.stringify({ customer_id: id, message: msg }) }).catch(() => {});
  window.open(waLink(mobile, msg), "_blank");
}

// ---- Modal handling ----
const modal = document.getElementById("customerModal");
const form = document.getElementById("customerForm");

document.getElementById("addCustomerBtn").addEventListener("click", () => openAddModal());
document.getElementById("cancelModalBtn").addEventListener("click", () => closeModal());

function openAddModal() {
  document.getElementById("modalTitle").textContent = "Add Customer";
  document.getElementById("customerId").value = "";
  form.reset();
  modal.classList.add("open");
}

function openEditModal(id) {
  const c = allCustomers.find((x) => x.id === id);
  if (!c) return;
  document.getElementById("modalTitle").textContent = "Edit Customer";
  document.getElementById("customerId").value = c.id;
  document.getElementById("custName").value = c.name;
  document.getElementById("custMobile").value = c.mobile;
  document.getElementById("custBirthday").value = c.birthday;
  document.getElementById("custNotes").value = c.notes || "";
  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("customerId").value;
  const payload = {
    name: document.getElementById("custName").value.trim(),
    mobile: document.getElementById("custMobile").value.trim(),
    birthday: document.getElementById("custBirthday").value,
    notes: document.getElementById("custNotes").value.trim(),
  };
  try {
    if (id) {
      await api(`/api/customers/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      toast("Customer updated ✅");
    } else {
      await api("/api/customers", { method: "POST", body: JSON.stringify(payload) });
      toast("Customer added ✅");
    }
    closeModal();
    loadCustomers(document.getElementById("searchInput").value);
  } catch (err) {
    toast("Error: " + err.message);
  }
});

async function deleteCustomer(id) {
  if (!confirm("Kya aap sach me ye customer delete karna chahte hain?")) return;
  try {
    await api(`/api/customers/${id}`, { method: "DELETE" });
    toast("Customer deleted");
    loadCustomers(document.getElementById("searchInput").value);
  } catch (err) {
    toast("Error: " + err.message);
  }
}

let searchTimer;
document.getElementById("searchInput").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadCustomers(e.target.value), 250);
});

document.addEventListener("DOMContentLoaded", () => {
  loadCustomers();
});
