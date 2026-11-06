/**
 * Main Application Controller for Eye Result Reader
 * 
 * Complies with Web Interface Guidelines & No AI Slop
 */

import { translations } from './i18n.js';
import { roundDiopter, formatDiopter, computeSE, classifyEye, evaluatePair, scalePercentageFromSE } from './clinical.js';
import { runReceiptOCR, preprocessReceiptImage, warmupOCR } from './ocr.js';
import { parseReceiptText } from './parser.js';
import {
  initDB, saveRecord, listRecords, deleteRecord, clearAllRecords,
  exportToExcel, exportToCSV, copyToClipboardTSV,
  getWebhookUrl, setWebhookUrl, testWebhook,
  getDefaultSite, setDefaultSite
} from './store.js';

// Application State
const state = {
  lang: 'en', // 'en' | 'fil'
  activeTab: 'scan',
  currentPhotoUrl: null,
  currentImageElement: null,
  rotationAngle: 0,
  currentRecord: null,
  allRecords: []
};

// DOM Elements
const elements = {
  // Navigation & Header
  langToggleBtn: document.getElementById('lang-toggle-btn'),
  langBtnText: document.getElementById('lang-btn-text'),
  disclaimerBarText: document.getElementById('disclaimer-bar-text'),
  appTitle: document.getElementById('app-title'),
  appSubtitle: document.getElementById('app-subtitle'),
  privacyBadgeText: document.getElementById('privacy-badge-text'),
  recordsBadge: document.getElementById('records-badge'),

  // Tabs
  tabScan: document.getElementById('tab-scan'),
  tabConfirm: document.getElementById('tab-confirm'),
  tabResults: document.getElementById('tab-results'),
  tabRecords: document.getElementById('tab-records'),
  tabExport: document.getElementById('tab-export'),
  navScanText: document.getElementById('nav-scan-text'),
  navConfirmText: document.getElementById('nav-confirm-text'),
  navResultsText: document.getElementById('nav-results-text'),
  navRecordsText: document.getElementById('nav-records-text'),
  navExportText: document.getElementById('nav-export-text'),

  // Panels
  viewScan: document.getElementById('view-scan'),
  viewConfirm: document.getElementById('view-confirm'),
  viewResults: document.getElementById('view-results'),
  viewRecords: document.getElementById('view-records'),
  viewExport: document.getElementById('view-export'),

  // Screen 1: Scan
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('file-input'),
  cameraInput: document.getElementById('camera-input'),
  btnCamera: document.getElementById('btn-camera'),
  btnBrowse: document.getElementById('btn-browse'),
  btnManualEntry: document.getElementById('btn-manual-entry'),
  btnSampleReceipt: document.getElementById('btn-sample-receipt'),
  ocrProgressOverlay: document.getElementById('ocr-progress-overlay'),
  ocrProgressTitle: document.getElementById('ocr-progress-title'),
  ocrProgressStatus: document.getElementById('ocr-progress-status'),
  ocrProgressBar: document.getElementById('ocr-progress-bar'),
  btnCancelOcr: document.getElementById('btn-cancel-ocr'),
  cancelOcrBtnText: document.getElementById('cancel-ocr-btn-text'),

  // Screen 2: Confirm
  previewImage: document.getElementById('preview-image'),
  previewEmpty: document.getElementById('preview-empty'),
  btnRotateLeft: document.getElementById('btn-rotate-left'),
  btnRotateRight: document.getElementById('btn-rotate-right'),
  btnRescan: document.getElementById('btn-rescan'),
  btnAutoDetectOcr: document.getElementById('btn-auto-detect-ocr'),
  btnAutoDetectText: document.getElementById('btn-auto-detect-text'),
  ocrInlineStatus: document.getElementById('ocr-inline-status'),
  ocrInlineMsg: document.getElementById('ocr-inline-msg'),
  photoHintText: document.getElementById('photo-hint-text'),
  btnBackUpload: document.getElementById('btn-back-upload'),
  refractionForm: document.getElementById('refraction-form'),

  inputCode: document.getElementById('input-code'),
  inputSite: document.getElementById('input-site'),
  inputNotes: document.getElementById('input-notes'),
  odSph: document.getElementById('od-sph'),
  odCyl: document.getElementById('od-cyl'),
  odAx: document.getElementById('od-ax'),
  odPps: document.getElementById('od-pps'),
  osSph: document.getElementById('os-sph'),
  osCyl: document.getElementById('os-cyl'),
  osAx: document.getElementById('os-ax'),
  osPps: document.getElementById('os-pps'),
  inputPd: document.getElementById('input-pd'),
  liveSeOdVal: document.getElementById('live-se-od-val'),
  liveSeOsVal: document.getElementById('live-se-os-val'),

  // Screen 3: Results
  resParticipantCode: document.getElementById('res-participant-code'),
  referralBanner: document.getElementById('referral-banner'),
  referralBannerTitle: document.getElementById('referral-banner-title'),
  referralBannerDesc: document.getElementById('referral-banner-desc'),
  anisometropiaCard: document.getElementById('anisometropia-card'),
  anisoMsg: document.getElementById('aniso-msg'),

  // OD Card
  odHeadline: document.getElementById('od-headline'),
  odExplanation: document.getElementById('od-explanation'),
  odAstigmatismNote: document.getElementById('od-astigmatism-note'),
  odColorBar: document.getElementById('od-color-bar'),
  odColorIndicator: document.getElementById('od-color-indicator'),
  odScalePin: document.getElementById('od-scale-pin'),
  odPinBadge: document.getElementById('od-pin-badge'),
  odValSph: document.getElementById('od-val-sph'),
  odValCyl: document.getElementById('od-val-cyl'),
  odValAx: document.getElementById('od-val-ax'),
  odValPps: document.getElementById('od-val-pps'),
  odValSe: document.getElementById('od-val-se'),

  // OS Card
  osHeadline: document.getElementById('os-headline'),
  osExplanation: document.getElementById('os-explanation'),
  osAstigmatismNote: document.getElementById('os-astigmatism-note'),
  osColorBar: document.getElementById('os-color-bar'),
  osColorIndicator: document.getElementById('os-color-indicator'),
  osScalePin: document.getElementById('os-scale-pin'),
  osPinBadge: document.getElementById('os-pin-badge'),
  osValSph: document.getElementById('os-val-sph'),
  osValCyl: document.getElementById('os-val-cyl'),
  osValAx: document.getElementById('os-val-ax'),
  osValPps: document.getElementById('os-val-pps'),
  osValSe: document.getElementById('os-val-se'),

  // Results Actions
  btnSaveRecord: document.getElementById('btn-save-record'),
  btnEditAgain: document.getElementById('btn-edit-again'),
  btnNewScan: document.getElementById('btn-new-scan'),

  // Screen 4: Records Table
  recordsTableBody: document.getElementById('records-table-body'),
  recordsSearch: document.getElementById('records-search'),
  noRecordsMsg: document.getElementById('no-records-msg'),
  btnRecordsExportExcel: document.getElementById('btn-records-export-excel'),
  btnRecordsCopyTsv: document.getElementById('btn-records-copy-tsv'),

  // Screen 5: Export / Data
  exportRecordsCount: document.getElementById('export-records-count'),
  btnExportExcel: document.getElementById('btn-export-excel'),
  btnExportCsv: document.getElementById('btn-export-csv'),
  btnCopyTsv: document.getElementById('btn-copy-tsv'),
  btnClearAll: document.getElementById('btn-clear-all'),
  webhookForm: document.getElementById('webhook-form'),
  webhookUrlInput: document.getElementById('webhook-url-input'),
  btnTestWebhook: document.getElementById('btn-test-webhook'),
  btnShowGuide: document.getElementById('btn-show-guide'),
  sheetsGuideBox: document.getElementById('sheets-guide-box'),
  webhookFeedback: document.getElementById('webhook-feedback'),

  // Glossary Dialog
  glossaryDialog: document.getElementById('glossary-dialog'),
  dialogTermTitle: document.getElementById('dialog-term-title'),
  dialogTermDesc: document.getElementById('dialog-term-desc'),
  dialogCloseBtn: document.getElementById('dialog-close-btn'),
  dialogOkBtn: document.getElementById('dialog-ok-btn'),

  // Toast
  toast: document.getElementById('toast')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  await initDB();
  setupEventListeners();
  generateParticipantCode();
  loadSavedSettings();
  await refreshRecords();
  updateUILanguage();
  // Warm up OCR engine in background so camera captures read instantly
  setTimeout(() => {
    warmupOCR();
  }, 1000);
});

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  // Language Switch
  elements.langToggleBtn.addEventListener('click', toggleLanguage);

  // Tabs
  elements.tabScan.addEventListener('click', () => switchTab('scan'));
  elements.tabConfirm.addEventListener('click', () => switchTab('confirm'));
  elements.tabResults.addEventListener('click', () => switchTab('results'));
  elements.tabRecords.addEventListener('click', () => switchTab('records'));
  elements.tabExport.addEventListener('click', () => switchTab('export'));

  // Upload Trigger Buttons
  elements.btnCamera.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.cameraInput.click();
  });
  elements.btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.fileInput.click();
  });
  elements.dropzone.addEventListener('click', () => elements.fileInput.click());

  elements.fileInput.addEventListener('change', handleFileSelect);
  elements.cameraInput.addEventListener('change', handleFileSelect);

  // Drag and Drop
  elements.dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropzone.classList.add('drag-over');
  });
  elements.dropzone.addEventListener('dragleave', () => elements.dropzone.classList.remove('drag-over'));
  elements.dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  });

  // Manual Entry & Sample Receipt
  elements.btnManualEntry.addEventListener('click', () => {
    state.currentPhotoUrl = null;
    elements.previewImage.hidden = true;
    elements.previewEmpty.hidden = false;
    switchTab('confirm');
  });

  elements.btnSampleReceipt.addEventListener('click', loadSampleReceipt);

  // Cancel / Skip OCR button
  elements.btnCancelOcr.addEventListener('click', () => {
    ocrAborted = true;
    elements.ocrProgressOverlay.hidden = true;
    switchTab('confirm');
    showToast('Skipped reading. Please check the photo and enter numbers.');
  });

  // Rotation & Auto-Detect Controls
  elements.btnRotateLeft.addEventListener('click', () => rotatePreview(-90));
  elements.btnRotateRight.addEventListener('click', () => rotatePreview(90));
  elements.btnRescan.addEventListener('click', () => triggerAutoDetectOCR());
  if (elements.btnAutoDetectOcr) {
    elements.btnAutoDetectOcr.addEventListener('click', () => triggerAutoDetectOCR());
  }

  elements.btnBackUpload.addEventListener('click', () => switchTab('scan'));

  // Live SE calculations on form inputs
  const liveInputs = [elements.odSph, elements.odCyl, elements.osSph, elements.osCyl];
  liveInputs.forEach(input => input.addEventListener('input', updateLiveSE));

  // Form submission
  elements.refractionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateAndShowResults();
  });

  // Results Actions
  elements.btnSaveRecord.addEventListener('click', handleSaveCurrentRecord);
  elements.btnEditAgain.addEventListener('click', () => switchTab('confirm'));
  elements.btnNewScan.addEventListener('click', () => {
    resetForm();
    switchTab('scan');
  });

  // Glossary Chips
  document.querySelectorAll('.term-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const termKey = btn.dataset.term;
      showGlossaryTerm(termKey);
    });
  });

  elements.dialogCloseBtn.addEventListener('click', () => elements.glossaryDialog.close());
  elements.dialogOkBtn.addEventListener('click', () => elements.glossaryDialog.close());

  // Records Table & Search
  elements.recordsSearch.addEventListener('input', filterRecordsTable);
  elements.btnRecordsExportExcel.addEventListener('click', () => handleExportExcel());
  elements.btnRecordsCopyTsv.addEventListener('click', () => handleCopyTsv());

  // Export Panel Actions
  elements.btnExportExcel.addEventListener('click', () => handleExportExcel());
  elements.btnExportCsv.addEventListener('click', () => handleExportCsv());
  elements.btnCopyTsv.addEventListener('click', () => handleCopyTsv());
  elements.btnClearAll.addEventListener('click', handleClearAll);

  // Webhook
  elements.webhookForm.addEventListener('submit', handleSaveWebhook);
  elements.btnTestWebhook.addEventListener('click', handleTestWebhook);
  elements.btnShowGuide.addEventListener('click', () => {
    elements.sheetsGuideBox.hidden = !elements.sheetsGuideBox.hidden;
  });
}

