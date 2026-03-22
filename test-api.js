#!/usr/bin/env node

// Test script for KB Portal REST API

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003/api';

async function testAPI() {
  console.log('🧪 Testing KB Portal REST API...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log(`   Status: ${healthRes.status} ${healthRes.statusText}`);
    console.log(`   Response: ${JSON.stringify(healthData, null, 2)}`);
    
    // Test 2: Login
    console.log('\n2. Testing login endpoint...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'afe2026' }),
    });
    const loginData = await loginRes.json();
    console.log(`   Status: ${loginRes.status} ${loginRes.statusText}`);
    console.log(`   Success: ${loginData.success}`);
    
    if (!loginData.success || !loginData.token) {
      console.log('   ❌ Login failed');
      return;
    }
    
    const token = loginData.token;
    console.log(`   ✅ Login successful, token received`);
    
    // Test 3: Verify token
    console.log('\n3. Testing token verification...');
    const verifyRes = await fetch(`${BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const verifyData = await verifyRes.json();
    console.log(`   Status: ${verifyRes.status} ${verifyRes.statusText}`);
    console.log(`   Authenticated: ${verifyData.authenticated}`);
    
    // Test 4: Get stats
    console.log('\n4. Testing stats endpoint...');
    const statsRes = await fetch(`${BASE_URL}/stats`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const statsData = await statsRes.json();
    console.log(`   Status: ${statsRes.status} ${statsRes.statusText}`);
    console.log(`   Stats: ${JSON.stringify(statsData, null, 2)}`);
    
    // Test 5: Get articles
    console.log('\n5. Testing articles endpoint...');
    const articlesRes = await fetch(`${BASE_URL}/articles`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const articlesData = await articlesRes.json();
    console.log(`   Status: ${articlesRes.status} ${articlesRes.statusText}`);
    console.log(`   Articles count: ${Array.isArray(articlesData) ? articlesData.length : 'N/A'}`);
    
    // Test 6: Get categories
    console.log('\n6. Testing categories endpoint...');
    const categoriesRes = await fetch(`${BASE_URL}/categories`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const categoriesData = await categoriesRes.json();
    console.log(`   Status: ${categoriesRes.status} ${categoriesRes.statusText}`);
    console.log(`   Categories count: ${Array.isArray(categoriesData) ? categoriesData.length : 'N/A'}`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Make sure the Next.js server is running on port 3003');
    console.error('Start it with: cd kb-portal-frontend && npm run dev');
  }
}

// Run the test
testAPI();