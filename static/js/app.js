// Nexus AI Ecommerce - Main Application Controller
const AuthState = {
  currentUser: null,
  activeAuthTab: "login",
  targetRole: "customer",

  async init() {
    const res = await API.get("/api/auth/me");
    if (res.user) this.currentUser = res.user;
    this.updateUI();
  },

  openModal(preferredRole = "customer") {
    this.targetRole = preferredRole;
    document.getElementById("authModal")?.classList.remove("hidden");
    this.switchTab(this.activeAuthTab);
  },

  closeModal() {
    document.getElementById("authModal")?.classList.add("hidden");
  },

  switchTab(tab) {
    this.activeAuthTab = tab;
    const isLogin = tab === "login";
    document.getElementById("authTabLogin")?.classList.toggle("border-indigo-600", isLogin);
    document.getElementById("authTabLogin")?.classList.toggle("text-indigo-600", isLogin);
    document.getElementById("authTabRegister")?.classList.toggle("border-indigo-600", !isLogin);
    document.getElementById("authTabRegister")?.classList.toggle("text-indigo-600", !isLogin);

    document.getElementById("authFormLogin")?.classList.toggle("hidden", !isLogin);
    document.getElementById("authFormRegister")?.classList.toggle("hidden", isLogin);
  },

  setRegisterRole(role) {
    this.targetRole = role;
    const isCust = role === "customer";
    document.getElementById("regRoleCustomer")?.classList.toggle("bg-indigo-600", isCust);
    document.getElementById("regRoleCustomer")?.classList.toggle("text-white", isCust);
    document.getElementById("regRoleSeller")?.classList.toggle("bg-indigo-600", !isCust);
    document.getElementById("regRoleSeller")?.classList.toggle("text-white", !isCust);
  },

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;

    const res = await API.post("/api/auth/login", { email, password });
    if (res.error) { showToast(res.error, "error"); return; }

    this.currentUser = res.user;
    this.closeModal();
    this.updateUI();
    showToast(`Welcome back, ${res.user.name}!`);

    if (['seller', 'admin'].includes(res.user.role)) SellerState.openPortal();
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("regName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value;
    const phone = document.getElementById("regPhone")?.value.trim();
    const address = document.getElementById("regAddress")?.value.trim();

    const res = await API.post("/api/auth/register", { name, email, password, role: this.targetRole, phone, address });
    if (res.error) { showToast(res.error, "error"); return; }

    this.currentUser = res.user;
    this.closeModal();
    this.updateUI();
    showToast(`Account registered as ${this.targetRole}!`);

    if (['seller', 'admin'].includes(this.targetRole)) SellerState.openPortal();
  },

  async quickDemoLogin(role) {
    const res = await API.post("/api/auth/quick-login", { role });
    if (res.error) { showToast(res.error, "error"); return; }
    this.currentUser = res.user;
    this.closeModal();
    this.updateUI();
    showToast(`Logged in as ${res.user.name} (${role})`);

    if (['seller', 'admin'].includes(role)) SellerState.openPortal();
  },

  async logout() {
    await API.post("/api/auth/logout");
    this.currentUser = null;
    this.updateUI();
    showToast("Logged out successfully");
  },

  updateUI() {
    const user = this.currentUser;
    const guestBtns = document.querySelectorAll(".auth-guest-only");
    const userBtns = document.querySelectorAll(".auth-user-only");
    const userNameEl = document.getElementById("navUserName");
    const userRoleBadge = document.getElementById("navUserRoleBadge");
    const sellerPortalBtn = document.getElementById("navSellerPortalBtn");

    if (user) {
      guestBtns.forEach(el => el.classList.add("hidden"));
      userBtns.forEach(el => el.classList.remove("hidden"));
      if (userNameEl) userNameEl.innerText = user.name.split(" ")[0];
      if (userRoleBadge) {
        userRoleBadge.innerText = user.role.toUpperCase();
        userRoleBadge.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${
          user.role === 'seller' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-700'
        }`;
      }
      if (sellerPortalBtn) {
        sellerPortalBtn.classList.toggle("hidden", !['seller', 'admin'].includes(user.role));
      }
    } else {
      guestBtns.forEach(el => el.classList.remove("hidden"));
      userBtns.forEach(el => el.classList.add("hidden"));
      if (sellerPortalBtn) sellerPortalBtn.classList.add("hidden");
    }
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) lucide.createIcons();
  await AuthState.init();
  await CartState.init();
  await Store.init();
  AIAssistant.init();

  // Instant Header Search Autocomplete
  const navSearch = document.getElementById("navSearchInput");
  const navDropdown = document.getElementById("navSearchDropdown");
  if (navSearch && navDropdown) {
    let timer;
    navSearch.addEventListener("input", (e) => {
      clearTimeout(timer);
      const val = e.target.value.trim().toLowerCase();
      if (!val) { navDropdown.classList.add("hidden"); return; }

      timer = setTimeout(() => {
        const matches = Store.products.filter(p => p.title.toLowerCase().includes(val) || p.category.toLowerCase().includes(val)).slice(0, 5);
        if (matches.length > 0) {
          navDropdown.innerHTML = matches.map(m => `
            <div onclick="Store.openDetailModal(${m.id}); document.getElementById('navSearchDropdown').classList.add('hidden');" class="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
              <img src="${m.image_url}" class="w-8 h-8 rounded object-cover flex-shrink-0">
              <div class="flex-1 min-w-0">
                <div class="text-xs font-semibold text-slate-900 truncate">${m.title}</div>
                <div class="text-[10px] text-slate-500">${m.category} • <span class="text-indigo-600 font-bold">${formatINR(m.price_inr)}</span></div>
              </div>
            </div>
          `).join("");
          navDropdown.classList.remove("hidden");
        } else {
          navDropdown.innerHTML = `<div class="p-3 text-xs text-slate-500 text-center">No matching products found</div>`;
          navDropdown.classList.remove("hidden");
        }
      }, 250);
    });

    document.addEventListener("click", (e) => {
      if (!navSearch.contains(e.target) && !navDropdown.contains(e.target)) {
        navDropdown.classList.add("hidden");
      }
    });
  }
});
