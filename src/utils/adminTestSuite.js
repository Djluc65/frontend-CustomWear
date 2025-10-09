// Suite de tests pour le dashboard admin
import { createTestAdmin } from './testAuth';

export class AdminTestSuite {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    this.results.push(logEntry);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  assert(condition, message) {
    if (condition) {
      this.passed++;
      this.log(`✅ ${message}`, 'pass');
      return true;
    } else {
      this.failed++;
      this.log(`❌ ${message}`, 'fail');
      return false;
    }
  }

  async testAdminAuthentication() {
    this.log('🔐 Testing admin authentication...', 'test');
    
    try {
      const { user, token } = createTestAdmin();
      
      this.assert(user !== null, 'Admin user created successfully');
      this.assert(user.role === 'admin', 'User has admin role');
      this.assert(user.email === 'admin@customwear.com', 'Admin email is correct');
      this.assert(token !== null, 'Admin token generated');
      
      return true;
    } catch (error) {
      this.log(`Error in admin authentication test: ${error.message}`, 'error');
      return false;
    }
  }

  async testLocalStorageIntegration() {
    this.log('💾 Testing localStorage integration...', 'test');
    
    try {
      const { user, token } = createTestAdmin();
      
      // Test localStorage storage
      localStorage.setItem('test_token', token);
      localStorage.setItem('test_user', JSON.stringify(user));
      
      const storedToken = localStorage.getItem('test_token');
      const storedUser = JSON.parse(localStorage.getItem('test_user'));
      
      this.assert(storedToken === token, 'Token stored correctly in localStorage');
      this.assert(storedUser.role === 'admin', 'User data stored correctly in localStorage');
      
      // Cleanup
      localStorage.removeItem('test_token');
      localStorage.removeItem('test_user');
      
      return true;
    } catch (error) {
      this.log(`Error in localStorage test: ${error.message}`, 'error');
      return false;
    }
  }

  async testMockDataAvailability() {
    this.log('📊 Testing mock data availability...', 'test');
    
    try {
      // Test if mock data modules can be imported
      const mockDataModule = await import('../data/mockData');
      
      this.assert(mockDataModule.mockStats !== undefined, 'Mock stats data available');
      this.assert(mockDataModule.mockProducts !== undefined, 'Mock products data available');
      this.assert(mockDataModule.mockOrders !== undefined, 'Mock orders data available');
      this.assert(mockDataModule.mockUsers !== undefined, 'Mock users data available');
      
      // Test data structure
      this.assert(Array.isArray(mockDataModule.mockProducts), 'Mock products is an array');
      this.assert(Array.isArray(mockDataModule.mockOrders), 'Mock orders is an array');
      this.assert(Array.isArray(mockDataModule.mockUsers), 'Mock users is an array');
      this.assert(typeof mockDataModule.mockStats === 'object', 'Mock stats is an object');
      
      return true;
    } catch (error) {
      this.log(`Error in mock data test: ${error.message}`, 'error');
      return false;
    }
  }

  async testAPIServiceIntegration() {
    this.log('🔌 Testing API service integration...', 'test');
    
    try {
      // Test if API service can be imported
      const apiModule = await import('../services/api');
      
      this.assert(apiModule.adminAPI !== undefined, 'Admin API service available');
      this.assert(typeof apiModule.adminAPI.getAllProducts === 'function', 'getAllProducts method exists');
      this.assert(typeof apiModule.adminAPI.getAllOrders === 'function', 'getAllOrders method exists');
      this.assert(typeof apiModule.adminAPI.getAllUsers === 'function', 'getAllUsers method exists');
      this.assert(typeof apiModule.adminAPI.getDashboardStats === 'function', 'getDashboardStats method exists');
      
      return true;
    } catch (error) {
      this.log(`Error in API service test: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Admin Dashboard Test Suite...', 'start');
    this.results = [];
    this.passed = 0;
    this.failed = 0;
    
    const tests = [
      this.testAdminAuthentication.bind(this),
      this.testLocalStorageIntegration.bind(this),
      this.testMockDataAvailability.bind(this),
      this.testAPIServiceIntegration.bind(this)
    ];
    
    for (const test of tests) {
      await test();
    }
    
    this.log(`📋 Test Summary: ${this.passed} passed, ${this.failed} failed`, 'summary');
    
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      results: this.results,
      success: this.failed === 0
    };
  }

  getResults() {
    return {
      passed: this.passed,
      failed: this.failed,
      total: this.passed + this.failed,
      results: this.results
    };
  }
}

export default AdminTestSuite;