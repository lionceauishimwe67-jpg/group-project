import { Request, Response } from 'express';
import { query, queryOne, run, withTransaction, getDb } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';
import os from 'os';
import * as XLSX from 'xlsx';

// File parsers
let pdfParse: any;
try {
  const mod = require('pdf-parse');
  pdfParse = typeof mod === 'function' ? mod : (mod.default || mod.parse || mod.pdfParse || null);
} catch { pdfParse = null; }
let mammoth: any;
try { mammoth = require('mammoth'); } catch { mammoth = null; }
let csvParse: any;
try { csvParse = require('csv-parse/sync'); } catch { csvParse = null; }
const csvParseFn = typeof csvParse === 'function' ? csvParse : (csvParse?.parse || csvParse?.default || null);
let Tesseract: any;
try {
  const mod = require('tesseract.js');
  Tesseract = mod?.recognize ? mod : (mod.default || mod);
} catch { Tesseract = null; }
let PdfPrinter: any;
try {
  const mod = require('pdfmake');
  PdfPrinter = typeof mod === 'function' ? mod : (mod.default || mod.PdfPrinter || mod);
} catch { PdfPrinter = null; }

// Types
interface ChronogramSubject {
  name: string;
  code?: string;
  periodsPerWeek: number;
  teacherNumber?: string;
  teacherName?: string;
  priority?: number;
}

interface TimeSlot {
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  isLunch: boolean;
}

interface ChronogramData {
  className?: string;
  classId?: number;
  subjects: ChronogramSubject[];
  timeSlots: TimeSlot[];
  days: string[];
  rawText?: string;
}

interface MultiClassChronogram {
  classes: ChronogramData[];
  rawText?: string;
}

interface TimetableEntryInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  classroom_id: number;
}

interface ValidationError {
  type: string;
  message: string;
  detail?: any;
}

interface ParsedRow {
  [key: string]: string;
}

// Default time slots if none extracted
const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { label: 'Period 1', startTime: '08:10', endTime: '09:00', isBreak: false, isLunch: false },
  { label: 'Period 2', startTime: '09:00', endTime: '09:50', isBreak: false, isLunch: false },
  { label: 'Short Break', startTime: '09:50', endTime: '10:10', isBreak: true, isLunch: false },
  { label: 'Period 3', startTime: '10:10', endTime: '10:55', isBreak: false, isLunch: false },
  { label: 'Period 4', startTime: '10:55', endTime: '11:45', isBreak: false, isLunch: false },
  { label: 'Period 5', startTime: '11:45', endTime: '12:35', isBreak: false, isLunch: false },
  { label: 'Lunch Break', startTime: '12:35', endTime: '13:35', isBreak: false, isLunch: true },
  { label: 'Period 6', startTime: '13:35', endTime: '14:25', isBreak: false, isLunch: false },
  { label: 'Period 7', startTime: '14:25', endTime: '15:15', isBreak: false, isLunch: false },
];

const DAY_MAP: Record<string, number> = {
  monday: 1, mon: 1,
  tuesday: 2, tue: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
  sunday: 0, sun: 0,
};

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

const CORE_SUBJECTS = ['math', 'mathematics', 'english', 'science', 'physics', 'chemistry', 'biology', 'kiswahili', 'french', 'history', 'geography', 'ict', 'computer'];

// Helper: read file content based on type
async function extractTextFromFile(filePath: string, mimeType?: string): Promise<{ text: string; data?: any[] }> {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';
  let data: any[] | undefined;

  if (ext === '.pdf' && pdfParse) {
    const buf = fs.readFileSync(filePath);
    const result = await pdfParse(buf);
    text = result.text || '';
  } else if ((ext === '.docx' || ext === '.doc') && mammoth) {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value || '';
  } else if (ext === '.csv' && csvParseFn) {
    const buf = fs.readFileSync(filePath, 'utf-8');
    data = csvParseFn(buf, { columns: true, skip_empty_lines: true, trim: true });
    text = buf;
  } else if (ext === '.xlsx' || ext === '.xls') {
    const buf = fs.readFileSync(filePath);
    const workbook = XLSX.read(buf, { type: 'buffer' });
    // Read ALL sheets - each sheet represents a different class timetable
    // Use header:1 to get 2D arrays (rows as arrays) so we can properly detect header rows
    const allSheets: any[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet, { defval: null, header: 1 });
      allSheets.push({ sheetName, data: sheetData });
    }
    data = allSheets;
    // Also produce text from all sheets for text-based parsing fallback
    const allTexts: string[] = [];
    for (const s of allSheets) {
      allTexts.push(`--- CLASS: ${s.sheetName} ---`);
      allTexts.push(s.data.map((r: any) => Array.isArray(r) ? r.join(' ') : Object.values(r).join(' ')).join('\n'));
    }
    text = allTexts.join('\n');
  } else if (ext === '.txt' || ext === '.md' || ext === '.json') {
    text = fs.readFileSync(filePath, 'utf-8');
    if (ext === '.json') {
      try { data = JSON.parse(text); } catch { /* ignore */ }
    }
  } else if (ext === '.json') {
    text = fs.readFileSync(filePath, 'utf-8');
    try { data = JSON.parse(text); } catch { /* ignore */ }
  } else if (Tesseract && (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.bmp' || ext === '.webp' || ext === '.tiff')) {
    const result = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
    text = result.data?.text || '';
  } else {
    // Try reading as text
    try { text = fs.readFileSync(filePath, 'utf-8'); } catch {
      // Binary file - if image, try OCR
      if (Tesseract) {
        try {
          const result = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
          text = result.data?.text || '';
        } catch { text = ''; }
      }
    }
  }

  return { text, data };
}

