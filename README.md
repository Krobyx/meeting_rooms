# Rezervacija sejnih sob

Spletna full-stack aplikacija za upravljanje in rezervacijo sejnih sob v podjetju.  
Aplikacija omogoča prijavo uporabnikov, upravljanje sejnih sob (ADMIN) ter ustvarjanje in upravljanje rezervacij (USER / ADMIN).

---

## 🧩 Tehnologije

### Backend
- **NestJS**
- **Prisma ORM**
- **PostgreSQL**
- **JWT (avtentikacija)**
- **Role-based avtorizacija (ADMIN / USER)**

### Frontend
- **React (Vite)**
- **TypeScript**
- **Fetch API**
- **CSS**

---

## 👤 Uporabniške vloge

### USER
- prijava / odjava
- ustvarjanje rezervacij
- urejanje in brisanje **samo svojih** rezervacij
- nalaganje avatarja

### ADMIN
- vse pravice USER-ja
- ustvarjanje, urejanje in brisanje sejnih sob
- brisanje in urejanje **vseh** rezervacij

---

## 🔐 Varnost

- JWT avtentikacija
- Role-based avtorizacija
- Backend validacija (DTO + class-validator)
- Zaščiteni endpointi
- Preprečevanje dvojnih rezervacij v istem terminu

---

## 📦 Funkcionalnosti

- Registracija in prijava uporabnikov
- CRUD za sejne sobe (ADMIN)
- CRUD za rezervacije
- Preverjanje konflikta rezervacij
- Ponavljajoče rezervacije (tedensko)
- Nalaganje avatarja uporabnika
- Prikaz podatkov v frontendu

---

## 🗂️ Podatkovni model

- **User**
- **Room**
- **Reservation**

Relacije:
- User 1:N Reservation
- Room 1:N Reservation

---

## ▶️ Zagon projekta

### Backend
```bash
npm install
npm run start:dev
