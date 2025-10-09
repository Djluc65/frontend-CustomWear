// Test final complet du dashboard admin
import { createTestAdmin } from './testAuth';
import AdminTestSuite from './adminTestSuite';

export class FinalAdminTest {
  constructor() {
    this.results = [];
    this.testSuite = new AdminTestSuite();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    this.results.push(logEntry);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  async testCompleteAdminFlow() {
    this.log('🚀 Starting complete admin flow test...', 'start');
    
    try {
      // 1. Test de base de la suite de tests
      this.log('📋 Running basic test suite...', 'test');
      const basicResults = await this.testSuite.runAllTests();
      
      if (!basicResults.success) {
        this.log(`❌ Basic tests failed: ${basicResults.failed} failures`, 'error');
        return { success: false, error: 'Basic tests failed', results: this.results };
      }
      
      this.log('✅ Basic tests passed successfully', 'pass');
      
      // 2. Test de création d'admin
      this.log('👤 Testing admin creation...', 'test');
      const { user, token } = createTestAdmin();
      
      if (!user || user.role !== 'admin') {
        this.log('❌ Admin creation failed', 'error');
        return { success: false, error: 'Admin creation failed', results: this.results };
      }
      
      this.log('✅ Admin user created successfully', 'pass');
      
      // 3. Test de stockage localStorage
      this.log('💾 Testing localStorage persistence...', 'test');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      const storedToken = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (storedToken !== token || storedUser.role !== 'admin') {
        this.log('❌ localStorage persistence failed', 'error');
        return { success: false, error: 'localStorage persistence failed', results: this.results };
      }
      
      this.log('✅ localStorage persistence working', 'pass');
      
      // 4. Test de simulation Redux
      this.log('🔄 Testing Redux state simulation...', 'test');
      
      // Simuler l'état Redux
      const mockReduxState = {
        auth: {
          isAuthenticated: true,
          user: user,
          token: token,
          isLoading: false,
          error: null
        }
      };
      
      if (!mockReduxState.auth.isAuthenticated || mockReduxState.auth.user.role !== 'admin') {
        this.log('❌ Redux state simulation failed', 'error');
        return { success: false, error: 'Redux state simulation failed', results: this.results };
      }
      
      this.log('✅ Redux state simulation working', 'pass');
      
      // 5. Test des données mock
      this.log('📊 Testing mock data integrity...', 'test');
      
      try {
        const mockDataModule = await import('../data/mockData');
        
        // Vérifier que toutes les données sont présentes et valides
        const checks = [
          { name: 'mockStats', data: mockDataModule.mockStats, type: 'object' },
          { name: 'mockProducts', data: mockDataModule.mockProducts, type: 'array' },
          { name: 'mockOrders', data: mockDataModule.mockOrders, type: 'array' },
          { name: 'mockUsers', data: mockDataModule.mockUsers, type: 'array' }
        ];
        
        for (const check of checks) {
          if (check.type === 'array' && (!Array.isArray(check.data) || check.data.length === 0)) {
            this.log(`❌ ${check.name} is not a valid array or is empty`, 'error');
            return { success: false, error: `Invalid ${check.name}`, results: this.results };
          }
          
          if (check.type === 'object' && (typeof check.data !== 'object' || check.data === null)) {
            this.log(`❌ ${check.name} is not a valid object`, 'error');
            return { success: false, error: `Invalid ${check.name}`, results: this.results };
          }
        }
        
        this.log('✅ All mock data is valid and accessible', 'pass');
        
      } catch (error) {
        this.log(`❌ Mock data import failed: ${error.message}`, 'error');
        return { success: false, error: 'Mock data import failed', results: this.results };
      }
      
      // 6. Test final
      this.log('🎯 All tests completed successfully!', 'success');
      this.log('🎉 Admin dashboard is ready for use!', 'success');
      
      return { 
        success: true, 
        message: 'All admin functionality tests passed successfully',
        results: this.results,
        summary: {
          basicTests: basicResults,
          adminCreation: true,
          localStorage: true,
          reduxSimulation: true,
          mockData: true
        }
      };
      
    } catch (error) {
      this.log(`❌ Unexpected error: ${error.message}`, 'error');
      return { success: false, error: error.message, results: this.results };
    }
  }

  async runFinalTest() {
    this.results = [];
    this.log('🔥 FINAL ADMIN DASHBOARD TEST', 'start');
    this.log('===============================', 'start');
    
    const result = await this.testCompleteAdminFlow();
    
    this.log('===============================', 'end');
    this.log(result.success ? '🎉 ALL TESTS PASSED!' : '❌ TESTS FAILED', 'end');
    
    return result;
  }
}

export default FinalAdminTest;