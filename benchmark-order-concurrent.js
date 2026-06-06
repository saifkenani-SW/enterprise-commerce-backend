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
  const totalRequests = 500;

  const requests = [];

  const benchmarkStart = Date.now();

  for (let i = 0; i < totalRequests; i++) {
    requests.push(createOrder());
  }

  const results = await Promise.allSettled(requests);

  const benchmarkEnd = Date.now();

  const normalizedResults = results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      ok: false,
      status: 0,
      time: 0,
    };
  });

  const success = normalizedResults.filter((r) => r.ok).length;
  const failed = normalizedResults.filter((r) => !r.ok).length;
  const times = normalizedResults.filter((r) => r.time > 0).map((r) => r.time);

  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const totalTime = benchmarkEnd - benchmarkStart;

  console.log('Concurrent Benchmark Results');
  console.log('----------------------------');
  console.log('Total Requests:', totalRequests);
  console.log('Success:', success);
  console.log('Failed:', failed);
  console.log('Total Benchmark Time:', totalTime, 'ms');
  console.log('Average Response Time:', average.toFixed(2), 'ms');
  console.log('Min Response Time:', min, 'ms');
  console.log('Max Response Time:', max, 'ms');
}

run();