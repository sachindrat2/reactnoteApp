// API Test Script - Run this in browser console to test API connectivity
// Copy and paste this entire script into your browser console

console.log('🔬 Starting API connectivity test...');

const testAPI = async () => {
  const tests = [
    {
      name: 'Direct Backend',
      url: 'https://noteappweb-backend.delightfulwave-7d742510.japaneast.azurecontainerapps.io/notes'
    },
    {
      name: 'Local CORS Proxy',
      url: 'http://localhost:3001/api/notes'
    },
    {
      name: 'CodeTabs Proxy',
      url: 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent('https://noteappweb-backend.delightfulwave-7d742510.japaneast.azurecontainerapps.io') + '/notes'
    }
  ];

  for (const test of tests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📍 URL: ${test.url}`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(test.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`✅ ${test.name}: ${response.status} ${response.statusText} (${duration}ms)`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`📊 Response length: ${data.length} chars`);
        console.log(`📄 First 200 chars: ${data.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n🏁 API connectivity test completed!');
};

// Run the test
testAPI();