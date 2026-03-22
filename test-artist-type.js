const fetch = require('node-fetch');

async function testArtistTypeFilter() {
  try {
    console.log('Testing artist search with artistType filter...');

    // Test solo artists
    const soloResponse = await fetch('http://localhost:5000/api/artists?artistType=solo', {
      headers: {
        'Authorization': 'Bearer test',
        'Content-Type': 'application/json'
      }
    });

    if (soloResponse.ok) {
      const soloData = await soloResponse.json();
      console.log('✅ Solo artists query successful:', soloData.length || soloData.artists?.length || 'unknown count');
    } else {
      console.log('❌ Solo artists query failed:', soloResponse.status);
    }

    // Test band artists
    const bandResponse = await fetch('http://localhost:5000/api/artists?artistType=band', {
      headers: {
        'Authorization': 'Bearer test',
        'Content-Type': 'application/json'
      }
    });

    if (bandResponse.ok) {
      const bandData = await bandResponse.json();
      console.log('✅ Band artists query successful:', bandData.length || bandData.artists?.length || 'unknown count');
    } else {
      console.log('❌ Band artists query failed:', bandResponse.status);
    }

    // Test all artists
    const allResponse = await fetch('http://localhost:5000/api/artists', {
      headers: {
        'Authorization': 'Bearer test',
        'Content-Type': 'application/json'
      }
    });

    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log('✅ All artists query successful:', allData.length || allData.artists?.length || 'unknown count');
    } else {
      console.log('❌ All artists query failed:', allResponse.status);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testArtistTypeFilter();