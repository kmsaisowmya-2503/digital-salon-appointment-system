import React, { useEffect, useMemo, useState } from "react";
import { loadBookings, saveBookings } from "../storage";
import { toISODate } from "../utils";
import BookingCard from "../components/BookingCard";

export default function Admin() {
  const [bookings, setBookings] = useState(() => loadBookings());
  const [filter, setFilter] = useState("TODAY"); // TODAY | UPCOMING | CANCELLED | ALL

  useEffect(() => {
    saveBookings(bookings);
  }, [bookings]);

  const today = toISODate(new Date());

  const filtered = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => b.createdAt - a.createdAt);

    if (filter === "ALL") return sorted;
    if (filter === "CANCELLED") return sorted.filter(b => b.status === "CANCELLED");
    if (filter === "TODAY") return sorted.filter(b => b.date === today);
    if (filter === "UPCOMING") return sorted.filter(b => b.date >= today && b.status !== "CANCELLED");
    return sorted;
  }, [bookings, filter, today]);

  function cancelBooking(id) {
    setBookings(prev =>
      prev.map(b => (b.id === id ? { ...b, status: "CANCELLED" } : b))
    );
  }

  const stats = useMemo(() => {
    const total = bookings.length;
    const cancelled = bookings.filter(b => b.status === "CANCELLED").length;
    const todayCount = bookings.filter(b => b.date === today).length;
    return { total, cancelled, todayCount };
  }, [bookings, today]);

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <div className="grid3 gap">
        <div className="card">
          <div className="muted">Total bookings</div>
          <div className="big">{stats.total}</div>
        </div>
        <div className="card">
          <div className="muted">Today</div>
          <div className="big">{stats.todayCount}</div>
        </div>
        <div className="card">
          <div className="muted">Cancelled</div>
          <div className="big">{stats.cancelled}</div>
        </div>
      </div>

      <div className="toolbar">
        <label className="muted">View</label>
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="TODAY">Today</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="ALL">All</option>
        </select>
      </div>

      {filtered.length ? (
        <div className="cards">
          {filtered.map(b => (
            <BookingCard key={b.id} b={b} showCancel={true} onCancel={cancelBooking} />
          ))}
        </div>
      ) : (
        <div className="empty">No bookings in this view.</div>
      )}
    </div>
  );
}
