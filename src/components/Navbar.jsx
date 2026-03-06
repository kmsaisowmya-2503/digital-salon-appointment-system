import React from "react";
import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="brand">💇‍♀️ Salon Booking</div>
        <nav className="links">
          <NavLink to="/" end className={({isActive}) => isActive ? "active" : ""}>Home</NavLink>
          <NavLink to="/services" className={({isActive}) => isActive ? "active" : ""}>Services</NavLink>
          <NavLink to="/book" className={({isActive}) => isActive ? "active" : ""}>Book</NavLink>
          <NavLink to="/my-bookings" className={({isActive}) => isActive ? "active" : ""}>My Bookings</NavLink>
          <NavLink to="/admin" className={({isActive}) => isActive ? "active" : ""}>Admin</NavLink>
        </nav>
      </div>
    </header>
  );
}
