import React from "react";
import "../styles/header.css";

const Header = () => (
	<nav className="site-nav" role="navigation" aria-label="Main">
		<div className="nav-top">
			<a className="logo" href="/">Perspectivas</a>
			<form className="search" role="search" aria-label="Buscar">
				<input type="search" name="q" placeholder="Buscar por tema, autor o dataset" aria-label="Buscar" />
			</form>
			<div className="cta-login">
				<button id="subscribe-cta" className="btn btn-primary">Suscríbete</button>
				<a className="login" href="/login" aria-label="Iniciar sesión">Entrar</a>
			</div>
		</div>
		<ul className="nav-main" role="menubar">
			<li role="none"><a role="menuitem" href="/">Inicio</a></li>
			<li role="none"><a role="menuitem" href="/news">Noticias</a></li>
			<li role="none"><a role="menuitem" href="/analysis">Análisis</a></li>
			<li role="none"><a role="menuitem" href="/markets">Mercados</a></li>
			<li role="none"><a role="menuitem" href="/visualizations">Visualizaciones</a></li>
			<li role="none"><a role="menuitem" href="/podcast">Podcast</a></li>
			<li role="none"><a role="menuitem" href="/resources">Recursos</a></li>
		</ul>
	</nav>
);

export default Header;