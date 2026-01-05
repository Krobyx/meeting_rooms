import { useEffect, useMemo, useState } from 'react';
import { getToken, isAdmin } from '../auth';

const API = import.meta.env.VITE_API_URL;

type Room = {
  id: number;
  name: string;
  capacity: number;
  location: string;
};

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export default function RoomsPage() {
  const admin = useMemo(() => isAdmin(), []);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // form
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [location, setLocation] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/rooms`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      setRooms(await res.json());
    } catch {
      setError('Napaka pri nalaganju sob');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createRoom() {
    setError('');
    try {
      if (!name.trim()) return setError('Vpiši ime sobe');
      if (!location.trim()) return setError('Vpiši lokacijo / nadstropje');

      const res = await fetch(`${API}/rooms`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name,
          capacity: Number(capacity),
          location,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setName('');
      setCapacity('10');
      setLocation('');
      await load();
    } catch (e: any) {
      // če nisi admin, bo backend vrnil 403
      setError(
        e?.message?.includes('Forbidden')
          ? 'Nimaš pravic (samo ADMIN lahko dodaja sobe).'
          : 'Napaka pri ustvarjanju sobe',
      );
    }
  }

  async function deleteRoom(id: number) {
    setError('');
    const ok = confirm('Res želiš izbrisati to sobo?');
    if (!ok) return;

    try {
      const res = await fetch(`${API}/rooms/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error(await res.text());

      await load();
    } catch (e: any) {
      setError(
        e?.message?.includes('Forbidden')
          ? 'Nimaš pravic (samo ADMIN lahko briše sobe).'
          : 'Brisanje sobe ni uspelo',
      );
    }
  }

  return (
    <div>
      <h2>Sobe</h2>

      {admin && (
        <div className="card">
          <h3>Dodaj sobo</h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              createRoom();
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ime sobe"
            />
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Kapaciteta"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Lokacija (npr. 1. nadstropje)"
            />

            <button type="submit">Create</button>
          </form>

          {error && <p style={{ color: 'crimson' }}>{error}</p>}
        </div>
      )}

      <h3>Seznam</h3>

      {loading ? (
        <p>Nalaganje...</p>
      ) : (
        <div className="card">
          {error && <p style={{ color: 'crimson' }}>{error}</p>}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th>Soba</th>
                <th>Kap.</th>
                <th>Lokacija</th>
                <th style={{ width: 1 }}></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                  <td>{r.name}</td>
                  <td>{r.capacity}</td>
                  <td>{r.location}</td>
                  <td style={{ textAlign: 'right' }}>
                    {admin && (
                      <button
                        type="button"
                        onClick={() => deleteRoom(r.id)}
                        style={{ background: 'crimson' }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {rooms.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12, opacity: 0.7 }}>
                    Ni sob.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
