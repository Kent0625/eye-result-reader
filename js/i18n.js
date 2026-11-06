/**
 * Internationalization (i18n) for Eye Result Reader
 * Supports English and Bisaya (Cebuano).
 */

export const translations = {
  en: {
    // General & Header
    appTitle: 'Eye Result Reader',
    appSubtitle: 'Autorefractometer Printout Interpreter',
    privacyBadge: '100% On-Device Privacy — Photo never uploaded or stored',
    langToggle: 'Bisaya',
    disclaimerBanner: 'Screening interpretation only. This is not a medical diagnosis or prescription.',

    // Navigation / Tabs
    navScan: 'Scan / Enter',
    navConfirm: 'Confirm Numbers',
    navResults: 'Results',
    navRecords: 'Saved Records',
    navExport: 'Excel & Data',

    // Screen 1: Upload / Input
    heroTitle: 'Read Your Autorefractometer Printout',
    heroDesc: 'Upload or take a photo of your receipt printout. The text is read directly in your browser. Or type the numbers manually.',
    uploadZoneTitle: 'Snap or Select Printout',
    uploadZonePrompt: 'Drag and drop a photo here, or click to choose from camera / gallery',
    uploadCameraBtn: 'Take Photo with Camera',
    uploadFileBtn: 'Choose Photo from Gallery',
    manualEntryBtn: 'Enter Numbers Manually',
    loadSampleBtn: 'Try Sample Receipt',
    cancelOcrBtn: 'Skip & Enter Manually →',
    cameraModalTitle: 'Receipt Camera Scanner',
    cameraGuide: 'Align receipt within frame & tap capture',
    cameraStarting: 'Starting camera…',
    cameraDenied: 'Camera permission required to scan directly.',
    cameraRetryBtn: 'Try Camera Again',
    cameraFallbackFileBtn: 'Choose Photo from Gallery',
    cameraGalleryBtn: 'Gallery',
    cameraManualBtn: 'Manual',
    switchCameraBtn: 'Switch Camera',
    capturePhotoBtn: 'Capture Receipt Photo',
    autoDetectBtn: '⚡ Auto-Detect Numbers from Photo',
    autoDetectScanning: 'Scanning numbers…',
    autoDetectSuccess: '✓ Numbers detected from photo! Please verify.',
    autoDetectFailed: 'Could not auto-read text clearly. Please enter numbers from the receipt photo on the left.',
    photoHint: 'Check the receipt photo on the left and enter or confirm the numbers below, or tap Auto-Detect.',
    ocrNotice: 'Tips for best reading: Ensure the printout is upright, flat, and well-lit. Avoid tilted angles.',
    ocrProcessing: 'Reading printout on this device…',
    ocrStatus: 'Analyzing lines and optical numbers…',

    // Screen 2: Confirm
    confirmTitle: 'Confirm Extracted Numbers',
    confirmDesc: 'Review the numbers against your receipt photo on the left. Tap any box to correct errors.',
    receiptPreviewTitle: 'Receipt Photo',
    receiptPreviewEmpty: 'No photo uploaded (Manual entry mode)',
    rotateLeft: 'Rotate Left',
    rotateRight: 'Rotate Right',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetView: 'Reset View',

    // Fields
    participantInfoTitle: 'Participant Information',
    participantCodeLabel: 'Participant Code',
    participantCodeHelp: 'Anonymous code (e.g. EE-261105-001)',
    siteLocationLabel: 'Site / Location (Optional)',
    siteLocationPlaceholder: 'e.g. RHU Sumilao, USTP Gym',
    dateLabel: 'Date & Time',

    rightEyeTitle: 'Right Eye (OD / Oculi Dextra)',
    leftEyeTitle: 'Left Eye (OS / Oculi Sinistra)',
    sharedTitle: 'Shared Measurements',

    fieldSph: 'SPH (Sphere)',
    fieldSphHelp: 'Plus (+) or minus (-) power (e.g. -2.25)',
    fieldCyl: 'CYL (Cylinder)',
    fieldCylHelp: 'Astigmatism power (e.g. -0.50)',
    fieldAx: 'AX (Axis)',
    fieldAxHelp: 'Angle in degrees 1° to 180°',
    fieldPps: 'PPS / PS (Pupil Size)',
    fieldPpsHelp: 'Pupil diameter in mm (e.g. 4.5)',
    fieldPd: 'PD (Pupillary Distance)',
    fieldPdHelp: 'Distance between pupils in mm (e.g. 63.0)',

    liveSeOd: 'OD Spherical Equiv: ',
    liveSeOs: 'OS Spherical Equiv: ',
    calculateBtn: 'View Results & Interpret',
    backToUploadBtn: 'Upload New Photo',

    // Screen 3: Results
    resultsTitle: 'Screening Interpretation',
    resultsSubtitle: 'Summary of optical findings for both eyes',
    odCardTitle: 'Right Eye (OD)',
    osCardTitle: 'Left Eye (OS)',
    seLabel: 'Spherical Equivalent (SE):',
    seFormulaNote: 'SE = SPH + (CYL / 2)',
    summaryMetrics: 'Measurements',

    // Scale
    scaleLabel: 'Refractive Power Scale',
    scaleNearsighted: 'Nearsighted (Myopia)',
    scaleClear: 'Clear (Normal)',
    scaleFarsighted: 'Farsighted (Hyperopia)',

    // Condition Headlines
    cond_emmetropia: 'Clear / Normal Vision Range',
    cond_myopia_mild: 'Mild Nearsightedness (Myopia)',
    cond_myopia_moderate: 'Moderate Nearsightedness (Myopia)',
    cond_myopia_strong: 'Strong Nearsightedness (High Myopia)',
    cond_hyperopia_mild: 'Mild Farsightedness (Hyperopia)',
    cond_hyperopia_strong: 'Moderate / Strong Farsightedness',
    cond_unknown: 'Measurements Pending',

    // Condition Explanations
    explain_emmetropia: 'Your eye focuses light well onto the retina. Distant and close objects are naturally in focus without significant strain.',
    explain_myopia_mild: 'You can see close objects clearly, but objects in the distance (like road signs or classroom boards) may look slightly soft or blurred.',
    explain_myopia_moderate: 'Distances appear noticeably blurred without corrective lenses. Tasks like driving, watching TV, or sports benefit greatly from prescription glasses.',
    explain_myopia_strong: 'Objects are only clear when held very close to your face. High nearsightedness requires prescription lenses for daily comfort and regular clinical eye checks.',
    explain_hyperopia_mild: 'Distant objects are typically clear, but viewing close-up work or reading for long periods may cause subtle eye strain or fatigue.',
    explain_hyperopia_strong: 'Close-up objects appear blurred, and focusing up close takes active eye muscle effort, which can cause headaches or tired eyes.',
    explain_astigmatism: 'Astigmatism was also detected (uneven curve of the cornea or lens), which can cause slight ghosting or shadows around letters.',

    // Anisometropia Note
    anisometropiaTitle: 'Notice: Difference Between Eyes (Anisometropia)',
    anisometropiaMsg: 'There is a difference of {diff} D (1.00 D or more) between your right and left eyes. When one eye is noticeably stronger than the other, it can cause unequal strain, headaches, or depth perception difficulty.',

    // Next Step
    nextStepTitle: 'Next Step',
    nextStepAction: 'Please visit a licensed eye doctor (optometrist or ophthalmologist) for a comprehensive clinical refraction, dilated exam, and official eyeglass prescription.',

    // Term Explanations (Tap-to-explain)
    glossaryTitle: 'Tap-to-Explain Optical Terms',
    glossaryIntro: 'Tap any term badge below to read what it measures in everyday language:',
    term_sph_title: 'SPH — Sphere',
    term_sph_desc: 'Measures the main focusing power in diopters (D). A negative number (-) means nearsightedness (trouble seeing far). A positive number (+) means farsightedness (trouble seeing near).',
    term_cyl_title: 'CYL — Cylinder',
    term_cyl_desc: 'Measures astigmatism. It means your eye is shaped slightly like an oval or rugby ball rather than a round basketball, bending light unevenly.',
    term_ax_title: 'AX — Axis',
    term_ax_desc: 'The direction or angle (from 1° to 180°) where the astigmatism curve is located. Think of it like orienting a pair of sunglasses.',
    term_pps_title: 'PPS / PS — Pupil Size',
    term_pps_desc: 'The diameter of your pupil opening in millimeters (mm) under the lighting inside the machine. Normal resting pupil size is usually 2.5 to 6.0 mm.',
    term_pd_title: 'PD — Pupillary Distance',
    term_pd_desc: 'The distance between the centers of your two pupils in millimeters (typically 55 to 70 mm). Opticians use this so the lenses line up exactly with your eyes.',
    term_se_title: 'SE — Spherical Equivalent',
    term_se_desc: 'The combined overall optical power of your eye, calculated as Sphere + (Cylinder / 2). It provides a single benchmark for screening severity.',

    // Disclaimer Full
    disclaimerFullTitle: 'Important Clinical Disclaimer',
    disclaimerFullText: 'This web application is an educational screening and interpretation tool designed to help community participants understand numbers printed by an automated autorefractometer. It is NOT an official diagnosis, medical opinion, or spectacle prescription. Eye health involves corneal curvature, intraocular pressure, retinal wellness, and subjective visual comfort. Never purchase eyeglasses solely based on automated screening numbers without an examination by a certified optometrist or ophthalmologist.',

    // Actions on results
    saveRecordBtn: 'Save Record to Database',
    editAgainBtn: 'Edit Numbers',
    newScanBtn: 'New Screening',
    printBtn: 'Print / Save PDF Slip',

    // Data / Excel Page
    exportTitle: 'Participant Data & Excel Export',
    exportDesc: 'Easily collect, download, or synchronize participant records for your research study or clinic log.',
    totalRecords: 'Total Screenings Saved:',
    downloadExcelBtn: 'Download Excel (.xlsx)',
    downloadCsvBtn: 'Download CSV File',
    copyTsvBtn: 'Copy for Excel / Sheets (Clipboard)',
    copiedToast: 'Copied to clipboard! Open Excel or Google Sheets and press Ctrl+V.',
    clearAllBtn: 'Clear All Records',
    clearConfirm: 'Are you sure you want to permanently delete all stored participant records? This cannot be undone.',

    // Webhook / Google Sheets integration
    webhookSectionTitle: 'Direct Google Sheets / Database Sync (Optional)',
    webhookDesc: 'Automatically send every saved screening directly to your live Google Sheet or database webhook.',
    webhookUrlLabel: 'Google Sheets Webhook URL',
    webhookPlaceholder: 'https://script.google.com/macros/s/.../exec',
    webhookSaveBtn: 'Save Webhook URL',
    webhookTestBtn: 'Test Connection',
    webhookSavedMsg: 'Webhook URL saved successfully.',
    webhookGuideBtn: 'How to setup free Google Sheet in 1 min',

    // Records Table
    recordsTableTitle: 'Saved Participant Records',
    colCode: 'Code',
    colDate: 'Date',
    colSite: 'Site',
    colOdSE: 'OD SE',
    colOsSE: 'OS SE',
    colDiff: 'Diff',
    colReferral: 'Referral?',
    colActions: 'Actions',
    btnView: 'View',
    btnDelete: 'Delete',
    noRecordsMsg: 'No participant screenings saved yet. Complete a screening to see it here.'
  },

  fil: { // Bisaya (Cebuano)
    // General & Header
    appTitle: 'Tigbasa sa Resulta sa Mata',
    appSubtitle: 'Tigpatin-aw sa Papel sa Autorefractometer',
    privacyBadge: '100% Pribado sa Imong Device — Ang litrato dili gayod i-upload o tipigan sa internet',
    langToggle: 'English',
    disclaimerBanner: 'Paghubad lamang sa pagsusi. Dili kini medikal nga diagnosis o reseta sa doktor.',

    // Navigation / Tabs
    navScan: 'Scan / Isulod',
    navConfirm: 'Kumpirmaha ang Numero',
    navResults: 'Mga Resulta',
    navRecords: 'Naka-save nga Rekord',
    navExport: 'Excel ug Datos',

    // Screen 1: Upload / Input
    heroTitle: 'Basaha ang Resulta sa Imong Autorefractor',
    heroDesc: 'I-upload o piktyuri ang papel nga gipatik sa makina. Basahon kini dayon sa imong browser. O mahimo sab nimong i-type ang mga numero sa kamot.',
    uploadZoneTitle: 'Piktyuri o Pilia ang Papel',
    uploadZonePrompt: 'I-drag ug i-drop ang litrato dinhi, o i-klik aron mokuha gamit ang camera / gallery',
    uploadCameraBtn: 'Kuha og Litrato gamit ang Camera',
    uploadFileBtn: 'Pili og Litrato gikan sa Gallery',
    manualEntryBtn: 'Isulod ang Numero sa Kamot (Manual)',
    loadSampleBtn: 'Sulayi ang Ehemplo nga Papel',
    cancelOcrBtn: 'Laktawi & Isulod sa Kamot →',
    cameraModalTitle: 'Scanner sa Resibo gamit ang Camera',
    cameraGuide: 'I-sentro ang papel sa sulod sa kahon ug pislita ang capture',
    cameraStarting: 'Gisugdan ang camera…',
    cameraDenied: 'Gikinahanglan ang pagtugot sa camera.',
    cameraRetryBtn: 'Sulayi Pag-usab ang Camera',
    cameraFallbackFileBtn: 'Pili og Litrato gikan sa Gallery',
    cameraGalleryBtn: 'Galeriya',
    cameraManualBtn: 'Manomano',
    switchCameraBtn: 'Balhina ang Camera',
    capturePhotoBtn: 'Piktyuri ang Papel',
    autoDetectBtn: '⚡ Awtomatikong Basahon gikan sa Litrato',
    autoDetectScanning: 'Ginasusi ang numero…',
    autoDetectSuccess: '✓ Nakit-an ang mga numero sa litrato! Palihog susiha.',
    autoDetectFailed: 'Wala klaro ang pagbasa. Palihog isulod ang mga numero gikan sa litrato sa wala.',
    photoHint: 'Tan-awa ang litrato sa papel sa wala ug isulod o kumpirmaha ang mga numero sa ubos, o pindota ang Awtomatiko.',
    ocrNotice: 'Pahimangno: Siguruha nga tarong, patag, ug hayag ang litrato sa papel. Likayi ang hiwi o dulom nga kuha.',
    ocrProcessing: 'Ginasusi ang papel sulod sa imong cellphone/computer…',
    ocrStatus: 'Gisusi ang mga linya ug numero sa grado…',

    // Screen 2: Confirm
    confirmTitle: 'Kumpirmaha ang mga Numero',
    confirmDesc: 'Itandi ang mga numero sa litrato sa imong papel sa wala. Pindota ang bisan unsang kahon aron tarungon kung dunay nasayop.',
    receiptPreviewTitle: 'Litrato sa Papel',
    receiptPreviewEmpty: 'Walay litrato nga gi-upload (Manual nga pagsulod)',
    rotateLeft: 'I-tuyok sa Wala',
    rotateRight: 'I-tuyok sa Tuo',
    zoomIn: 'Padak-a',
    zoomOut: 'Pagamya',
    resetView: 'Ibalik sa Sukod',

    // Fields
    participantInfoTitle: 'Impormasyon sa Partisipante',
    participantCodeLabel: 'Koda sa Partisipante (Code)',
    participantCodeHelp: 'Sekreto nga koda (pananglitan EE-261105-001)',
    siteLocationLabel: 'Lugar / Lokasyon (Dili pinugos)',
    siteLocationPlaceholder: 'pananglitan RHU Sumilao, USTP Gym',
    dateLabel: 'Petsa ug Oras',

    rightEyeTitle: 'Tuong Mata (OD / Oculi Dextra)',
    leftEyeTitle: 'Walang Mata (OS / Oculi Sinistra)',
    sharedTitle: 'Dugang nga Sukod sa Duha ka Mata',

    fieldSph: 'SPH (Sphere)',
    fieldSphHelp: 'Grado sa pagkalubog: Plus (+) o Minus (-) (e.g. -2.25)',
    fieldCyl: 'CYL (Cylinder)',
    fieldCylHelp: 'Grado sa astigmatismo (e.g. -0.50)',
    fieldAx: 'AX (Axis)',
    fieldAxHelp: 'Anggulo gikan 1° hangtod 180°',
    fieldPps: 'PPS / PS (Gidak-on sa Pupil)',
    fieldPpsHelp: 'Diametro sa pupil sa mm (e.g. 4.5)',
    fieldPd: 'PD (Distansya sa Pupil)',
    fieldPdHelp: 'Distansya sa duha ka sentro sa mata sa mm (e.g. 63.0)',

    liveSeOd: 'OD Spherical Equiv: ',
    liveSeOs: 'OS Spherical Equiv: ',
    calculateBtn: 'Tan-awa ang Resulta ug Pagpatin-aw',
    backToUploadBtn: 'Pag-upload og Bag-ong Litrato',

    // Screen 3: Results
    resultsTitle: 'Paghubad sa Resulta sa Pagsusi',
    resultsSubtitle: 'Katingbanan sa nakita sa grado sa duha ka mata',
    odCardTitle: 'Tuong Mata (OD)',
    osCardTitle: 'Walang Mata (OS)',
    seLabel: 'Kinatibuk-ang Grado (Spherical Equivalent / SE):',
    seFormulaNote: 'Kalkulasyon: SE = SPH + (CYL / 2)',
    summaryMetrics: 'Mga Sukod sa Mata',

    // Scale
    scaleLabel: 'Kasukdanan sa Grado sa Mata',
    scaleNearsighted: 'Lubog sa Layo (Myopia)',
    scaleClear: 'Klaro / Normal',
    scaleFarsighted: 'Lubog sa Duol (Hyperopia)',

    // Condition Headlines
    cond_emmetropia: 'Klaro / Normal nga Panan-aw',
    cond_myopia_mild: 'Gamay nga Pagkalubog sa Layo (Mild Myopia)',
    cond_myopia_moderate: 'Kasarangan nga Pagkalubog sa Layo (Moderate Myopia)',
    cond_myopia_strong: 'Kusog nga Pagkalubog sa Layo (Strong Myopia)',
    cond_hyperopia_mild: 'Gamay nga Pagkalubog sa Duol (Mild Hyperopia)',
    cond_hyperopia_strong: 'Kasarangan o Kusog nga Pagkalubog sa Duol',
    cond_unknown: 'Gahulat sa Pagsukod',

    // Condition Explanations
    explain_emmetropia: 'Sakto ang pag-focus sa kahayag sa imong mata. Klaro ang mga butang sa layo ug duol nga walay pagpaningkamot ang mata.',
    explain_myopia_mild: 'Klaro nimong makita ang mga butang sa duol, apan ang mga butang sa layo (sama sa karatula sa karsada o pisara) medyo lubog na o dili kaayo hait.',
    explain_myopia_moderate: 'Mamatikdan gyud nga lubog ang mga butang sa layo kon walay antipara. Ang pagmaneho, pagtan-aw og TV, o pagdula mas komportable kon dunay saktong antipara.',
    explain_myopia_strong: 'Klaro lamang ang mga butang kon ipaduol pag-ayo sa imong nawong. Ang kusog nga pagkalubog sa layo nagkinahanglan gayod og antipara ug regular nga pagsusi sa doktor sa mata.',
    explain_hyperopia_mild: 'Kasagaran klaro ang layo, apan kon magbasa o magtrabaho sa duol sa taas nga panahon, mahimong bation nimo nga kapoy o sakit ang mata.',
    explain_hyperopia_strong: 'Lubog ang mga butang sa duol, ug ang pag-focus nagkinahanglan og dakong paningkamot sa kaunuran sa mata, nga mahimong magdala og labad sa ulo.',
    explain_astigmatism: 'Aduna usab nakitang astigmatismo (dili parehas ang kurbada sa cornea), nga mahimong maghatag og anino o doble gamay sa mga letra.',

    // Anisometropia Note
    anisometropiaTitle: 'Pahibalo: Kalainan sa Duha ka Mata (Anisometropia)',
    anisometropiaMsg: 'Adunay kalainan nga {diff} D (1.00 D o labaw pa) sa taliwala sa imong tuong mata ug walang mata. Kung mas kusog og grado ang usa ka mata kay sa usa, mahimo kining magpahinabog pagsakit sa ulo o labaw nga kakapoy sa usa ka mata.',

    // Next Step
    nextStepTitle: 'Sunod nga Lakang',
    nextStepAction: 'Palihug pakigkita sa usa ka lisensyadong doktor sa mata (optometrist o ophthalmologist) alang sa hingpit nga pagsusi sa panan-aw ug opisyal nga reseta sa antipara.',

    // Term Explanations (Tap-to-explain)
    glossaryTitle: 'Pindota aron Masabtan ang mga Termino',
    glossaryIntro: 'Pindota ang bisan unsang badge sa ubos aron mabasa ang kahulogan niini sa simpleng pinulongan:',
    term_sph_title: 'SPH — Sphere',
    term_sph_desc: 'Nagsukod sa pangunang grado sa mata gamit ang diopters (D). Ang negative (-) nagpasabot nga lubog sa layo (nearsighted). Ang positive (+) nagpasabot nga lubog sa duol (farsighted).',
    term_cyl_title: 'CYL — Cylinder',
    term_cyl_desc: 'Nagsukod sa astigmatismo. Buot ipasabot dili lingin sama sa bola sa basketball ang nawong sa mata, kondili pormag itlog o bola sa rugby, maong magkatag ang kahayag.',
    term_ax_title: 'AX — Axis',
    term_ax_desc: 'Ang anggulo (gikan 1° hangtod 180°) kung asa nahimutang ang kurba sa astigmatismo. Sama kini sa pag-orient sa lente sa antipara.',
    term_pps_title: 'PPS / PS — Gidak-on sa Pupil',
    term_pps_desc: 'Ang gilapdon sa lingin nga pupil sa imong mata sa milimetro (mm). Ang normal nga pupil kasagaran anaa sa 2.5 hangtod 6.0 mm.',
    term_pd_title: 'PD — Distansya sa Pupil',
    term_pd_desc: 'Ang distansya taliwala sa sentro sa imong duha ka pupil sa milimetro (kasagaran 55 hangtod 70 mm). Gigamit kini aron motakdo gyod ang sentro sa lente sa imong mata.',
    term_se_title: 'SE — Spherical Equivalent',
    term_se_desc: 'Ang kinatibuk-ang grado sa mata, nga kalkulado gikan sa Sphere + (Cylinder / 2). Mao kini ang giya nga gigamit sa pagsusi sa kalubogon.',

    // Disclaimer Full
    disclaimerFullTitle: 'Mahinungdanong Pahinumdom Medikal',
    disclaimerFullText: 'Kini nga web application usa lamang ka gamit sa pagpatin-aw ug edukasyon sa mga numero nga gipatik sa automated autorefractometer. DILI kini opisyal nga medikal nga diagnosis o reseta sa antipara. Ang kahimsog sa mata naglakip sa kurba sa cornea, presyon sa sulod sa mata, kahimtang sa retina, ug kasinatian sa panan-aw. Ayaw gayod pagpalit og antipara base lamang niining numero sa makina nga walay eksaminasyon sa sertipikadong optometrist o ophthalmologist.',

    // Actions on results
    saveRecordBtn: 'I-save ang Rekord sa Database',
    editAgainBtn: 'Usba ang mga Numero',
    newScanBtn: 'Bag-ong Pagsusi',
    printBtn: 'I-print / I-save isip PDF',

    // Data / Excel Page
    exportTitle: 'Datos sa Partisipante ug Pag-export sa Excel',
    exportDesc: 'Sayon nga pagtigom, pag-download, o pag-sync sa mga rekord sa partisipante alang sa inyong panukiduki o klinika.',
    totalRecords: 'Tanan nga Naka-save nga Pagsusi:',
    downloadExcelBtn: 'I-download ang Excel (.xlsx)',
    downloadCsvBtn: 'I-download ang CSV File',
    copyTsvBtn: 'Kopyaha para sa Excel / Sheets (Clipboard)',
    copiedToast: 'Nakopya na sa clipboard! Ablihi ang Excel o Google Sheets ug pindota ang Ctrl+V.',
    clearAllBtn: 'Papasa ang Tanan nga Rekord',
    clearConfirm: 'Sigurado ka ba nga gusto nimong papason ang tanan nga rekord? Dili na kini mabalik.',

    // Webhook / Google Sheets integration
    webhookSectionTitle: 'Direktang Pag-sync sa Google Sheets / Database (Opsyonal)',
    webhookDesc: 'Awtomatikong ipadala ang matag na-save nga pagsusi ngadto sa inyong buhi nga Google Sheet o database webhook.',
    webhookUrlLabel: 'URL sa Google Sheets Webhook',
    webhookPlaceholder: 'https://script.google.com/macros/s/.../exec',
    webhookSaveBtn: 'I-save ang Webhook URL',
    webhookTestBtn: 'Sulayi ang Koneksyon',
    webhookSavedMsg: 'Malampusong na-save ang Webhook URL.',
    webhookGuideBtn: 'Unsaon pag-setup sa libreng Google Sheet sulod sa 1 minuto',

    // Records Table
    recordsTableTitle: 'Nakatala nga mga Partisipante',
    colCode: 'Koda',
    colDate: 'Petsa',
    colSite: 'Lugar',
    colOdSE: 'OD SE',
    colOsSE: 'OS SE',
    colDiff: 'Kalainan',
    colReferral: 'Referral?',
    colActions: 'Aksyon',
    btnView: 'Tan-awa',
    btnDelete: 'Papasa',
    noRecordsMsg: 'Wala pa’y rekord sa partisipante. Human og usa ka pagsusi aron makita kini dinhi.'
  }
};
