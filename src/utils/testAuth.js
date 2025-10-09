// Utilitaire pour créer un utilisateur admin de test

export const createTestAdmin = () => {
  const testAdmin = {
    _id: 'admin1',
    firstName: 'Admin',
    lastName: 'Test',
    email: 'admin@customwear.com',
    role: 'admin',
    status: 'active'
  };

  const testToken = 'test-admin-token-123';

  // Stocker dans localStorage
  localStorage.setItem('token', testToken);
  localStorage.setItem('user', JSON.stringify(testAdmin));

  return { user: testAdmin, token: testToken };
};

export const isTestMode = () => {
  return localStorage.getItem('token') === 'test-admin-token-123';
};

export const clearTestAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};