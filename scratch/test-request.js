async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/videos');
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response Length:', text.length);
    console.log('Response Snippet:', text.substring(0, 200));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