// ---------- Text cleaning: strip all metadata, XML, XMP, RDF, document properties ----------
function cleanExtractedText(raw: string): string {
  let text = raw;
  // 1) Remove entire XML/XMP/RDF blocks (multiline)
  const blockTags = ['rdf:RDF', 'rdf:Description', 'xmpMM', 'xmp', 'pdf', 'dc', 'x:xmpmeta', 'photoshop', 'stEvt', 'stRef', 'stMfs'];
  for (const tag of blockTags) {
    const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}[^>]*>`, 'gi');
    text = text.replace(re, ' ');
  }
  // 2) Remove stray XML/HTML tags (including self-closing)
  text = text.replace(/<[a-zA-Z0-9_:][^>]*\/>/g, ' ');
  text = text.replace(/<\/?[a-zA-Z0-9_:][^>]*>/g, ' ');
  // 3) Remove namespace declarations
  text = text.replace(/xmlns:[a-zA-Z0-9_]+="[^"]*"/g, ' ');
  text = text.replace(/xmlns="[^"]*"/g, ' ');
  // 4) Remove URLs / URNs / UUIDs / GUIDs
  text = text.replace(/https?:\/\/\S+/g, ' ');
  text = text.replace(/urn:[a-zA-Z0-9_:.-]+/g, ' ');
  text = text.replace(/uuid:[a-f0-9\-]{36}/gi, ' ');
  text = text.replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, ' ');
  // 5) Remove common document properties / metadata tokens
  text = text.replace(/(?:adobe|microsoft|excel|word|powerpoint|acrobat|reader|wondershare|foxit)\s*(?:\d{4}|pdf|office|reader)?/gi, ' ');
  text = text.replace(/(?:create|creation|modify|modified|author|title|subject|keywords|producer|creator)\s*(?:date|time|tool|by)?:?\s*\S+/gi, ' ');
  text = text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[+-]\d{2}:\d{2})?/g, ' ');
  text = text.replace(/\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}/g, ' ');
  // 6) Remove hex / binary garbage
  text = text.replace(/\b[0-9a-fA-F]{32,}\b/g, ' ');
  // 7) Collapse whitespace
  text = text.replace(/\s+/g, ' ');
  return text;
}

// ---------- Reject lines that are clearly metadata, not timetable data ----------
function isLikelyMetadataLine(line: string): boolean {
  const lower = line.toLowerCase();
  const metadataPatterns = [
    /^\s*<[^>]+>\s*$/,                 // pure XML tag line
    /^\s*xmlns/,                         // namespace declaration
    /^\s*<\?xml/,                       // XML prolog
    /adobe\.com/, /microsoft\.com/, /ns\.adobe/,
    /rdf:/, /xmp:/, /xmpmm:/, /pdf:/, /dc:/, /photoshop:/, /stEvt:/, /stRef:/,
    /uuid\s*[:=]/, /guid\s*[:=]/,
    /microsoft\s*excel/, /microsoft\s*word/, /adobe\s*acrobat/, /adobe\s*pdf/,
    /creator\s*tool/, /creation\s*date/, /modify\s*date/, /producer/, /author/,
    /document\s*properties/, /metadata/, /embedded\s*file/, /object\s*pool/,
    /^\s*[a-f0-9]{32,}\s*$/,            // hex-only line
    /^(?:\d{1,2}\/){2}\d{4}\s+\d{1,2}:\d{2}/, // embedded timestamp
    /^\s*\d{4}-\d{2}-\d{2}T/,          // ISO timestamp line
    /\b(ns\.|schema\.)/,
  ];
  for (const p of metadataPatterns) {
    if (p.test(lower) || p.test(line)) return true;
  }
  return false;
}

// ---------- Reject obviously non-subject strings ----------
function isValidSubjectName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 3 || trimmed.length > 80) return false;
  const lower = trimmed.toLowerCase();
  const garbage = [
    /microsoft/, /excel/, /word/, /adobe/, /acrobat/, /pdf/, /powerpoint/,
    /http:\/\//, /https:\/\//, /xmlns/, /rdf:/, /xmp/, /dc:/, /pdf:/,
    /^\d{4}-\d{2}-\d{2}/, /uuid/, /guid/,
    /creator\s*tool/, /creation\s*date/, /modify\s*date/, /metadata/,
    /^[\d\s\W]+$/, /\(\d{4}\)/, /^\d{1,2}\/\d{1,2}\/\d{4}/,
    /^[a-f0-9]{8,}$/i,
    /urn:/, /ns\.adobe/, /embedded/, /object\s*pool/,
  ];
  for (const p of garbage) {
    if (p.test(lower) || p.test(trimmed)) return false;
  }
  return true;
}

// ---------- Helper: parse a timetable grid cell ----------
function parseCell(cell: string): { subject: string; teacherId?: number } | null {
  const t = cell.trim().toUpperCase();
  if (!t || t === '-' || t === '—' || t === 'NULL' || t === 'N/A') return null;

  // Special entries without teacher IDs
  const special = ['ASSEMBLY', 'BREAK', 'LUNCH', 'SPORT', 'DEBATE', 'CPD', 'RELIGION', 'TEST', 'STUDY', 'LIBRARY', 'CLUB'];
  for (const s of special) if (t === s || t.startsWith(s + ' ')) return { subject: s };

  // Pattern: SUBJECT CODE (teacher_id) or SUBJECTCODE(teacher_id) or SUBJECTCODE()
  // Handles: "GENCP (13)", "GENMGP(2)", "NITIS(25)", "NITIAP" (no teacher)
  const m = cell.match(/^([A-Za-z][A-Za-z0-9\s&\-/]{1,35})\s*\(\s*(\d*)\s*\)$/);
  if (m) {
    const tid = m[2] ? parseInt(m[2], 10) : NaN;
    return { subject: m[1].trim().toUpperCase(), teacherId: isNaN(tid) ? undefined : tid };
  }

  // Pattern: SUBJECTCODE without parentheses but looks like a code (all caps, 2-10 chars)
  if (/^[A-Z]{2,10}[A-Z0-9]*$/.test(t) && t.length >= 3 && t.length <= 15) {
    return { subject: t };
  }

  // Plain subject name
  if (/^[A-Za-z][A-Za-z0-9\s&\-/]{1,35}$/.test(cell.trim())) return { subject: cell.trim().toUpperCase() };
  return null;
}

// ---------- Helper: extract HH:MM from time string ----------
function normalizeTime(t: string): string {
  const m = t.match(/(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2,'0')}:${m[2]}` : t;
}

