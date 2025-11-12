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

export function findFirstImage(content) {
  const imageMatch = content.match(/!\[.*\]\((.*)\)/);
  if (imageMatch && imageMatch[1]) {
    if (imageMatch[1].startsWith('http')) {
      return imageMatch[1];
    } else {
      return `https://perspectivaspy.vercel.app${imageMatch[1].startsWith('/') ? '' : '/'}${imageMatch[1]}`;
    }
  }
  return null;
}
