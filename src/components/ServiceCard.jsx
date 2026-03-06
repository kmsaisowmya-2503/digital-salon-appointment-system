import React from "react";

export default function ServiceCard({ service, onSelect }) {
  return (
    <div className="card">
      <div className="card-title">{service.name}</div>
      <div className="muted">{service.category}</div>
      <div className="row">
        <span>⏱ {service.durationMin} min</span>
        <span>₹ {service.price}</span>
      </div>
      {onSelect ? (
        <button className="btn" onClick={() => onSelect(service.id)}>
          Select
        </button>
      ) : null}
    </div>
  );
}