// ---------- Parse grid-format timetable: time column + day columns ----------
function parseChronogramFromText(rawText: string): ChronogramData {
  const text = cleanExtractedText(rawText);
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).filter(l => !isLikelyMetadataLine(l));

  const subjectMap = new Map<string, { name: string; periods: number; teacherId?: number }>();
  const timeSlots: TimeSlot[] = [];
  let className = '';
  const dayOrder: string[] = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const dayIndex = new Map(dayOrder.map((d,i) => [d.toLowerCase(), i]));

  // Detect grid header row (contains day names)
  let headerIdx = -1;
  let colToDay = new Map<number, number>(); // column index -> day index (0=Mon,..)
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    const lower = lines[i].toLowerCase();
    let matched = 0;
    const tempMap = new Map<number, number>();
    // Split by tabs, commas, or multiple spaces
    let parts = lines[i].split(/\t+/);
    if (parts.length < 3) {
      // try comma split
      parts = lines[i].split(/,/);
    }
    if (parts.length < 3) {
      // try wide-space split
      parts = lines[i].split(/\s{2,}/);
    }
    for (let c = 0; c < parts.length; c++) {
      const p = parts[c].trim().toLowerCase();
      for (let d = 0; d < dayOrder.length; d++) {
        if (p === dayOrder[d].toLowerCase() || p === dayOrder[d].substring(0,3).toLowerCase()) {
          tempMap.set(c, d); matched++;
        }
      }
    }
    if (matched >= 3) { headerIdx = i; colToDay = tempMap; break; }
  }

  // If grid detected, parse rows
  if (headerIdx >= 0) {
    for (let r = headerIdx + 1; r < lines.length; r++) {
      const line = lines[r];
      const parts = line.split(/\t+/);
      if (parts.length < 2) continue;
      // First column should be time range
      const timeStr = parts[0].trim();
      // Handle formats: "7:50'-8:10'", "8:10-8:50", "08:10 - 09:00"
      const timeMatch = timeStr.match(/(\d{1,2})[:\.](\d{2})\s*['"]?\s*[-–—~to]+\s*(\d{1,2})[:\.](\d{2})\s*['"]?/i);
      if (!timeMatch) continue;
      const st = `${timeMatch[1].padStart(2,'0')}:${timeMatch[2]}`;
      const et = `${timeMatch[3].padStart(2,'0')}:${timeMatch[4]}`;
      const rest = parts.slice(1).join(' ').toLowerCase();
      const isBreak = rest.includes('break');
      const isLunch = rest.includes('lunch');
      const label = isBreak ? 'Break' : (isLunch ? 'Lunch' : `Period ${timeSlots.length + 1}`);
      if (!timeSlots.find(s => s.startTime === st && s.endTime === et)) {
        timeSlots.push({ startTime: st, endTime: et, label, isBreak, isLunch });
      }

      // Parse each cell against days
      for (let c = 1; c < parts.length; c++) {
        const dayIdx = colToDay.get(c);
        if (dayIdx === undefined) continue;
        const cell = parseCell(parts[c]);
        if (!cell) continue;
        // Count subject occurrences
        const existing = subjectMap.get(cell.subject);
        if (!existing) {
          subjectMap.set(cell.subject, { name: cell.subject, periods: 1, teacherId: cell.teacherId });
        } else {
          existing.periods++;
          if (!existing.teacherId && cell.teacherId) existing.teacherId = cell.teacherId;
        }
      }
    }
  }

  // Fallback: if no grid detected, use basic line-by-line parsing for time slots
  if (timeSlots.length === 0) {
    for (const line of lines) {
      const m = line.match(/(\d{1,2}):(\d{2})\s*[-–—to]+\s*(\d{1,2}):(\d{2})/i);
      if (m) {
        const st = `${m[1].padStart(2,'0')}:${m[2]}`;
        const et = `${m[3].padStart(2,'0')}:${m[4]}`;
        const rest = line.toLowerCase();
        const isBreak = rest.includes('break') || rest.includes('repos') || rest.includes('short');
        const isLunch = rest.includes('lunch') || rest.includes('déjeuner') || rest.includes('midi');
        if (!timeSlots.find(s => s.startTime === st && s.endTime === et)) {
          timeSlots.push({ startTime: st, endTime: et, label: `Period ${timeSlots.length + 1}`, isBreak, isLunch });
        }
      }
    }
  }

  // Extract class name from level/grade text
  const classMatch = text.match(/(?:level|class|grade|promotion)\s*(?:[:=]|\s)\s*([A-Z0-9\s\-/]{2,80})/i);
  if (classMatch) className = classMatch[1].trim();
  // Also match formats like "LEVEL III NETWORKING AND INTERNET TECHNOLOGIES"
  const levelDeptMatch = text.match(/LEVEL\s+([IVX]+|\d+)\s+([A-Z][A-Z\s&\-/]{2,80})/i);
  if (levelDeptMatch && !className) {
    className = `L${levelDeptMatch[1]} ${levelDeptMatch[2].trim()}`;
  }
  // Match "SENIOR V ACCOUNTING", "S4 ACC", etc.
  const seniorMatch = text.match(/(SENIOR\s+[IVX]+\s+\w+|S[1-6]\s*\w{2,}|L[1-6]\s*\w{2,}|L[1-6][A-Z]{2,})/i);
  if (seniorMatch && !className) {
    className = seniorMatch[1].trim();
  }

  const subjects: ChronogramSubject[] = [];
  for (const [, s] of subjectMap) {
    subjects.push({
      name: s.name,
      periodsPerWeek: s.periods,
      teacherNumber: s.teacherId ? String(s.teacherId) : undefined,
    });
  }

  return {
    subjects,
    timeSlots: timeSlots.length ? timeSlots : [...DEFAULT_TIME_SLOTS],
    days: dayOrder,
    className,
    rawText: text.slice(0, 5000)
  };
}

function parseChronogramFromRows(rows: any[]): ChronogramData {
  const subjectMap = new Map<string, { name: string; periods: number; teacherId?: number }>();
  const timeSlots: TimeSlot[] = [];
  const days: string[] = [];
  let className = '';

  if (!Array.isArray(rows) || rows.length === 0) return { subjects: [], timeSlots: [...DEFAULT_TIME_SLOTS], days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] };

  // Detect if rows are 2D arrays (like timetable-data.json) or object rows (CSV)
  const is2DArray = Array.isArray(rows[0]);

  if (is2DArray) {
    // 2D array format: rows[0] is header with day names, rows[n][0] is time, rows[n][c] is subject cell
    const dataRows = rows as any[][];
    // Find header row (contains day names)
    let headerRowIdx = -1;
    let colToDay = new Map<number, number>();
    for (let r = 0; r < Math.min(dataRows.length, 10); r++) {
      let matched = 0;
      const tempMap = new Map<number, number>();
      for (let c = 0; c < dataRows[r].length; c++) {
        const val = String(dataRows[r][c] || '').trim().toLowerCase();
        for (let d = 0; d < DAY_ORDER.length; d++) {
          if (val === DAY_ORDER[d].toLowerCase() || val === DAY_ORDER[d].substring(0,3).toLowerCase()) {
            tempMap.set(c, d); matched++;
          }
        }
      }
      if (matched >= 3) { headerRowIdx = r; colToDay = tempMap; break; }
    }

    // Also look for class/level info in rows before header
    for (let r = 0; r < Math.max(headerRowIdx, 5); r++) {
      if (r >= dataRows.length) break;
      for (const cell of dataRows[r]) {
        const str = String(cell || '');
        const classMatch = str.match(/(?:LEVEL|CLASS|GRADE)\s*(?:[:=]|\s)\s*([A-Z0-9\s\-/]{2,80})/i);
        if (classMatch && !className) className = classMatch[1].trim();
        // Match "LEVEL III NETWORKING AND INTERNET TECHNOLOGIES"
        const levelDeptMatch = str.match(/LEVEL\s+([IVX]+|\d+)\s+([A-Z][A-Z\s&\-/]{2,80})/i);
        if (levelDeptMatch && !className) {
          className = `L${levelDeptMatch[1]} ${levelDeptMatch[2].trim()}`;
        }
        // Also match "SENIOR V ACCOUNTING", "S4 ACC", "L3NIT", etc.
        const seniorMatch = str.match(/(SENIOR\s+[IVX]+\s+\w+|S[1-6]\s*\w{2,}|L[1-6]\s*\w{2,}|L[1-6][A-Z]{2,})/i);
        if (seniorMatch && !className) className = seniorMatch[1].trim();
      }
    }

    // Parse data rows
    if (headerRowIdx >= 0) {
      for (let r = headerRowIdx + 1; r < dataRows.length; r++) {
        const row = dataRows[r];
        if (!row || row.length < 2) continue;
        const timeStr = String(row[0] || '').trim();
        // Handle formats: "7:50'-8:10'", "8:10-8:50", "08:10 - 09:00"
        const timeMatch = timeStr.match(/(\d{1,2})[:\.](\d{2})\s*['"]?\s*[-–—~to]+\s*(\d{1,2})[:\.](\d{2})\s*['"]?/i);
        if (!timeMatch) continue;
        const st = `${timeMatch[1].padStart(2,'0')}:${timeMatch[2]}`;
        const et = `${timeMatch[3].padStart(2,'0')}:${timeMatch[4]}`;
        const rest = row.slice(1).join(' ').toLowerCase();
        const isBreak = rest.includes('break');
        const isLunch = rest.includes('lunch');
        const label = isBreak ? 'Break' : (isLunch ? 'Lunch' : `Period ${timeSlots.length + 1}`);
        if (!timeSlots.find(s => s.startTime === st && s.endTime === et)) {
          timeSlots.push({ startTime: st, endTime: et, label, isBreak, isLunch });
        }

        // Parse each cell
        for (let c = 1; c < row.length; c++) {
          const dayIdx = colToDay.get(c);
          if (dayIdx === undefined) continue;
          const cell = parseCell(String(row[c] || ''));
          if (!cell) continue;
          const existing = subjectMap.get(cell.subject);
          if (!existing) {
            subjectMap.set(cell.subject, { name: cell.subject, periods: 1, teacherId: cell.teacherId });
          } else {
            existing.periods++;
            if (!existing.teacherId && cell.teacherId) existing.teacherId = cell.teacherId;
          }
        }
      }
    }
    const subjects: ChronogramSubject[] = [];
    for (const [, s] of subjectMap) {
      subjects.push({
        name: s.name,
        periodsPerWeek: s.periods,
        teacherNumber: s.teacherId ? String(s.teacherId) : undefined,
      });
    }
    return { subjects, timeSlots: timeSlots.length ? timeSlots : [...DEFAULT_TIME_SLOTS], days: DAY_ORDER, className };
  }

  // Object-row format (CSV / XLSX with headers as object keys)
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  // Check if keys are __EMPTY, __EMPTY_1, etc. (Excel sheets with no headers)
  const isEmptyKeys = keys.length > 0 && keys.every(k => k === '__EMPTY' || k.startsWith('__EMPTY_'));
  
  if (isEmptyKeys) {
    // Convert to 2D array format
    const as2D = rows.map((row: any) => {
      const arr: any[] = [];
      for (const k of keys) {
        if (k === '__EMPTY') {
          arr[0] = row[k];
        } else {
          const idx = parseInt(k.replace('__EMPTY_', ''), 10);
          arr[idx] = row[k];
        }
      }
      return arr;
    });
    // Recursively call with 2D array
    return parseChronogramFromRows(as2D);
  }

  // Detect day columns
  for (const k of keys) {
    const lk = k.toLowerCase();
    if (DAY_MAP[lk] !== undefined || DAY_MAP[lk.substring(0,3)] !== undefined) {
      days.push(lk.charAt(0).toUpperCase() + lk.slice(1));
    }
  }

  // Detect time slot rows
  for (const row of rows) {
    const timeVal = row['Time'] || row['time'] || row['Start'] || row['start'] || row['Period'] || row['period'];
    if (timeVal && String(timeVal).match(/\d{1,2}[:.hH]\d{2}/)) {
      const t = String(timeVal);
      const rangeMatch = t.match(/(\d{1,2})[:.hH]\s*(\d{2})\s*[-–—to]+\s*(\d{1,2})[:.hH]\s*(\d{2})/i);
      if (rangeMatch) {
        const st = `${rangeMatch[1].padStart(2,'0')}:${rangeMatch[2]}`;
        const et = `${rangeMatch[3].padStart(2,'0')}:${rangeMatch[4]}`;
        const rest = Object.values(row).join(' ').toLowerCase();
        const isBreak = rest.includes('break') || rest.includes('repos');
        const isLunch = rest.includes('lunch') || rest.includes('midi');
        timeSlots.push({ startTime: st, endTime: et, label: `Period ${timeSlots.length+1}`, isBreak, isLunch });
      }
    }
  }

  const subjects: ChronogramSubject[] = [];

  // Detect subject rows
  const subjectKey = keys.find(k => k.toLowerCase().includes('subject') || k.toLowerCase().includes('module') || k.toLowerCase().includes('course'));
  const periodsKey = keys.find(k => k.toLowerCase().includes('period') || k.toLowerCase().includes('hour') || k.toLowerCase().includes('week') || k.toLowerCase().includes('credit'));
  const teacherKey = keys.find(k => k.toLowerCase().includes('teacher') || k.toLowerCase().includes('instructor') || k.toLowerCase().includes('tutor'));
  const codeKey = keys.find(k => k.toLowerCase().includes('code') || k.toLowerCase().includes('id') || k.toLowerCase().includes('number'));
  const classKey = keys.find(k => k.toLowerCase().includes('class') || k.toLowerCase().includes('level') || k.toLowerCase().includes('group'));

  for (const row of rows) {
    const name = subjectKey ? row[subjectKey] : '';
    if (!name || String(name).trim().length < 2 || !isValidSubjectName(String(name))) continue;
    const periods = periodsKey ? parseInt(String(row[periodsKey]), 10) || 2 : 2;
    const teacher = teacherKey ? String(row[teacherKey] || '') : '';
    const code = codeKey ? String(row[codeKey] || '') : '';
    if (classKey && !className) className = String(row[classKey] || '').trim();
    subjects.push({
      name: String(name).trim(),
      code: code || undefined,
      periodsPerWeek: periods,
      teacherNumber: teacher.match(/^\d+$/) ? teacher : undefined,
      teacherName: teacher.match(/^\d+$/) ? undefined : teacher,
    });
  }

  return { subjects, timeSlots: timeSlots.length ? timeSlots : [...DEFAULT_TIME_SLOTS], days: days.length ? days : ['Monday','Tuesday','Wednesday','Thursday','Friday'], className };
}

// Core AI smart generation algorithm
async function generateSmartTimetableAlgorithm(
  chronogram: ChronogramData,
  classId: number,
  referenceData: { teachers: any[]; subjects: any[]; classrooms: any[]; teacherSubjects: any[] }
): Promise<{ entries: TimetableEntryInput[]; conflicts: string[]; warnings: string[] }> {
  const conflicts: string[] = [];
  const warnings: string[] = [];
  const entries: TimetableEntryInput[] = [];

  const { subjects, timeSlots } = chronogram;
  const workingDays = [1, 2, 3, 4, 5]; // Mon-Fri
  const nonBreakSlots = timeSlots.filter(s => !s.isBreak && !s.isLunch);

  if (subjects.length === 0) {
    return { entries, conflicts: ['No subjects found in chronogram'], warnings };
  }

  // Map chronogram subjects to DB subjects and teachers
  const mappedSubjects = subjects.map(s => {
    let dbSubject = referenceData.subjects.find((sub: any) =>
      sub.name?.toLowerCase() === s.name.toLowerCase() ||
      sub.code?.toLowerCase() === (s.code || '').toLowerCase() ||
      sub.name?.toLowerCase().includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(sub.name?.toLowerCase())
    );
    if (!dbSubject) {
      // Try fuzzy
      dbSubject = referenceData.subjects.find((sub: any) => {
        const a = sub.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        const b = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return a.length > 3 && b.length > 3 && (a.includes(b) || b.includes(a));
      });
    }

    // Find teacher by number or name
    let dbTeacher = null;
    if (s.teacherNumber) {
      dbTeacher = referenceData.teachers.find((t: any) =>
        t.phone?.includes(s.teacherNumber!) || t.id === parseInt(s.teacherNumber!, 10) || t.name?.includes(s.teacherNumber!)
      );
    }
    if (!dbTeacher && s.teacherName) {
      dbTeacher = referenceData.teachers.find((t: any) =>
        t.name?.toLowerCase() === s.teacherName!.toLowerCase() ||
        t.name?.toLowerCase().includes(s.teacherName!.toLowerCase()) ||
        s.teacherName!.toLowerCase().includes(t.name?.toLowerCase())
      );
    }
    if (!dbTeacher && dbSubject) {
      // Try teacher_subjects relationship
      const rel = referenceData.teacherSubjects.find((ts: any) => ts.subject_id === dbSubject.id);
      if (rel) {
        dbTeacher = referenceData.teachers.find((t: any) => t.id === rel.teacher_id);
      }
    }

    return { ...s, dbSubject, dbTeacher };
  });

  // Validate teachers
  for (const ms of mappedSubjects) {
    if (!ms.dbSubject) {
      warnings.push(`Subject "${ms.name}" not found in database. It will be created or skipped.`);
    }
    if (!ms.dbTeacher) {
      warnings.push(`Teacher for "${ms.name}" (number: ${ms.teacherNumber || 'N/A'}) not found in database.`);
    }
  }

  // Determine priority: core subjects first
  const prioritized = [...mappedSubjects].sort((a, b) => {
    const aCore = CORE_SUBJECTS.some(c => a.name.toLowerCase().includes(c)) ? 1 : 0;
    const bCore = CORE_SUBJECTS.some(c => b.name.toLowerCase().includes(c)) ? 1 : 0;
    if (bCore !== aCore) return bCore - aCore;
    return (b.periodsPerWeek || 0) - (a.periodsPerWeek || 0);
  });

  // Track used slots per day per teacher and per classroom
  const teacherDayPeriods = new Map<number, Map<number, number>>(); // teacherId -> day -> count
  const teacherSlotUsed = new Map<string, Set<string>>(); // teacherId -> Set<"day-start-end">
  const classroomSlotUsed = new Map<string, Set<string>>(); // classroomId -> Set<"day-start-end">
  const subjectDayPeriods = new Map<number, Map<number, number>>(); // subjectId -> day -> count

  function getTeacherCount(teacherId: number, day: number) {
    if (!teacherDayPeriods.has(teacherId)) teacherDayPeriods.set(teacherId, new Map());
    return teacherDayPeriods.get(teacherId)!.get(day) || 0;
  }
  function incTeacherCount(teacherId: number, day: number) {
    if (!teacherDayPeriods.has(teacherId)) teacherDayPeriods.set(teacherId, new Map());
    const m = teacherDayPeriods.get(teacherId)!;
    m.set(day, (m.get(day) || 0) + 1);
  }
  function getSubjectCount(subjectId: number, day: number) {
    if (!subjectDayPeriods.has(subjectId)) subjectDayPeriods.set(subjectId, new Map());
    return subjectDayPeriods.get(subjectId)!.get(day) || 0;
  }
  function incSubjectCount(subjectId: number, day: number) {
    if (!subjectDayPeriods.has(subjectId)) subjectDayPeriods.set(subjectId, new Map());
    const m = subjectDayPeriods.get(subjectId)!;
    m.set(day, (m.get(day) || 0) + 1);
  }
  function isSlotUsedByTeacher(teacherId: number, day: number, slot: TimeSlot) {
    const key = `${teacherId}`;
    if (!teacherSlotUsed.has(key)) teacherSlotUsed.set(key, new Set());
    return teacherSlotUsed.get(key)!.has(`${day}-${slot.startTime}-${slot.endTime}`);
  }
  function markTeacherSlot(teacherId: number, day: number, slot: TimeSlot) {
    const key = `${teacherId}`;
    if (!teacherSlotUsed.has(key)) teacherSlotUsed.set(key, new Set());
    teacherSlotUsed.get(key)!.add(`${day}-${slot.startTime}-${slot.endTime}`);
  }
  function isSlotUsedByClassroom(classroomId: number, day: number, slot: TimeSlot) {
    const key = `${classroomId}`;
    if (!classroomSlotUsed.has(key)) classroomSlotUsed.set(key, new Set());
    return classroomSlotUsed.get(key)!.has(`${day}-${slot.startTime}-${slot.endTime}`);
  }
  function markClassroomSlot(classroomId: number, day: number, slot: TimeSlot) {
    const key = `${classroomId}`;
    if (!classroomSlotUsed.has(key)) classroomSlotUsed.set(key, new Set());
    classroomSlotUsed.get(key)!.add(`${day}-${slot.startTime}-${slot.endTime}`);
  }

  // Auto-assign classroom: pick first available or create generic
  let defaultClassroomId = referenceData.classrooms[0]?.id || 1;

  for (const ms of prioritized) {
    let remaining = ms.periodsPerWeek || 2;
    if (!ms.dbSubject) {
      warnings.push(`Skipping "${ms.name}" - no matching subject in database.`);
      continue;
    }

    const subjectId = ms.dbSubject.id;
    const teacherId = ms.dbTeacher?.id || 0;

    if (teacherId === 0) {
      conflicts.push(`No teacher assigned for "${ms.name}" - cannot schedule.`);
      continue;
    }

    // Distribute across days, max 3 per day per subject
    for (const day of workingDays) {
      if (remaining <= 0) break;
      if (getSubjectCount(subjectId, day) >= 3) continue;

      for (const slot of nonBreakSlots) {
        if (remaining <= 0) break;
        if (getSubjectCount(subjectId, day) >= 3) break;

        const slotKey = `${day}-${slot.startTime}-${slot.endTime}`;
        if (isSlotUsedByTeacher(teacherId, day, slot)) continue;
        if (isSlotUsedByClassroom(defaultClassroomId, day, slot)) {
          // Try find another classroom
          let altClassroom = referenceData.classrooms.find((c: any) => !isSlotUsedByClassroom(c.id, day, slot));
          if (!altClassroom) continue;
          defaultClassroomId = altClassroom.id;
        }

        // Place lesson
        entries.push({
          day_of_week: day,
          start_time: slot.startTime,
          end_time: slot.endTime,
          class_id: classId,
          subject_id: subjectId,
          teacher_id: teacherId,
          classroom_id: defaultClassroomId,
        });

        incSubjectCount(subjectId, day);
        incTeacherCount(teacherId, day);
        markTeacherSlot(teacherId, day, slot);
        markClassroomSlot(defaultClassroomId, day, slot);
        remaining--;
      }
    }

    if (remaining > 0) {
      conflicts.push(`Could not place ${remaining} periods for "${ms.name}" - insufficient slots or constraints.`);
    }
  }

  return { entries, conflicts, warnings };
}

// Upload chronogram file
export const uploadChronogram = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const file = req.file as any;
  const filePath = file.path;
  const originalName = file.originalname;
  const fileType = file.mimetype;
  const fileSize = file.size;

  try {
    // Save upload record
    const result = await run(
      `INSERT INTO chronogram_uploads (original_name, file_name, file_path, file_type, file_size, analysis_status, uploaded_by)
       VALUES (?, ?, ?, ?, ?, 'processing', ?)`,
      [originalName, file.filename, filePath, fileType, fileSize, (req.user as any)?.userId || null]
    );
    const uploadId = result.lastID;

    // Async parse
    const { text, data } = await extractTextFromFile(filePath, fileType);

    // Check if data is multi-sheet (Excel with multiple sheets)
    let multiClassChronogram: MultiClassChronogram;
    if (Array.isArray(data) && data.length > 0 && data[0]?.sheetName && Array.isArray(data[0]?.data)) {
      // Multi-sheet Excel: each sheet = a class
      const classes: ChronogramData[] = [];
      for (const sheet of data) {
        const sheetChronogram = parseChronogramFromRows(sheet.data);
        // Use sheet name as class name if not already extracted
        if (!sheetChronogram.className || sheetChronogram.className.trim() === '') {
          sheetChronogram.className = sheet.sheetName.trim();
        }
        // Also try to extract class name from sheet content (e.g., "SENIOR V ACCOUNTING")
        if (sheet.data.length > 0) {
          for (const row of sheet.data) {
            const vals = Object.values(row || {}).map(v => String(v || ''));
            for (const val of vals) {
              const seniorMatch = val.match(/(SENIOR\s+[IVX]+\s+\w+|S[1-6]\s*\w+|L[1-6]\s*\w+|L[1-6][A-Z]+)/i);
              if (seniorMatch && (sheetChronogram.className === sheet.sheetName.trim())) {
                sheetChronogram.className = seniorMatch[1].trim();
                break;
              }
            }
          }
        }
        classes.push(sheetChronogram);
      }
      multiClassChronogram = { classes, rawText: text.slice(0, 5000) };
    } else if (Array.isArray(data) && data.length > 0) {
      // Single sheet or other structured data
      const chronogram = parseChronogramFromRows(data);
      multiClassChronogram = { classes: [chronogram], rawText: text.slice(0, 5000) };
    } else {
      // Text-based parsing
      const chronogram = parseChronogramFromText(text);
      multiClassChronogram = { classes: [chronogram], rawText: text.slice(0, 5000) };
    }

    // Use first class as primary chronogram for backward compatibility
    const chronogram: ChronogramData = multiClassChronogram.classes[0] || {
      subjects: [], timeSlots: [...DEFAULT_TIME_SLOTS], days: DAY_ORDER, className: ''
    };

    // Update record with extracted data (store multi-class data)
    await run(
      `UPDATE chronogram_uploads SET extracted_data = ?, analysis_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(multiClassChronogram), uploadId]
    );

    res.status(201).json({
      success: true,
      message: `Chronogram uploaded and analyzed successfully. Found ${multiClassChronogram.classes.length} class(es)`,
      uploadId,
      chronogram,
      multiClassChronogram,
      meta: { fileType, fileSize, originalName }
    });
  } catch (error: any) {
    console.error('Chronogram upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze chronogram: ' + error.message });
  }
});

// Validate extracted chronogram data against database
export const validateChronogramData = asyncHandler(async (req: Request, res: Response) => {
  const { uploadId } = req.body;
  if (!uploadId) {
    return res.status(400).json({ success: false, error: 'uploadId is required' });
  }

  const upload = await queryOne<{ extracted_data: string }>(
    'SELECT extracted_data FROM chronogram_uploads WHERE id = ?',
    [uploadId]
  );
  if (!upload) {
    return res.status(404).json({ success: false, error: 'Upload not found' });
  }

  let chronogram: ChronogramData;
  let multiClassChronogram: MultiClassChronogram | null = null;
  try {
    const parsed = JSON.parse(upload.extracted_data);
    // Check if it's multi-class format
    if (parsed.classes && Array.isArray(parsed.classes)) {
      multiClassChronogram = parsed as MultiClassChronogram;
      // Use the requested className or first class
      const requestedClass = req.body.className;
      if (requestedClass) {
        chronogram = multiClassChronogram.classes.find((c: ChronogramData) => 
          c.className?.toLowerCase() === requestedClass.toLowerCase()
        ) || multiClassChronogram.classes[0];
      } else {
        chronogram = multiClassChronogram.classes[0];
      }
    } else {
      chronogram = parsed as ChronogramData;
    }
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid extracted data' });
  }

  const teachers = await query<any[]>('SELECT id, name, phone FROM teachers ORDER BY name');
  const subjects = await query<any[]>('SELECT id, name, code FROM subjects ORDER BY name');
  const classrooms = await query<any[]>('SELECT id, name FROM classrooms ORDER BY name');
  const teacherSubjects = await query<any[]>('SELECT teacher_id, subject_id FROM teacher_subjects');

  const validationErrors: ValidationError[] = [];
  const warnings: string[] = [];
  const matchedTeachers: any[] = [];
  const matchedSubjects: any[] = [];

  for (const s of chronogram.subjects) {
    // Subject validation
    let dbSubject = subjects.find((sub: any) =>
      sub.name?.toLowerCase() === s.name.toLowerCase() ||
      sub.code?.toLowerCase() === (s.code || '').toLowerCase()
    );
    if (!dbSubject) {
      dbSubject = subjects.find((sub: any) => {
        const a = sub.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        const b = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return a.length > 3 && b.length > 3 && (a.includes(b) || b.includes(a));
      });
    }
    if (dbSubject) {
      matchedSubjects.push({ chronogramSubject: s, dbSubject });
    } else {
      validationErrors.push({ type: 'missing_subject', message: `Subject "${s.name}" not found in database`, detail: s });
    }

    // Teacher validation
    let dbTeacher = null;
    if (s.teacherNumber) {
      dbTeacher = teachers.find((t: any) =>
        t.phone?.includes(s.teacherNumber!) || t.id === parseInt(s.teacherNumber!, 10)
      );
    }
    if (dbTeacher) {
      matchedTeachers.push({ chronogramSubject: s, dbTeacher });
    } else {
      warnings.push(`Teacher ${s.teacherNumber || 'unknown'} for "${s.name}" not found.`);
      if (s.teacherNumber) {
        validationErrors.push({ type: 'missing_teacher', message: `Teacher number "${s.teacherNumber}" for "${s.name}" not found`, detail: s });
      }
    }
  }

  // Save validation result
  const validationResult = {
    isValid: validationErrors.length === 0,
    errors: validationErrors,
    warnings,
    matchedTeachers,
    matchedSubjects,
    teacherCount: teachers.length,
    subjectCount: subjects.length,
    classroomCount: classrooms.length,
  };

  await run(
    `UPDATE chronogram_uploads SET analysis_result = ?, validation_errors = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [JSON.stringify(validationResult), JSON.stringify(validationErrors), uploadId]
  );

  res.json({
    success: true,
    data: validationResult,
    message: validationErrors.length === 0 ? 'All data validated successfully' : `Found ${validationErrors.length} validation issues`
  });
});

// Generate smart timetable
export const generateSmartTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { uploadId, classId, useAutoClassrooms = true, prioritizeCore = true } = req.body;
  if (!uploadId || !classId) {
    return res.status(400).json({ success: false, error: 'uploadId and classId are required' });
  }

  const upload = await queryOne<{ extracted_data: string }>(
    'SELECT extracted_data FROM chronogram_uploads WHERE id = ?',
    [uploadId]
  );
  if (!upload) {
    return res.status(404).json({ success: false, error: 'Upload not found' });
  }

  let chronogram: ChronogramData;
  let multiClassChronogram: MultiClassChronogram | null = null;
  try {
    const parsed = JSON.parse(upload.extracted_data);
    if (parsed.classes && Array.isArray(parsed.classes)) {
      multiClassChronogram = parsed as MultiClassChronogram;
      // Find the class matching the requested classId's name
      const classRecord = await queryOne<{ id: number; name: string }>('SELECT id, name FROM classes WHERE id = ?', [classId]);
      if (classRecord) {
        chronogram = multiClassChronogram.classes.find((c: ChronogramData) =>
          c.className?.toLowerCase() === classRecord.name.toLowerCase() ||
          c.className?.toLowerCase().includes(classRecord.name.toLowerCase()) ||
          classRecord.name.toLowerCase().includes(c.className?.toLowerCase() || '')
        ) || multiClassChronogram.classes[0];
      } else {
        chronogram = multiClassChronogram.classes[0];
      }
    } else {
      chronogram = parsed as ChronogramData;
    }
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid chronogram data' });
  }

  // Ensure class exists
  const classRecord = await queryOne<{ id: number; name: string }>('SELECT id, name FROM classes WHERE id = ?', [classId]);
  if (!classRecord) {
    return res.status(404).json({ success: false, error: 'Class not found' });
  }

  // Load reference data
  const [teachers, subjects, classrooms, teacherSubjects] = await Promise.all([
    query('SELECT id, name, phone FROM teachers ORDER BY name'),
    query('SELECT id, name, code FROM subjects ORDER BY name'),
    query('SELECT id, name FROM classrooms ORDER BY name'),
    query('SELECT teacher_id, subject_id FROM teacher_subjects'),
  ]);

  const referenceData = { teachers, subjects, classrooms, teacherSubjects } as { teachers: any[]; subjects: any[]; classrooms: any[]; teacherSubjects: any[] };

  // Run generation
  const { entries, conflicts, warnings } = await generateSmartTimetableAlgorithm(chronogram, classId, referenceData);

  // Save generation record
  const genResult = await run(
    `INSERT INTO timetable_generations (name, class_id, chronogram_upload_id, generated_by, generation_config, validation_status, validation_errors, generated_timetable, conflicts, is_current)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `Auto-gen ${new Date().toISOString().slice(0,10)} ${classRecord.name}`,
      classId,
      uploadId,
      (req.user as any)?.userId || null,
      JSON.stringify({ useAutoClassrooms, prioritizeCore }),
      conflicts.length === 0 ? 'valid' : 'warning',
      JSON.stringify(warnings),
      JSON.stringify(entries),
      JSON.stringify(conflicts),
      0
    ]
  );

  res.json({
    success: true,
    data: {
      generationId: genResult.lastID,
      entries,
      conflicts,
      warnings,
      entryCount: entries.length,
      className: classRecord.name,
    },
    message: conflicts.length === 0
      ? `Generated ${entries.length} timetable entries successfully`
      : `Generated ${entries.length} entries with ${conflicts.length} conflicts requiring attention`
  });
});

// Save generated timetable to database
export const saveGeneratedTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { generationId, replaceExisting = true } = req.body;
  if (!generationId) {
    return res.status(400).json({ success: false, error: 'generationId is required' });
  }

  const generation = await queryOne<{ class_id: number; generated_timetable: string; validation_status: string }>(
    'SELECT class_id, generated_timetable, validation_status FROM timetable_generations WHERE id = ?',
    [generationId]
  );
  if (!generation) {
    return res.status(404).json({ success: false, error: 'Generation not found' });
  }

  let entries: TimetableEntryInput[];
  try {
    entries = JSON.parse(generation.generated_timetable);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid timetable data' });
  }

  await withTransaction(async () => {
    if (replaceExisting) {
      await run('DELETE FROM timetable WHERE class_id = ? AND is_temporary = 0', [generation.class_id]);
    }

    for (const e of entries) {
      await run(
        `INSERT INTO timetable (class_id, subject_id, teacher_id, classroom_id, day_of_week, start_time, end_time, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [e.class_id, e.subject_id, e.teacher_id || null, e.classroom_id || null, e.day_of_week, e.start_time, e.end_time]
      );
    }

    await run(
      'UPDATE timetable_generations SET is_current = 0 WHERE class_id = ?',
      [generation.class_id]
    );
    await run(
      'UPDATE timetable_generations SET is_current = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [generationId]
    );
  });

  res.json({
    success: true,
    message: `Saved ${entries.length} timetable entries for class`,
    data: { savedCount: entries.length }
  });
});

