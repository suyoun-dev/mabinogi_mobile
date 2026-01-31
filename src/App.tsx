import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import CreateSchedulePage from './pages/CreateSchedulePage';
import MySchedulePage from './pages/MySchedulePage';
import CharactersPage from './pages/CharactersPage';
import './App.css';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/create" element={<CreateSchedulePage />} />
              <Route path="/my-schedule" element={<MySchedulePage />} />
              <Route path="/characters" element={<CharactersPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
