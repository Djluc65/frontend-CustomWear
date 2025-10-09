// Données de test pour le dashboard admin

export const mockStats = {
  overview: {
    totalUsers: 1250,
    newUsersThisMonth: 85,
    totalProducts: 45,
    activeProducts: 42,
    totalOrders: 320,
    ordersThisMonth: 28,
    totalRevenue: 45680.50,
    monthlyRevenue: 8950.75
  },
  recentOrders: [
    {
      _id: '1',
      orderNumber: 'ORD-001',
      user: { firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@email.com' },
      totalAmount: 89.99,
      status: 'pending',
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      orderNumber: 'ORD-002',
      user: { firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@email.com' },
      totalAmount: 129.50,
      status: 'processing',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      _id: '3',
      orderNumber: 'ORD-003',
      user: { firstName: 'Pierre', lastName: 'Durand', email: 'pierre.durand@email.com' },
      totalAmount: 75.25,
      status: 'shipped',
      createdAt: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  topProducts: [
    {
      _id: '1',
      name: 'T-shirt Personnalisé Premium',
      totalSold: 45,
      revenue: 1350.00
    },
    {
      _id: '2',
      name: 'Hoodie Custom Design',
      totalSold: 32,
      revenue: 1920.00
    },
    {
      _id: '3',
      name: 'Casquette Brodée',
      totalSold: 28,
      revenue: 840.00
    }
  ]
};

export const mockProducts = [
  {
    _id: '1',
    name: 'T-shirt Personnalisé Premium',
    description: 'T-shirt en coton bio de haute qualité, parfait pour la personnalisation',
    price: 29.99,
    category: { _id: 'cat1', name: 'T-shirts' },
    images: ['/images/tshirt1.jpg'],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blanc', 'Noir', 'Bleu', 'Rouge'],
    materials: ['Coton bio'],
    sku: 'TSH-PREM-001',
    stock: 150,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Hoodie Custom Design',
    description: 'Sweat à capuche confortable avec possibilité de personnalisation complète',
    price: 59.99,
    category: { _id: 'cat2', name: 'Sweats' },
    images: ['/images/hoodie1.jpg'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Gris', 'Noir', 'Bleu marine'],
    materials: ['Coton', 'Polyester'],
    sku: 'HOO-CUST-001',
    stock: 75,
    status: 'active',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    _id: '3',
    name: 'Casquette Brodée',
    description: 'Casquette ajustable avec broderie personnalisée',
    price: 24.99,
    category: { _id: 'cat3', name: 'Accessoires' },
    images: ['/images/cap1.jpg'],
    sizes: ['Unique'],
    colors: ['Noir', 'Blanc', 'Rouge', 'Bleu'],
    materials: ['Coton'],
    sku: 'CAP-BROD-001',
    stock: 200,
    status: 'active',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

export const mockOrders = [
  {
    _id: '1',
    orderNumber: 'ORD-001',
    user: {
      _id: 'user1',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@email.com'
    },
    items: [
      {
        product: mockProducts[0],
        quantity: 2,
        price: 29.99,
        customization: { text: 'Mon Design', color: 'Blanc' }
      }
    ],
    totalAmount: 89.99,
    status: 'pending',
    shippingAddress: {
      street: '123 Rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    orderNumber: 'ORD-002',
    user: {
      _id: 'user2',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@email.com'
    },
    items: [
      {
        product: mockProducts[1],
        quantity: 1,
        price: 59.99,
        customization: { text: 'Custom Hoodie', color: 'Gris' }
      }
    ],
    totalAmount: 129.50,
    status: 'processing',
    shippingAddress: {
      street: '456 Avenue des Champs',
      city: 'Lyon',
      postalCode: '69001',
      country: 'France'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString()
  },
  {
    _id: '3',
    orderNumber: 'ORD-003',
    user: {
      _id: 'user3',
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre.durand@email.com'
    },
    items: [
      {
        product: mockProducts[2],
        quantity: 3,
        price: 24.99,
        customization: { text: 'Team Logo', color: 'Noir' }
      }
    ],
    totalAmount: 75.25,
    status: 'shipped',
    shippingAddress: {
      street: '789 Boulevard Saint-Germain',
      city: 'Marseille',
      postalCode: '13001',
      country: 'France'
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const mockUsers = [
  {
    _id: 'user1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@email.com',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 2592000000).toISOString(), // 30 jours
    lastLogin: new Date(Date.now() - 86400000).toISOString(),
    ordersCount: 5,
    totalSpent: 299.95
  },
  {
    _id: 'user2',
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@email.com',
    role: 'user',
    status: 'active',
    createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 jours
    lastLogin: new Date(Date.now() - 43200000).toISOString(),
    ordersCount: 3,
    totalSpent: 189.97
  },
  {
    _id: 'user3',
    firstName: 'Pierre',
    lastName: 'Durand',
    email: 'pierre.durand@email.com',
    role: 'user',
    status: 'inactive',
    createdAt: new Date(Date.now() - 7776000000).toISOString(), // 90 jours
    lastLogin: new Date(Date.now() - 2592000000).toISOString(),
    ordersCount: 1,
    totalSpent: 75.25
  },
  {
    _id: 'admin1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@customwear.com',
    role: 'admin',
    status: 'active',
    createdAt: new Date(Date.now() - 31536000000).toISOString(), // 1 an
    lastLogin: new Date().toISOString(),
    ordersCount: 0,
    totalSpent: 0
  }
];