import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;

export default function RegisterPage() {
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function register() {
    setError('');
    setLoading(true);

    try {
      if (!name.trim()) return setError('Vpiši ime');
      if (!email.trim()) return setError('Vpiši email');
      if (password.length < 6)
        return setError('Geslo mora imeti vsaj 6 znakov');

      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        // backend običajno vrne JSON ali text
        let msg = 'Registracija ni uspela';
        try {
          const data = await res.json();
          msg = data?.message || msg;
          if (Array.isArray(msg)) msg = msg.join(', ');
        } catch {
          msg = await res.text();
        }
        throw new Error(msg);
      }

      // po registraciji preusmeri na login
      nav('/login');
    } catch (e: any) {
      setError(e.message || 'Registracija ni uspela');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Registracija</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          register();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ime"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Geslo (min 6)"
          type="password"
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Pošiljam...' : 'Registriraj'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <p style={{ marginTop: 12 }}>
        Že imaš račun? <Link to="/login">Prijava</Link>
      </p>
    </div>
  );
}
