# -*- coding: utf-8 -*-
# Nexus AI Ecommerce Seed Data

DEMO_USERS = [
    {
        'id': 1,
        'name': 'Arjun Sharma',
        'email': 'customer@nexus.ai',
        'password': 'customer123',
        'role': 'customer',
        'phone': '+91 98765 43210',
        'address': 'Flat 402, Royal Palms, Indiranagar, Bengaluru, Karnataka 560038'
    },
    {
        'id': 2,
        'name': 'TechNova Retail (Priya Patel)',
        'email': 'seller@nexus.ai',
        'password': 'seller123',
        'role': 'seller',
        'phone': '+91 91234 56789',
        'address': 'Unit 12, Nexus Tech Park, Whitefield, Bengaluru, Karnataka 560066'
    },
    {
        'id': 3,
        'name': 'Nexus Super Admin',
        'email': 'admin@nexus.ai',
        'password': 'admin123',
        'role': 'admin',
        'phone': '+91 99999 88888',
        'address': 'Nexus HQ, Cyber City, Gurugram, Haryana 122002'
    }
]

# Sample from 54 products across 6 categories:
PRODUCTS = [
    {
        "id": 1, "seller_id": 2, "title": "Apple iPhone 15 Pro (128GB - Natural Titanium)",
        "category": "Electronics", "price_inr": 124990, "mrp_inr": 134900, "stock": 18,
        "rating": 4.9, "reviews_count": 528, "badge": "AI Pick",
        "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
        "specs": {"Brand": "Apple", "Chip": "A17 Pro", "Display": "6.1 Super Retina XDR OLED", "Warranty": "1 Year Apple Care"}
    },
    {
        "id": 13, "seller_id": 2, "title": "Manyavar Men Royal Embroidered Jacquard Kurta Pajama Set",
        "category": "Fashion", "price_inr": 4999, "mrp_inr": 7999, "stock": 40,
        "rating": 4.7, "reviews_count": 340, "badge": "Festive Special",
        "image_url": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
        "specs": {"Fabric": "Silk Blend Jacquard", "Fit": "Regular Fit", "Occasion": "Festive, Wedding"}
    },
    {
        "id": 23, "seller_id": 2, "title": "De'Longhi Dedica Deluxe Espresso & Cappuccino Machine",
        "category": "Home & Kitchen", "price_inr": 24990, "mrp_inr": 32990, "stock": 16,
        "rating": 4.8, "reviews_count": 320, "badge": "Barista Choice",
        "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
        "specs": {"Pressure": "15 Bar Italian Pump", "Heating": "Thermoblock Rapid Heat", "Body": "Stainless Steel"}
    }
    # ... (Total 54 products across Electronics, Fashion, Home & Kitchen, Beauty, Books, Fitness)
]
