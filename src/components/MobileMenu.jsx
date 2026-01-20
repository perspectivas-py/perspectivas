import React, { useState } from "react";

const menuItems = [
  { label: "Inicio", href: "/" },
  { label: "Noticias", href: "/news" },
  { label: "Análisis", href: "/analysis" },
  { label: "Mercados", href: "/markets" },
  { label: "Visualizaciones", href: "/visualizations" },
  { label: "Podcast", href: "/podcast" },
  { label: "Recursos", href: "/resources" },
];

const quickAccess = [
  { label: "Mi lista", href: "/my-list" },
  { label: "Últimas cotizaciones", href: "/markets/latest" },
];

const MobileMenu = ({ open, onClose }) => {
  if (!open) return null;
  window.dispatchEvent(new CustomEvent("analytics", { detail: { event: "hamburger_open" } }));
  const handleItemClick = (label, href) => {
    window.dispatchEvent(new CustomEvent("analytics", { detail: { event: "hamburger_item_click", label, href } }));
    if (onClose) onClose();
  };
  return (
    <div className="mobile-menu-overlay" onClick={onClose}>
      <nav className="mobile-menu" onClick={e => e.stopPropagation()}>
        <button className="mobile-menu-close" onClick={onClose}>&times;</button>
        <ul className="mobile-menu-list">
          {menuItems.map(item => (
            <li key={item.label}>
              <a href={item.href} onClick={() => handleItemClick(item.label, item.href)}>{item.label}</a>
            </li>
          ))}
        </ul>
        <div className="mobile-menu-quick">
          <h4>Accesos rápidos</h4>
          <ul>
            {quickAccess.map(item => (
              <li key={item.label}>
                <a href={item.href} onClick={() => handleItemClick(item.label, item.href)}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
};

export default MobileMenu;
