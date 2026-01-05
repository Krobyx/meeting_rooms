import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomsPage from './pages/RoomsPage';
import ReservationsPage from './pages/ReservationsPage';
import { isAdmin, isLoggedIn } from './auth';

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/reservations" replace />;
  return <>{children}</>;
}

export default function App() {
  const nav = useNavigate();
  const token = localStorage.getItem('token');
  const admin = isAdmin();

  const logout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };

  return (
    <div className="container">
      <header className="navbar">
        <h1>Meeting Rooms</h1>

        {/* Rooms link vidi samo ADMIN */}
        {admin && <Link to="/rooms">Rooms</Link>}

        {/* Reservations vidi vsak prijavljen (in tudi neprijavljen lahko klikne, ampak ga preusmeri) */}
        <Link to="/reservations">Reservations</Link>

        {!token ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <button onClick={logout}>Logout</button>
        )}
      </header>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rooms: samo ADMIN */}
        <Route
          path="/rooms"
          element={
            <AdminOnly>
              <RoomsPage />
            </AdminOnly>
          }
        />

        {/* Reservations: vsi prijavljeni */}
        <Route
          path="/reservations"
          element={
            <RequireAuth>
              <ReservationsPage />
            </RequireAuth>
          }
        />

        {/* Default: če nisi prijavljen -> login, sicer ADMIN -> rooms, USER -> reservations */}
        <Route
          path="*"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : (
              <Navigate to={admin ? '/rooms' : '/reservations'} replace />
            )
          }
        />
      </Routes>
    </div>
  );
}
