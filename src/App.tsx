import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import GuidePopup from './components/GuidePopup';
import EventPopup from './components/EventPopup';
import HomePage from './pages/HomePage';
import CreateSchedulePage from './pages/CreateSchedulePage';
import MySchedulePage from './pages/MySchedulePage';
import CharactersPage from './pages/CharactersPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import './App.css';

// 인증 필요한 라우트
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 회원 전용 라우트 (게스트 제외)
const MemberRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isGuest, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!isLoggedIn || isGuest) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// 관리자 전용 라우트
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="app">
      {isLoggedIn && <Header />}
      <main className={isLoggedIn ? 'main-content' : ''}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <MemberRoute>
                <CreateSchedulePage />
              </MemberRoute>
            }
          />
          <Route
            path="/my-schedule"
            element={
              <MemberRoute>
                <MySchedulePage />
              </MemberRoute>
            }
          />
          <Route
            path="/characters"
            element={
              <MemberRoute>
                <CharactersPage />
              </MemberRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      {isLoggedIn && <Footer />}
      {isLoggedIn && <EventPopup />}
      {isLoggedIn && <GuidePopup />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
