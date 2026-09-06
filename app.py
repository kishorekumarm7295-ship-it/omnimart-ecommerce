# -*- coding: utf-8 -*-
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3, json, random, datetime, re, os, database

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = 'nexus-ai-ecommerce-secret-production-key-2026'

database.init_db()

def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    conn = database.get_db()
    user = conn.execute('SELECT id, name, email, role, phone, address FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return dict(user) if user else None

# --- AUTH ROUTES ---
@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    return jsonify({'user': get_current_user()})

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json() or {}
    email, password = data.get('email', '').strip().lower(), data.get('password', '')
    conn = database.get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    conn.close()
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid email or password'}), 401
    session['user_id'] = user['id']
    session['user_role'] = user['role']
    return jsonify({'message': 'Login successful', 'user': dict(user)})

@app.route('/api/auth/quick-login', methods=['POST'])
def auth_quick_login():
    role = (request.get_json() or {}).get('role', 'customer')
    email_map = {'customer': 'customer@nexus.ai', 'seller': 'seller@nexus.ai', 'admin': 'admin@nexus.ai'}
    conn = database.get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ?', (email_map.get(role),)).fetchone()
    conn.close()
    if not user: return jsonify({'error': 'Demo account not found'}), 404
    session['user_id'] = user['id']
    session['user_role'] = user['role']
    return jsonify({'message': f'Logged in as {role.capitalize()}', 'user': dict(user)})

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    session.clear()
    return jsonify({'message': 'Logged out'})

# --- PRODUCTS & CATEGORIES ---
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = database.get_db()
    rows = conn.execute('SELECT category, COUNT(*) as count, MIN(price_inr) as min_price, MAX(price_inr) as max_price FROM products GROUP BY category ORDER BY count DESC').fetchall()
    conn.close()
    return jsonify({'categories': [dict(r) for r in rows]})

@app.route('/api/products', methods=['GET'])
def get_products():
    q = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    min_price = request.args.get('min_price', type=int)
    max_price = request.args.get('max_price', type=int)
    min_rating = request.args.get('min_rating', type=float)
    sort_by = request.args.get('sort_by', 'featured')

    query = 'SELECT * FROM products WHERE 1=1'
    params = []
    if q:
        query += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)'
        params.extend([f'%{q}%', f'%{q}%', f'%{q}%'])
    if category and category.lower() != 'all':
        query += ' AND category = ?'
        params.append(category)
    if min_price is not None:
        query += ' AND price_inr >= ?'
        params.append(min_price)
    if max_price is not None:
        query += ' AND price_inr <= ?'
        params.append(max_price)
    if min_rating is not None:
        query += ' AND rating >= ?'
        params.append(min_rating)

    if sort_by == 'price_asc': query += ' ORDER BY price_inr ASC'
    elif sort_by == 'price_desc': query += ' ORDER BY price_inr DESC'
    elif sort_by == 'rating_desc': query += ' ORDER BY rating DESC'
    elif sort_by == 'newest': query += ' ORDER BY id DESC'
    else: query += ' ORDER BY rating DESC, reviews_count DESC'

    conn = database.get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()

    products = []
    for r in rows:
        d = dict(r)
        d['specs'] = json.loads(d.get('specs_json') or '{}')
        d['discount_pct'] = round(((d['mrp_inr'] - d['price_inr']) / d['mrp_inr']) * 100) if d.get('mrp_inr') > d['price_inr'] else 0
        products.append(d)
    return jsonify({'products': products, 'total': len(products)})

# --- CART & WISHLIST ---
@app.route('/api/cart', methods=['GET', 'POST'])
def cart_ops():
    user = get_current_user()
    if not user: return jsonify({'error': 'Unauthorized'}), 401
    conn = database.get_db()
    if request.method == 'GET':
        rows = conn.execute('SELECT c.quantity, p.* FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', (user['id'],)).fetchall()
        conn.close()
        items = [dict(r) for r in rows]
        return jsonify({'items': items, 'subtotal': sum(i['price_inr'] * i['quantity'] for i in items)})
    else:
        pid = request.get_json().get('product_id')
        qty = int(request.get_json().get('quantity', 1))
        conn.execute('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + ?', (user['id'], pid, qty, qty))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Added to cart'})