// Get real-world current time (use server time as reference, can be enhanced with NTP)
export const getRealWorldTime = asyncHandler(async (req: Request, res: Response) => {
  // For production-grade accuracy, you could call worldtimeapi.org
  // Here we return precise server time with timezone info
  const now = new Date();
  res.json({
    success: true,
    data: {
      timestamp: now.toISOString(),
      unixTime: now.getTime(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 8),
      dayOfWeek: now.getDay(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: -now.getTimezoneOffset(),
    }
  });
});

// Get current activity for a class (current lesson, next lesson, break, lunch, end)
export const getCurrentActivity = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.query;
  if (!classId) {
    return res.status(400).json({ success: false, error: 'classId is required' });
  }

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8);
  const currentDay = now.getDay();
  const currentDate = now.toISOString().split('T')[0];

  // Get today's schedule
  const schedule = await query<any[]>(`
    SELECT
      t.id,
      s.name AS subject_name,
      te.name AS teacher_name,
      c.name AS classroom_name,
      t.start_time,
      t.end_time,
      t.day_of_week,
      t.status
    FROM timetable t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN teachers te ON t.teacher_id = te.id
    LEFT JOIN classrooms c ON t.classroom_id = c.id
    WHERE t.class_id = ?
      AND t.day_of_week = ?
      AND t.is_active = 1
      AND (
        (t.is_temporary = 0)
        OR
        (t.is_temporary = 1 AND t.temporary_date = ?)
      )
    ORDER BY t.start_time
  `, [classId, currentDay, currentDate]);

  if (schedule.length === 0) {
    return res.json({
      success: true,
      data: {
        currentActivity: 'no_classes',
        currentLesson: null,
        nextLesson: null,
        breakTime: null,
        lunchTime: null,
        endOfClasses: true,
        scheduleEmpty: true,
      },
      meta: { currentTime, currentDay, currentDate }
    });
  }

  let currentLesson = null;
  let nextLesson = null;
  let breakTime = null;
  let lunchTime = null;
  let endOfClasses = false;
  let currentActivity = 'unknown';

  // Find current lesson
  for (const entry of schedule) {
    if (currentTime >= entry.start_time && currentTime <= entry.end_time) {
      currentLesson = entry;
      break;
    }
  }

  if (currentLesson) {
    currentActivity = 'lesson';
  } else {
    // Check if in break or lunch gap
    for (let i = 0; i < schedule.length; i++) {
      const entry = schedule[i];
      const prevEnd = i > 0 ? schedule[i - 1].end_time : null;
      const nextStart = entry.start_time;

      if (prevEnd && currentTime > prevEnd && currentTime < nextStart) {
        // In a gap
        const gapDuration = (parseTime(nextStart) - parseTime(prevEnd)) / 60000;
        if (gapDuration >= 30) {
          lunchTime = { start: prevEnd, end: nextStart, durationMinutes: gapDuration };
          currentActivity = 'lunch';
        } else {
          breakTime = { start: prevEnd, end: nextStart, durationMinutes: gapDuration };
          currentActivity = 'break';
        }
        // next lesson after gap
        nextLesson = entry;
        break;
      }

      if (currentTime < entry.start_time) {
        nextLesson = entry;
        if (!breakTime && !lunchTime) currentActivity = 'between_lessons';
        break;
      }
    }

    if (!nextLesson && !breakTime && !lunchTime && currentTime > schedule[schedule.length - 1].end_time) {
      endOfClasses = true;
      currentActivity = 'end_of_classes';
    }
  }

  // If current lesson exists, find next lesson after it
  if (currentLesson && !nextLesson) {
    for (const entry of schedule) {
      if (entry.start_time > currentLesson.end_time) {
        nextLesson = entry;
        break;
      }
    }
  }

  function parseTime(t: string) {
    const [h, m, s] = t.split(':').map(Number);
    return new Date(2000, 0, 1, h, m, s || 0).getTime();
  }

  res.json({
    success: true,
    data: {
      currentActivity,
      currentLesson,
      nextLesson,
      breakTime,
      lunchTime,
      endOfClasses,
      scheduleEmpty: false,
      remainingMinutes: currentLesson
        ? Math.round((parseTime(currentLesson.end_time) - now.getTime()) / 60000)
        : nextLesson
          ? Math.round((parseTime(nextLesson.start_time) - now.getTime()) / 60000)
          : 0,
    },
    meta: { currentTime, currentDay, currentDate }
  });
});

