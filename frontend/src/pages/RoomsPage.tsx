import { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

type Room = { id: number; name: string; capacity: number; location: string };

export default function RoomsPage() {
  const nav = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState('Sejna soba A');
  const [capacity, setCapacity] = useState(10);
  const [location, setLocation] = useState('1. nadstropje');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setMsg('');
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (e: any) {
      if (e?.response?.status === 401) nav('/login');
      else setMsg(e?.response?.data?.message ?? 'Napaka pri branju sob');
    }
  };

  const create = async () => {
    setMsg('');
    try {
      await api.post('/rooms', { name, capacity, location });
      await load();
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? 'Napaka pri ustvarjanju sobe');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h3>Sobe</h3>

      <div
        style={{
          display: 'grid',
          gap: 8,
          maxWidth: 520,
          padding: 12,
          border: '1px solid #ddd',
        }}
      >
        <b>Dodaj sobo</b>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="name"
        />
        <input
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
          placeholder="capacity"
          type="number"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="location"
        />
        <button onClick={create}>Create</button>
        {msg && <div style={{ color: 'crimson' }}>{String(msg)}</div>}
      </div>

      <h4>Seznam</h4>
      <ul>
        {rooms.map((r) => (
          <li key={r.id}>
            #{r.id} — {r.name} ({r.capacity}) — {r.location}
          </li>
        ))}
      </ul>
    </div>
  );
}
