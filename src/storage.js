const KEY = "salon_bookings_v1";

export function loadBookings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBookings(bookings) {
  localStorage.setItem(KEY, JSON.stringify(bookings));
}
