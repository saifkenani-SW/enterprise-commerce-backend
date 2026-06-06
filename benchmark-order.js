const userId = '94a16321-3bd4-4dd7-9dfb-b4acccc43bf2';
const productId = '66d2533b-1ab6-4706-a85d-e608662ba751';

const url = 'http://localhost:3000/orders';

async function createOrder() {
  const start = Date.now();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      items: [
        {
          productId,
          quantity: 1,
        },
      ],
    }),
  });

  const end = Date.now();

  return {
    ok: response.ok,
    status: response.status,
    time: end - start,
  };
}

async function run() {
  const totalRequests = 50;
  const results = [];

  for (let i = 0; i < totalRequests; i++) {
    const result = await createOrder();
    results.push(result);
  }

  const success = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const times = results.map((r) => r.time);

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  console.log('Total Requests:', totalRequests);
  console.log('Success:', success);
  console.log('Failed:', failed);
  console.log('Average Response Time:', average.toFixed(2), 'ms');
  console.log('Min Response Time:', min, 'ms');
  console.log('Max Response Time:', max, 'ms');
}

run();