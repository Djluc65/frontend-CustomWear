import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { store, persistor } from './store/store';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';

// CLIENT_ID Google OAuth 2.0
// Pour obtenir votre propre CLIENT_ID :
// 1. Allez sur la Google Cloud Console (https://console.cloud.google.com/)
// 2. Créez un nouveau projet ou sélectionnez-en un existant
// 3. Allez dans "APIs & Services" > "Credentials" (Identifiants)
// 4. Cliquez sur "Create Credentials" > "OAuth client ID"
// 5. Choisissez "Web application"
// 6. Ajoutez "http://localhost:3000" (ou votre domaine) dans "Authorized JavaScript origins"
// 7. Copiez le "Client ID" généré et collez-le ci-dessous ou dans votre fichier .env
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "204161238553-22o6r5mam3kugqoioehl77e1qtsosuj6.apps.googleusercontent.com";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </GoogleOAuthProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
