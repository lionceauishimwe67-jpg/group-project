const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Test with a few different PDFs to understand patterns
const uploadDir = path.join(__dirname, '..', 'uploads', 'chronograms');
const pdfFiles = fs.readdirSync(uploadDir).filter(f => f.toLowerCase().endsWith('.pdf')).slice(0, 5);

(async () => {
  for (const pdfFile of pdfFiles) {
    const filePath = path.join(uploadDir, pdfFile);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`FILE: ${pdfFile}`);
    console.log(`PAGES: ${data.numpages}`);
    console.log(`TEXT LENGTH: ${data.text.length}`);
    console.log(`${'='.repeat(80)}`);
    
    // Extract key info
    const text = data.text;
    
    // Look for qualification title
    const qualMatch = text.match(/QUALIFICATION TITLE[:\s]*([^\n]+)/i);
    if (qualMatch) console.log('QUALIFICATION:', qualMatch[1].trim());
    
    // Look for trade/sector
    const tradeMatch = text.match(/(?:TRADE|SECTOR)[:\s]*([^\n]+)/i);
    if (tradeMatch) console.log('TRADE:', tradeMatch[1].trim());
    
    // Look for RTQF level
    const levelMatch = text.match(/RTQF LEVEL[:\s]*([^\n]+)/i);
    if (levelMatch) console.log('RTQF LEVEL:', levelMatch[1].trim());
    
    // Look for module codes (pattern: 3-7 uppercase letters followed by 2-3 digits)
    const codeMatches = text.match(/\b([A-Z]{2,7}\d{2,3})\b/g);
    if (codeMatches) {
      const uniqueCodes = [...new Set(codeMatches)].slice(0, 20);
      console.log('MODULE CODES:', uniqueCodes.join(', '));
    }
    
    // Look for module names (lines starting with capital letters, containing verbs like Apply, Develop, Use, etc.)
    const moduleLines = text.split('\n').filter(line => {
      const trimmed = line.trim();
      return /^(Apply|Develop|Use|Gukoresha|Echanger|Kutumia|Organize|Integrate)/i.test(trimmed) && trimmed.length > 20;
    });
    if (moduleLines.length > 0) {
      console.log('MODULES:', moduleLines.slice(0, 10).join(' | '));
    }
    
    // Look for time patterns
    const timeMatches = text.match(/\b(\d{1,2}[:.]\d{2})\s*[-–—~]\s*(\d{1,2}[:.]\d{2})\b/g);
    if (timeMatches) console.log('TIME SLOTS:', [...new Set(timeMatches)].join(', '));
    
    // Look for term dates
    const termMatches = text.match(/Term\s+[IVX]+\s*[:.]\s*FROM\s+\d{2}\/\d{2}\/\d{4}\s+TO\s+\d{2}\/\d{2}\/\d{4}/gi);
    if (termMatches) console.log('TERMS:', termMatches.join(', '));
  }
})();
