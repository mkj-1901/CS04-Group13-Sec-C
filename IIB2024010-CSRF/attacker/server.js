// ============================================================================
// CSRF DEMO – Attacker Server (port 3001)
// Serves malicious pages that exploit the victim app's CSRF vulnerability.
// ============================================================================

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = 3001;

// Serve all HTML files in this directory as static files
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log('');
  console.log(`====================================================`);
  console.log(`  CSRF Demo – Attacker Server`);
  console.log(`  URL  : http://localhost:${PORT}`);
  console.log(`  Pages:`);
  console.log(`    GET  exploit : http://localhost:${PORT}/csrf-get.html`);
  console.log(`    POST exploit : http://localhost:${PORT}/csrf-post.html`);
  console.log(`====================================================`);
  console.log('');
});
