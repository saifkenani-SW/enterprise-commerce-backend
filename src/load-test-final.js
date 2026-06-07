import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================
// ضع هنا IDs حقيقية من قاعدة بياناتك
// ============================================
const USERS = [
  '262b65d0-18a8-4a6c-8fc1-3f7ca61b149b',
  '8a2f58e3-7dfb-4f19-93f2-94b780a3413d',
  '924b62f9-2a1f-4758-91ca-df2f7c0bb2ba',
  '36355b70-f903-4660-aa80-d7ffa505b15c',
  '4edbb66b-aaff-47c7-a9fd-d163d58f7533',
  '2031369a-9049-49ba-940d-195b5603661f',
  '1cea180a-c6a4-4482-9c2c-ce1275cab385',
  '0784fb0c-d26b-4dcb-a80c-c8fb538f48f8',
  '597fd736-8ca3-439d-8a63-f57933b4ac99',
  '9808a4e8-d848-4bb0-8262-9f4c593832f6',
];

const PRODUCTS = [
  {
    id: '503bbabb-ac09-42ee-8bfc-1e0f42fd8f46',
    name: 'MacBook Pro M4',
    price: 1299.99,
  },
  {
    id: '94ab5abb-feff-4581-a17b-61981813959f',
    name: 'iPhone 16 Pro',
    price: 1099.99,
  },
  {
    id: 'cf73fc85-1c4f-4f13-8a3b-f9c4167d8e80',
    name: 'Sony WH-1000XM5',
    price: 349.99,
  },
  {
    id: 'f159c62b-be90-413b-9e99-f41f40c1d149',
    name: 'Samsung 4K OLED TV',
    price: 1799.99,
  },
  {
    id: 'b9a551d8-4e43-4485-bf83-260e10558f19',
    name: 'Nike Air Max 270',
    price: 150.0,
  },
  {
    id: '3760b6fe-1631-46c4-b31a-bd402d39902a',
    name: 'PlayStation 5',
    price: 449.99,
  },
  {
    id: 'ec81cbc5-45b3-4990-95ea-cfc560fd0312',
    name: 'iPad Air M2',
    price: 599.99,
  },
  {
    id: '92773e3f-d15f-4b4a-af04-99029a1d00b6',
    name: 'Dell XPS 15',
    price: 1899.99,
  },
  {
    id: '4153e6fb-fd66-4960-b1c4-eb060ac32a61',
    name: 'Bose QuietComfort Earbuds',
    price: 279.99,
  },
  {
    id: '29fdb92f-da65-4112-8323-42d2cd3aa034',
    name: 'Canon EOS R6',
    price: 2499.99,
  },
  {
    id: 'effe7c07-1c1d-4579-8112-2f542bebca4a',
    name: 'Nespresso Vertuo Plus',
    price: 199.99,
  },
  {
    id: '0b9f975b-9075-4f1a-95f6-a799a613c6b6',
    name: 'Dyson V15 Detect',
    price: 749.99,
  },
  {
    id: '10af05c5-cca2-4468-ad55-c39ded605e4b',
    name: 'LG UltraGear Monitor',
    price: 599.99,
  },
  {
    id: '8080f559-7ce6-4d91-8fd2-83731a0d8824',
    name: 'JBL PartyBox 310',
    price: 449.99,
  },
  {
    id: '5d362d99-f5c7-4125-919e-72c5343e5fa4',
    name: 'Logitech MX Master 3S',
    price: 99.99,
  },
  {
    id: 'b12028a4-d4d7-469d-84f7-f6ee4231479d',
    name: 'Razer BlackWidow V4',
    price: 169.99,
  },
  {
    id: 'a90d6485-d3f9-4410-b2a5-b3f562126ffa',
    name: 'Yeti Blue Microphone',
    price: 129.99,
  },
  {
    id: '7e816e7f-1872-42aa-b749-a430850dc6cd',
    name: 'Samsung Galaxy Watch 6',
    price: 299.99,
  },
  {
    id: '5de2f7af-d06e-46ce-bbbf-627bc71d67a0',
    name: 'GoPro Hero 12',
    price: 399.99,
  },
  {
    id: '89c653e4-f4e9-40a8-8028-e315059a6167',
    name: 'Kindle Paperwhite',
    price: 139.99,
  },
];

// ============================================
// إعدادات السيناريوهات
// ============================================
export const options = {
  scenarios: {
    // السيناريو 1: Flash Sale - 50 مستخدم يهجمون على منتج واحد
    flash_sale: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '30s',
      exec: 'flashSale',
    },
    // السيناريو 2: تدفق ثابت - 20 مستخدم متواصل
    steady_traffic: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
      exec: 'normalShopping',
    },
    // السيناريو 3: تدفق تصاعدي - من 5 إلى 30 مستخدم
    ramping_traffic: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '30s', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'mixedShopping',
    },
  },
};

// ============================================
// دوال مساعدة
// ============================================
function randomUser() {
  return USERS[Math.floor(Math.random() * USERS.length)];
}

function randomProducts(count) {
  const shuffled = [...PRODUCTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ============================================
// السيناريو 1: Flash Sale
// ============================================
export function flashSale() {
  const product = PRODUCTS[0];

  const res = http.post(
    'http://localhost:3000/orders',
    JSON.stringify({
      userId: randomUser(),
      items: [{ productId: product.id, quantity: 1 }],
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  check(res, {
    '🔥 201 Success': (r) => r.status === 201,
    '🔥 400 Sold Out': (r) => r.status === 400,
    '🔥 409 Conflict': (r) => r.status === 409,
  });
}

// ============================================
// السيناريو 2: تسوق عادي (1-3 منتجات)
// ============================================
export function normalShopping() {
  const count = Math.floor(Math.random() * 3) + 1;
  const products = randomProducts(count);

  const items = products.map((p) => ({
    productId: p.id,
    quantity: Math.floor(Math.random() * 2) + 1,
  }));

  const res = http.post(
    'http://localhost:3000/orders',
    JSON.stringify({
      userId: randomUser(),
      items: items,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  check(res, {
    '✅ 201': (r) => r.status === 201,
    '❌ 400': (r) => r.status === 400,
    '⚠️ 409': (r) => r.status === 409,
  });

  sleep(0.1);
}

// ============================================
// السيناريو 3: تسوق متنوع (1-5 منتجات)
// ============================================
export function mixedShopping() {
  const count = Math.floor(Math.random() * 5) + 1;
  const products = randomProducts(count);

  const items = products.map((p) => ({
    productId: p.id,
    quantity: Math.floor(Math.random() * 5) + 1,
  }));

  const res = http.post(
    'http://localhost:3000/orders',
    JSON.stringify({
      userId: randomUser(),
      items: items,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  check(res, {
    '✅ 201': (r) => r.status === 201,
    '❌ 400': (r) => r.status === 400,
    '⚠️ 409': (r) => r.status === 409,
  });

  sleep(Math.random() * 0.5);
}

// ============================================
// تحضير قبل الاختبار
// ============================================
export function setup() {
  console.log('===========================================');
  console.log('🚀 LOAD TEST STARTING');
  console.log('===========================================');
  console.log(`  Users: ${USERS.length}`);
  console.log(`  Products: ${PRODUCTS.length}`);
  console.log('===========================================\n');
}
