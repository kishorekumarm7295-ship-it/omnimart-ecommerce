// Nexus AI Ecommerce - Store & Catalog Module
const Store = {
  products: [],
  categories: [],
  activeCategory: "all",
  searchQuery: "",
  priceMin: 0,
  priceMax: 150000,
  minRating: 0,
  inStockOnly: false,
  sortBy: "featured",

  async init() {
    await this.loadCategories();
    await this.loadProducts();
    this.setupEventListeners();
  },

  async loadCategories() {
    const data = await API.get("/api/categories");
    if (data.categories) {
      this.categories = data.categories;
      this.renderCategoryBar();
      this.renderCategoryFilters();
    }
  },

  async loadProducts() {
    const params = new URLSearchParams();
    if (this.searchQuery) params.append("q", this.searchQuery);
    if (this.activeCategory && this.activeCategory !== "all") params.append("category", this.activeCategory);
    if (this.priceMin > 0) params.append("min_price", this.priceMin);
    if (this.priceMax < 150000) params.append("max_price", this.priceMax);
    if (this.minRating > 0) params.append("min_rating", this.minRating);
    if (this.inStockOnly) params.append("in_stock", "true");
    if (this.sortBy) params.append("sort_by", this.sortBy);

    const container = document.getElementById("productGrid");
    if (container) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <div class="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="mt-3 text-sm font-medium">Loading Nexus catalog...</p>
        </div>
      `;
    }

    const res = await API.get(`/api/products?${params.toString()}`);
    this.products = res.products || [];
    this.renderProducts();
    this.updateProductCounts(res.total || 0);
  },

  renderCategoryBar() {
    const bar = document.getElementById("categoryNavPills");
    if (!bar) return;

    let html = `
      <button onclick="Store.setCategory('all')" class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        this.activeCategory === 'all'
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
      }">
        🔥 All Categories
      </button>
    `;

    this.categories.forEach(cat => {
      const icons = {
        "Electronics": "⚡",
        "Fashion": "✨",
        "Home & Kitchen": "☕",
        "Beauty": "💄",
        "Books": "📚",
        "Fitness": "🏋️"
      };
      const icon = icons[cat.category] || "🛍️";
      const isActive = this.activeCategory === cat.category;
      html += `
        <button onclick="Store.setCategory('${cat.category}')" class="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
        }">
          ${icon} ${cat.category} (${cat.count})
        </button>
      `;
    });
    bar.innerHTML = html;
  },

  renderCategoryFilters() {
    const list = document.getElementById("sidebarCategoryList");
    if (!list) return;

    let html = `
      <label class="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-100/60 transition">
        <div class="flex items-center gap-2">
          <input type="radio" name="catFilter" value="all" ${this.activeCategory === 'all' ? 'checked' : ''} onchange="Store.setCategory('all')" class="text-indigo-600 focus:ring-indigo-500">
          <span class="text-sm font-medium text-slate-700">All Products</span>
        </div>
        <span class="text-xs text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">54</span>
      </label>
    `;

    this.categories.forEach(c => {
      html += `
        <label class="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-slate-100/60 transition">
          <div class="flex items-center gap-2">
            <input type="radio" name="catFilter" value="${c.category}" ${this.activeCategory === c.category ? 'checked' : ''} onchange="Store.setCategory('${c.category}')" class="text-indigo-600 focus:ring-indigo-500">
            <span class="text-sm font-medium text-slate-700">${c.category}</span>
          </div>
          <span class="text-xs text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">${c.count}</span>
        </label>
      `;
    });
    list.innerHTML = html;
  },

  setCategory(cat) {
    this.activeCategory = cat;
    this.renderCategoryBar();
    this.renderCategoryFilters();
    this.loadProducts();
  },

  updateProductCounts(total) {
    const countEl = document.getElementById("productTotalCount");
    if (countEl) countEl.innerText = `${total} products found in INR`;
  },

  renderProducts() {
    const container = document.getElementById("productGrid");
    if (!container) return;

    if (this.products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-20 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <i data-lucide="package-search" class="w-8 h-8"></i>
          </div>
          <h3 class="text-lg font-bold text-slate-900">No products found</h3>
          <p class="text-sm text-slate-500 mt-1">Try relaxing your search terms or price filter.</p>
          <button onclick="Store.resetFilters()" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition">
            Reset All Filters
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = "";
    this.products.forEach(p => {
      const isWishlist = (window.CartState && CartState.wishlistIds.includes(p.id)) || false;
      const badgeHtml = p.badge
        ? `<span class="absolute top-3 left-3 z-10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-indigo-600 text-white shadow">${p.badge}</span>`
        : (p.discount_pct > 0 ? `<span class="absolute top-3 left-3 z-10 px-2.5 py-1 text-[11px] font-bold rounded-full bg-rose-600 text-white shadow">${p.discount_pct}% OFF</span>` : "");

      html += `
        <div class="product-card group relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col shadow-sm">
          ${badgeHtml}

          <!-- Wishlist Toggle -->
          <button onclick="Store.toggleWishlist(${p.id})" class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:scale-110 transition shadow-sm">
            <i data-lucide="heart" class="w-4 h-4 ${isWishlist ? 'fill-rose-500 text-rose-500' : ''}"></i>
          </button>

          <!-- Image -->
          <div onclick="Store.openDetailModal(${p.id})" class="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer">
            <img src="${p.image_url}" alt="${p.title}" class="product-card-img w-full h-full object-cover" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
              <span class="px-3 py-1.5 rounded-lg bg-indigo-600/95 text-white text-xs font-semibold backdrop-blur shadow flex items-center gap-1.5">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i> Quick View
              </span>
            </div>
          </div>

          <!-- Content Details -->
          <div class="p-4 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between text-xs text-indigo-600 font-medium mb-1">
                <span>${p.category}</span>
                <div class="flex items-center gap-1 text-amber-500">
                  <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i>
                  <span class="font-bold text-slate-800">${p.rating}</span>
                  <span class="text-slate-400">(${p.reviews_count})</span>
                </div>
              </div>
              <h4 onclick="Store.openDetailModal(${p.id})" class="text-sm font-semibold text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer transition mb-2" title="${p.title}">
                ${p.title}
              </h4>
            </div>

            <div>
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-lg font-bold text-slate-900">${formatINR(p.price_inr)}</span>
                ${p.mrp_inr > p.price_inr ? `<span class="text-xs text-slate-400 line-through">${formatINR(p.mrp_inr)}</span>` : ''}
                ${p.discount_pct > 0 ? `<span class="text-xs font-bold text-emerald-600">${p.discount_pct}% off</span>` : ''}
              </div>

              <div class="flex items-center gap-2">
                <button onclick="CartState.addItem(${p.id}, 1)" class="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
                  <i data-lucide="shopping-cart" class="w-4 h-4"></i> Add to Cart
                </button>
                <button onclick="Store.openDetailModal(${p.id})" class="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition" title="View details">
                  <i data-lucide="info" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  async openDetailModal(prodId) {
    const modal = document.getElementById("productDetailModal");
    const content = document.getElementById("productDetailContent");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="p-12 text-center text-slate-500">
        <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p class="mt-3 text-sm font-medium">Fetching product specifications & verified reviews...</p>
      </div>
    `;
    modal.classList.remove("hidden");

    const p = await API.get(`/api/products/${prodId}`);
    if (!p || p.error) {
      content.innerHTML = `<div class="p-6 text-center text-rose-500">Failed to load product details.</div>`;
      return;
    }

    const specsHtml = Object.entries(p.specs || {}).map(([k, v]) => `
      <div class="flex justify-between py-2 border-b border-slate-100 text-xs">
        <span class="text-slate-500 font-medium">${k}</span>
        <span class="text-slate-900 font-semibold">${v}</span>
      </div>
    `).join("");

    const reviewsHtml = (p.reviews && p.reviews.length > 0)
      ? p.reviews.map(r => `
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-2">
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-bold text-slate-900">${r.user_name}</span>
            <div class="flex text-amber-500">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          </div>
          <p class="text-xs text-slate-700 mt-1">${r.comment}</p>
          <span class="text-[10px] text-slate-400 mt-1 block">${r.created_at || 'Verified Purchase'}</span>
        </div>
      `).join("")
      : `<p class="text-xs text-slate-400 italic">No buyer reviews yet. Be the first to review this product!</p>`;

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
        <div>
          <div class="aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm mb-4 relative">
            <img src="${p.image_url}" alt="${p.title}" class="w-full h-full object-cover">
            ${p.badge ? `<span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold uppercase rounded-full bg-indigo-600 text-white shadow">${p.badge}</span>` : ''}
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-xs">
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span class="text-slate-400 block text-[10px]">Warranty</span>
              <span class="font-bold text-slate-800">1 Year Genuine</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span class="text-slate-400 block text-[10px]">Replacement</span>
              <span class="font-bold text-emerald-600">7 Days Return</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span class="text-slate-400 block text-[10px]">Delivery</span>
              <span class="font-bold text-indigo-600">Express Free</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-600">${p.category}</span>
            <h2 class="text-xl md:text-2xl font-bold text-slate-900 mt-1 mb-2">${p.title}</h2>
            
            <div class="flex items-center gap-3 mb-4 text-sm">
              <div class="flex items-center gap-1 bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-bold text-xs">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i> ${p.rating}
              </div>
              <span class="text-slate-500 text-xs">${p.reviews_count} Verified Ratings</span>
              <span class="text-xs font-semibold ${p.stock > 5 ? 'text-emerald-600' : 'text-amber-600'}">
                ${p.stock > 0 ? `In Stock (${p.stock} units)` : 'Out of Stock'}
              </span>
            </div>

            <div class="flex items-baseline gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <span class="text-3xl font-extrabold text-slate-900">${formatINR(p.price_inr)}</span>
              ${p.mrp_inr > p.price_inr ? `<span class="text-base text-slate-400 line-through">${formatINR(p.mrp_inr)}</span>` : ''}
              ${p.discount_pct > 0 ? `<span class="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold">Save ${p.discount_pct}%</span>` : ''}
            </div>

            <p class="text-xs md:text-sm text-slate-600 leading-relaxed mb-4">${p.description}</p>

            <div class="mb-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Technical Specifications</h4>
              <div class="bg-slate-50 rounded-xl p-3 border border-slate-200">
                ${specsHtml || '<p class="text-xs text-slate-400">Standard specifications apply.</p>'}
              </div>
            </div>

            <!-- PIN Code Delivery Checker -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">Check Delivery & COD Availability</label>
              <div class="flex gap-2">
                <input type="text" id="pincodeInput" placeholder="Enter 6-digit PIN code (e.g. 560038)" maxlength="6" class="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500">
                <button onclick="Store.checkPincode()" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition">Check</button>
              </div>
              <div id="pincodeResult" class="mt-2 text-xs hidden"></div>
            </div>
          </div>

          <div class="flex gap-3 pt-4 border-t border-slate-200">
            <button onclick="CartState.addItem(${p.id}, 1); Store.closeDetailModal();" class="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition">
              <i data-lucide="shopping-cart" class="w-4 h-4"></i> Add to Cart
            </button>
            <button onclick="CartState.addItem(${p.id}, 1); Store.closeDetailModal(); CheckoutState.openModal();" class="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition">
              <i data-lucide="zap" class="w-4 h-4"></i> Buy Now
            </button>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="p-6 bg-slate-50/80 border-t border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-bold text-slate-900 flex items-center gap-2">
            <i data-lucide="message-square" class="w-4 h-4 text-indigo-600"></i> Customer Reviews (${p.reviews ? p.reviews.length : 0})
          </h3>
          <button onclick="Store.toggleReviewForm()" class="text-xs text-indigo-600 hover:text-indigo-700 font-bold">Write a Review</button>
        </div>

        <div id="reviewForm" class="hidden mb-4 p-4 rounded-xl bg-white border border-slate-200">
          <div class="flex items-center gap-2 mb-3">
            <label class="text-xs text-slate-700">Rating:</label>
            <select id="newReviewRating" class="bg-slate-50 text-amber-500 text-xs border border-slate-300 rounded-lg p-1.5">
              <option value="5">★★★★★ (5 Stars)</option>
              <option value="4">★★★★☆ (4 Stars)</option>
              <option value="3">★★★☆☆ (3 Stars)</option>
              <option value="2">★★☆☆☆ (2 Stars)</option>
              <option value="1">★☆☆☆☆ (1 Star)</option>
            </select>
          </div>
          <textarea id="newReviewComment" rows="2" placeholder="Share your experience..." class="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 mb-2 focus:outline-none focus:border-indigo-500"></textarea>
          <button onclick="Store.submitReview(${p.id})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition">
            Submit Review
          </button>
        </div>

        <div>${reviewsHtml}</div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  closeDetailModal() {
    const modal = document.getElementById("productDetailModal");
    if (modal) modal.classList.add("hidden");
  },

  checkPincode() {
    const pin = document.getElementById("pincodeInput")?.value.trim();
    const res = document.getElementById("pincodeResult");
    if (!res) return;

    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      res.className = "mt-2 text-xs text-rose-500";
      res.innerText = "Please enter a valid 6-digit Indian PIN code.";
      res.classList.remove("hidden");
      return;
    }

    res.className = "mt-2 text-xs text-emerald-600 flex items-center gap-1.5 font-medium";
    res.innerHTML = `✓ Delivery available to PIN <b>${pin}</b>: Free Express Delivery by tomorrow! Cash on Delivery is eligible.`;
    res.classList.remove("hidden");
  },

  toggleReviewForm() {
    document.getElementById("reviewForm")?.classList.toggle("hidden");
  },

  async submitReview(prodId) {
    const comment = document.getElementById("newReviewComment")?.value.trim();
    const rating = document.getElementById("newReviewRating")?.value || 5;
    if (!comment) { showToast("Please write a comment", "warning"); return; }
    const res = await API.post("/api/reviews", { product_id: prodId, rating: parseInt(rating), comment: comment });
    if (res.error) { showToast(res.error, "error"); return; }
    showToast("Review submitted successfully!");
    this.openDetailModal(prodId);
  },

  async toggleWishlist(prodId) {
    const res = await API.post("/api/wishlist/toggle", { product_id: prodId });
    if (res.error) { showToast(res.error, "warning"); AuthState.openModal(); return; }
    showToast(res.message);
    if (window.CartState) await CartState.loadWishlist();
    this.renderProducts();
  },

  setupEventListeners() {
    const searchInput = document.getElementById("catalogSearchInput");
    if (searchInput) {
      let timer;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          Store.searchQuery = e.target.value.trim();
          Store.loadProducts();
        }, 300);
      });
    }

    document.getElementById("catalogSortSelect")?.addEventListener("change", (e) => {
      Store.sortBy = e.target.value;
      Store.loadProducts();
    });

    const priceSlider = document.getElementById("priceSlider");
    const priceDisplay = document.getElementById("priceDisplay");
    if (priceSlider && priceDisplay) {
      priceSlider.addEventListener("input", (e) => {
        Store.priceMax = parseInt(e.target.value);
        priceDisplay.innerText = formatINR(Store.priceMax);
      });
      priceSlider.addEventListener("change", () => Store.loadProducts());
    }
  },

  resetFilters() {
    this.searchQuery = "";
    this.activeCategory = "all";
    this.priceMin = 0;
    this.priceMax = 150000;
    this.minRating = 0;
    this.inStockOnly = false;
    this.sortBy = "featured";

    const searchInput = document.getElementById("catalogSearchInput");
    if (searchInput) searchInput.value = "";
    const priceSlider = document.getElementById("priceSlider");
    const priceDisplay = document.getElementById("priceDisplay");
    if (priceSlider) priceSlider.value = 150000;
    if (priceDisplay) priceDisplay.innerText = "₹1,50,000";

    this.renderCategoryBar();
    this.renderCategoryFilters();
    this.loadProducts();
  }
};
