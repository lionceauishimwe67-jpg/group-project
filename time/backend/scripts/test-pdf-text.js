const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Test with first PDF
const pdfFile = path.join(__dirname, '..', 'uploads', 'chronograms', 'chronogram-1778153214705-501212509.pdf');
const dataBuffer = fs.readFileSync(pdfFile);

pdfParse(dataBuffer).then(data => {
  console.log('=== RAW PDF TEXT ===');
  console.log(data.text);
  console.log('\n=== TEXT LENGTH:', data.text.length);
  console.log('=== PAGES:', data.numpages);
}).catch(e => console.error('Error:', e.message));
