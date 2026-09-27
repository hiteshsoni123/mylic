let allCalls = [];

async function loadCustomerFilter() {
  const data = await api("/api/customers");
  const select = document.getElementById("customerFilter");
  (data.customers || []).forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

async function loadCalls(customerId = "") {
  const url = customerId ? `/api/calls?customer_id=${customerId}` : "/api/calls";
  const data = await api(url);
  allCalls = data.calls || [];
  renderCalls(allCalls);
}

function renderCalls(calls) {
  const body = document.getElementById("callsTableBody");
  const empty = document.getElementById("emptyCalls");
  if (calls.length === 0) {
    body.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  body.innerHTML = calls
    .map(
      (c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.mobile}</td>
      <td>${formatDateTime(c.called_at)}</td>
    </tr>`
    )
    .join("");
}

document.getElementById("customerFilter").addEventListener("change", (e) => {
  loadCalls(e.target.value);
});

document.addEventListener("DOMContentLoaded", () => {
  loadCustomerFilter();
  loadCalls();
});
