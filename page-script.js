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
        document.getElementById('page-title').textContent = title;

        // Convert Markdown to HTML
        document.getElementById('page-content').innerHTML = marked.parse(markdownBody);

    } catch (error) {
        console.error(error);
        document.getElementById('page-title').textContent = 'Error 404';
        document.getElementById('page-content').innerHTML = '<p>La página que buscas no existe o ha sido movida.</p><a href="index.html">Volver al inicio</a>';
    }
});