/**
 * Tab Switching
 */
function switchTab(tabId) {
  state.activeTab = tabId;

  const tabs = [
    { id: 'scan', tab: elements.tabScan, view: elements.viewScan },
    { id: 'confirm', tab: elements.tabConfirm, view: elements.viewConfirm },
    { id: 'results', tab: elements.tabResults, view: elements.viewResults },
    { id: 'records', tab: elements.tabRecords, view: elements.viewRecords },
    { id: 'export', tab: elements.tabExport, view: elements.viewExport }
  ];

  tabs.forEach(t => {
    const isActive = t.id === tabId;
    t.tab.classList.toggle('active', isActive);
    t.tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    t.view.classList.toggle('active', isActive);
    t.view.hidden = !isActive;
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Language Switching (English <-> Bisaya)
 */
function toggleLanguage() {
  state.lang = state.lang === 'en' ? 'fil' : 'en';
  updateUILanguage();
  if (state.currentRecord) {
    renderResults(state.currentRecord);
  }
}

function t(key, replacements = {}) {
  const dict = translations[state.lang] || translations.en;
  let text = dict[key] || translations.en[key] || key;
  for (const [k, v] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

function updateUILanguage() {
  const dict = translations[state.lang];

  // Header & Disclaimer
  elements.disclaimerBarText.textContent = dict.disclaimerBanner;
  elements.appTitle.textContent = dict.appTitle;
  elements.appSubtitle.textContent = dict.appSubtitle;
  elements.privacyBadgeText.textContent = dict.privacyBadge;
  elements.langBtnText.textContent = dict.langToggle;

  // Tabs
  elements.navScanText.textContent = dict.navScan;
  elements.navConfirmText.textContent = dict.navConfirm;
  elements.navResultsText.textContent = dict.navResults;
  elements.navRecordsText.textContent = dict.navRecords;
  elements.navExportText.textContent = dict.navExport;

  // Screen 1: Scan
  document.getElementById('hero-title').textContent = dict.heroTitle;
  document.getElementById('hero-desc').textContent = dict.heroDesc;
  document.getElementById('upload-zone-title').textContent = dict.uploadZoneTitle;
  document.getElementById('upload-zone-prompt').textContent = dict.uploadZonePrompt;
  document.getElementById('upload-camera-btn-text').textContent = dict.uploadCameraBtn;
  document.getElementById('upload-file-btn-text').textContent = dict.uploadFileBtn;
  document.getElementById('manual-entry-btn-text').textContent = dict.manualEntryBtn;
  document.getElementById('load-sample-btn-text').textContent = dict.loadSampleBtn;
  if (elements.cancelOcrBtnText) {
    elements.cancelOcrBtnText.textContent = dict.cancelOcrBtn || 'Skip & Enter Manually →';
  }
  document.getElementById('ocr-notice-text').textContent = dict.ocrNotice;
  elements.ocrProgressTitle.textContent = dict.ocrProcessing;

  // Screen 2: Confirm
  document.getElementById('confirm-title').textContent = dict.confirmTitle;
  document.getElementById('confirm-desc').textContent = dict.confirmDesc;
  document.getElementById('receipt-preview-title').textContent = dict.receiptPreviewTitle;
  document.getElementById('receipt-preview-empty').textContent = dict.receiptPreviewEmpty;
  if (elements.btnAutoDetectText) {
    elements.btnAutoDetectText.textContent = dict.autoDetectBtn;
  }
  if (elements.photoHintText) {
    elements.photoHintText.textContent = dict.photoHint;
  }
  document.getElementById('participant-info-title').textContent = dict.participantInfoTitle;
  document.getElementById('participant-code-label').textContent = dict.participantCodeLabel;
  document.getElementById('participant-code-help').textContent = dict.participantCodeHelp;
  document.getElementById('site-location-label').textContent = dict.siteLocationLabel;
  document.getElementById('right-eye-title').textContent = dict.rightEyeTitle;
  document.getElementById('left-eye-title').textContent = dict.leftEyeTitle;
  document.getElementById('shared-title').textContent = dict.sharedTitle;
  document.getElementById('field-od-sph').textContent = dict.fieldSph;
  document.getElementById('field-od-cyl').textContent = dict.fieldCyl;
  document.getElementById('field-od-ax').textContent = dict.fieldAx;
  document.getElementById('field-od-pps').textContent = dict.fieldPps;
  document.getElementById('field-os-sph').textContent = dict.fieldSph;
  document.getElementById('field-os-cyl').textContent = dict.fieldCyl;
  document.getElementById('field-os-ax').textContent = dict.fieldAx;
  document.getElementById('field-os-pps').textContent = dict.fieldPps;
  document.getElementById('field-pd').textContent = dict.fieldPd;
  document.getElementById('live-se-od-label').textContent = dict.liveSeOd;
  document.getElementById('live-se-os-label').textContent = dict.liveSeOs;
  document.getElementById('calculate-btn-text').textContent = dict.calculateBtn;
  document.getElementById('back-to-upload-btn-text').textContent = dict.backToUploadBtn;

  // Screen 3: Results
  document.getElementById('results-title').textContent = dict.resultsTitle;
  document.getElementById('results-subtitle').textContent = dict.resultsSubtitle;
  document.getElementById('od-card-title').textContent = dict.odCardTitle;
  document.getElementById('os-card-title').textContent = dict.osCardTitle;
  document.getElementById('aniso-title').textContent = dict.anisometropiaTitle;
  document.getElementById('next-step-title').textContent = dict.nextStepTitle;
  document.getElementById('next-step-action').textContent = dict.nextStepAction;
  document.getElementById('glossary-title').textContent = dict.glossaryTitle;
  const glossaryIntroEl = document.getElementById('glossary-intro');
  if (glossaryIntroEl) glossaryIntroEl.textContent = dict.glossaryIntro;
  document.getElementById('disclaimer-full-title').textContent = dict.disclaimerFullTitle;
  document.getElementById('disclaimer-full-text').textContent = dict.disclaimerFullText;
  document.getElementById('save-record-btn-text').textContent = dict.saveRecordBtn;
  document.getElementById('edit-again-btn-text').textContent = dict.editAgainBtn;
  document.getElementById('new-scan-btn-text').textContent = dict.newScanBtn;

  // Scale labels
  ['od', 'os'].forEach(eye => {
    const nearLbl = document.getElementById(`scale-lbl-near-${eye}`);
    const clearLbl = document.getElementById(`scale-lbl-clear-${eye}`);
    const farLbl = document.getElementById(`scale-lbl-far-${eye}`);
    if (nearLbl) nearLbl.textContent = dict.scaleNearsighted;
    if (clearLbl) clearLbl.textContent = dict.scaleClear;
    if (farLbl) farLbl.textContent = dict.scaleFarsighted;
  });

  // Screen 4 & 5: Export / Records
  document.getElementById('export-title').textContent = dict.exportTitle;
  document.getElementById('export-desc').textContent = dict.exportDesc;
  document.getElementById('total-records-label').textContent = dict.totalRecords;
  document.getElementById('download-excel-btn-text').textContent = dict.downloadExcelBtn;
  document.getElementById('download-csv-btn-text').textContent = dict.downloadCsvBtn;
  document.getElementById('copy-tsv-btn-text').textContent = dict.copyTsvBtn;
  document.getElementById('clear-all-btn-text').textContent = dict.clearAllBtn;
  document.getElementById('webhook-section-title').textContent = dict.webhookSectionTitle;
  document.getElementById('webhook-desc').textContent = dict.webhookDesc;
  document.getElementById('webhook-url-label').textContent = dict.webhookUrlLabel;
  document.getElementById('webhook-save-btn-text').textContent = dict.webhookSaveBtn;
  document.getElementById('webhook-test-btn-text').textContent = dict.webhookTestBtn;
  document.getElementById('webhook-guide-btn-text').textContent = dict.webhookGuideBtn;
  document.getElementById('records-table-title').textContent = dict.recordsTableTitle;
  document.getElementById('no-records-text').textContent = dict.noRecordsMsg;
}

/**
 * File Handling & Image Processing
 */
function handleFileSelect(e) {
  if (e.target.files && e.target.files.length > 0) {
    processImageFile(e.target.files[0]);
  }
}

async function processImageFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please select a valid image file (JPG, PNG).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    state.currentPhotoUrl = event.target.result;
    state.rotationAngle = 0;
    loadPhotoIntoPreview(state.currentPhotoUrl, () => {
      runOCRAndPopulate();
    });
  };
  reader.readAsDataURL(file);
}

function loadPhotoIntoPreview(url, onLoaded) {
  const img = new Image();
  img.onload = () => {
    state.currentImageElement = img;
    elements.previewImage.src = url;
    elements.previewImage.hidden = false;
    elements.previewEmpty.hidden = true;
    updatePreviewTransform();
    if (onLoaded) onLoaded();
  };
  img.src = url;
}

function rotatePreview(deltaDeg) {
  state.rotationAngle = (state.rotationAngle + deltaDeg + 360) % 360;
  updatePreviewTransform();
}

function updatePreviewTransform() {
  if (elements.previewImage) {
    elements.previewImage.style.transform = `rotate(${state.rotationAngle}deg)`;
  }
}

let ocrAborted = false;

/**
 * Fast Optical Recognition & Number Populator
 * Auto-detects prescription numbers with an unbreakable 8-second safety timeout
 */
async function runOCRAndPopulate() {
  ocrAborted = false;
  elements.ocrProgressOverlay.hidden = false;
  elements.ocrProgressBar.style.width = '15%';
  elements.ocrProgressTitle.textContent = t('ocrProcessing');
  elements.ocrProgressStatus.textContent = 'Reading receipt lines… (tap Skip anytime)';

  try {
    const ocrPromise = runReceiptOCR(
      state.currentImageElement,
      state.rotationAngle,
      (statusText, pct) => {
        if (ocrAborted) return;
        elements.ocrProgressStatus.textContent = statusText;
        if (pct) elements.ocrProgressBar.style.width = `${Math.max(15, Math.min(100, pct))}%`;
      }
    );

    // Hard 8-second timeout so user is NEVER stuck under ANY circumstances
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 8000)
    );

    const ocrResult = await Promise.race([ocrPromise, timeoutPromise]);

    if (ocrAborted) return;

    elements.ocrProgressBar.style.width = '100%';
    setTimeout(() => {
      elements.ocrProgressOverlay.hidden = true;
    }, 200);

    if (ocrResult && ocrResult.success && ocrResult.parsed && 
        (ocrResult.parsed.od.sph !== null || ocrResult.parsed.os.sph !== null || ocrResult.parsed.pd !== null)) {
      populateConfirmFields(ocrResult.parsed);
      switchTab('confirm');
      showToast('✓ Receipt numbers detected! Please review and confirm.');
    } else {
      switchTab('confirm');
      showToast('Receipt photo loaded! Please check and type numbers on the right.');
    }
  } catch (err) {
    if (ocrAborted) return;
    console.warn('OCR processing notice:', err);
    elements.ocrProgressOverlay.hidden = true;
    switchTab('confirm');
    showToast('Receipt photo ready! Enter or confirm the numbers from the photo.');
  }
}

let isScanning = false;

/**
 * On-Demand Optical Character Recognition Runner
 * Runs when user taps "⚡ Auto-Detect Numbers from Photo" on Confirm screen
 */
async function triggerAutoDetectOCR() {
  if (isScanning) return;
  if (!state.currentImageElement) {
    showToast('No receipt photo loaded to scan.');
    return;
  }

  isScanning = true;
  if (elements.btnAutoDetectOcr) elements.btnAutoDetectOcr.disabled = true;
  if (elements.ocrInlineStatus) elements.ocrInlineStatus.hidden = false;
  if (elements.ocrInlineMsg) elements.ocrInlineMsg.textContent = t('autoDetectScanning');
  if (elements.btnAutoDetectText) elements.btnAutoDetectText.textContent = t('autoDetectScanning');

  try {
    const ocrResult = await runReceiptOCR(
      state.currentImageElement,
      state.rotationAngle,
      (statusText, pct) => {
        if (elements.ocrInlineMsg) elements.ocrInlineMsg.textContent = `${statusText} (${pct}%)`;
      }
    );

    if (ocrResult && ocrResult.success && ocrResult.parsed && 
        (ocrResult.parsed.od.sph !== null || ocrResult.parsed.os.sph !== null || ocrResult.parsed.pd !== null)) {
      populateConfirmFields(ocrResult.parsed);
      if (elements.btnAutoDetectText) elements.btnAutoDetectText.textContent = '✓ Re-scan Photo Numbers';
      showToast(t('autoDetectSuccess'));
    } else {
      if (elements.btnAutoDetectText) elements.btnAutoDetectText.textContent = t('autoDetectBtn');
      showToast(t('autoDetectFailed'));
    }
  } catch (err) {
    console.warn('Auto-detect notice:', err);
    if (elements.btnAutoDetectText) elements.btnAutoDetectText.textContent = t('autoDetectBtn');
    showToast(t('autoDetectFailed'));
  } finally {
    isScanning = false;
    if (elements.btnAutoDetectOcr) elements.btnAutoDetectOcr.disabled = false;
    if (elements.ocrInlineStatus) elements.ocrInlineStatus.hidden = true;
  }
}

/**
 * Populate Extracted Numbers into Confirm Form
 */
function populateConfirmFields(parsed) {
  if (parsed.od) {
    if (parsed.od.sph !== null) elements.odSph.value = parsed.od.sph.toFixed(2);
    if (parsed.od.cyl !== null) elements.odCyl.value = parsed.od.cyl.toFixed(2);
    if (parsed.od.ax !== null) elements.odAx.value = parsed.od.ax;
    if (parsed.od.pps !== null) elements.odPps.value = parsed.od.pps.toFixed(1);
  }

  if (parsed.os) {
    if (parsed.os.sph !== null) elements.osSph.value = parsed.os.sph.toFixed(2);
    if (parsed.os.cyl !== null) elements.osCyl.value = parsed.os.cyl.toFixed(2);
    if (parsed.os.ax !== null) elements.osAx.value = parsed.os.ax;
    if (parsed.os.pps !== null) elements.osPps.value = parsed.os.pps.toFixed(1);
  }

  if (parsed.pd !== null) {
    elements.inputPd.value = parsed.pd.toFixed(1);
  }

  updateLiveSE();
}

/**
 * Live Spherical Equivalent update
 */
function updateLiveSE() {
  const odS = parseFloat(elements.odSph.value);
  const odC = parseFloat(elements.odCyl.value);
  const odSE = computeSE(odS, odC);
  elements.liveSeOdVal.textContent = odSE !== null ? formatDiopter(odSE) : '—';

  const osS = parseFloat(elements.osSph.value);
  const osC = parseFloat(elements.osCyl.value);
  const osSE = computeSE(osS, osC);
  elements.liveSeOsVal.textContent = osSE !== null ? formatDiopter(osSE) : '—';
}

/**
 * Try Sample Receipt Generator
 * Creates an authentic realistic autorefractor receipt image on Canvas for immediate testing!
 */
function loadSampleReceipt() {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');

  // Realistic thermal paper texture background
  ctx.fillStyle = '#f8f8f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Thermal header
  ctx.fillStyle = '#1c1c1e';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AUTOREFRACTOMETER', 300, 60);

  ctx.font = '16px monospace';
  ctx.fillText('REF DATA   VD: 12.00   CYL: -', 300, 100);
  ctx.fillText('DATE: 2026/11/05  TIME: 10:45', 300, 130);

  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, 150);
  ctx.lineTo(560, 150);
  ctx.stroke();

  // Right Eye (OD)
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('<R>     SPH      CYL    AX', 60, 190);
  ctx.font = '19px monospace';
  ctx.fillText('       -1.75    -0.50    85', 60, 230);
  ctx.fillText('       -1.75    -0.50    85', 60, 265);
  ctx.fillText('       -1.75    -0.75    84', 60, 300);
  ctx.font = 'bold 20px monospace';
  ctx.fillText(' *     -1.75    -0.50    85', 60, 345);
  ctx.font = '17px monospace';
  ctx.fillText('       PS: 4.5 mm', 60, 380);

  ctx.beginPath();
  ctx.moveTo(40, 410);
  ctx.lineTo(560, 410);
  ctx.stroke();

  // Left Eye (OS)
  ctx.font = 'bold 20px monospace';
  ctx.fillText('<L>     SPH      CYL    AX', 60, 450);
  ctx.font = '19px monospace';
  ctx.fillText('       -2.25    -0.75    95', 60, 490);
  ctx.fillText('       -2.25    -0.75    95', 60, 525);
  ctx.fillText('       -2.50    -0.75    95', 60, 560);
  ctx.font = 'bold 20px monospace';
  ctx.fillText(' *     -2.25    -0.75    95', 60, 605);
  ctx.font = '17px monospace';
  ctx.fillText('       PS: 4.8 mm', 60, 640);

  ctx.beginPath();
  ctx.moveTo(40, 670);
  ctx.lineTo(560, 670);
  ctx.stroke();

  // Shared
  ctx.font = 'bold 20px monospace';
  ctx.fillText('PD = 63.0 mm', 60, 715);

  const dataUrl = canvas.toDataURL('image/png');
  state.currentPhotoUrl = dataUrl;
  state.rotationAngle = 0;

  loadPhotoIntoPreview(dataUrl, () => {
    // Populate sample receipt numbers immediately so users can test with 0 wait
    populateConfirmFields({
      od: { sph: -1.75, cyl: -0.50, ax: 85, pps: 4.5 },
      os: { sph: -2.25, cyl: -0.75, ax: 95, pps: 4.8 },
      pd: 63.0
    });
    switchTab('confirm');
    showToast('Sample receipt loaded! Review numbers and tap View Results.');
  });
}

