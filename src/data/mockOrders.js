export const initialOrders = [
  {
    id: 'GC-2026-9812',
    date: '2026-09-17T10:30:00Z',
    formattedDate: '17 Sep 2026, 10:30 AM',
    status: 'Delivered',
    statusStep: 4, // 1: Placed, 2: Packed, 3: Out for Delivery, 4: Delivered
    deliverySlot: 'Morning (07:00 AM - 10:00 AM)',
    address: {
      fullName: 'Rahul Sharma',
      phone: '+91 98765 43210',
      street: 'Flat 402, Green Meadows Residency, Sector 14',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122001'
    },
    items: [
      {
        id: 'prod-fv-01',
        name: 'Fresh Organic Robusta Bananas',
        unit: '1 kg (5-6 pcs)',
        price: 48,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'prod-db-01',
        name: 'Farm Fresh Homogenized Cow Milk',
        unit: '1 L (Pouch)',
        price: 56,
        quantity: 3,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'prod-rag-01',
        name: 'Chakki Fresh Shudh Whole Wheat Atta',
        unit: '5 kg',
        price: 229,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 493,
    deliveryFee: 0,
    discountSavings: 115,
    total: 493,
    paymentMethod: 'Cash on Delivery'
  },
  {
    id: 'GC-2026-8941',
    date: '2026-09-12T16:15:00Z',
    formattedDate: '12 Sep 2026, 04:15 PM',
    status: 'Delivered',
    statusStep: 4,
    deliverySlot: 'Evening (05:00 PM - 08:00 PM)',
    address: {
      fullName: 'Rahul Sharma',
      phone: '+91 98765 43210',
      street: 'Flat 402, Green Meadows Residency, Sector 14',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122001'
    },
    items: [
      {
        id: 'prod-sn-01',
        name: 'Crunchy Slow-Roasted Salted Almonds',
        unit: '250 g Pouch',
        price: 219,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'prod-bev-01',
        name: '100% Pure Tender Coconut Water',
        unit: '1 L Tetra',
        price: 119,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80'
      }
    ],
    subtotal: 457,
    deliveryFee: 40,
    discountSavings: 162,
    total: 497,
    paymentMethod: 'UPI / Online'
  }
];
