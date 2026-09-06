# -*- coding: utf-8 -*-
import sqlite3, os, json
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), 'nexus_ecommerce.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT UNIQUE,
        password_hash TEXT, role TEXT DEFAULT "customer", phone TEXT, address TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT, seller_id INTEGER DEFAULT 2, title TEXT, category TEXT,
        description TEXT, price_inr INTEGER, mrp_inr INTEGER, stock INTEGER DEFAULT 10,
        rating REAL DEFAULT 4.5, reviews_count INTEGER DEFAULT 0, image_url TEXT, badge TEXT, specs_json TEXT
    );''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT, order_code TEXT UNIQUE, user_id INTEGER,
        customer_name TEXT, customer_email TEXT, total_amount INTEGER, subtotal INTEGER,
        discount INTEGER, tax INTEGER, shipping INTEGER, payment_method TEXT, payment_status TEXT,
        order_status TEXT, shipping_address TEXT, tracking_number TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_id INTEGER, title TEXT, price INTEGER, quantity INTEGER, image_url TEXT
    );''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, product_id INTEGER, quantity INTEGER DEFAULT 1, UNIQUE(user_id, product_id)
    );''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, product_id INTEGER, UNIQUE(user_id, product_id)
    );''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER, user_id INTEGER, user_name TEXT, rating INTEGER, comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );''')
    conn.commit()
    
    # Auto-seed if empty
    if cursor.execute('SELECT COUNT(*) as cnt FROM products').fetchone()['cnt'] == 0:
        import seed_data
        for u in seed_data.DEMO_USERS:
            cursor.execute('INSERT OR IGNORE INTO users (id, name, email, password_hash, role, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
                           (u['id'], u['name'], u['email'], generate_password_hash(u['password']), u['role'], u['phone'], u['address']))
        for p in seed_data.PRODUCTS:
            cursor.execute('INSERT INTO products (id, seller_id, title, category, description, price_inr, mrp_inr, stock, rating, reviews_count, image_url, badge, specs_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                           (p['id'], p['seller_id'], p['title'], p['category'], p['description'], p['price_inr'], p['mrp_inr'], p['stock'], p['rating'], p['reviews_count'], p['image_url'], p.get('badge'), json.dumps(p.get('specs', {}))))
        conn.commit()
    conn.close()