/**
 * Calculate & Render Results
 */
function calculateAndShowResults() {
  const odSph = roundDiopter(elements.odSph.value);
  const odCyl = roundDiopter(elements.odCyl.value);
  const odAx = elements.odAx.value ? parseInt(elements.odAx.value, 10) : null;
  const odPps = elements.odPps.value ? parseFloat(elements.odPps.value) : null;

  const osSph = roundDiopter(elements.osSph.value);
  const osCyl = roundDiopter(elements.osCyl.value);
  const osAx = elements.osAx.value ? parseInt(elements.osAx.value, 10) : null;
  const osPps = elements.osPps.value ? parseFloat(elements.osPps.value) : null;

  const pd = elements.inputPd.value ? parseFloat(elements.inputPd.value) : null;
  const code = (elements.inputCode.value || '').trim() || generateParticipantCode();
  const site = (elements.inputSite.value || '').trim();
  const notes = (elements.inputNotes.value || '').trim();

  const evalResult = evaluatePair(odSph, odCyl, osSph, osCyl);

  const record = {
    id: `REC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    code,
    site,
    notes,
    od_sph: odSph,
    od_cyl: odCyl,
    od_ax: odAx,
    od_pps: odPps,
    od_se: evalResult.odSE,
    od_condition: evalResult.odClass.conditionKey,
    os_sph: osSph,
    os_cyl: osCyl,
    os_ax: osAx,
    os_pps: osPps,
    os_se: evalResult.osSE,
    os_condition: evalResult.osClass.conditionKey,
    pd,
    diff_se: evalResult.diff,
    anisometropia: evalResult.isAnisometropia,
    referral: evalResult.referralRecommended,
    evalResult
  };

  state.currentRecord = record;
  renderResults(record);
  switchTab('results');
}

/**
 * Render Results Screen UI
 */
function renderResults(record) {
  const evalResult = record.evalResult || evaluatePair(record.od_sph, record.od_cyl, record.os_sph, record.os_cyl);

  // Participant Code
  elements.resParticipantCode.textContent = record.code;

  // Referral Banner
  if (evalResult.referralRecommended) {
    elements.referralBanner.className = 'referral-banner banner-orange';
    elements.referralBannerTitle.textContent = state.lang === 'fil' ? 'GISUGYOT NGA MAGPA-CHECK SA DOKTOR (REFERRAL)' : 'REFERRAL RECOMMENDED';
    elements.referralBannerDesc.textContent = state.lang === 'fil'
      ? 'Ang usa o duha ka mata anaa sa gawas sa normal nga sukod (−0.50 D hangtod +0.50 D). Magpakonsulta sa optometrist o ophthalmologist.'
      : 'One or both eyes are outside the normal range (−0.50 D to +0.50 D). Please consult an optometrist or ophthalmologist for a comprehensive eye exam.';
  } else {
    elements.referralBanner.className = 'referral-banner banner-green';
    elements.referralBannerTitle.textContent = state.lang === 'fil' ? 'KLARO / NORMAL NGA PANAN-AW (NO REFERRAL)' : 'NO REFERRAL NEEDED';
    elements.referralBannerDesc.textContent = state.lang === 'fil'
      ? 'Ang duha ka mata anaa sa normal nga sumbanan base niining pagsusi sa makina.'
      : 'Both eyes fall within the normal refractive range based on this automated screening.';
  }

  // Anisometropia Note (Visible if diff >= 1.00 D)
  if (evalResult.isAnisometropia && evalResult.diff !== null) {
    elements.anisometropiaCard.hidden = false;
    elements.anisoMsg.textContent = t('anisometropiaMsg', { diff: formatDiopter(evalResult.diff, false) });
  } else {
    elements.anisometropiaCard.hidden = true;
  }

  // Render Right Eye (OD)
  renderEyeResultCard(
    'od',
    record.od_sph, record.od_cyl, record.od_ax, record.od_pps,
    evalResult.odSE, evalResult.odClass,
    elements.odHeadline, elements.odExplanation, elements.odAstigmatismNote,
    elements.odColorBar, elements.odColorIndicator,
    elements.odScalePin, elements.odPinBadge,
    elements.odValSph, elements.odValCyl, elements.odValAx, elements.odValPps, elements.odValSe
  );

  // Render Left Eye (OS)
  renderEyeResultCard(
    'os',
    record.os_sph, record.os_cyl, record.os_ax, record.os_pps,
    evalResult.osSE, evalResult.osClass,
    elements.osHeadline, elements.osExplanation, elements.osAstigmatismNote,
    elements.osColorBar, elements.osColorIndicator,
    elements.osScalePin, elements.osPinBadge,
    elements.osValSph, elements.osValCyl, elements.osValAx, elements.osValPps, elements.osValSe
  );
}

function renderEyeResultCard(
  eyeCode, sph, cyl, ax, pps, se, eyeClass,
  headlineEl, explanationEl, astigNoteEl,
  colorBarEl, pillEl,
  pinEl, pinBadgeEl,
  valSphEl, valCylEl, valAxEl, valPpsEl, valSeEl
) {
  const condKey = eyeClass.conditionKey;
  headlineEl.textContent = t(`cond_${condKey}`);
  explanationEl.textContent = t(`explain_${condKey}`);

  // Astigmatism note
  if (eyeClass.hasAstigmatism) {
    astigNoteEl.hidden = false;
    astigNoteEl.textContent = t('explain_astigmatism');
  } else {
    astigNoteEl.hidden = true;
  }

  // Status colors: green, amber, orange
  const color = eyeClass.colorStatus; // 'green', 'amber', 'orange'
  colorBarEl.className = `condition-color-bar bar-${color}`;
  pillEl.className = `status-pill pill-${color}`;
  pillEl.textContent = eyeClass.severity === 'normal' ? 'Normal' : eyeClass.severity.toUpperCase();

  // Position Pin on Diopter Scale
  const pct = scalePercentageFromSE(se);
  pinEl.style.left = `${pct}%`;
  pinBadgeEl.textContent = se !== null ? formatDiopter(se) : '—';

  // Metrics Table
  valSphEl.textContent = sph !== null ? formatDiopter(sph) : '—';
  valCylEl.textContent = cyl !== null ? formatDiopter(cyl) : '—';
  valAxEl.textContent = ax !== null ? `${ax}°` : '—';
  valPpsEl.textContent = pps !== null ? `${pps.toFixed(1)} mm` : '—';
  valSeEl.textContent = se !== null ? formatDiopter(se) : '—';
}

/**
 * Tap-to-Explain Modal
 */
function showGlossaryTerm(termKey) {
  const titleKey = `term_${termKey}_title`;
  const descKey = `term_${termKey}_desc`;

  elements.dialogTermTitle.textContent = t(titleKey);
  elements.dialogTermDesc.textContent = t(descKey);

  elements.glossaryDialog.showModal();
}

/**
 * Save Record to Database & Webhook Sync
 */
async function handleSaveCurrentRecord() {
  if (!state.currentRecord) {
    showToast('No active screening to save.');
    return;
  }

  try {
    await saveRecord(state.currentRecord);
    await refreshRecords();
    showToast(state.lang === 'fil' ? 'Naka-save na ang rekord sa database!' : 'Record successfully saved to database!');
  } catch (err) {
    console.error('Save failed:', err);
    showToast('Failed to save record to storage.');
  }
}

/**
 * Load Records & Refresh Table
 */
async function refreshRecords() {
  state.allRecords = await listRecords();
  elements.recordsBadge.textContent = state.allRecords.length;
  elements.exportRecordsCount.textContent = state.allRecords.length;
  renderRecordsTable(state.allRecords);
}

function renderRecordsTable(records) {
  elements.recordsTableBody.innerHTML = '';

  if (!records || records.length === 0) {
    elements.noRecordsMsg.hidden = false;
    return;
  }
  elements.noRecordsMsg.hidden = true;

  records.forEach(r => {
    const tr = document.createElement('tr');

    const odSeStr = r.od_se !== null && r.od_se !== undefined ? formatDiopter(r.od_se) : '—';
    const osSeStr = r.os_se !== null && r.os_se !== undefined ? formatDiopter(r.os_se) : '—';
    const diffStr = r.diff_se !== null && r.diff_se !== undefined ? formatDiopter(r.diff_se, false) : '—';
    const referralStr = r.referral ? '<span class="status-pill pill-orange">Refer</span>' : '<span class="status-pill pill-green">Normal</span>';
    const dateFormatted = new Date(r.timestamp).toLocaleDateString();

    tr.innerHTML = `
      <td><strong>${escapeHtml(r.code)}</strong></td>
      <td>${dateFormatted}</td>
      <td>${escapeHtml(r.site || '—')}</td>
      <td>${odSeStr}</td>
      <td>${osSeStr}</td>
      <td>${diffStr}</td>
      <td>${referralStr}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button type="button" class="btn btn-secondary btn-sm" data-action="view" data-id="${r.id}">View</button>
          <button type="button" class="btn btn-ghost btn-sm" style="color:var(--color-danger)" data-action="delete" data-id="${r.id}" aria-label="Delete ${escapeHtml(r.code)}">&times;</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-action="view"]').addEventListener('click', () => {
      state.currentRecord = r;
      renderResults(r);
      switchTab('results');
    });

    tr.querySelector('[data-action="delete"]').addEventListener('click', async () => {
      if (confirm(`Delete record for ${r.code}?`)) {
        await deleteRecord(r.id);
        await refreshRecords();
        showToast('Record deleted.');
      }
    });

    elements.recordsTableBody.appendChild(tr);
  });
}

