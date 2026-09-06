// Nexus AI Ecommerce - Customer Portal & Dashboard
const CustomerDashboard = {
  activeTab: "orders",
  orders: [],

  async openModal() {
    if (!AuthState.currentUser) {
      showToast("Please log in to access your customer dashboard", "warning");
      AuthState.openModal();
      return;
    }
    const modal = document.getElementById("customerDashboardModal");
    if (modal) {
      modal.classList.remove("hidden");
      this.switchTab(this.activeTab);
    }
  },

  closeModal() {
    document.getElementById("customerDashboardModal")?.classList.add("hidden");
  },

  async switchTab(tab) {
    this.activeTab = tab;
    ["orders", "wishlist", "profile"].forEach(t => {
      const btn = document.getElementById(`custTabBtn_${t}`);
      const pane = document.getElementById(`custTabPane_${t}`);
      if (btn) {
        btn.className = t === tab 
          ? "px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
          : "px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200";
      }
      if (pane) pane.classList.toggle("hidden", t !== tab);
    });

    if (tab === "orders") await this.loadOrders();
    if (tab === "wishlist") await this.loadWishlistTab();
    if (tab === "profile") this.loadProfileTab();
  },

  async loadOrders() {
    const container = document.getElementById("customerOrdersList");
    if (!container) return;

    container.innerHTML = `<div class="py-8 text-center text-slate-500 text-xs font-medium">Fetching orders...</div>`;

    const res = await API.get("/api/orders");
    this.orders = res.orders || [];

    if (this.orders.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400">
          <i data-lucide="package-x" class="w-12 h-12 mx-auto text-slate-400 mb-2"></i>
          <p class="font-bold text-slate-900 text-sm">No orders yet</p>
          <p class="text-xs text-slate-500 mt-1">Start shopping from our catalog of 50+ handpicked products.</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = "";
    this.orders.forEach(o => {
      const statusColors = {
        "Processing": "bg-amber-50 text-amber-700 border-amber-200",
        "Confirmed": "bg-blue-50 text-blue-700 border-blue-200",
        "Shipped": "bg-indigo-50 text-indigo-700 border-indigo-200",
        "Out for Delivery": "bg-purple-50 text-purple-700 border-purple-200",
        "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-200",
        "Cancelled": "bg-rose-50 text-rose-700 border-rose-200"
      };

      const steps = ["Processing", "Confirmed", "Shipped", "Delivered"];
      const currentStepIdx = steps.indexOf(o.order_status) !== -1 ? steps.indexOf(o.order_status) : 1;

      const itemsHtml = (o.items || []).map(i => `
        <div class="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
          <img src="${i.image_url}" class="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'">
          <div class="flex-1 min-w-0">
            <h6 class="text-xs font-semibold text-slate-900 truncate">${i.title}</h6>
            <div class="text-[11px] text-slate-500 mt-0.5">Qty: ${i.quantity} × ${formatINR(i.price)}</div>
          </div>
          <span class="text-xs font-bold text-slate-900">${formatINR(i.price * i.quantity)}</span>
        </div>
      `).join("");

      html += `
        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm mb-4">
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 mb-3">
            <div>
              <span class="text-xs text-slate-500">Order Reference:</span>
              <span class="font-mono font-bold text-indigo-600 text-sm ml-1.5">${o.order_code}</span>
              <span class="text-[11px] text-slate-400 ml-2">(${o.created_at})</span>
            </div>
            <span class="px-2.5 py-1 text-xs font-bold rounded-full border ${statusColors[o.order_status] || 'bg-slate-100 text-slate-700'}">
              ● ${o.order_status}
            </span>
          </div>

          <!-- Progress Stepper -->
          ${o.order_status !== 'Cancelled' ? `
            <div class="py-3 px-4 mb-3 bg-slate-50 rounded-xl border border-slate-200">
              <div class="flex justify-between items-center relative">
                <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-0"></div>
                <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-0 transition-all" style="width: ${(currentStepIdx / (steps.length - 1)) * 100}%"></div>
                
                ${steps.map((s, idx) => `
                  <div class="flex flex-col items-center relative z-10">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx <= currentStepIdx ? 'bg-indigo-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-300'
                    }">
                      ${idx <= currentStepIdx ? '✓' : idx + 1}
                    </div>
                    <span class="text-[10px] mt-1 font-semibold ${idx <= currentStepIdx ? 'text-indigo-600' : 'text-slate-400'}">${s}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ''}

          <div class="space-y-1 mb-4">${itemsHtml}</div>

          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
            <div class="text-slate-600">
              <span>Paid via: <b>${o.payment_method}</b></span>
              <span class="ml-3">Total: <b class="text-slate-900 text-sm font-bold">${formatINR(o.total_amount)}</b></span>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="CheckoutState.viewInvoice('${o.order_code}')" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition flex items-center gap-1.5 border border-slate-200">
                <i data-lucide="file-text" class="w-3.5 h-3.5"></i> Tax Invoice
              </button>
              ${['Processing', 'Confirmed'].includes(o.order_status) ? `
                <button onclick="CustomerDashboard.cancelOrder(${o.id})" class="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition border border-rose-200">
                  Cancel Order
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  async cancelOrder(orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    const res = await API.post(`/api/orders/${orderId}/cancel`);
    if (res.error) { showToast(res.error, "error"); return; }
    showToast(res.message);
    await this.loadOrders();
  },

  async loadWishlistTab() {
    const container = document.getElementById("customerWishlistGrid");
    if (!container) return;

    const res = await API.get("/api/wishlist");
    const items = res.items || [];

    if (items.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <i data-lucide="heart" class="w-12 h-12 mx-auto text-slate-400 mb-2"></i>
          <p class="font-bold text-slate-900 text-sm">Your wishlist is empty</p>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = items.map(p => `
      <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
        <img src="${p.image_url}" class="w-14 h-14 rounded-lg object-cover bg-white flex-shrink-0">
        <div class="flex-1 min-w-0">
          <h5 class="text-xs font-semibold text-slate-900 truncate">${p.title}</h5>
          <span class="text-xs font-bold text-indigo-600">${formatINR(p.price_inr)}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="CartState.addItem(${p.id}, 1)" class="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white" title="Add to Cart">
            <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="Store.toggleWishlist(${p.id}); CustomerDashboard.loadWishlistTab();" class="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600" title="Remove">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `).join("");
    if (window.lucide) lucide.createIcons();
  },

  loadProfileTab() {
    const u = AuthState.currentUser;
    if (!u) return;
    document.getElementById("profileNameInput").value = u.name || "";
    document.getElementById("profileEmailInput").value = u.email || "";
    document.getElementById("profilePhoneInput").value = u.phone || "";
    document.getElementById("profileAddressInput").value = u.address || "";
  },

  async saveProfile() {
    const name = document.getElementById("profileNameInput")?.value.trim();
    const phone = document.getElementById("profilePhoneInput")?.value.trim();
    const address = document.getElementById("profileAddressInput")?.value.trim();

    const res = await API.post("/api/auth/update-profile", { name, phone, address });
    if (res.error) { showToast(res.error, "error"); return; }

    showToast("Profile settings saved!");
    AuthState.currentUser = res.user;
    AuthState.updateUI();
  }
};
