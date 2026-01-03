#!/usr/bin/env node

/**
 * AfroMoji API Test Script
 * 
 * Tests all API endpoints and reports errors
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testEndpoint(name, path, method = 'GET', body = null, headers = {}, expectedStatus = 200, allowedStatuses = null) {
  try {
    log(`\n  Testing: ${name}`, 'cyan');
    log(`  ${method} ${path}`, 'blue');
    
    const response = await makeRequest(path, method, body, headers);
    
    // Check if response matches expected status or any allowed statuses
    const validStatuses = allowedStatuses || [expectedStatus];
    const passed = validStatuses.includes(response.status);
    
    if (passed) {
      log(`  ✓ Status: ${response.status}`, 'green');
      testResults.passed++;
    } else {
      const expectedStr = allowedStatuses ? `one of [${validStatuses.join(', ')}]` : expectedStatus;
      log(`  ✗ Status: ${response.status} (expected ${expectedStr})`, 'red');
      log(`  Response: ${JSON.stringify(response.body, null, 2)}`, 'yellow');
      testResults.failed++;
      testResults.errors.push({
        name,
        path,
        method,
        expectedStatus,
        actualStatus: response.status,
        response: response.body,
      });
    }
    
    return response;
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    testResults.failed++;
    testResults.errors.push({
      name,
      path,
      method,
      error: error.message,
    });
    return null;
  }
}

async function runTests() {
  log('\n================================', 'blue');
  log('AfroMoji API Test Suite', 'blue');
  log('================================\n', 'blue');

  // Test variables
  let accessToken = null;
  let refreshToken = null;
  let otpSessionId = null;
  let userId = null;
  let generationId = null;
  let postId = null;

  // ======================
  // Health Check
  // ======================
  log('\n━━━ Health Check ━━━', 'yellow');
  await testEndpoint('Health Check', '/health', 'GET');

  // ======================
  // Tribes (Public)
  // ======================
  log('\n━━━ Tribes API ━━━', 'yellow');
  const tribesRes = await testEndpoint('Get All Tribes', '/api/tribes', 'GET');
  await testEndpoint('Get Tribe by Slug', '/api/tribes/wakandan-lineage', 'GET');
  await testEndpoint('Get Tribe Preview', '/api/tribes/wakandan-lineage/preview', 'GET');

  // ======================
  // Auth - Send OTP
  // ======================
  log('\n━━━ Authentication ━━━', 'yellow');
  
  // Note: OTP tests will fail without Twilio config, but we'll test the endpoint structure
  const otpRes = await testEndpoint(
    'Send OTP (expected to fail without valid Twilio)',
    '/api/auth/otp/send',
    'POST',
    { phoneE164: '+12345678901' }, // Valid E.164 format with 11 digits
    {},
    400 // Expecting error without valid Twilio config
  );
  
  if (otpRes && otpRes.body && otpRes.body.otpSessionId) {
    otpSessionId = otpRes.body.otpSessionId;
    log(`  → OTP Session ID: ${otpSessionId}`, 'green');
  }

  // ======================
  // Auth - Verify OTP (will fail without valid session)
  // ======================
  await testEndpoint(
    'Verify OTP (expected to fail)',
    '/api/auth/otp/verify',
    'POST',
    { otpSessionId: otpSessionId || 'test-session', code: '123456' },
    {},
    400, // Expecting error without valid OTP
    [400, 429] // Accept rate limit as valid (session-based rate limiting)
  );
  
  // Small delay to avoid rate limiting
  await sleep(100);

  // ======================
  // Auth - Get Me (without token)
  // ======================
  await testEndpoint(
    'Get Me (unauthorized)',
    '/api/auth/me',
    'GET',
    null,
    {},
    401 // Expecting unauthorized
  );

  // ======================
  // Auth - Refresh Token (without token)
  // ======================
  await testEndpoint(
    'Refresh Token (invalid)',
    '/api/auth/refresh',
    'POST',
    { refreshToken: 'invalid-token' },
    {},
    401 // Expecting unauthorized
  );

  // ======================
  // Protected Routes (without auth)
  // ======================
  log('\n━━━ Protected Routes (No Auth) ━━━', 'yellow');
  
  // Delay to avoid rate limiting
  await sleep(100);
  
  await testEndpoint('Get My Profile (unauthorized)', '/api/users/me', 'GET', null, {}, 401);
  await testEndpoint('Get Feed (unauthorized)', '/api/feed', 'GET', null, {}, 401);
  await testEndpoint('Create Post (unauthorized)', '/api/posts', 'POST', {}, {}, 401);
  await testEndpoint('Create Generation (unauthorized)', '/api/generate', 'POST', {}, {}, 401);
  await testEndpoint('Join Tribe (unauthorized)', '/api/tribes/wakandan-lineage/join', 'POST', {}, {}, 401);

  // ======================
  // User Routes (Public)
  // ======================
  log('\n━━━ User Routes (Public) ━━━', 'yellow');
  
  // Delay to avoid rate limiting
  await sleep(100);
  await testEndpoint('Get User Profile (non-existent)', '/api/users/nonexistentuser', 'GET', null, {}, 404);
  await testEndpoint('Get User Avatar (non-existent)', '/api/users/nonexistentuser/avatar', 'GET', null, {}, 404);
  await testEndpoint('Get User Posts (non-existent)', '/api/users/nonexistentuser/posts', 'GET', null, {}, 404);

  // ======================
  // Tribe Posts/Members (Protected)
  // ======================
  log('\n━━━ Tribe Posts/Members (No Auth) ━━━', 'yellow');
  
  // Delay to avoid rate limiting
  await sleep(100);
  await testEndpoint('Get Tribe Posts (unauthorized)', '/api/tribes/wakandan-lineage/posts', 'GET', null, {}, 401);
  await testEndpoint('Get Tribe Members (unauthorized)', '/api/tribes/wakandan-lineage/members', 'GET', null, {}, 401);

  // ======================
  // Media Routes (Protected)
  // ======================
  log('\n━━━ Media Routes (No Auth) ━━━', 'yellow');
  
  // Delay to avoid rate limiting
  await sleep(100);
  await testEndpoint('Init Selfie Upload (unauthorized)', '/api/media/selfies/init', 'POST', {}, {}, 401);
  await testEndpoint('Get Selfies (unauthorized)', '/api/media/selfies', 'GET', null, {}, 401);

  // ======================
  // Admin Routes (Protected)
  // ======================
  log('\n━━━ Admin Routes (No Auth) ━━━', 'yellow');
  
  // Delay to avoid rate limiting
  await sleep(100);
  await testEndpoint('Flag Post (unauthorized)', '/admin/posts/123/flag', 'POST', {}, {}, 401);
  await testEndpoint('Ban User (unauthorized)', '/admin/users/123/ban', 'POST', {}, {}, 401);

  // ======================
  // Worker Routes
  // ======================
  log('\n━━━ Worker Routes ━━━', 'yellow');
  
  // Delay to avoid rate limiting
  await sleep(100);
  await testEndpoint(
    'Process Generation (invalid ID)',
    '/worker/process-generation',
    'POST',
    { generationId: 'invalid-id' },
    {},
    400 // Expecting bad request
  );

  // ======================
  // Job Routes
  // ======================
  log('\n━━━ Job Routes ━━━', 'yellow');
  await testEndpoint(
    'Execute Generation Job (invalid ID)',
    '/api/jobs/generation',
    'POST',
    { generationId: 'invalid-id' },
    {},
    400 // Expecting bad request
  );

  // ======================
  // Cron Routes
  // ======================
  log('\n━━━ Cron Routes ━━━', 'yellow');
  await testEndpoint(
    'Generation Retry',
    '/api/cron/generation-retry',
    'GET',
    null,
    { Authorization: 'Bearer dev-secret' }, // Cron secret
    200
  );

  // ======================
  // 404 Routes
  // ======================
  log('\n━━━ 404 Handling ━━━', 'yellow');
  
  // Delay to avoid rate limiting
  await sleep(100);
  await testEndpoint('Non-existent endpoint', '/api/nonexistent', 'GET', null, {}, 404);
  await testEndpoint('Invalid route', '/invalid/route', 'GET', null, {}, 404);

  // ======================
  // Results Summary
  // ======================
  log('\n\n================================', 'blue');
  log('Test Results Summary', 'blue');
  log('================================\n', 'blue');
  
  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'cyan');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  if (testResults.errors.length > 0) {
    log('\n━━━ Failed Tests Details ━━━\n', 'red');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error.name}`, 'red');
      log(`   ${error.method} ${error.path}`, 'yellow');
      if (error.expectedStatus) {
        log(`   Expected: ${error.expectedStatus}, Got: ${error.actualStatus}`, 'yellow');
      }
      if (error.error) {
        log(`   Error: ${error.error}`, 'yellow');
      }
      if (error.response) {
        log(`   Response: ${JSON.stringify(error.response, null, 2)}`, 'yellow');
      }
      log('');
    });
  }

  log('\n================================\n', 'blue');
  
  // Exit with error code if tests failed
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Check if server is running before tests
async function checkServerHealth() {
  try {
    log('Checking if server is running...', 'cyan');
    await makeRequest('/health');
    log('✓ Server is running\n', 'green');
    return true;
  } catch (error) {
    log('✗ Server is not running!', 'red');
    log(`Error: ${error.message}`, 'red');
    log('\nPlease start the server with: npm run dev', 'yellow');
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await runTests();
})();

