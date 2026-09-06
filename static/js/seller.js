// Nexus AI Ecommerce - Seller Portal & Analytics
const SellerState = {
  products: [],
  orders: [],
  analytics: null,
  chartInstance: null,

  async openPortal() {
    if (!AuthState.currentUser || !['seller', 'admin'].includes(AuthState.currentUser.role)) {
      showToast("Please log in with a Seller or Admin account", "warning");
      AuthState.openModal("seller");
      return;
    }
    document.getElementById("sellerPortalModal")?.classList.remove("hidden");
    await this.loadDashboard();
  },

  closePortal() {
    document.getElementById("sellerPortalModal")?.classList.add("hidden");
  },

  async loadDashboard() {
    await Promise.all([
      this.loadAnalytics(),
      this.loadSellerProducts(),
      this.loadSellerOrders()
    ]);
  },

  async loadAnalytics() {
    const res = await API.get("/api/seller/analytics");
    if (res.error) return;
    this.analytics = res;

    document.getElementById("sellerTotalRevenue").innerText = formatINR(res.total_revenue);
    document.getElementById("sellerTotalOrders").innerText = res.total_orders;
    document.getElementById("sellerTotalProducts").innerText = res.total_products;
    document.getElementById("sellerLowStockCount").innerText = res.low_stock_count;

    this.renderSalesChart(res.sales_trend);
  },

  renderSalesChart(trend) {
    const canvas = document.getElementById("sellerSalesChart");
    if (!canvas || !window.Chart) return;
    if (this.chartInstance) this.chartInstance.destroy();

    this.chartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: (trend || []).map(t => t.date),
        datasets: [{
          label: "Daily Revenue (INR)",
          data: (trend || []).map(t => t.sales),
          borderColor: "#4f46e5",
          backgroundColor: "rgba(79, 70, 229, 0.08)",
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#4f46e5",
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "rgba(0, 0, 0, 0.04)" }, ticks: { color: "#64748b", font: { size: 10 } } },
          y: { grid: { color: "rgba(0, 0, 0, 0.04)" }, ticks: { color: "#64748b", font: { size: 10 }, callback: (v) => "₹" + v.toLocaleString("en-IN") } }
        }
      }
    });
  },

  async loadSellerProducts() {
    const container = document.getElementById("sellerProductsTableBody");
    if (!container) return;

    const res = await API.get("/api/products");
    this.products = res.products || [];

    container.innerHTML = this.products.map(p => `
      <tr class="border-b border-slate-200 hover:bg-slate-50 transition">
        <td class="py-3 px-3">
          <div class="flex items-center gap-2.5">
            <img src="${p.image_url}" class="w-10 h-10 rounded-lg object-cover bg-slate-100" onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'">
            <div class="min-w-0 max-w-xs">
              <h6 class="text-xs font-semibold text-slate-900 truncate">${p.title}</h6>
              <span class="text-[10px] text-indigo-600 font-medium">${p.category}</span>
            </div>
          </div>
        </td>
        <td class="py-3 px-3 text-xs font-bold text-slate-900">${formatINR(p.price_inr)}</td>
        <td class="py-3 px-3">
          <span class="text-xs font-bold ${p.stock <= 5 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-700'}">
            ${p.stock} units
          </span>
        </td>
        <td class="py-3 px-3 text-xs text-amber-500 font-bold">${p.rating} ★</td>
        <td class="py-3 px-3 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="SellerState.openEditProductModal(${p.id})" class="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white border border-slate-200 transition" title="Edit">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="SellerState.deleteProduct(${p.id})" class="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 text-slate-600 hover:text-white border border-slate-200 transition" title="Delete">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");

    if (window.lucide) lucide.createIcons();
  },

  async loadSellerOrders() {
    const container = document.getElementById("sellerOrdersTableBody");
    if (!container) return;

    const res = await API.get("/api/seller/orders");
    this.orders = res.orders || [];

    container.innerHTML = this.orders.map(o => `
      <tr class="border-b border-slate-200 hover:bg-slate-50 transition">
        <td class="py-3 px-3 font-mono text-xs font-bold text-indigo-600">${o.order_code}</td>
        <td class="py-3 px-3">
          <div class="text-xs font-semibold text-slate-900">${o.customer_name || 'Customer'}</div>
          <div class="text-[10px] text-slate-500">${o.customer_email || ''}</div>
        </td>
        <td class="py-3 px-3 text-xs text-slate-700">
          ${(o.items || []).map(i => `${i.title.substring(0, 20)}... (x${i.quantity})`).join(", ")}
        </td>
        <td class="py-3 px-3 text-xs font-bold text-emerald-600">${formatINR(o.total_amount)}</td>
        <td class="py-3 px-3">
          <select onchange="SellerState.updateOrderStatus(${o.id}, this.value)" class="bg-white text-slate-900 text-xs border border-slate-300 rounded-lg px-2 py-1 focus:border-indigo-500 focus:outline-none shadow-xs">
            <option value="Processing" ${o.order_status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Confirmed" ${o.order_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Out for Delivery" ${o.order_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
            <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join("");
  },

  async updateOrderStatus(orderId, status) {
    const res = await API.put(`/api/seller/orders/${orderId}/status`, { status });
    if (res.error) { showToast(res.error, "error"); return; }
    showToast(res.message);
  },

  openAddProductModal() {
    const modal = document.getElementById("productFormModal");
    const form = document.getElementById("productCrudForm");
    if (!modal || !form) return;
    form.reset();
    document.getElementById("formProductId").value = "";
    document.getElementById("productFormTitle").innerText = "Add New Product to Catalog";
    modal.classList.remove("hidden");
  },

  async openEditProductModal(prodId) {
    const p = this.products.find(x => x.id === prodId);
    if (!p) return;
    document.getElementById("formProductId").value = p.id;
    document.getElementById("productFormTitle").innerText = "Edit Product Details";
    document.getElementById("formProductTitle").value = p.title;
    document.getElementById("formProductCategory").value = p.category;
    document.getElementById("formProductPrice").value = p.price_inr;
    document.getElementById("formProductMrp").value = p.mrp_inr;
    document.getElementById("formProductStock").value = p.stock;
    document.getElementById("formProductImage").value = p.image_url;
    document.getElementById("formProductBadge").value = p.badge || "";
    document.getElementById("formProductDesc").value = p.description || "";
    document.getElementById("productFormModal")?.classList.remove("hidden");
  },

  closeProductFormModal() {
    document.getElementById("productFormModal")?.classList.add("hidden");
  },

  async saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById("formProductId")?.value;
    const title = document.getElementById("formProductTitle")?.value.trim();
    const category = document.getElementById("formProductCategory")?.value;
    const price_inr = parseInt(document.getElementById("formProductPrice")?.value || 0);
    const mrp_inr = parseInt(document.getElementById("formProductMrp")?.value || price_inr);
    const stock = parseInt(document.getElementById("formProductStock")?.value || 10);
    const image_url = document.getElementById("formProductImage")?.value.trim();
    const badge = document.getElementById("formProductBadge")?.value.trim();
    const description = document.getElementById("formProductDesc")?.value.trim();

    const payload = { title, category, price_inr, mrp_inr, stock, image_url, badge, description };
    const res = id ? await API.put(`/api/products/${id}`, payload) : await API.post("/api/products", payload);

    if (res.error) { showToast(res.error, "error"); return; }
    showToast(res.message);
    this.closeProductFormModal();
    await this.loadSellerProducts();
    await Store.loadProducts();
  },

  async deleteProduct(prodId) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await API.delete(`/api/products/${prodId}`);
    if (res.error) { showToast(res.error, "error"); return; }
    showToast(res.message);
    await this.loadSellerProducts();
    await Store.loadProducts();
  }
};
