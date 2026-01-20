import React, { useEffect, useRef, useState } from "react";

const MarketWidget = () => {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible && !data) {
      fetch("/api/markets/latest")
        .then(res => res.json())
        .then(setData);
    }
  }, [visible, data]);

  if (!visible) return <div ref={ref} style={{ minHeight: 80 }} />;

  return (
    <div className="market-widget" ref={ref}>
      <h3>Mercados</h3>
      {data ? (
        <ul>
          {data.map((item, i) => (
            <li key={i}>{item.name}: {item.value}</li>
          ))}
        </ul>
      ) : (
        <div>Cargando datos de mercados...</div>
      )}
      <button className="expand-markets" onClick={() => setExpanded(true)}>
        Expandir panel de mercados
      </button>
      {expanded && (
        <div className="market-panel">
          {/* Aquí iría el panel detallado de mercados */}
          <h4>Panel detallado</h4>
          {/* ... */}
          <button onClick={() => setExpanded(false)}>Cerrar panel</button>
        </div>
      )}
    </div>
  );
};

export default MarketWidget;
