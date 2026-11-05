# Eye Result Reader

An in-browser, privacy-preserving web application for reading, interpreting, and recording autorefractometer receipt printouts.

Designed for community vision screenings, research field trials, and participants, with bilingual **English / Bisaya (Cebuano)** explanations, visual diopter scales with pin markers, an editable confirmation screen, and **instant Excel / Google Sheets data collection**.

---

## Key Features

1. **100% Client-Side Privacy (Zero Photo Uploads)**
   - The user snaps or uploads a printout photo.
   - Text recognition (OCR) and image preprocessing run entirely inside the browser using HTML5 Canvas and Tesseract.js.
   - **The photo is never uploaded or saved to any remote server or cloud.**

2. **Confirmation & Editing Screen**
   - Editable fields for both eyes:
     - **Right Eye (OD)**: SPH, CYL, AX, PPS
     - **Left Eye (OS)**: SPH, CYL, AX, PPS
     - **Shared**: PD (Pupillary Distance), Participant Code, Site location, Notes
   - Receipt photo preview sits right beside the inputs with 90° rotation and re-scan controls.
   - Manual entry also works from scratch without uploading a photo.

3. **Participant-Friendly Visual Result Cards**
   - **Color Bars**: Green (clear/normal), Amber (mild), Orange (moderate/strong).
   - **Continuous Visual Scale**: Physical pin marker indicating exact diopter position between *Nearsighted &larr; Clear &rarr; Farsighted*.
   - **Plain Explanations**: Friendly everyday language describing what the numbers mean for daily vision.
   - **Astigmatism Flag**: Explains cylinder power and axis orientation.

4. **Anisometropia Note & Next Step**
   - An alert appears if the two eyes differ by **1.00 D or more** ($|\Delta SE| \ge 1.00\text{ D}$), explaining unequal eye strain.
   - Clear **"Next step"** line directing users to see a licensed optometrist or ophthalmologist.

5. **Tap-to-Explain Terms (Interactive Glossary)**
   - Interactive chips for `SPH`, `CYL`, `AX`, `PPS`, `PD`, and `SE`.
   - Clicking any term explains it in plain terms (in English or Bisaya).

6. **English / Bisaya Toggle**
   - One-click language switch changes every screen, explanation, button, and disclaimer.

7. **Clinical Disclaimer**
   - Persistent disclaimer bar on every screen: *"Screening interpretation only. This is not a medical diagnosis or prescription."*
   - Comprehensive full clinical and legal disclaimer card at the end of the results.

8. **Direct Connection to Excel, CSV & Live Google Sheets / Database**
   - **One-click "Download Excel (.xlsx)"**: Produces a pre-formatted spreadsheet using SheetJS.
   - **One-click "Download CSV"**: Standard UTF-8 CSV file.
   - **"Copy for Sheets (Clipboard)"**: Copies clean tab-delimited table rows for instant `Ctrl + V` into open Excel or Google Sheets.
   - **Automatic Local Database**: IndexedDB automatically logs every screening with participant codes, timestamps, diopter values, SE, and referral status.
   - **Live Google Sheets Webhook Sync**: Optional Webhook URL input automatically sends every saved screening directly to your live Google Sheet in real time! Includes a ready-to-paste 1-minute Apps Script template (`google-sheets-script.js`).

---

## How to Connect to Excel or Google Sheets

### Option A: One-Click Excel Download (Offline)
1. Go to the **"Excel & Data"** tab (or **"Saved Records"** tab).
2. Click **"Download Excel (.xlsx)"**.
3. A formatted `.xlsx` workbook will download with clean columns: `Participant Code`, `OD SPH`, `OD CYL`, `OD AX`, `OD PPS`, `OD SE`, `OS SPH`, `OS CYL`, `OS AX`, `OS PPS`, `OS SE`, `PD`, `Diff SE`, `Anisometropia`, `Referral`, etc.

### Option B: Live Real-Time Google Sheet Sync
1. Open [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Click **Extensions &rarr; Apps Script**.
3. Replace the code in `Code.gs` with the entire contents of [`google-sheets-script.js`](./google-sheets-script.js).
4. Click **Deploy &rarr; New deployment**:
   - Type: **Web app**
   - Description: `Eye Result Reader Sync`
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Click **Deploy** and copy the Web App URL (ends with `/exec`).
6. In **Eye Result Reader**, open the **"Excel & Data"** tab, paste your URL into **Google Sheets Webhook URL**, and click **Save Webhook URL**.
7. Every time you save a screening, a new row will append to your Google Sheet automatically!

---

## Deploy to Vercel

### Method 1: Via GitHub Repo (Recommended)
1. Initialize a git repository and push this `eye-result-reader` folder to your GitHub:
   ```bash
   cd eye-result-reader
   git init
   git add .
   git commit -m "Initial commit of Eye Result Reader"
   git branch -M main
   # Add your remote and push:
   # git remote add origin https://github.com/<your-username>/eye-result-reader.git
   # git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com).
3. Click **Add New &rarr; Project**.
4. Import your `eye-result-reader` repository.
5. In the project configuration:
   - **Framework Preset**: Select **"Other"**.
   - **Build Command**: Leave **empty**.
   - **Output Directory**: Leave **empty** (or `./`).
6. Click **Deploy**. Your app is live in seconds with HTTPS!

### Method 2: Via Vercel CLI
Inside the `eye-result-reader` folder, simply run:
```bash
npx vercel
```
Follow the prompts to link and deploy.

---

## Local Development & Testing

To run the application locally on your computer:
```bash
cd eye-result-reader
npm start
```
Or with Python:
```bash
python -m http.server 3000
```
Open `http://localhost:3000` in any web browser.

---

## Before Sharing with Study Participants

1. **OCR Verification**:
   - Receipt thermal paper can vary in contrast and font.
   - For best OCR reading, instruct operators or participants to take **flat, upright, well-lit photos without shadows or tilt**.
   - Emphasize using the **Confirm screen** to double-check numbers against the photo preview before viewing results.
2. **Bisaya Review**:
   - The included Bisaya (Cebuano) translation is tailored for community comprehension. Have a native speaker or community liaison review dialect nuances for your specific region (e.g. Northern Mindanao vs. Central Visayas).
3. **Optometrist Review of Cutoffs**:
   - Cutoffs are based on Spherical Equivalent ($SE = SPH + \frac{CYL}{2}$):
     - **Clear / Normal Range**: $-0.50\text{ D}$ to $+0.50\text{ D}$
     - **Mild Nearsightedness**: $-0.50\text{ D} > SE \ge -3.00\text{ D}$
     - **Moderate Nearsightedness**: $-3.00\text{ D} > SE \ge -6.00\text{ D}$
     - **Strong Nearsightedness**: $SE < -6.00\text{ D}$
     - **Mild Farsightedness**: $+0.50\text{ D} < SE \le +2.00\text{ D}$
     - **Moderate / Strong Farsightedness**: $SE > +2.00\text{ D}$
     - **Anisometropia**: $|\Delta SE| \ge 1.00\text{ D}$
   - Confirm these bands with your supervising clinical team or collaborating optometrist.
