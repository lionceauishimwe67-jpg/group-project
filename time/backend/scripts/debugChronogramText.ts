import fs from 'fs';
import path from 'path';
const mod = require('pdf-parse');
const PDFParse = mod.PDFParse;

(async () => {
  const filePath = path.resolve(process.cwd(), '..', 'AI_Timetable_Testing_Data.pdf');
  const buf = fs.readFileSync(filePath);
  const p = new PDFParse(new Uint8Array(buf));
  const result: any = await p.getText();
  const raw = result.text || result;
  const blockTags = ['rdf:RDF', 'rdf:Description', 'xmpMM', 'xmp', 'pdf', 'dc', 'x:xmpmeta', 'photoshop', 'stEvt', 'stRef', 'stMfs'];
  let text = raw as string;
  for (const tag of blockTags) {
    const re = new RegExp(`<${tag}[^>]*>[\s\S]*?<\/${tag}[^>]*>`, 'gi');
    text = text.replace(re, ' ');
  }
  text = text.replace(/<[a-zA-Z0-9_:][^>]*\/>/g, ' ');
  text = text.replace(/<\/?[a-zA-Z0-9_:][^>]*>/g, ' ');
  text = text.replace(/xmlns:[a-zA-Z0-9_]+="[^"]*"/g, ' ');
  text = text.replace(/xmlns="[^"]*"/g, ' ');
  text = text.replace(/https?:\/\/\S+/g, ' ');
  text = text.replace(/urn:[a-zA-Z0-9_:.-]+/g, ' ');
  text = text.replace(/uuid:[a-f0-9\-]{36}/gi, ' ');
  text = text.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, ' ');
  text = text.replace(/(?:adobe|microsoft|excel|word|powerpoint|acrobat|reader|wondershare|foxit)\s*(?:\d{4}|pdf|office|reader)?/gi, ' ');
  text = text.replace(/(?:create|creation|modify|modified|author|title|subject|keywords|producer|creator)\s*(?:date|time|tool|by)?:?\s*\S+/gi, ' ');
  text = text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?/g, ' ');
  text = text.replace(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/g, ' ');
  text = text.replace(/\b[0-9a-fA-F]{32,}\b/g, ' ');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\r?\n[ \t]*/g, '\n');
  text = text.replace(/\n+/g, '\n');
  text = text.replace(/ +/g, ' ');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  console.log('lines', lines.length);
  const classHeaderIdx = lines.findIndex(line => /class id/i.test(line));
  const teacherHeaderIdx = lines.findIndex(line => (/teacher/i.test(line) && /subject/i.test(line)) || (/teacher/i.test(line) && /availability/i.test(line)));
  console.log('classHeaderIdx', classHeaderIdx, 'line=', lines[classHeaderIdx]);
  console.log('teacherHeaderIdx', teacherHeaderIdx, 'line=', lines[teacherHeaderIdx]);
  console.log(lines.slice(0, 40).join('\n---\n'));
})().catch(err => { console.error(err); process.exit(1); });
