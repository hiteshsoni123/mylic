// Shared helpers used across all dashboard pages

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options,
  });
  if (res.status === 401) {
    window.location.href = "/login.html";
    throw new Error("unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || "request_failed");
  }
  return data;
}

function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// dd-mm-yyyy hh:mm  e.g. 21-02-2026 12:30
function formatDateTime(sqliteUtcString) {
  if (!sqliteUtcString) return "-";
  const iso = sqliteUtcString.replace(" ", "T") + "Z";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateOnly(yyyyMmDd) {
  if (!yyyyMmDd) return "-";
  const [y, m, d] = yyyyMmDd.split("-");
  return `${d}-${m}-${y}`;
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

// Normalizes a mobile number for wa.me / tel: links (assumes India +91 if 10 digits)
function normalizeMobile(mobile) {
  let m = (mobile || "").replace(/[^\d]/g, "");
  if (m.length === 10) m = "91" + m;
  return m;
}

function waLink(mobile, message) {
  const m = normalizeMobile(mobile);
  return `https://wa.me/${m}?text=${encodeURIComponent(message)}`;
}

function telLink(mobile) {
  return `tel:${(mobile || "").replace(/\s+/g, "")}`;
}

function birthdayWishMessage(name) {
  return `🎉 Happy Birthday, ${name}! 🎂\n\nWishing you a wonderful year ahead filled with health, happiness & prosperity.\n\nWarm regards,\nMy LIC Record`;
}

// Days until next birthday (0 = today). bday = "YYYY-MM-DD"
function daysUntilBirthday(bday) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [, m, d] = bday.split("-").map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  next.setHours(0, 0, 0, 0);
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d);
  return Math.round((next - today) / 86400000);
}

async function requireAuth() {
  try {
    const data = await api("/api/me");
    if (!data.authenticated) window.location.href = "/login.html";
  } catch {
    window.location.href = "/login.html";
  }
}

function setupSidebar() {
  const hamburger = document.getElementById("hamburger");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  if (!hamburger || !sidebar) return;
  const toggle = () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
  };
  hamburger.addEventListener("click", toggle);
  overlay && overlay.addEventListener("click", toggle);

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await api("/api/logout", { method: "POST" }).catch(() => {});
      window.location.href = "/login.html";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  setupSidebar();
});
