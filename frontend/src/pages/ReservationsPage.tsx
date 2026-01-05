import { useEffect, useMemo, useState } from 'react';
import { getToken, isAdmin } from '../auth';

const API = import.meta.env.VITE_API_URL;

type Reservation = {
  id: number;
  title: string;
  startAt: string;
  endAt: string;
  roomId: number;
  userId: number;
  recurringId?: string | null;
};

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

function hours1to24() {
  return Array.from({ length: 24 }, (_, i) => i + 1);
}

function toIsoFromDateAndHour(dateStr: string, hour: number) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);

  if (hour === 24) {
    dt.setDate(dt.getDate() + 1);
    dt.setHours(0, 0, 0, 0);
  } else {
    dt.setHours(hour, 0, 0, 0);
  }

  return dt.toISOString();
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function fromIsoToDateAndHour(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();

  if (h === 0) {
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    return {
      date: `${prev.getFullYear()}-${pad2(prev.getMonth() + 1)}-${pad2(prev.getDate())}`,
      hour: 24,
    };
  }

  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    hour: h,
  };
}

/** datum: 1.05.2026 */
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

/** ura: 11:00 */
function formatHour(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function roomLabel(rooms: Room[], roomId: number) {
  const r = rooms.find((x) => x.id === roomId);
  if (!r) return `Soba #${roomId}`;
  // samo ime + nadstropje (location)
  return `${r.name} — ${r.location}`;
}

export default function ReservationsPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // create/edit form
  const [roomId, setRoomId] = useState<number | ''>('');
  const [title, setTitle] = useState('');

  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
  });

  const [startHour, setStartHour] = useState<number>(10);
  const [endHour, setEndHour] = useState<number>(11);

  // REPEAT UI
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState<number>(4);

  // edit mode
  const [editId, setEditId] = useState<number | null>(null);

  const admin = useMemo(() => isAdmin(), []);

  async function loadReservations() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/reservations`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      setItems(await res.json());
    } catch {
      setError('Napaka pri nalaganju rezervacij');
    } finally {
      setLoading(false);
    }
  }

  async function loadRooms() {
    try {
      const res = await fetch(`${API}/rooms`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());

      const data: Room[] = await res.json();
      setRooms(data);

      if (data.length > 0 && roomId === '') setRoomId(data[0].id);
    } catch {
      setError('Ne morem naložiti sob (morda nimaš pravic za GET /rooms).');
    }
  }

  useEffect(() => {
    loadRooms();
    loadReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setEditId(null);
    setTitle('');
    setRepeatEnabled(false);
    setRepeatWeeks(4);
  }

  async function createOrUpdate() {
    setError('');
    try {
      if (!title.trim()) return setError('Vpiši naslov rezervacije');
      if (!date) return setError('Izberi datum');
      if (roomId === '') return setError('Izberi sobo');
      if (endHour <= startHour)
        return setError('Končna ura mora biti večja od začetne');

      const startAt = toIsoFromDateAndHour(date, startHour);
      const endAt = toIsoFromDateAndHour(date, endHour);

      const body: any = {
        roomId: Number(roomId),
        title,
        startAt,
        endAt,
      };

      if (!editId && repeatEnabled) body.repeatWeeks = Number(repeatWeeks);

      const url = editId
        ? `${API}/reservations/${editId}`
        : `${API}/reservations`;
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      resetForm();
      await loadReservations();
    } catch {
      setError('Napaka pri shranjevanju rezervacije');
    }
  }

  async function remove(id: number) {
    setError('');
    try {
      const res = await fetch(`${API}/reservations/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadReservations();
    } catch {
      setError('Brisanje ni uspelo');
    }
  }

  function startEdit(r: Reservation) {
    setEditId(r.id);
    setRoomId(r.roomId);
    setTitle(r.title);

    const s = fromIsoToDateAndHour(r.startAt);
    const e = fromIsoToDateAndHour(r.endAt);

    setDate(s.date);
    setStartHour(s.hour);
    setEndHour(e.hour);

    setRepeatEnabled(false);
    setRepeatWeeks(4);
  }

  return (
    <div>
      <h2>Rezervacije</h2>

      <div className="card">
        <h3>{editId ? `Uredi rezervacijo #${editId}` : 'Nova rezervacija'}</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            createOrUpdate();
          }}
        >
          <label style={{ display: 'grid', gap: 6 }}>
            Soba
            <select
              value={roomId === '' ? '' : String(roomId)}
              onChange={(e) =>
                setRoomId(e.target.value ? Number(e.target.value) : '')
              }
            >
              {rooms.length === 0 ? (
                <option value="">(ni sob)</option>
              ) : (
                rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.location}
                  </option>
                ))
              )}
            </select>
          </label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Naslov (npr. Tedenski sestanek)"
          />

          <label style={{ display: 'grid', gap: 6 }}>
            Datum
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              Začetek (ura 1–24)
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
              >
                {hours1to24().map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              Konec (ura 1–24)
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
              >
                {hours1to24().map((h) => (
                  <option key={h} value={h}>
                    {h}:00
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!editId && (
            <>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={repeatEnabled}
                  onChange={(e) => setRepeatEnabled(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Ponovi rezervacijo
              </label>

              {repeatEnabled && (
                <label style={{ display: 'grid', gap: 6 }}>
                  Število tednov (ustvari 1x na teden)
                  <select
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}{' '}
                        {n === 1
                          ? 'teden'
                          : n === 2
                            ? 'tedna'
                            : n === 3 || n === 4
                              ? 'tedne'
                              : 'tednov'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </>
          )}

          <button type="submit">{editId ? 'Save' : 'Create'}</button>

          {editId && (
            <button type="button" onClick={resetForm}>
              Cancel
            </button>
          )}
        </form>

        {error && <p style={{ color: 'crimson' }}>{error}</p>}
      </div>

      <h3>Seznam</h3>

      {loading ? (
        <p>Nalaganje...</p>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left' }}>
                <th>Naslov</th>
                <th>Soba</th>
                <th>Datum</th>
                <th>Ura</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {items.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                  <td>{r.title}</td>
                  <td>{roomLabel(rooms, r.roomId)}</td>
                  <td>{formatDate(r.startAt)}</td>
                  <td>
                    {formatHour(r.startAt)} – {formatHour(r.endAt)}
                  </td>

                  <td
                    style={{
                      display: 'flex',
                      gap: 8,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <button type="button" onClick={() => startEdit(r)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => remove(r.id)}>
                      Delete
                    </button>

                    {admin && r.recurringId && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(
                            `${API}/reservations/series/${r.recurringId}`,
                            {
                              method: 'DELETE',
                              headers: authHeaders(),
                            },
                          );
                          if (res.ok) await loadReservations();
                        }}
                      >
                        Delete series
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 12, opacity: 0.7 }}>
                    Ni rezervacij.
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
