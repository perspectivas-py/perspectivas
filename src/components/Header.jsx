
import React, { useEffect, useState } from "react";
import "../styles/header.css";
import analytics from "../utils/analytics";

function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
	return null;
}

function setCookie(name, value, days = 365) {
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

const CTA_VARIANTS = [
	{ key: "A", text: "Suscríbete — 2 análisis/semana" },
	{ key: "B", text: "Únete a Perspectivas — contenido exclusivo" },
	{ key: "C", text: "Recibe alertas de mercado" }
];

const Header = () => {
	const [ctaVariant, setCtaVariant] = useState("A");

	useEffect(() => {
		let variant = getCookie("ab_cta_variant");
		if (!variant) {
			const idx = Math.floor(Math.random() * CTA_VARIANTS.length);
			variant = CTA_VARIANTS[idx].key;
			setCookie("ab_cta_variant", variant);
		}
		setCtaVariant(variant);
		analytics.track("cta_ab_test_view", { variant });
	}, []);

	const handleMenuClick = (category) => {
		analytics.track("menu_click", { category });
	};

	const handleCtaClick = () => {
		analytics.track("cta_click", { variant: ctaVariant, location: "header" });
	};

	return (
		<nav className="site-nav" role="navigation" aria-label="Main">
			<div className="nav-top">
				<a className="logo" href="/">Perspectivas</a>
				<form className="search" role="search" aria-label="Buscar">
					<input type="search" name="q" placeholder="Buscar por tema, autor o dataset" aria-label="Buscar" />
				</form>
				<div className="cta-login">
					<button id="subscribe-cta" className="btn btn-primary" onClick={handleCtaClick}>
						{CTA_VARIANTS.find(v => v.key === ctaVariant)?.text || "Suscríbete"}
					</button>
					<a className="login" href="/login" aria-label="Iniciar sesión">Entrar</a>
				</div>
			</div>
			<ul className="nav-main" role="menubar">
				<li role="none"><a role="menuitem" href="/" onClick={() => handleMenuClick("Inicio")}>Inicio</a></li>
				<li role="none"><a role="menuitem" href="/news" onClick={() => handleMenuClick("Noticias")}>Noticias</a></li>
				<li role="none"><a role="menuitem" href="/analysis" onClick={() => handleMenuClick("Análisis")}>Análisis</a></li>
				<li role="none"><a role="menuitem" href="/markets" onClick={() => handleMenuClick("Mercados")}>Mercados</a></li>
				<li role="none"><a role="menuitem" href="/visualizations" onClick={() => handleMenuClick("Visualizaciones")}>Visualizaciones</a></li>
				<li role="none"><a role="menuitem" href="/podcast" onClick={() => handleMenuClick("Podcast")}>Podcast</a></li>
				<li role="none"><a role="menuitem" href="/resources" onClick={() => handleMenuClick("Recursos")}>Recursos</a></li>
			</ul>
		</nav>
	);
};

export default Header;