function filterRecordsTable() {
  const query = elements.recordsSearch.value.toLowerCase().trim();
  if (!query) {
    renderRecordsTable(state.allRecords);
    return;
  }

  const filtered = state.allRecords.filter(r => {
    const codeMatch = (r.code || '').toLowerCase().includes(query);
    const siteMatch = (r.site || '').toLowerCase().includes(query);
    return codeMatch || siteMatch;
  });

  renderRecordsTable(filtered);
}

/**
 * Excel & CSV Export Handlers
 */
async function handleExportExcel() {
  if (state.allRecords.length === 0) {
    showToast('No records available to export.');
    return;
  }
  try {
    await exportToExcel(state.allRecords);
    showToast('Excel workbook (.xlsx) downloaded!');
  } catch (err) {
    console.error('Excel export error:', err);
    showToast('Export failed: ' + err.message);
  }
}

function handleExportCsv() {
  if (state.allRecords.length === 0) {
    showToast('No records available to export.');
    return;
  }
  try {
    exportToCSV(state.allRecords);
    showToast('CSV file downloaded!');
  } catch (err) {
    console.error('CSV export error:', err);
    showToast('Export failed: ' + err.message);
  }
}

async function handleCopyTsv() {
  if (state.allRecords.length === 0) {
    showToast('No records available to copy.');
    return;
  }
  try {
    await copyToClipboardTSV(state.allRecords);
    showToast(t('copiedToast'));
  } catch (err) {
    console.error('Copy TSV error:', err);
    showToast('Clipboard copy failed.');
  }
}

