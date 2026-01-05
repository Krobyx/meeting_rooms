import { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('anze@test.com');
  const [password, setPassword] = useState('123456');
  const [msg, setMsg] = useState<string>('');

  const login = async () => {
    setMsg('');
    try {
      const res = await api.post('/auth/login', { email, password });

      const token = res.data.access_token;
      localStorage.setItem('token', token);

      // ⬇️ preberi role iz JWT
      const payload = parseJwt(token);

      if (payload?.role === 'ADMIN') {
        nav('/rooms');
      } else {
        nav('/reservations');
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? 'Login failed');
    }
  };

  return (
    <div>
      <h3>Login</h3>
      <div style={{ display: 'grid', gap: 8, maxWidth: 360 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
        />
        <button onClick={login}>Login</button>
        {msg && <div style={{ color: 'crimson' }}>{String(msg)}</div>}
      </div>
    </div>
  );
}