# --- ORDERS & CHECKOUT ---
@app.route('/api/orders', methods=['POST'])
def create_order():
    user = get_current_user()
    if not user: return jsonify({'error': 'Please login to order'}), 401
    data = request.get_json() or {}
    conn = database.get_db()
    cart = conn.execute('SELECT c.quantity, p.* FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', (user['id'],)).fetchall()
    if not cart:
        conn.close()
        return jsonify({'error': 'Cart is empty'}), 400

    subtotal = sum(c['price_inr'] * c['quantity'] for c in cart)
    coupon = data.get('coupon_code', '').upper()
    discount = 500 if coupon == 'NEXUS500' and subtotal >= 2000 else (round(subtotal * 0.10) if coupon == 'WELCOME10' else 0)
    shipping = 0 if subtotal >= 999 else 99
    tax = round((subtotal - discount) * 0.18)
    total = max(0, (subtotal - discount) + shipping)
    order_code = f"NEX-{random.randint(10000, 99999)}"

    cursor = conn.cursor()
    cursor.execute('INSERT INTO orders (order_code, user_id, customer_name, customer_email, total_amount, subtotal, discount, tax, shipping, payment_method, payment_status, order_status, shipping_address, tracking_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                   (order_code, user['id'], user['name'], user['email'], total, subtotal, discount, tax, shipping, data.get('payment_method', 'UPI'), 'Completed', 'Processing', data.get('shipping_address'), f"NX-TRK-{random.randint(100000, 999999)}"))
    oid = cursor.lastrowid
    for item in cart:
        cursor.execute('INSERT INTO order_items (order_id, product_id, title, price, quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)', (oid, item['id'], item['title'], item['price_inr'], item['quantity'], item['image_url']))
        cursor.execute('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?', (item['quantity'], item['id']))
    cursor.execute('DELETE FROM cart WHERE user_id = ?', (user['id'],))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Order created', 'order_code': order_code, 'total_amount': total})

# --- NEXUS AI CHAT ENGINE ---
@app.route('/api/ai/chat', methods=['POST'])
def ai_chat():
    msg = (request.get_json() or {}).get('message', '').strip().lower()
    conn = database.get_db()
    
    # 1. Order Tracking
    match = re.search(r'NEX-\d+', msg, re.IGNORECASE)
    if 'track' in msg or match:
        code = match.group(0).upper() if match else 'NEX-88219'
        order = conn.execute('SELECT * FROM orders WHERE order_code = ?', (code,)).fetchone()
        if order:
            conn.close()
            return jsonify({'reply': f"📦 **Order Found: {order['order_code']}**\n• Status: `{order['order_status']}`\n• Total: ₹{order['total_amount']:,}\n• Tracking: `{order['tracking_number']}`\n• Delivery to: {order['shipping_address']}", 'product_cards': []})

    # 2. Deals / Coupons
    if any(k in msg for k in ['coupon', 'deal', 'offer', 'discount']):
        deals = conn.execute('SELECT * FROM products WHERE badge IN ("Hot Deal", "Bestseller") LIMIT 3').fetchall()
        conn.close()
        return jsonify({
            'reply': "🎉 **Active Nexus Coupons:**\n1. `WELCOME10` (10% Off)\n2. `NEXUS500` (₹500 Off on ₹2000+)\n3. `AIFEST` (20% Savings)\nFree delivery on orders above ₹999!",
            'product_cards': [dict(d) for d in deals]
        })

    # 3. Budget / Category Search
    limit = 30000 if '30000' in msg or '30k' in msg else (15000 if '15000' in msg or '15k' in msg else None)
    sql = 'SELECT * FROM products WHERE 1=1'
    params = []
    if limit:
        sql += ' AND price_inr <= ?'; params.append(limit)
    if 'headphone' in msg or 'earbud' in msg:
        sql += ' AND (title LIKE "%headphone%" OR title LIKE "%earbud%")'
    sql += ' ORDER BY rating DESC LIMIT 3'
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return jsonify({
        'reply': f"✨ Here are top-rated options{' within ₹' + str(limit) if limit else ''} from our catalog:",
        'product_cards': [dict(r) for r in rows]
    })

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
