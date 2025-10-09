import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginSuccess } from '../store/slices/authSlice';
import { simulateAdminLogin, checkAdminAccess, clearAdminSession } from '../utils/testAdminAccess';
import AdminTestSuite from '../utils/adminTestSuite';
import FinalAdminTest from '../utils/finalAdminTest';

const TestAdmin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [finalTestResults, setFinalTestResults] = useState(null);
  const [isRunningFinalTest, setIsRunningFinalTest] = useState(false);

  const handleTestAdminLogin = () => {
    try {
      const { user, token } = simulateAdminLogin();
      
      // Dispatch l'action Redux pour mettre à jour le state
      dispatch(loginSuccess({ user, token }));
      
      setStatus('✅ Admin login successful! Redirecting to dashboard...');
      
      // Rediriger vers le dashboard admin
      setTimeout(() => {
        navigate('/admin');
      }, 1000);
      
    } catch (error) {
      setStatus('❌ Error during admin login: ' + error.message);
    }
  };

  const handleCheckAccess = () => {
    const hasAccess = checkAdminAccess();
    setStatus(hasAccess ? '✅ Admin access confirmed' : '❌ No admin access');
  };

  const handleClearSession = () => {
    clearAdminSession();
    setStatus('🧹 Admin session cleared');
  };

  const handleGoToAdmin = () => {
    navigate('/admin');
  };

  const handleGoToAuth = () => {
    navigate('/auth');
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    setStatus('🧪 Running comprehensive admin tests...');
    
    try {
      const testSuite = new AdminTestSuite();
      const results = await testSuite.runAllTests();
      
      setTestResults(results);
      setStatus(results.success ? 
        `✅ All tests passed! (${results.passed}/${results.total})` : 
        `⚠️ Some tests failed (${results.passed}/${results.total})`
      );
    } catch (error) {
      setStatus('❌ Error running tests: ' + error.message);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleRunFinalTest = async () => {
    setIsRunningFinalTest(true);
    setStatus('🔥 Running final comprehensive admin test...');
    
    try {
      const finalTest = new FinalAdminTest();
      const results = await finalTest.runFinalTest();
      
      setFinalTestResults(results);
      setStatus(results.success ? 
        '🎉 Final test completed successfully! Admin dashboard is fully functional.' : 
        `❌ Final test failed: ${results.error}`
      );
    } catch (error) {
      setStatus('❌ Error running final test: ' + error.message);
    } finally {
      setIsRunningFinalTest(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Admin Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Actions de test :</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={handleTestAdminLogin}
            style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            🔐 Simuler Connexion Admin
          </button>
          
          <button 
            onClick={handleCheckAccess}
            style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            ✅ Vérifier Accès Admin
          </button>
          
          <button 
            onClick={handleGoToAdmin}
            style={{ padding: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            🏠 Aller au Dashboard Admin
          </button>
          
          <button 
            onClick={handleGoToAuth}
            style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            🔑 Aller à la Page d'Authentification
          </button>
          
          <button 
            onClick={handleRunTests}
            disabled={isRunningTests}
            style={{
              padding: '10px',
              backgroundColor: isRunningTests ? '#6c757d' : '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isRunningTests ? 'not-allowed' : 'pointer'
            }}
          >
            {isRunningTests ? 'Tests en cours...' : 'Exécuter tous les tests'}
        </button>

        <button 
          onClick={handleRunFinalTest}
          disabled={isRunningFinalTest}
          style={{
            padding: '10px 20px',
            backgroundColor: isRunningFinalTest ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunningFinalTest ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            fontWeight: 'bold'
          }}
        >
          {isRunningFinalTest ? '🔥 Test final en cours...' : '🔥 TEST FINAL COMPLET'}
        </button>
          
          <button 
            onClick={handleClearSession}
            style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            🧹 Effacer Session Admin
          </button>
        </div>
      </div>

      {status && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: status.includes('❌') ? '#f8d7da' : '#d4edda',
          border: `1px solid ${status.includes('❌') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <strong>Status:</strong> {status}
        </div>
      )}

      {testResults && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: testResults.success ? '#d4edda' : '#f8d7da', 
          border: `1px solid ${testResults.success ? '#c3e6cb' : '#f5c6cb'}`, 
          borderRadius: '5px' 
        }}>
          <h3>Résultats des tests</h3>
          <p><strong>Total:</strong> {testResults.total} tests</p>
          <p><strong>Réussis:</strong> {testResults.passed}</p>
          <p><strong>Échoués:</strong> {testResults.failed}</p>
          
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Détails des tests
            </summary>
            <div style={{ marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {testResults.results.map((result, index) => (
                <div key={index} style={{ 
                  padding: '5px', 
                  marginBottom: '5px',
                  backgroundColor: result.type === 'pass' ? '#d1ecf1' : 
                                 result.type === 'fail' ? '#f8d7da' : '#fff3cd',
                  borderRadius: '3px',
                  fontSize: '14px'
                }}>
                  <span style={{ fontWeight: 'bold' }}>[{result.timestamp}]</span> {result.message}
                </div>
              ))}
            </div>
          </details>
         </div>
       )}

       {finalTestResults && (
         <div style={{ 
           marginTop: '20px', 
           padding: '20px', 
           backgroundColor: finalTestResults.success ? '#d4edda' : '#f8d7da', 
           border: `2px solid ${finalTestResults.success ? '#28a745' : '#dc3545'}`, 
           borderRadius: '10px' 
         }}>
           <h2 style={{ color: finalTestResults.success ? '#155724' : '#721c24' }}>
             {finalTestResults.success ? '🎉 TEST FINAL RÉUSSI!' : '❌ TEST FINAL ÉCHOUÉ'}
           </h2>
           
           {finalTestResults.success && (
             <div style={{ marginTop: '15px' }}>
               <h3>✅ Toutes les fonctionnalités validées:</h3>
               <ul style={{ marginLeft: '20px' }}>
                 <li>✅ Authentification admin</li>
                 <li>✅ Stockage localStorage</li>
                 <li>✅ Simulation Redux</li>
                 <li>✅ Données de test</li>
                 <li>✅ API services</li>
               </ul>
               <p style={{ 
                 marginTop: '15px', 
                 padding: '10px', 
                 backgroundColor: '#d1ecf1', 
                 borderRadius: '5px',
                 fontWeight: 'bold'
               }}>
                 🚀 Le dashboard admin est prêt à être utilisé!
               </p>
             </div>
           )}
           
           <details style={{ marginTop: '15px' }}>
             <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
               Logs détaillés du test final
             </summary>
             <div style={{ marginTop: '10px', maxHeight: '400px', overflowY: 'auto' }}>
               {finalTestResults.results && finalTestResults.results.map((result, index) => (
                 <div key={index} style={{ 
                   padding: '8px', 
                   marginBottom: '5px',
                   backgroundColor: result.type === 'pass' || result.type === 'success' ? '#d1ecf1' : 
                                  result.type === 'error' ? '#f8d7da' : '#fff3cd',
                   borderRadius: '3px',
                   fontSize: '14px',
                   fontFamily: 'monospace'
                 }}>
                   <span style={{ fontWeight: 'bold' }}>[{result.timestamp}]</span> {result.message}
                 </div>
               ))}
             </div>
           </details>
         </div>
       )}
     </div>
   );
};

export default TestAdmin;