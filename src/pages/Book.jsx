import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { SALON, SERVICES, STAFF } from "../data";
import { loadBookings, saveBookings } from "../storage";
import { genBookingId, minutesToTimeStr, overlaps, parseISODate, toISODate } from "../utils";

function getServiceById(id) {
  return SERVICES.find(s => s.id === id) || null;
}
function getStaffById(id) {
  return STAFF.find(s => s.id === id) || null;
}
function getSkillForService(service) {
  return service?.category || "";
}
function staffWorksOnDate(staff, isoDate) {
  const day = parseISODate(isoDate).getDay(); // 0=Sun
  return staff.workingDays.includes(day);
}

function generateSlotsForDay(services, bookings, isoDate, staffIdOrAny, totalDuration) {
  if (!services || services.length === 0) return [];
  const openMin = SALON.openHour * 60;
  const closeMin = SALON.closeHour * 60;
  const duration = totalDuration;

  const slots = [];
  for (let start = openMin; start + duration <= closeMin; start += SALON.slotMinutes) {
    const end = start + duration;

    if (staffIdOrAny === "ANY") {
      const ok = STAFF.some(st => {
        // Check if staff has all required skills
        const requiredSkills = [...new Set(services.map(s => s.category))];
        if (!requiredSkills.every(skill => st.skills.includes(skill))) return false;
        if (!staffWorksOnDate(st, isoDate)) return false;

        const staffBookings = bookings.filter(b => b.date === isoDate && b.staffId === st.id && b.status !== "CANCELLED");
        const hasOverlap = staffBookings.some(b => overlaps(start, end, b.startMin, b.endMin));
        return !hasOverlap;
      });
      if (!ok) continue;
    } else {
      const st = getStaffById(staffIdOrAny);
      if (!st) continue;
      // Check if staff has all required skills
      const requiredSkills = [...new Set(services.map(s => s.category))];
      if (!requiredSkills.every(skill => st.skills.includes(skill))) continue;
      if (!staffWorksOnDate(st, isoDate)) continue;

      const staffBookings = bookings.filter(b => b.date === isoDate && b.staffId === st.id && b.status !== "CANCELLED");
      const hasOverlap = staffBookings.some(b => overlaps(start, end, b.startMin, b.endMin));
      if (hasOverlap) continue;
    }

    slots.push({
      startMin: start,
      endMin: end,
      label: `${minutesToTimeStr(start)} - ${minutesToTimeStr(end)}`
    });
  }
  return slots;
}

function autoAssignStaff(services, bookings, isoDate, startMin, endMin) {
  if (!services || services.length === 0) return null;
  const requiredSkills = [...new Set(services.map(s => s.category))];

  const eligible = STAFF
    .filter(st => requiredSkills.every(skill => st.skills.includes(skill)) && staffWorksOnDate(st, isoDate))
    .map(st => {
      const count = bookings.filter(b => b.date === isoDate && b.staffId === st.id && b.status !== "CANCELLED").length;
      const staffBookings = bookings.filter(b => b.date === isoDate && b.staffId === st.id && b.status !== "CANCELLED");
      const hasOverlap = staffBookings.some(b => overlaps(startMin, endMin, b.startMin, b.endMin));
      return { st, count, hasOverlap };
    })
    .filter(x => !x.hasOverlap)
    .sort((a, b) => a.count - b.count);

  return eligible.length ? eligible[0].st : null;
}

