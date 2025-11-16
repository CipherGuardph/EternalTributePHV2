const fs = require('fs');
const path = require('path');

const tributesDir = path.join(__dirname, 'tributes');
const viewsDir = path.join(__dirname, 'views');
const outputDir = path.join(__dirname, 'public');

// Function to extract tribute info from an HTML file
function getTributeInfo(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const titleMatch = content.match(/<title>In Loving Memory of (.*?)<\/title>/);
    const name = titleMatch ? titleMatch[1] : 'Unknown';
    const descriptionMatch = content.match(/<p class="message">(.*?)<\/p>/) || content.match(/<p>(.*?)<\/p>/);
    const description = descriptionMatch ? descriptionMatch[1] : 'A life to remember.';
    const relativePath = path.relative(tributesDir, filePath).replace(/\\/g, '/');

    return {
        name,
        description,
        url: `/tributes/${relativePath}`
    };
}

// Read all tribute files
const tributeFiles = fs.readdirSync(tributesDir).filter(file => file.endsWith('.html'));
const tributes = tributeFiles.map(file => getTributeInfo(path.join(tributesDir, file)));

// Create the HTML for the recent tributes section
const recentTributesHtml = tributes.map(tribute => `
    <div class="tribute-preview-card">
        <h4>In Loving Memory of ${tribute.name}</h4>
        <p>${tribute.description}</p>
        <a href="${tribute.url}" class="button small-button">View Tribute</a>
    </div>
`).join('');

// Read the main index.html template
const indexTemplate = fs.readFileSync(path.join(viewsDir, 'index.html'), 'utf-8');

// Replace the placeholder with the dynamic content
const finalHtml = indexTemplate.replace(
    /<div class="tribute-preview-grid">[\s\S]*?<\/div>/,
    `<div class="tribute-preview-grid">${recentTributesHtml}</div>`
);

// Write the final HTML to the output directory
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}
fs.writeFileSync(path.join(outputDir, 'index.html'), finalHtml);

// Copy tributes directory to public
const publicTributesDir = path.join(outputDir, 'tributes');
if (fs.existsSync(publicTributesDir)) {
    fs.rmSync(publicTributesDir, { recursive: true, force: true });
}
fs.mkdirSync(publicTributesDir);

tributeFiles.forEach(file => {
    fs.copyFileSync(path.join(tributesDir, file), path.join(publicTributesDir, file));
});

console.log('Build complete. index.html and tributes generated in public directory.');
