import React, { useState } from "react";
import analytics from "../utils/analytics";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const SubscribeModal = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [alerts, setAlerts] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const variant = getCookie("ab_cta_variant") || "A";
    analytics.track("subscribe_start", { source: "header_cta", variant });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "header_cta", variant, alerts }),
      });
      if (res.ok) {
        setSuccess(true);
        analytics.track("subscribe_complete", { source: "header_cta", plan: alerts ? "alertas" : "solo_email" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Suscríbete</h2>
        {success ? (
          <div className="modal-success">¡Gracias por suscribirte!</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Email:
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label>
              <input type="checkbox" checked={alerts} onChange={e => setAlerts(e.target.checked)} />
              Quiero recibir alertas
            </label>
            <button type="submit" disabled={loading} className="btn btn-primary">Suscribirme</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubscribeModal;
