CheckoutState.selectPayment = function(method) {
  this.selectedPayment = method;
  ["upi", "card", "netbanking", "cod"].forEach(m => {
    const tab = document.getElementById(`payTab_${m}`);
    const pane = document.getElementById(`payPane_${m}`);
    if (tab) tab.className = m === method 
      ? "flex-1 py-2.5 px-3 text-xs font-bold rounded-xl bg-indigo-600 text-white text-center shadow-md"
      : "flex-1 py-2.5 px-3 text-xs font-semibold rounded-xl bg-slate-100 text-slate-600 text-center";
    if (pane) pane.classList.toggle("hidden", m !== method);
  });
};

CheckoutState.viewInvoice = async function(orderCode) {
  orderCode = orderCode || this.lastOrderData?.order_code;
  const order = await API.get(`/api/orders/${orderCode}`);
  const modal = document.getElementById("invoiceModal");
  const content = document.getElementById("invoiceContent");

  const itemsHtml = order.items.map((item, idx) => `
    <tr class="border-b border-slate-200">
      <td class="py-2.5 px-3 text-slate-700 text-center">${idx + 1}</td>
      <td class="py-2.5 px-3 text-slate-900 font-medium">${item.title}</td>
      <td class="py-2.5 px-3 text-slate-600 text-center">8517</td>
      <td class="py-2.5 px-3 text-slate-700 text-center">${item.quantity}</td>
      <td class="py-2.5 px-3 text-slate-900 text-right font-medium">${formatINR(item.price)}</td>
      <td class="py-2.5 px-3 text-slate-900 text-right font-bold">${formatINR(item.price * item.quantity)}</td>
    </tr>
  `).join("");

  content.innerHTML = `
    <div class="bg-white text-slate-900 p-8 rounded-2xl shadow-2xl max-w-3xl mx-auto border border-slate-200">
      <div class="flex justify-between pb-4 border-b border-slate-300 mb-6">
        <div>
          <span class="text-2xl font-black text-indigo-600">NEXUS AI</span>
          <span class="text-xs bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded ml-2">TAX INVOICE</span>
          <p class="text-xs text-slate-500 mt-1">Nexus AI Ecommerce Pvt. Ltd.<br>GSTIN: 29AABCN8891Q1Z4 | CIN: U72200KA2026PTC109823</p>
        </div>
        <div class="text-right text-xs">
          <p><b>Invoice No:</b> INV-${order.order_code}</p>
          <p><b>Date:</b> ${order.created_at}</p>
          <p><b>Payment:</b> ${order.payment_method}</p>
        </div>
      </div>
      <table class="w-full text-xs mb-6 border border-slate-200">
        <thead class="bg-slate-100 text-slate-700 font-bold">
          <tr><th class="py-2 px-3">#</th><th class="py-2 px-3 text-left">Description</th><th class="py-2 px-3">HSN</th><th class="py-2 px-3">Qty</th><th class="py-2 px-3 text-right">Unit Rate</th><th class="py-2 px-3 text-right">Total</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="flex justify-end gap-3 no-print">
        <button onclick="window.print()" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold">🖨️ Print / Save PDF</button>
        <button onclick="CheckoutState.closeInvoice()" class="px-5 py-2.5 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold">Close</button>
      </div>
    </div>
  `;
  modal.classList.remove("hidden");
};
