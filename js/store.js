/**
 * Data Storage & Export Module for Eye Result Reader
 * 
 * Provides:
 * - Persistent client-side database (IndexedDB / LocalStorage)
 * - Microsoft Excel (.xlsx) file generation via SheetJS
 * - CSV export & TSV clipboard copy (for instant Excel/Sheets paste)
 * - Real-time cloud sync to Google Sheets / Webhook endpoint
 */

const DB_NAME = 'EyeResultReaderDB';
const DB_VERSION = 1;
const STORE_NAME = 'screenings';
const WEBHOOK_KEY = 'eeye_webhook_url';
const SITE_KEY = 'eeye_default_site';

let dbInstance = null;

/**
 * Open or initialize IndexedDB
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to LocalStorage');
      return resolve(null);
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error, falling back to LocalStorage');
      resolve(null);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('code', 'code', { unique: false });
      }
    };
  });
}

/**
 * Save screening record
 */
export async function saveRecord(record) {
  const db = await initDB();
  const rec = {
    ...record,
    id: record.id || `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: record.timestamp || new Date().toISOString()
  };

  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(rec);
      req.onsuccess = () => resolve(rec);
      req.onerror = () => reject(req.error);
    });
  } else {
    // LocalStorage fallback
    const list = getAllRecordsFromLocalStorage();
    const existingIdx = list.findIndex(r => r.id === rec.id);
    if (existingIdx >= 0) list[existingIdx] = rec;
    else list.unshift(rec);
    localStorage.setItem(STORE_NAME, JSON.stringify(list));
  }

  // Trigger optional Cloud / Webhook sync asynchronously
  syncRecordToWebhook(rec).catch(err => console.warn('Background webhook sync failed:', err));

  return rec;
}

/**
 * List all saved participant records (sorted newest first)
 */
export async function listRecords() {
  const db = await initDB();
  if (db) {
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const sorted = (req.result || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(sorted);
      };
      req.onerror = () => resolve(getAllRecordsFromLocalStorage());
    });
  }
  return getAllRecordsFromLocalStorage();
}

/**
 * Delete a specific record
 */
export async function deleteRecord(id) {
  const db = await initDB();
  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  const list = getAllRecordsFromLocalStorage().filter(r => r.id !== id);
  localStorage.setItem(STORE_NAME, JSON.stringify(list));
}

/**
 * Clear all stored participant records
 */
export async function clearAllRecords() {
  const db = await initDB();
  if (db) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  localStorage.removeItem(STORE_NAME);
}

function getAllRecordsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORE_NAME);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Webhook Settings
 */
export function getWebhookUrl() {
  return localStorage.getItem(WEBHOOK_KEY) || '';
}

export function setWebhookUrl(url) {
  localStorage.setItem(WEBHOOK_KEY, (url || '').trim());
}

export function getDefaultSite() {
  return localStorage.getItem(SITE_KEY) || '';
}

export function setDefaultSite(site) {
  localStorage.setItem(SITE_KEY, (site || '').trim());
}

/**
 * Sync record to Webhook / Google Sheets endpoint
 */
export async function syncRecordToWebhook(record, customUrl = null) {
  const url = customUrl || getWebhookUrl();
  if (!url) return { skipped: true };

  const payload = {
    event: 'screening_saved',
    id: record.id,
    timestamp: record.timestamp,
    date: new Date(record.timestamp).toLocaleString(),
    participant_code: record.code,
    site: record.site || '',
    // Right Eye
    od_sph: record.od_sph,
    od_cyl: record.od_cyl,
    od_ax: record.od_ax,
    od_pps: record.od_pps,
    od_se: record.od_se,
    od_condition: record.od_condition || '',
    // Left Eye
    os_sph: record.os_sph,
    os_cyl: record.os_cyl,
    os_ax: record.os_ax,
    os_pps: record.os_pps,
    os_se: record.os_se,
    os_condition: record.os_condition || '',
    // Shared
    pd: record.pd,
    diff_se: record.diff_se,
    anisometropia: record.anisometropia ? 'YES' : 'NO',
    referral_recommended: record.referral ? 'YES' : 'NO',
    notes: record.notes || ''
  };

  const response = await fetch(url, {
    method: 'POST',
    mode: 'no-cors', // standard for Google Apps Script Webhook
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return { success: true };
}

/**
 * Test Webhook Connection
 */
export async function testWebhook(url) {
  if (!url) throw new Error('Please enter a webhook URL first.');
  const testPayload = {
    event: 'test_connection',
    timestamp: new Date().toISOString(),
    message: 'Eye Result Reader connection test'
  };

  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });
  return true;
}

/**
 * Format records for spreadsheet export
 */
function buildSpreadsheetRows(records) {
  return records.map(r => ({
    'Record ID': r.id,
    'Timestamp': r.timestamp,
    'Date / Time': new Date(r.timestamp).toLocaleString(),
    'Participant Code': r.code || '',
    'Screening Site': r.site || '',
    // OD
    'OD SPH (D)': r.od_sph !== null && r.od_sph !== undefined ? Number(r.od_sph) : '',
    'OD CYL (D)': r.od_cyl !== null && r.od_cyl !== undefined ? Number(r.od_cyl) : '',
    'OD AX (deg)': r.od_ax !== null && r.od_ax !== undefined ? Number(r.od_ax) : '',
    'OD PPS (mm)': r.od_pps !== null && r.od_pps !== undefined ? Number(r.od_pps) : '',
    'OD SE (D)': r.od_se !== null && r.od_se !== undefined ? Number(r.od_se) : '',
    'OD Classification': r.od_condition || '',
    // OS
    'OS SPH (D)': r.os_sph !== null && r.os_sph !== undefined ? Number(r.os_sph) : '',
    'OS CYL (D)': r.os_cyl !== null && r.os_cyl !== undefined ? Number(r.os_cyl) : '',
    'OS AX (deg)': r.os_ax !== null && r.os_ax !== undefined ? Number(r.os_ax) : '',
    'OS PPS (mm)': r.os_pps !== null && r.os_pps !== undefined ? Number(r.os_pps) : '',
    'OS SE (D)': r.os_se !== null && r.os_se !== undefined ? Number(r.os_se) : '',
    'OS Classification': r.os_condition || '',
    // Summary
    'PD (mm)': r.pd !== null && r.pd !== undefined ? Number(r.pd) : '',
    'Diff SE (D)': r.diff_se !== null && r.diff_se !== undefined ? Number(r.diff_se) : '',
    'Anisometropia (>=1.0D)': r.anisometropia ? 'YES' : 'NO',
    'Referral Recommended': r.referral ? 'REFERRAL' : 'NO REFERRAL',
    'Notes': r.notes || ''
  }));
}

/**
 * One-click Export to Microsoft Excel (.xlsx) using SheetJS
 */
export async function exportToExcel(records, filename = null) {
  if (!records || records.length === 0) {
    throw new Error('No records available to export.');
  }

  const rows = buildSpreadsheetRows(records);

  // If XLSX is available from vendor
  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    const colWidths = [
      { wch: 24 }, // Record ID
      { wch: 22 }, // Timestamp
      { wch: 20 }, // Date
      { wch: 18 }, // Code
      { wch: 18 }, // Site
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 }, // OD
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 24 }, // OS
      { wch: 10 }, { wch: 12 }, { wch: 22 }, { wch: 20 }, { wch: 25 } // Summary
    ];
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Screenings');

    const dateSlug = new Date().toISOString().split('T')[0];
    const outName = filename || `eye_screening_records_${dateSlug}.xlsx`;
    XLSX.writeFile(wb, outName);
    return true;
  } else {
    // Fallback to CSV if XLSX is unavailable
    return exportToCSV(records, filename ? filename.replace('.xlsx', '.csv') : null);
  }
}

/**
 * One-click Export to CSV
 */
export function exportToCSV(records, filename = null) {
  if (!records || records.length === 0) {
    throw new Error('No records available to export.');
  }

  const rows = buildSpreadsheetRows(records);
  const headers = Object.keys(rows[0]);

  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h] !== null && row[h] !== undefined ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const dateSlug = new Date().toISOString().split('T')[0];
  const outName = filename || `eye_screening_records_${dateSlug}.csv`;

  triggerBlobDownload(blob, outName);
  return true;
}

/**
 * Copy data to Clipboard as Tab-Separated Values (TSV)
 * Allows pasting directly into Excel or Google Sheets (Ctrl + V)
 */
export async function copyToClipboardTSV(records) {
  if (!records || records.length === 0) {
    throw new Error('No records available to copy.');
  }

  const rows = buildSpreadsheetRows(records);
  const headers = Object.keys(rows[0]);

  const tsvLines = [];
  tsvLines.push(headers.join('\t'));

  for (const row of rows) {
    const values = headers.map(h => (row[h] !== null && row[h] !== undefined ? String(row[h]) : ''));
    tsvLines.push(values.join('\t'));
  }

  const text = tsvLines.join('\n');
  await navigator.clipboard.writeText(text);
  return true;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
