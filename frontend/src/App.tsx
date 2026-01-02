import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RoomsPage from './pages/RoomsPage';
import ReservationsPage from './pages/ReservationsPage';

export default function App() {
  const nav = useNavigate();
  const token = localStorage.getItem('token');

  const logout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };

  return (
    <div
      style={{ maxWidth: 900, margin: '24px auto', fontFamily: 'system-ui' }}
    >
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h2 style={{ marginRight: 'auto' }}>Meeting Rooms</h2>
        <Link to="/rooms">Rooms</Link>
        <Link to="/reservations">Reservations</Link>
        {!token ? (
          <Link to="/login">Login</Link>
        ) : (
          <button onClick={logout}>Logout</button>
        )}
      </header>

      <hr style={{ margin: '16px 0' }} />

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="*" element={<RoomsPage />} />
      </Routes>
    </div>
  );
}
