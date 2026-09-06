// Nexus AI Ecommerce - Cart & Wishlist Module
const CartState = {
  items: [],
  wishlistIds: [],
  appliedCoupon: null,
  discount: 0,

  async init() {
    await this.loadCart();
    await this.loadWishlist();
  },

  async loadCart() {
    const res = await API.get("/api/cart");
    this.items = res.items || [];
    this.updateBadges();
    this.renderCartDrawer();
  },

  async loadWishlist() {
    const res = await API.get("/api/wishlist");
    this.wishlistIds = res.product_ids || [];
    const badge = document.getElementById("wishlistBadge");
    if (badge) {
      badge.innerText = this.wishlistIds.length;
      badge.classList.toggle("hidden", this.wishlistIds.length === 0);
    }
  },

  async addItem(productId, quantity = 1) {
    const res = await API.post("/api/cart", { product_id: productId, quantity: quantity });
    if (res.error) {
      showToast(res.error, "warning");
      AuthState.openModal();
      return;
    }
    showToast("Added to Cart!");
    await this.loadCart();
    this.openDrawer();
  },

  async updateQuantity(productId, newQty) {
    if (newQty <= 0) {
      await this.removeItem(productId);
      return;
    }
    await API.put(`/api/cart/${productId}`, { quantity: newQty });
    await this.loadCart();
  },

  async removeItem(productId) {
    await API.delete(`/api/cart/${productId}`);
    showToast("Item removed from cart", "warning");
    await this.loadCart();
  },

  updateBadges() {
    const totalCount = this.items.reduce((sum, i) => sum + i.quantity, 0);
    const badge = document.getElementById("cartBadge");
    if (badge) {
      badge.innerText = totalCount;
      badge.classList.toggle("hidden", totalCount === 0);
    }
  },

  openDrawer() {
    document.getElementById("cartDrawer")?.classList.remove("translate-x-full");
    document.getElementById("cartDrawerOverlay")?.classList.remove("hidden");
  },

  closeDrawer() {
    document.getElementById("cartDrawer")?.classList.add("translate-x-full");
    document.getElementById("cartDrawerOverlay")?.classList.add("hidden");
  },

  applyCoupon(code) {
    code = (code || document.getElementById("couponInput")?.value || "").trim().toUpperCase();
    const subtotal = this.getSubtotal();

    if (!code) { showToast("Please enter a coupon code", "warning"); return; }

    if (code === "WELCOME10") {
      this.appliedCoupon = code;
      this.discount = Math.round(subtotal * 0.10);
      showToast("Coupon WELCOME10 applied: 10% Off!");
    } else if (code === "NEXUS500") {
      if (subtotal < 2000) {
        showToast("NEXUS500 requires minimum order of ₹2,000", "error");
        return;
      }
      this.appliedCoupon = code;
      this.discount = 500;
      showToast("Coupon NEXUS500 applied: ₹500 Instant Discount!");
    } else if (code === "AIFEST") {
      this.appliedCoupon = code;
      this.discount = Math.min(2000, Math.round(subtotal * 0.20));
      showToast("Coupon AIFEST applied: 20% Grand Savings!");
    } else {
      showToast("Invalid or expired coupon code", "error");
      return;
    }

    this.renderCartDrawer();
  },

  removeCoupon() {
    this.appliedCoupon = null;
    this.discount = 0;
    showToast("Coupon removed");
    this.renderCartDrawer();
  },

  getSubtotal() {
    return this.items.reduce((sum, i) => sum + (i.price_inr * i.quantity), 0);
  },

  renderCartDrawer() {
    const list = document.getElementById("cartItemsList");
    const footer = document.getElementById("cartDrawerFooter");
    if (!list || !footer) return;

    if (this.items.length === 0) {
      list.innerHTML = `
        <div class="py-24 text-center px-4">
          <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <i data-lucide="shopping-bag" class="w-8 h-8"></i>
          </div>
          <h4 class="text-slate-900 font-bold text-base">Your cart is empty</h4>
          <p class="text-xs text-slate-500 mt-1">Discover 50+ amazing products and start shopping!</p>
          <button onclick="CartState.closeDrawer()" class="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition">
            Explore Catalog
          </button>
        </div>
      `;
      footer.classList.add("hidden");
      if (window.lucide) lucide.createIcons();
      return;
    }

    footer.classList.remove("hidden");
    let html = "";
    this.items.forEach(item => {
      html += `
        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3">
          <img src="${item.image_url}" alt="${item.title}" class="w-16 h-16 rounded-lg object-cover bg-white flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'">
          
          <div class="flex-1 min-w-0">
            <h5 class="text-xs font-semibold text-slate-900 truncate" title="${item.title}">${item.title}</h5>
            <div class="text-xs text-indigo-600 font-bold mt-0.5">${formatINR(item.price_inr)}</div>

            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button onclick="CartState.updateQuantity(${item.id}, ${item.quantity - 1})" class="px-2 py-0.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs">-</button>
                <span class="px-2.5 py-0.5 text-xs font-bold text-slate-900">${item.quantity}</span>
                <button onclick="CartState.updateQuantity(${item.id}, ${item.quantity + 1})" class="px-2 py-0.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs">+</button>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-xs font-bold text-slate-900">${formatINR(item.price_inr * item.quantity)}</span>
                <button onclick="CartState.removeItem(${item.id})" class="text-slate-400 hover:text-rose-500 transition" title="Remove">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    list.innerHTML = html;

    const subtotal = this.getSubtotal();
    const shipping = subtotal >= 999 ? 0 : 99;
    const grandTotal = Math.max(0, (subtotal - this.discount) + shipping);

    document.getElementById("cartSubtotal").innerText = formatINR(subtotal);
    document.getElementById("cartDiscount").innerText = `-${formatINR(this.discount)}`;
    document.getElementById("cartShipping").innerText = shipping === 0 ? "FREE" : formatINR(shipping);
    document.getElementById("cartGrandTotal").innerText = formatINR(grandTotal);

    const couponTag = document.getElementById("appliedCouponTag");
    if (couponTag) {
      if (this.appliedCoupon) {
        couponTag.innerHTML = `
          <div class="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2 font-medium">
            <span>🎉 Code <b>${this.appliedCoupon}</b> applied (-${formatINR(this.discount)})</span>
            <button onclick="CartState.removeCoupon()" class="text-xs hover:text-black font-bold ml-2">✕</button>
          </div>
        `;
        couponTag.classList.remove("hidden");
      } else {
        couponTag.classList.add("hidden");
      }
    }

    if (window.lucide) lucide.createIcons();
  }
};
