@echo off
title Nexus AI Ecommerce Platform
echo ========================================================
echo          Starting Nexus AI Ecommerce Server
echo ========================================================
echo.
echo URL: http://127.0.0.1:5000
echo Currency: INR (Rs.)
echo Demo Accounts:
echo  - Customer: customer@nexus.ai / customer123
echo  - Seller:   seller@nexus.ai / seller123
echo  - Admin:    admin@nexus.ai / admin123
echo.
echo Press Ctrl+C to stop the server.
echo ========================================================
echo.
python app.py
pause
