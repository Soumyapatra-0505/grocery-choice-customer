# Grocery Choice - Customer Application

This directory contains the independent customer-facing web application for **Grocery Choice**, built with React 19, Vite 8, React Router v7, and Vanilla CSS.

## Features

- **Branding**: Original Grocery Choice logo, custom color palette, responsive navigation.
- **Browse & Search**: 8 categories, 24+ products, dynamic search with suggestions, filters, and sorting.
- **Product Details**: Image preview, discount calculator, stock indicators, quantity selector.
- **Cart & Checkout**: Cart drawer/page with free delivery threshold tracker, express delivery slot selection, order validation.
- **Delivery Location**:
  - Delivery location selector in customer header
  - Option 1: Browser Geolocation API GPS detection (zero external API keys needed)
  - Option 2: Full manual address entry with 6-digit PIN validation
  - Saved addresses management (switch, edit, delete)
  - Automatic `localStorage` persistence
  - Strict checkout guard requiring location selection before order placement
- **Mock Authentication & Order History**: One-click demo sign-in and persistent order history.

## Development & Build Commands

Inside `customer/`:

```bash
# Start local development server on http://localhost:5173
npm run dev

# Build production bundle
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```
