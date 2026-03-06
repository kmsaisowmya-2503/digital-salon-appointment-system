import React from "react";

export default function BookingCard({ b, onCancel, showCancel }) {
  const servicesList = b.services || [{ name: b.serviceName, price: b.price }];
  
  return (
    <div className={`card ${b.status === "CANCELLED" ? "card-cancelled" : ""}`}>
      <div className="row space">
        <div>
          <div className="card-title">
            {servicesList.length === 1 
              ? servicesList[0].name 
              : `${servicesList.length} Services`
            }
          </div>
          <div className="muted">Booking ID: <b>{b.id}</b></div>
        </div>
        <div className="pill">{b.status}</div>
      </div>

      {servicesList.length > 1 && (
        <div className="services-list">
          {servicesList.map((service, index) => (
            <div key={index} className="service-item">
              • {service.name} (₹{service.price})
            </div>
          ))}
        </div>
      )}

      <div className="grid2">
        <div><span className="muted">Customer:</span> {b.customerName}</div>
        <div><span className="muted">Phone:</span> {b.phone}</div>
        <div><span className="muted">Date:</span> {b.date}</div>
        <div><span className="muted">Time:</span> {b.timeLabel}</div>
        <div><span className="muted">Staff:</span> {b.staffName}</div>
        <div><span className="muted">Total Price:</span> ₹ {b.price}</div>
      </div>

      {b.note ? <div className="note"><span className="muted">Note:</span> {b.note}</div> : null}

      {showCancel && b.status !== "CANCELLED" ? (
        <button className="btn danger" onClick={() => onCancel?.(b.id)}>Cancel</button>
      ) : null}
    </div>
  );
}
