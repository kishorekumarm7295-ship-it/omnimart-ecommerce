const API = {
  async get(url) {
    const res = await fetch(url);
    return await res.json();
  },
  async post(url, data = {}) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return await res.json();
  },
  async put(url, data = {}) {
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    return await res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: "DELETE" });
    return await res.json();
  }
};

function formatINR(amount) {
  if (amount === undefined || amount === null) return "₹0";
  return "₹" + Number(amount).toLocaleString("en-IN");
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${
    type === "error" ? "bg-rose-600" : (type === "warning" ? "bg-amber-600" : "bg-indigo-600")
  }`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}
