import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <div className="hero">
        <h1>No Receptionist Required ✨</h1>
        <p className="muted">
          Customers can book services, choose time slots, and manage appointments directly.
        </p>
        <div className="row">
          <Link className="btn" to="/book">Book Appointment</Link>
          <Link className="btn secondary" to="/services">View Services</Link>
        </div>
      </div>

      <div className="section">
        <h2>How it works</h2>
        <ol className="muted">
          <li>Select service and preferred staff (or any staff)</li>
          <li>Pick date and available time slot</li>
          <li>Fill your details and confirm booking</li>
          <li>Search booking later to cancel (demo)</li>
        </ol>
      </div>
    </div>
  );
}
