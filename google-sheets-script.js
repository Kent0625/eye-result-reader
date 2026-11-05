/**
 * ============================================================================
 * E-EYE / EYE RESULT READER — 1-MINUTE GOOGLE SHEETS SYNC SCRIPT
 * ============================================================================
 * 
 * Instructions to connect your Google Sheet in 60 seconds:
 * 
 * 1. Open Google Sheets (create a new blank spreadsheet).
 * 2. Click "Extensions" -> "Apps Script".
 * 3. Delete any default code in Code.gs, paste this entire file, and click "Save" (disk icon).
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Click the gear icon (Select type) -> Choose "Web app".
 * 6. Set Description: "Eye Result Reader Sync"
 *    Execute as: "Me"
 *    Who has access: "Anyone" (crucial so the browser can send the screening rows).
 * 7. Click "Deploy", approve access/permissions.
 * 8. Copy the Web app URL (ends with /exec).
 * 9. In Eye Result Reader, go to "Excel & Data" -> paste into "Google Sheets Webhook URL" -> click Save!
 * 
 * Every time you click "Save Record to Database" on the results screen, a new row
 * will automatically append to your Google Sheet in real time!
 */

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(15000); // Wait up to 15s to prevent concurrent write collisions

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Record ID",
        "Timestamp",
        "Date / Time",
        "Participant Code",
        "Site / Location",
        "OD SPH",
        "OD CYL",
        "OD AX",
        "OD PPS",
        "OD SE",
        "OD Classification",
        "OS SPH",
        "OS CYL",
        "OS AX",
        "OS PPS",
        "OS SE",
        "OS Classification",
        "PD",
        "Diff SE",
        "Anisometropia",
        "Referral",
        "Notes"
      ]);
      // Format header row
      sheet.getRange(1, 1, 1, 22).setFontWeight("bold").setBackground("#EEF2F6");
      sheet.setFrozenRows(1);
    }

    var contents = e.postData ? e.postData.contents : "";
    var data = contents ? JSON.parse(contents) : {};

    // Ignore test pings from writing a full row
    if (data.event === "test_connection") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Connection test OK" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Append participant data row
    sheet.appendRow([
      data.id || "",
      data.timestamp || new Date().toISOString(),
      data.date || new Date().toLocaleString(),
      data.participant_code || "",
      data.site || "",
      data.od_sph !== undefined && data.od_sph !== null ? data.od_sph : "",
      data.od_cyl !== undefined && data.od_cyl !== null ? data.od_cyl : "",
      data.od_ax !== undefined && data.od_ax !== null ? data.od_ax : "",
      data.od_pps !== undefined && data.od_pps !== null ? data.od_pps : "",
      data.od_se !== undefined && data.od_se !== null ? data.od_se : "",
      data.od_condition || "",
      data.os_sph !== undefined && data.os_sph !== null ? data.os_sph : "",
      data.os_cyl !== undefined && data.os_cyl !== null ? data.os_cyl : "",
      data.os_ax !== undefined && data.os_ax !== null ? data.os_ax : "",
      data.os_pps !== undefined && data.os_pps !== null ? data.os_pps : "",
      data.os_se !== undefined && data.os_se !== null ? data.os_se : "",
      data.os_condition || "",
      data.pd !== undefined && data.pd !== null ? data.pd : "",
      data.diff_se !== undefined && data.diff_se !== null ? data.diff_se : "",
      data.anisometropia || "NO",
      data.referral_recommended || "NO",
      data.notes || ""
    ]);

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Eye Result Reader Webhook is active and waiting for POST data.");
}
