import React, { useEffect, useMemo, useState } from "react";
import { loadBookings, saveBookings } from "../storage";
import BookingCard from "../components/BookingCard";

export default function MyBookings() {
  const [bookings, setBookings] = useState(() => loadBookings());
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("BOOKING_ID"); // BOOKING_ID | PHONE

  useEffect(() => {
    saveBookings(bookings);
  }, [bookings]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    if (mode === "BOOKING_ID") {
      return bookings.filter(b => b.id.toLowerCase() === q.toLowerCase());
    }
    return bookings.filter(b => b.phone === q);
  }, [query, mode, bookings]);

  function cancelBooking(id) {
    setBookings(prev =>
      prev.map(b => (b.id === id ? { ...b, status: "CANCELLED" } : b))
    );
  }

  return (
    <div>
      <h1>My Bookings</h1>

      <div className="card">
        <div className="card-title">Search your booking</div>

        <div className="grid2 gap">
          <div>
            <label className="label">Search by</label>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="BOOKING_ID">Booking ID</option>
              <option value="PHONE">Phone</option>
            </select>
          </div>
          <div>
            <label className="label">{mode === "BOOKING_ID" ? "Booking ID" : "Phone"}</label>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value.trimStart())}
              placeholder={mode === "BOOKING_ID" ? "Ex: BK12ABCD1234" : "10-digit phone"}
            />
          </div>
        </div>

        {query.trim() ? (
          results.length ? (
            <div className="cards">
              {results.map(b => (
                <BookingCard key={b.id} b={b} showCancel={true} onCancel={cancelBooking} />
              ))}
            </div>
          ) : (
            <div className="empty">No booking found. Check your {mode === "BOOKING_ID" ? "Booking ID" : "Phone"}.</div>
          )
        ) : (
          <div className="muted small">Enter your details to search.</div>
        )}
      </div>
    </div>
  );
}
