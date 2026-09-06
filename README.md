# Nexus AI Ecommerce Platform 🚀

A full-stack, enterprise-grade E-Commerce web application built with Python, Flask, SQLite, and a modern responsive frontend featuring Tailwind CSS, Lucide icons, Chart.js, and an embedded autonomous AI Shopping Assistant.

---

## 🌟 Key Platform Features

### 1. Dual Customer & Seller Portals
- **Customer Hub**:
  - Browse, live search, and filter 50+ handpicked products across 6 major online categories.
  - Interactive product specifications modal, verified buyer reviews, and instant PIN-code delivery estimator.
  - Persistent Cart & Wishlist with live counter badges.
  - Coupon redemption: `WELCOME10` (10% Off), `NEXUS500` (₹500 Instant Discount on ₹2000+), `AIFEST` (20% Off up to ₹2000).
  - Customer Orders timeline tracking (`Order Placed` ➔ `Confirmed` ➔ `Shipped` ➔ `Out for Delivery` ➔ `Delivered`).
  - Order cancellation & Official Itemized **GST Tax Invoice** view and print/download.
- **Seller Command Center**:
  - Real-time revenue analytics, active catalog tracker, orders received, and low-stock indicators.
  - Visual weekly revenue performance charts powered by Chart.js.
  - Product Catalog CRUD (Add new product with specifications, edit prices and stock, delete products).
  - Order Fulfillment management: Update customer order status from `Processing` to `Shipped` and `Delivered`.

### 2. Multi-Method Payment Portal (INR ₹)
- Simulated high-security 256-bit Indian payment gateway:
  - **UPI / QR**: Live QR code generator, quick apps (PhonePe, GPay, Paytm, CRED), and verified VPA field.
  - **Credit / Debit Cards**: Animated credit card preview with real-time formatting, expiry, CVV, and **3D Secure OTP verification modal** (`1234`).
  - **Net Banking**: Seamless routing through major Indian banks (HDFC, SBI, ICICI, Axis, Kotak, PNB).
  - **Cash on Delivery (COD)**: Doorstep verification option.
- Automatic 18% GST (CGST 9% + SGST 9%) tax calculation and Free Delivery threshold (₹999).
- Instant celebratory confetti animation and downloadable / printable official **GST Tax Invoice**.

### 3. Nexus AI Shopping Assistant
- Always-accessible floating AI shopping companion.
- Natural language query understanding:
  - **Budget Filters**: e.g., *"Suggest headphones under ₹30,000"*
  - **Product Comparisons**: e.g., *"Compare iPhone 15 Pro and Galaxy S24 Ultra"*
  - **Order Lookup**: e.g., *"Where is my order NEX-88219?"*
  - **Coupons & Policies**: Informs users of active promo codes, warranty policies, and 7-day easy returns.
  - **Embedded Product Cards**: Direct "Add to Cart" and "Quick View" buttons inside the AI response.

### 4. 54 Pre-Seeded Products in INR
- Electronics & Gadgets (12 products: Apple, Samsung, Sony, DJI, Anker, PS5)
- Fashion & Apparel (10 products: Manyavar, Sabyasachi, Nike Jordan, Fossil, Ray-Ban, Levi's)
- Home & Kitchen (9 products: De'Longhi Espresso, Philips Air Fryer, ECOVACS Robot Vac, Dyson)
- Beauty & Personal Care (8 products: Dior, The Ordinary, Oral-B iO9, Dyson Nural, Forest Essentials)
- Books & Tech (7 products: LLM Applications, Atomic Habits, Clean Code, Kindle Paperwhite)
- Fitness & Sports (8 products: Bowflex Dumbbells, Manduka PRO Mat, ON Whey Protein, Yonex)

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Features Accessible |
|---|---|---|---|
| **Customer** | `customer@nexus.ai` | `customer123` | Cart, Wishlist, Checkout, My Orders tracking, Reviews |
| **Seller** | `seller@nexus.ai` | `seller123` | Seller Dashboard, Revenue charts, Add/Edit/Delete products, Fulfill orders |
| **Admin** | `admin@nexus.ai` | `admin123` | Full access to both Customer & Seller features |

*(1-Click Demo Login buttons are also directly available on the Sign In modal for immediate access!)*

---

## 💻 How to Run the Application

### Option A: Using Windows Launcher
Simply double-click `run.bat` or run:
```powershell
.\run.bat