export default function Book() {
  const location = useLocation();
  const preselect = location.state?.preselectServiceId;

  const [bookings, setBookings] = useState(() => loadBookings());

  const [selectedServices, setSelectedServices] = useState(preselect ? [preselect] : []);
  const [staffPick, setStaffPick] = useState("ANY"); // ANY or staffId
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [slotStart, setSlotStart] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const [errors, setErrors] = useState({});
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    saveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    if (preselect) setSelectedServices([preselect]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setSlotStart(null);
    setConfirmed(null);
    setErrors({});
  }, [selectedServices, staffPick, date]);

  const services = useMemo(() => selectedServices.map(id => getServiceById(id)).filter(Boolean), [selectedServices]);
  const totalDuration = useMemo(() => services.reduce((sum, s) => sum + s.durationMin, 0), [services]);
  const totalPrice = useMemo(() => services.reduce((sum, s) => sum + s.price, 0), [services]);

  const compatibleStaff = useMemo(() => {
    if (services.length === 0) return [];
    // Find staff that can handle ALL selected services
    const requiredSkills = [...new Set(services.map(s => s.category))];
    return STAFF.filter(st => requiredSkills.every(skill => st.skills.includes(skill)));
  }, [services]);

  const slots = useMemo(() => {
    if (services.length === 0) return [];
    return generateSlotsForDay(services, bookings, date, staffPick, totalDuration);
  }, [services, bookings, date, staffPick, totalDuration]);

  const selectedSlot = useMemo(() => {
    if (slotStart == null || totalDuration === 0) return null;
    const end = slotStart + totalDuration;
    return { startMin: slotStart, endMin: end, label: `${minutesToTimeStr(slotStart)} - ${minutesToTimeStr(end)}` };
  }, [slotStart, totalDuration]);

  function validate() {
    const e = {};
    if (!customerName.trim()) e.customerName = "Name is required";
    if (!phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = "Phone must be 10 digits";
    if (services.length === 0) e.services = "Select at least one service";
    if (!date) e.date = "Select a date";
    if (slotStart == null) e.slot = "Select a time slot";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev) {
    ev.preventDefault();
    setConfirmed(null);

    const today = toISODate(new Date());
    if (date < today) {
      setErrors({ date: "You cannot book for a past date" });
      return;
    }

    if (!validate()) return;

    const startMin = slotStart;
    const endMin = slotStart + totalDuration;

    let staffObj = null;
    if (staffPick === "ANY") {
      staffObj = autoAssignStaff(services, bookings, date, startMin, endMin);
      if (!staffObj) {
        setErrors({ slot: "No staff available for this slot. Pick another time." });
        return;
      }
    } else {
      staffObj = getStaffById(staffPick);
      if (!staffObj) {
        setErrors({ staff: "Invalid staff selection" });
        return;
      }
      const staffBookings = bookings.filter(b => b.date === date && b.staffId === staffObj.id && b.status !== "CANCELLED");
      const clash = staffBookings.some(b => overlaps(startMin, endMin, b.startMin, b.endMin));
      if (clash) {
        setErrors({ slot: "This staff is already booked at that time. Choose another slot." });
        return;
      }
    }

    const newBooking = {
      id: genBookingId(),
      status: "CONFIRMED",
      createdAt: Date.now(),

      serviceIds: selectedServices,
      services: services.map(s => ({ id: s.id, name: s.name, price: s.price, durationMin: s.durationMin })),
      durationMin: totalDuration,
      price: totalPrice,

      staffId: staffObj.id,
      staffName: staffObj.name,

      date,
      startMin,
      endMin,
      timeLabel: selectedSlot.label,

      customerName: customerName.trim(),
      phone: phone.trim(),
      note: note.trim(),
    };

    setBookings(prev => [newBooking, ...prev]);
    setConfirmed(newBooking);
    setNote("");
  }

  return (
    <div>
      <h1>Book Appointment</h1>

      <div className="grid2 gap">
        <div className="card">
          <div className="card-title">Choose Services</div>

          <div className="services-selection">
            {SERVICES.map(s => (
              <label key={s.id} className="service-checkbox">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(s.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedServices(prev => [...prev, s.id]);
                    } else {
                      setSelectedServices(prev => prev.filter(id => id !== s.id));
                    }
                  }}
                />
                <span className="service-info">
                  {s.name} — ₹{s.price} ({s.durationMin} min)
                </span>
              </label>
            ))}
          </div>
          {selectedServices.length > 0 && (
            <div className="selected-summary">
              <strong>Total: ₹{totalPrice} ({totalDuration} min)</strong>
            </div>
          )}
          {errors.services ? <div className="error">{errors.services}</div> : null}

          <label className="label">Staff</label>
          <select className="input" value={staffPick} onChange={(e) => setStaffPick(e.target.value)}>
            <option value="ANY">Any staff (auto assign)</option>
            {compatibleStaff.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </select>
          {errors.staff ? <div className="error">{errors.staff}</div> : null}

          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          {errors.date ? <div className="error">{errors.date}</div> : null}

          <div className="muted small">
            Salon hours: {SALON.openHour}:00 - {SALON.closeHour}:00 | Slot step: {SALON.slotMinutes} min
          </div>
        </div>

        <div className="card">
          <div className="card-title">Available Slots</div>

          {slots.length === 0 ? (
            <div className="empty">
              No slots available for this date. Try another date or choose “Any staff”.
            </div>
          ) : (
            <div className="slots">
              {slots.map(s => (
                <button
                  key={s.startMin}
                  className={`slot ${slotStart === s.startMin ? "slot-active" : ""}`}
                  onClick={() => setSlotStart(s.startMin)}
                  type="button"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {errors.slot ? <div className="error">{errors.slot}</div> : null}

          {selectedSlot ? (
            <div className="selected">
              Selected: <b>{selectedSlot.label}</b>
            </div>
          ) : null}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Customer Details</div>

        <form onSubmit={onSubmit} className="form">
          <div className="grid2 gap">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
              />
              {errors.customerName ? <div className="error">{errors.customerName}</div> : null}
            </div>

            <div>
              <label className="label">Phone (10 digits) *</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter phone number"
              />
              {errors.phone ? <div className="error">{errors.phone}</div> : null}
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any request (e.g., prefer quick service)"
            />
          </div>

          <button className="btn" type="submit">Confirm Booking</button>
        </form>

        {confirmed ? (
          <div className="success">
            ✅ Booking Confirmed! <br />
            Booking ID: <b>{confirmed.id}</b> <br />
            {confirmed.serviceName} | {confirmed.date} | {confirmed.timeLabel} | Staff: {confirmed.staffName}
          </div>
        ) : null}
      </div>
    </div>
  );
}
