import bcrypt from 'bcryptjs';
import {
  PASSWORDS,
  USER_ROLES,
  FIRST_NAMES,
  LAST_NAMES,
  CATEGORIES,
  COUPON_CODES,
  CITIES,
  STATES,
  STREETS,
  REVIEW_TITLES,
  REVIEW_COMMENTS,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_SUBJECTS,
  TICKET_DESCRIPTIONS,
  TICKET_RESOLUTIONS,
  ID_PREFIX,
  PRODUCTS_NAMES,
} from './constants';

interface GeneratedData {
  users: any[];
  categories: any[];
  products: any[];
  coupons: any[];
  orders: any[];
  reviews: any[];
  addresses: any[];
  tickets: any[];
}

const generateObjectId = (prefix: string, index: number): string => {
  const safePrefix = (prefix || '').toLowerCase().replace(/[^0-9a-f]/g, '');
  const remaining = 24 - safePrefix.length;
  const hexIndex = index.toString(16).padStart(Math.max(0, remaining), '0');
  const id = `${safePrefix}${hexIndex}`.padStart(24, '0').slice(0, 24);
  return id;
};;

const generateDate = (startYear: number, endYear: number): string => {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
};

const slugify = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export async function generateAllSampleData(): Promise<GeneratedData> {
  const users: any[] = [];
  const sellers: any[] = [];
  const customers: any[] = [];
  const supportUsers: any[] = [];
  const categories: any[] = [];
  const products: any[] = [];
  const coupons: any[] = [];
  const orders: any[] = [];
  const reviews: any[] = [];
  const addresses: any[] = [];
  const tickets: any[] = [];

  // Hash passwords
  const HASHED_PASSWORDS = {
    ADMIN: await bcrypt.hash(PASSWORDS.ADMIN, 10),
    SELLER: await bcrypt.hash(PASSWORDS.SELLER, 10),
    CUSTOMER: await bcrypt.hash(PASSWORDS.CUSTOMER, 10),
    SUPPORT: await bcrypt.hash(PASSWORDS.SUPPORT, 10),
  };

  // Generate Users
  let userIndex = 1;

  // Admins
  for (let i = 0; i < 10; i++) {
    const firstName = FIRST_NAMES[i];
    const lastName = LAST_NAMES[i];
    users.push({
      _id: { $oid: generateObjectId(ID_PREFIX.USER, userIndex) },
      email: `admin${i + 1}@yopmail.com`,
      password: HASHED_PASSWORDS.ADMIN,
      name: `${firstName} ${lastName}`,
      role: USER_ROLES.ADMIN,
      isActive: true,
      emailVerified: true,
      createdAt: generateDate(2024, 2024),
      updatedAt: generateDate(2025, 2025),
    });
    userIndex++;
  }

  // Sellers
  for (let i = 0; i < 20; i++) {
    const firstName = FIRST_NAMES[10 + i];
    const lastName = LAST_NAMES[10 + i];
    const seller = {
      _id: { $oid: generateObjectId(ID_PREFIX.USER, userIndex) },
      email: `seller${i + 1}@yopmail.com`,
      password: HASHED_PASSWORDS.SELLER,
      name: `${firstName} ${lastName}`,
      role: USER_ROLES.SELLER,
      isActive: true,
      emailVerified: true,
      createdAt: generateDate(2024, 2024),
      updatedAt: generateDate(2025, 2025),
    };
    users.push(seller);
    sellers.push(seller);
    userIndex++;
  }

  // Customers
  for (let i = 0; i < 60; i++) {
    const firstName = FIRST_NAMES[(30 + i) % 50];
    const lastName = LAST_NAMES[(30 + i) % 50];
    const customer = {
      _id: { $oid: generateObjectId(ID_PREFIX.USER, userIndex) },
      email: `user${i + 1}@yopmail.com`,
      password: HASHED_PASSWORDS.CUSTOMER,
      name: `${firstName} ${lastName}`,
      role: USER_ROLES.CUSTOMER,
      isActive: i < 65,
      emailVerified: i < 60,
      createdAt: generateDate(2024, 2025),
      updatedAt: generateDate(2025, 2025),
    };
    users.push(customer);
    customers.push(customer);
    userIndex++;
  }

  // Support Users
  for (let i = 0; i < 10; i++) {
    const firstName = FIRST_NAMES[(i + 5) % 50];
    const lastName = LAST_NAMES[(i + 15) % 50];
    const supportUser = {
      _id: { $oid: generateObjectId(ID_PREFIX.USER, userIndex) },
      email: `support${i + 1}@yopmail.com`,
      password: HASHED_PASSWORDS.SUPPORT,
      name: `${firstName} ${lastName}`,
      role: USER_ROLES.SUPPORT,
      isActive: i < 9,
      emailVerified: true,
      createdAt: generateDate(2024, 2024),
      updatedAt: generateDate(2025, 2025),
    };
    users.push(supportUser);
    supportUsers.push(supportUser);
    userIndex++;
  }

  // Generate Categories
  CATEGORIES.forEach((cat, index) => {
    categories.push({
      _id: { $oid: generateObjectId(ID_PREFIX.CATEGORY, index + 1) },
      name: cat.name,
      slug: slugify(cat.name),
      description: cat.description,
      icon: cat.icon,
      isActive: true,
      productCount: 15,
      createdAt: generateDate(2024, 2024),
      updatedAt: generateDate(2025, 2025),
    });
  });

  // Generate Products
  let productIndex = 1;

  for (let catIndex = 0; catIndex < categories.length; catIndex++) {
    for (let i = 0; i < 15; i++) {
      const seller = sellers[productIndex % sellers.length];
      const productName = `${PRODUCTS_NAMES[productIndex % PRODUCTS_NAMES.length]} ${catIndex + 1}`;
      const price = Math.floor(Math.random() * 500 + 20) + 0.99;

      products.push({
        _id: { $oid: generateObjectId(ID_PREFIX.PRODUCT, productIndex) },
        name: productName,
        description: `High quality product from ${categories[catIndex].name} category`,
        price: price,
        category: categories[catIndex].name,
        stock: Math.floor(Math.random() * 100 + 10),
        imageUrl: `https://picsum.photos/seed/${productIndex}/400/400`,
        sellerId: seller._id,
        isActive: productIndex % 20 !== 0,
        tags: [slugify(categories[catIndex].name)],
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        reviewCount: Math.floor(Math.random() * 50),
        createdAt: generateDate(2024, 2025),
        updatedAt: generateDate(2025, 2025),
      });
      productIndex++;
    }
  }

  // Generate Coupons
  COUPON_CODES.forEach((code, index) => {
    const isPercentage = index % 2 === 0;
    coupons.push({
      _id: { $oid: generateObjectId(ID_PREFIX.COUPON, index + 1) },
      code: code,
      description: `Save with ${code}`,
      discountType: isPercentage ? 'percentage' : 'fixed',
      discount: isPercentage ? 10 + index * 2 : 50 + index * 10,
      minPurchase: 50 + index * 10,
      maxDiscount: isPercentage ? 100 + index * 20 : null,
      validFrom: new Date('2025-01-01'),
      validTo: new Date('2026-12-31'),
      usageLimit: 100 + index * 50,
      usageCount: Math.floor(Math.random() * 50),
      isActive: index < 18,
      createdAt: generateDate(2024, 2024),
      updatedAt: generateDate(2025, 2025),
    });
  });

  // Generate Orders
  for (let i = 0; i < 50; i++) {
    const customer = customers[i % customers.length];
    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderItems: any[] = [];
    let subtotal = 0;

    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemSubtotal = Math.round(product.price * quantity * 100) / 100;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        quantity: quantity,
        price: product.price,
        sellerId: product.sellerId,
        subtotal: itemSubtotal,
      });
    }

    const coupon = i % 3 === 0 ? coupons[i % coupons.length] : null;
    let discount = 0;
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discount = Math.round(subtotal * (coupon.discount / 100) * 100) / 100;
      } else {
        discount = coupon.discount;
      }
    }

    const tax = Math.round((subtotal - discount) * 0.1 * 100) / 100;
    const shipping = subtotal > 100 ? 0 : 10;
    const total = Math.round((subtotal - discount + tax + shipping) * 100) / 100;

    orders.push({
      _id: { $oid: generateObjectId(ID_PREFIX.ORDER, i + 1) },
      orderNumber: `ORD-${Date.now()}-${i + 1}`,
      customerId: customer._id,
      customerEmail: customer.email,
      sellerId: orderItems[0]?.sellerId,
      items: orderItems,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: tax,
      shipping: shipping,
      discount: discount,
      couponCode: coupon ? coupon.code : null,
      total: total,
      orderStatus: ORDER_STATUSES[Math.floor(Math.random() * ORDER_STATUSES.length)],
      paymentStatus: i % 5 === 0 ? PAYMENT_STATUSES[0] : PAYMENT_STATUSES[1],
      paymentMethod: PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)],
      shippingAddress: {
        street: `${Math.floor(Math.random() * 9999) + 1} ${STREETS[i % STREETS.length]}`,
        city: CITIES[i % CITIES.length],
        state: STATES[i % STATES.length],
        zip: String(10000 + Math.floor(Math.random() * 90000)),
        country: 'USA',
      },
      notes: i % 4 === 0 ? 'Please handle with care' : null,
      createdAt: generateDate(2025, 2025),
      updatedAt: generateDate(2025, 2025),
    });
  }

  // Generate Reviews
  for (let i = 0; i < 100; i++) {
    const customer = customers[i % customers.length];
    const product = products[i % products.length];
    const titleIndex = i % REVIEW_TITLES.length;

    reviews.push({
      _id: { $oid: generateObjectId(ID_PREFIX.REVIEW, i + 1) },
      productId: product._id,
      userId: customer._id,
      userName: customer.name,
      rating: Math.floor(Math.random() * 3) + 3,
      title: REVIEW_TITLES[titleIndex],
      comment: REVIEW_COMMENTS[titleIndex],
      images: i % 5 === 0 ? [`https://picsum.photos/seed/review${i}/200/200`] : [],
      helpful: Math.floor(Math.random() * 20),
      verified: i < 80,
      createdAt: generateDate(2025, 2025),
      updatedAt: generateDate(2025, 2025),
    });
  }

  // Generate Addresses
  for (let i = 0; i < 100; i++) {
    const user = users[i % users.length];
    const cityIndex = i % CITIES.length;

    addresses.push({
      _id: { $oid: generateObjectId(ID_PREFIX.ADDRESS, i + 1) },
      userId: user._id,
      street: `${Math.floor(Math.random() * 9999) + 1} ${STREETS[i % STREETS.length]}`,
      city: CITIES[cityIndex],
      state: STATES[cityIndex],
      zip: String(10000 + Math.floor(Math.random() * 90000)),
      country: 'USA',
      isDefault: i % 2 === 0,
      label: i % 2 === 0 ? 'home' : 'work',
      createdAt: generateDate(2024, 2025),
      updatedAt: generateDate(2025, 2025),
    });
  }

  // Generate Tickets
  for (let i = 0; i < 20; i++) {
    const customer = customers[i % customers.length];
    const statusIndex = i % TICKET_STATUSES.length;
    const status = TICKET_STATUSES[statusIndex];

    let assignedTo = null;
    if (status !== 'open' && supportUsers.length > 0) {
      assignedTo = supportUsers[i % supportUsers.length]._id;
    }

    tickets.push({
      _id: { $oid: generateObjectId(ID_PREFIX.TICKET, i + 1) },
      ticketId: `TKT-2025-${String(i + 1).padStart(4, '0')}`,
      subject: TICKET_SUBJECTS[i % TICKET_SUBJECTS.length],
      description: TICKET_DESCRIPTIONS[i % TICKET_DESCRIPTIONS.length],
      category: TICKET_CATEGORIES[i % TICKET_CATEGORIES.length],
      priority: TICKET_PRIORITIES[i % TICKET_PRIORITIES.length],
      status: status,
      customerName: customer.name,
      customerEmail: customer.email,
      customerId: customer._id,
      assignedTo: assignedTo,
      resolution:
        status === 'resolved' || status === 'closed'
          ? TICKET_RESOLUTIONS[i % TICKET_RESOLUTIONS.length]
          : null,
      attachments: i % 5 === 0 ? [`attachment-${i + 1}.jpg`] : [],
      comments: [],
      createdAt: generateDate(2025, 2025),
      updatedAt: generateDate(2025, 2025),
      resolvedAt: status === 'resolved' || status === 'closed' ? generateDate(2025, 2025) : null,
      closedAt: status === 'closed' ? generateDate(2025, 2025) : null,
    });
  }

  return {
    users,
    categories,
    products,
    coupons,
    orders,
    reviews,
    addresses,
    tickets,
  };
}