async function handleClearAll() {
  if (confirm(t('clearConfirm'))) {
    await clearAllRecords();
    await refreshRecords();
    showToast('All participant records cleared.');
  }
}

/**
 * Webhook Settings Handler
 */
function handleSaveWebhook(e) {
  e.preventDefault();
  const url = elements.webhookUrlInput.value.trim();
  setWebhookUrl(url);
  elements.webhookFeedback.textContent = t('webhookSavedMsg');
  elements.webhookFeedback.className = 'feedback-msg success';
  elements.webhookFeedback.hidden = false;
  setTimeout(() => elements.webhookFeedback.hidden = true, 4000);
}

async function handleTestWebhook() {
  const url = elements.webhookUrlInput.value.trim();
  if (!url) {
    showToast('Please enter a webhook URL first.');
    return;
  }
  try {
    await testWebhook(url);
    elements.webhookFeedback.textContent = 'Test ping dispatched! Check your Google Sheet.';
    elements.webhookFeedback.className = 'feedback-msg success';
    elements.webhookFeedback.hidden = false;
  } catch (err) {
    elements.webhookFeedback.textContent = 'Webhook test failed: ' + err.message;
    elements.webhookFeedback.className = 'feedback-msg error';
    elements.webhookFeedback.hidden = false;
  }
}

function loadSavedSettings() {
  const savedUrl = getWebhookUrl();
  if (savedUrl) elements.webhookUrlInput.value = savedUrl;

  const defaultSite = getDefaultSite();
  if (defaultSite) elements.inputSite.value = defaultSite;
}

/**
 * Helpers
 */
function generateParticipantCode() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const seq = String(state.allRecords.length + 1).padStart(3, '0');
  const code = `EE-${yy}${mm}${dd}-${seq}`;
  elements.inputCode.value = code;
  return code;
}

function resetForm() {
  elements.refractionForm.reset();
  state.currentPhotoUrl = null;
  state.currentImageElement = null;
  state.currentRecord = null;
  elements.previewImage.hidden = true;
  elements.previewEmpty.hidden = false;
  elements.liveSeOdVal.textContent = '—';
  elements.liveSeOsVal.textContent = '—';
  generateParticipantCode();
  loadSavedSettings();
}

function showToast(msg) {
  elements.toast.textContent = msg;
  elements.toast.hidden = false;
  setTimeout(() => {
    elements.toast.hidden = true;
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