// Export timetable to Excel, CSV, or PDF
export const exportTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { generationId, classId, format = 'excel' } = req.body;
  if (!generationId && !classId) {
    return res.status(400).json({ success: false, error: 'generationId or classId is required' });
  }

  let entries: any[] = [];
  let className = '';

  if (generationId) {
    const gen = await queryOne<{ generated_timetable: string; class_id: number }>(
      'SELECT generated_timetable, class_id FROM timetable_generations WHERE id = ?',
      [generationId]
    );
    if (!gen) return res.status(404).json({ success: false, error: 'Generation not found' });
    entries = JSON.parse(gen.generated_timetable);
    const cls = await queryOne<{ name: string }>('SELECT name FROM classes WHERE id = ?', [gen.class_id]);
    className = cls?.name || '';
  } else {
    entries = await query<any[]>(`
      SELECT
        t.day_of_week,
        t.start_time,
        t.end_time,
        s.name AS subject_name,
        te.name AS teacher_name,
        c.name AS classroom_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN teachers te ON t.teacher_id = te.id
      LEFT JOIN classrooms c ON t.classroom_id = c.id
      WHERE t.class_id = ? AND t.is_active = 1
      ORDER BY t.day_of_week, t.start_time
    `, [classId]);
    const cls = await queryOne<{ name: string }>('SELECT name FROM classes WHERE id = ?', [classId]);
    className = cls?.name || '';
  }

  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const rows = entries.map((e: any) => ({
    Day: dayNames[e.day_of_week] || e.day_of_week,
    'Start Time': e.start_time,
    'End Time': e.end_time,
    Subject: e.subject_name || e.subject_id,
    Teacher: e.teacher_name || e.teacher_id || 'Unassigned',
    Classroom: e.classroom_name || e.classroom_id || '',
  }));

  if (format === 'csv') {
    const headers = Object.keys(rows[0] || {}).join(',');
    const csv = [headers, ...rows.map((r: any) => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="timetable-${className}.csv"`);
    res.send(csv);
    return;
  }

  if (format === 'excel') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="timetable-${className}.xlsx"`);
    res.send(buf);
    return;
  }

  if (format === 'pdf') {
    if (!PdfPrinter) {
      return res.status(500).json({ success: false, error: 'PDF generation library not available' });
    }
    const fonts = {
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      }
    };
    const printer = new PdfPrinter(fonts);
    const tableBody = [
      ['Day', 'Start', 'End', 'Subject', 'Teacher', 'Classroom'],
      ...rows.map((r: any) => [r.Day, r['Start Time'], r['End Time'], r.Subject, r.Teacher, r.Classroom])
    ];
    const docDef = {
      content: [
        { text: `School Timetable - ${className}`, style: 'header' },
        { text: `Generated: ${new Date().toLocaleString()}`, margin: [0, 0, 0, 10] },
        { table: { body: tableBody }, layout: 'lightHorizontalLines' }
      ],
      styles: { header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] } }
    };
    const pdfDoc = printer.createPdfKitDocument(docDef);
    const chunks: Buffer[] = [];
    pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const buf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="timetable-${className}.pdf"`);
      res.send(buf);
    });
    pdfDoc.end();
    return;
  }

  res.status(400).json({ success: false, error: 'Unsupported format. Use excel, csv, or pdf' });
});

// List generation history
export const getGenerationHistory = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.query;
  let sql = `
    SELECT g.*, c.name AS class_name, cu.original_name AS chronogram_name
    FROM timetable_generations g
    JOIN classes c ON g.class_id = c.id
    LEFT JOIN chronogram_uploads cu ON g.chronogram_upload_id = cu.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (classId) {
    sql += ' AND g.class_id = ?';
    params.push(classId);
  }
  sql += ' ORDER BY g.created_at DESC';
  const rows = await query<any[]>(sql, params);
  res.json({ success: true, data: rows });
});

