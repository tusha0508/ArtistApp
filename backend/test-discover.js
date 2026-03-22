async function testDiscoverEndpoint() {
  try {
    console.log('Testing discover endpoint with pincode 400068...');

    // First test without auth to see if endpoint is accessible
    const response = await fetch('http://localhost:3000/api/artists/discover?pincode=400068');

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDiscoverEndpoint();