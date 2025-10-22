// API URL Test Script
// Run this in the browser console to verify the API URL construction

console.log('🧪 === API URL TEST ===');

// Check current location
console.log('Current location:', window.location.href);
console.log('Current hostname:', window.location.hostname);

// Check the backend URL constant
console.log('BACKEND_URL constant:', 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net');

// Test URL construction for different endpoints
const testEndpoints = ['/notes', '/token', '/register'];

testEndpoints.forEach(endpoint => {
  const backendUrl = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';
  const fullUrl = `${backendUrl}${endpoint}`;
  
  console.log(`Endpoint ${endpoint}:`);
  console.log(`  Backend URL: ${backendUrl}`);
  console.log(`  Full URL: ${fullUrl}`);
  console.log(`  URL object:`, new URL(fullUrl));
});

// Test if the issue is with relative URL resolution
console.log('\n🔍 Testing URL resolution:');
const baseUrl = 'https://ownnoteapp-hedxcahwcrhwb8hb.canadacentral-01.azurewebsites.net';
const endpoint = '/notes';
const testUrl = `${baseUrl}${endpoint}`;

console.log('Base URL:', baseUrl);
console.log('Endpoint:', endpoint);
console.log('Combined URL:', testUrl);
console.log('Is absolute?', testUrl.startsWith('http'));

// Try creating a URL object to see if it resolves correctly
try {
  const urlObj = new URL(testUrl);
  console.log('URL Object:', {
    href: urlObj.href,
    origin: urlObj.origin,
    pathname: urlObj.pathname,
    protocol: urlObj.protocol,
    host: urlObj.host
  });
} catch (e) {
  console.error('URL construction failed:', e);
}

console.log('\n✅ Test complete!');