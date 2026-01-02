import { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

type Reservation = {
  id: number;
  title: string;
  startAt: string;
  endAt: string;
  recurringId: string | null;
  roomId: number;
};

export default function ReservationsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState<Reservation[]>([]);
  const [roomId, setRoomId] = useState(1);
  const [title, setTitle] = useState('Tedenski sestanek');
  const [startAt, setStartAt] = useState('2026-01-07T10:00:00.000Z');
  const [endAt, setEndAt] = useState('2026-01-07T11:00:00.000Z');
  const [repeatWeeks, setRepeatWeeks] = useState<number>(0);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setMsg('');
    try {
      const res = await api.get('/reservations');
      setItems(res.data);
    } catch (e: any) {
      if (e?.response?.status === 401) nav('/login');
      else setMsg(e?.response?.data?.message ?? 'Napaka pri branju rezervacij');
    }
  };

  const create = async () => {
    setMsg('');
    try {
      const payload: any = { roomId, title, startAt, endAt };
      if (repeatWeeks && repeatWeeks > 0) payload.repeatWeeks = repeatWeeks;

      const res = await api.post('/reservations', payload);
      setMsg(JSON.stringify(res.data));
      await load();
    } catch (e: any) {
      setMsg(
        e?.response?.data?.message ?? 'Napaka pri ustvarjanju rezervacije',
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h3>Rezervacije</h3>

      <div
        style={{
          display: 'grid',
          gap: 8,
          maxWidth: 620,
          padding: 12,
          border: '1px solid #ddd',
        }}
      >
        <b>Nova rezervacija</b>
        <input
          type="number"
          value={roomId}
          onChange={(e) => setRoomId(Number(e.target.value))}
          placeholder="roomId"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="title"
        />
        <input
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          placeholder="startAt (ISO)"
        />
        <input
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          placeholder="endAt (ISO)"
        />
        <input
          type="number"
          value={repeatWeeks}
          onChange={(e) => setRepeatWeeks(Number(e.target.value))}
          placeholder="repeatWeeks (0 = no)"
        />
        <button onClick={create}>Create</button>
        {msg && <pre style={{ whiteSpace: 'pre-wrap' }}>{String(msg)}</pre>}
      </div>

      <h4>Seznam</h4>
      <ul>
        {items.map((r) => (
          <li key={r.id}>
            #{r.id} — {r.title} — room:{r.roomId} — {r.startAt} → {r.endAt}
            {r.recurringId ? ` (series: ${r.recurringId})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
