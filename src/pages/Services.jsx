import React, { useState } from "react";
import { SERVICES } from "../data";
import ServiceCard from "../components/ServiceCard";
import { useNavigate } from "react-router-dom";

export default function Services() {
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  const categories = ["All", ...Array.from(new Set(SERVICES.map(s => s.category)))];
  const filtered = filter === "All" ? SERVICES : SERVICES.filter(s => s.category === filter);

  return (
    <div>
      <h1>Services</h1>

      <div className="toolbar">
        <label className="muted">Category</label>
        <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="cards">
        {filtered.map(s => (
          <ServiceCard
            key={s.id}
            service={s}
            onSelect={() => navigate("/book", { state: { preselectServiceId: s.id } })}
          />
        ))}
      </div>
    </div>
  );
}
