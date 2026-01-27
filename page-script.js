document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        document.getElementById('page-title').textContent = 'Página no encontrada';
        document.getElementById('page-content').innerHTML = '<p>No se especificó ninguna página.</p>';
        return;
    }

    try {
        // Attempt to fetch the markdown file
        // Note: In a real SSG this would be pre-built, but here we fetch dynamically for simplicity
        const response = await fetch(`content/pages/${slug}.md`);

        if (!response.ok) {
            throw new Error('Page not found');
        }

        const text = await response.text();

        // Simple parsing of Frontmatter
        // We assume standard --- delimiters
        const parts = text.split('---');
        let title = 'Sin título';
        let markdownBody = text;

        if (parts.length >= 3) {
            // Has frontmatter
            const frontmatter = parts[1];
            markdownBody = parts.slice(2).join('---');

            // Extract title purely via regex for simplicity
            const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
            if (titleMatch) {
                title = titleMatch[1];
            }
        } else {
            // Attempt to guess title from first H1
            const h1Match = text.match(/^#\s+(.*)/);
            if (h1Match) {
                title = h1Match[1];
                markdownBody = text.replace(/^#\s+.*(\r\n|\n|\r)/, '');
            }
        }

        // Update DOM
        document.title = `${title} — Perspectivas`;
        const titleEl = document.getElementById('page-title');
        const contentEl = document.getElementById('page-content');
        const loadingEl = document.getElementById('page-loading');

        if (loadingEl) loadingEl.style.display = 'none';
        if (titleEl) {
            titleEl.textContent = title;
            titleEl.style.display = 'block';
        }

        // Convert Markdown to HTML
        if (contentEl) {
            contentEl.innerHTML = marked.parse(markdownBody);
        }

    } catch (error) {
        console.error(error);
        const titleEl = document.getElementById('page-title');
        const contentEl = document.getElementById('page-content');
        const loadingEl = document.getElementById('page-loading');

        if (loadingEl) loadingEl.style.display = 'none';
        if (titleEl) {
            titleEl.textContent = 'Error 404';
            titleEl.style.display = 'block';
        }
        if (contentEl) {
            contentEl.innerHTML = '<p>La página que buscas no existe o ha sido movida.</p><a href="index.html" class="cta-subscribe-v2" style="display:inline-block; margin-top:2rem;">Volver al inicio</a>';
        }
    }
});