// Delete generation
export const deleteGeneration = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await run('DELETE FROM timetable_generations WHERE id = ?', [id]);
  res.json({ success: true, message: 'Generation deleted' });
});

// Delete all generation history
export const deleteAllHistory = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.body;
  if (classId) {
    await run('DELETE FROM timetable_generations WHERE class_id = ?', [classId]);
    res.json({ success: true, message: 'All generation history deleted for class' });
  } else {
    await run('DELETE FROM timetable_generations');
    res.json({ success: true, message: 'All generation history deleted' });
  }
});

// Delete all timetable entries (reset timetable)
export const deleteAllTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.body;
  if (classId) {
    await run('DELETE FROM timetable WHERE class_id = ?', [classId]);
    res.json({ success: true, message: 'All timetable entries deleted for class' });
  } else {
    await run('DELETE FROM timetable');
    res.json({ success: true, message: 'All timetable entries deleted' });
  }
});

// Delete all chronogram uploads
export const deleteAllUploads = asyncHandler(async (req: Request, res: Response) => {
  // Get all uploads to delete files
  const uploads = await query<any[]>('SELECT file_path FROM chronogram_uploads');
  for (const u of uploads) {
    try {
      if (u.file_path && fs.existsSync(u.file_path)) {
        fs.unlinkSync(u.file_path);
      }
    } catch { /* ignore file delete errors */ }
  }
  await run('DELETE FROM chronogram_uploads');
  res.json({ success: true, message: 'All chronogram uploads deleted' });
});

// Full timetable reset (delete everything)
export const fullTimetableReset = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.body;
  
  if (classId) {
    // Reset for specific class
    await run('DELETE FROM timetable WHERE class_id = ?', [classId]);
    await run('DELETE FROM timetable_generations WHERE class_id = ?', [classId]);
    res.json({ success: true, message: `Full timetable reset completed for class ID ${classId}` });
  } else {
    // Full reset - delete everything
    // Delete upload files
    const uploads = await query<any[]>('SELECT file_path FROM chronogram_uploads');
    for (const u of uploads) {
      try {
        if (u.file_path && fs.existsSync(u.file_path)) {
          fs.unlinkSync(u.file_path);
        }
      } catch { /* ignore */ }
    }
    await run('DELETE FROM timetable');
    await run('DELETE FROM timetable_generations');
    await run('DELETE FROM chronogram_uploads');
    res.json({ success: true, message: 'Full timetable reset completed - all data deleted' });
  }
});
