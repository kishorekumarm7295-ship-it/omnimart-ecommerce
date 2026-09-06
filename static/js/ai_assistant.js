// Nexus AI Ecommerce - Intelligent AI Shopping Buddy
const AIAssistant = {
  isOpen: false,
  isTyping: false,

  init() {
    document.getElementById("aiChatInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  },

  toggleChat() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById("aiChatPanel");
    if (panel) {
      panel.classList.toggle("hidden", !this.isOpen);
      if (this.isOpen) {
        document.getElementById("aiNotificationDot")?.classList.add("hidden");
        document.getElementById("aiChatInput")?.focus();
        this.scrollToBottom();
      }
    }
  },

  openWithPrompt(text) {
    if (!this.isOpen) this.toggleChat();
    const input = document.getElementById("aiChatInput");
    if (input) {
      input.value = text;
      this.sendMessage();
    }
  },

  async sendMessage() {
    const input = document.getElementById("aiChatInput");
    const msg = input?.value.trim();
    if (!msg || this.isTyping) return;

    input.value = "";
    this.appendMessage("user", msg);
    this.showTypingIndicator();

    const res = await API.post("/api/ai/chat", { message: msg });
    this.hideTypingIndicator();

    if (res.reply) {
      this.appendMessage("ai", res.reply, res.product_cards);
    } else {
      this.appendMessage("ai", "I'm ready to help! Ask me for recommendations in INR, budget comparisons, or order tracking.");
    }
  },

  appendMessage(sender, text, productCards = []) {
    const container = document.getElementById("aiChatMessages");
    if (!container) return;

    const msgDiv = document.createElement("div");
    msgDiv.className = `flex ${sender === "user" ? "justify-end" : "justify-start"} mb-4`;

    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.*?)\*/g, '<i>$1</i>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-200 text-indigo-700 px-1 py-0.5 rounded text-[11px] font-mono">$1</code>')
      .replace(/\n/g, '<br>');

    let cardsHtml = "";
    if (productCards && productCards.length > 0) {
      cardsHtml = `<div class="grid grid-cols-1 gap-2 mt-3 pt-3 border-t border-slate-200">`;
      productCards.forEach(p => {
        cardsHtml += `
          <div class="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 shadow-sm transition">
            <img src="${p.image_url}" alt="${p.title}" class="w-11 h-11 rounded-lg object-cover bg-slate-100 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'">
            <div class="flex-1 min-w-0">
              <div class="text-[11px] font-bold text-slate-900 truncate" title="${p.title}">${p.title}</div>
              <div class="flex items-center gap-1.5 mt-0.5">
                <span class="text-xs font-extrabold text-indigo-600">${formatINR(p.price_inr)}</span>
                <span class="text-[10px] text-amber-500 font-bold">★ ${p.rating}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button onclick="CartState.addItem(${p.id}, 1)" class="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold" title="Add to cart">
                <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="Store.openDetailModal(${p.id})" class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600" title="Quick view">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        `;
      });
      cardsHtml += `</div>`;
    }

    if (sender === "user") {
      msgDiv.innerHTML = `
        <div class="max-w-[82%] bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed shadow-sm">
          ${formattedText}
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="flex gap-2.5 max-w-[90%]">
          <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          </div>
          <div class="flex-1 bg-white border border-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed shadow-sm">
            ${formattedText}
            ${cardsHtml}
          </div>
        </div>
      `;
    }

    container.appendChild(msgDiv);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
  },

  showTypingIndicator() {
    this.isTyping = true;
    const container = document.getElementById("aiChatMessages");
    if (!container) return;

    const ind = document.createElement("div");
    ind.id = "aiTypingIndicator";
    ind.className = "flex items-center gap-2 mb-4 text-xs text-slate-500";
    ind.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
        <i data-lucide="bot" class="w-3.5 h-3.5"></i>
      </div>
      <div class="bg-white border border-slate-200 p-2.5 rounded-xl rounded-tl-none flex items-center gap-1.5 shadow-xs">
        <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
        <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
        <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
      </div>
    `;
    container.appendChild(ind);
    if (window.lucide) lucide.createIcons();
    this.scrollToBottom();
  },

  hideTypingIndicator() {
    this.isTyping = false;
    document.getElementById("aiTypingIndicator")?.remove();
  },

  scrollToBottom() {
    const container = document.getElementById("aiChatMessages");
    if (container) container.scrollTop = container.scrollHeight;
  },

  clearChat() {
    const container = document.getElementById("aiChatMessages");
    if (container) {
      container.innerHTML = `
        <div class="flex gap-2.5 max-w-[90%] mb-4">
          <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-sm">
            <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          </div>
          <div class="bg-white border border-slate-200 text-slate-800 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed shadow-sm">
            Namaste! 🙏 I am your <b>Nexus AI Shopping Buddy</b>. Ask me for recommendations, price comparisons, active coupons, or track your orders in INR!
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  }
};
