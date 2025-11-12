export function parseFrontmatter(markdownContent) {
  const frontmatterRegex = /^---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(markdownContent);
  const data = { frontmatter: {}, content: markdownContent };
  if (match) {
    data.content = markdownContent.replace(match[0], '').trim();
    match[1].split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        data.frontmatter[key.trim()] = valueParts.join(':').trim().replace(/"/g, '');
      }
    });
  }
  return data;
}
