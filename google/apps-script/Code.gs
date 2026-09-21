/**
 * Private owner archive. Deploy as a web app executed by the owner.
 * Script properties: HMAC_SECRET, SHEET_ID, FOLDER_ID, OWNER_EMAIL.
 * The destination inbox comes from OWNER_EMAIL, not from the request body.
 * This file is not deployed by the website build.
 */
function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty("HMAC_SECRET");
  var body = e.postData && e.postData.contents ? e.postData.contents : "";
  var envelope;
  try { envelope = JSON.parse(body); } catch (err) { envelope = null; }
  if (!secret || !envelope || !verify_(secret, envelope)) {
    return json_({ archive: "failed", notification: "failed", error: "Signature rejected." });
  }
  var sentAt = Number(envelope.timestamp || "0");
  if (!sentAt || Math.abs(Date.now() - sentAt) > 5 * 60 * 1000) {
    return json_({ archive: "failed", notification: "failed", error: "Timestamp outside the allowed window." });
  }
  var payload = JSON.parse(envelope.payload);
  var archiveError = "";
  try {
    var sheet = SpreadsheetApp.openById(props.getProperty("SHEET_ID")).getSheets()[0];
    upsert_(sheet, payload);
    var folder = DriveApp.getFolderById(props.getProperty("FOLDER_ID"));
    folder.createFile(payload.submissionId + ".json", envelope.payload, MimeType.JSON);
  } catch (err) {
    archiveError = String(err).slice(0, 300);
  }
  var notified = false;
  var notifyError = "";
  var inbox = props.getProperty("OWNER_EMAIL");
  if (!inbox) notifyError = "OWNER_EMAIL is not set.";
  else {
    try {
      MailApp.sendEmail(inbox, "Command Center inquiry " + payload.reference, envelope.payload);
      notified = true;
    } catch (err2) {
      notifyError = String(err2).slice(0, 300);
    }
  }
  return json_({
    archive: archiveError ? "failed" : "synced",
    notification: notified ? "sent" : "failed",
    error: archiveError || notifyError
  });
}

function verify_(secret, envelope) {
  var payload = envelope.payload || "";
  var digest = bytesToHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, payload));
  var canonical = envelope.timestamp + "." + envelope.submissionId + "." + digest;
  var mac = bytesToHex_(Utilities.computeHmacSha256Signature(canonical, secret));
  return mac === envelope.signature;
}

function upsert_(sheet, payload) {
  var values = sheet.getDataRange().getValues();
  if (values.length === 0) {
    sheet.appendRow(["submissionId", "reference", "createdAt", "name", "email", "company", "phone", "serviceCategory", "teamSize", "currentTools", "interest", "workflowProblem", "scenarioInterest", "marketingConsent", "sourcePath"]);
  }
  var row = [payload.submissionId, payload.reference, payload.createdAt, payload.name, payload.email, payload.company, payload.phone, payload.serviceCategory, payload.teamSize, payload.currentTools, payload.interest, payload.workflowProblem, payload.scenarioInterest, payload.marketingConsent, payload.sourcePath];
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === payload.submissionId) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function bytesToHex_(bytes) {
  return bytes.map(function (b) {
    var v = (b + 256) % 256;
    return ("0" + v.toString(16)).slice(-2);
  }).join("");
}
