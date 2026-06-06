const inventoryId = 'f4d5c201-2a87-431b-af2f-eaf3fe937241';

const url = `http://localhost:3000/inventories/${inventoryId}/decrease-optimistic`;

async function run() {
  const requests = [];

  for (let i = 0; i < 20; i++) {
    requests.push(
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: 1,
        }),
      }),
    );
  }

  const results = await Promise.allSettled(requests);

  let success = 0;
  let failed = 0;

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value.ok) {
        success++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
  }

  console.log('Success:', success);
  console.log('Failed:', failed);
}

run();