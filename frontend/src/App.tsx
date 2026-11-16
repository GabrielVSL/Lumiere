import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import Home from './components/Home';
import LumierePlay from './components/LumierePlay';
import MyList from './components/MyList';
import { AuthProvider } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import AppLayout from './components/layout/AppLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Modal Global de Autenticação com Estética Editorial */}
        <AuthModal />

        <Routes>
          {/* 1. Landing Page Pública */}
          <Route path="/" element={<LandingPage />} />

          {/* 2. Início da Plataforma de Filmes Clássicos (Pós-Login) */}
          <Route
            path="/app"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />

          {/* 3. Explorar o Acervo (648 Obras Clássicas) */}
          <Route
            path="/play"
            element={
              <AppLayout>
                <LumierePlay />
              </AppLayout>
            }
          />
          <Route
            path="/explorar"
            element={
              <AppLayout>
                <LumierePlay />
              </AppLayout>
            }
          />

          {/* 4. Minha Lista de Clássicos Salvos */}
          <Route
            path="/minha-lista"
            element={
              <AppLayout>
                <MyList />
              </AppLayout>
            }
          />

          {/* Redireciona antigas rotas de filmes modernos para o acervo clássico */}
          <Route path="/explorer" element={<Navigate to="/play" replace />} />
          <Route path="/detalhes/:id" element={<Navigate to="/play" replace />} />
          <Route path="/series/:id" element={<Navigate to="/play" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
