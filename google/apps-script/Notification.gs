// Add this file beside preserved legacy source. Rename the existing legacy
// doPost to legacyWebsitePost_ before adding this router. Keep existing doGet.
function doPost(event) {
  var raw;
  try { raw = JSON.parse(event && event.postData ? event.postData.contents : ""); }
  catch (_) { return cplJson_({ ok: false, errorCode: "INVALID_REQUEST" }); }
  if (raw && typeof raw.signature === "string" && typeof raw.payload === "string") return cplNotificationPost_(raw);
  if (raw && (raw.secret || raw.action) && typeof legacyWebsitePost_ === "function") return legacyWebsitePost_(event);
  return cplJson_({ ok: false, errorCode: "INVALID_REQUEST" });
}

// Request only send-mail authorization, without sending any message.
function cplAuthorizeNotification() { return MailApp.getRemainingDailyQuota(); }

function cplNotificationPost_(envelope) {
  var props = PropertiesService.getScriptProperties();
  if (!cplVerify_(envelope, props.getProperty("HMAC_SECRET"))) return cplJson_({ ok: false, errorCode: "AUTH_FAILED" });
  var inquiry;
  try { inquiry = JSON.parse(envelope.payload); }
  catch (_) { return cplJson_({ ok: false, errorCode: "INVALID_PAYLOAD" }); }
  if (!cplValidInquiry_(inquiry,envelope.submissionId)) return cplJson_({ ok: false, errorCode: "INVALID_PAYLOAD" });
  var result = cplResult_(inquiry);
  if ((props.getProperty("OWNER_EMAIL") || "").trim().toLowerCase() !== result.recipient) {
    result.notification="unconfigured"; result.errorCode="RECIPIENT_UNCONFIGURED";
    return cplResponse_(envelope,result,props);
  }
  if (!cplEligible_(inquiry,props)) {
    result.notification="held"; result.errorCode="BACKLOG_HELD";
    return cplResponse_(envelope,result,props);
  }
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    result.notification="not_started"; result.notificationRetryable=true; result.errorCode="LEDGER_BUSY";
    return cplResponse_(envelope,result,props);
  }
  try { cplDeliverLocked_(inquiry,props,result); }
  catch (_) { result.notification="ambiguous"; result.notificationRetryable=false; result.errorCode="LEDGER_OUTCOME_UNKNOWN"; }
  finally { lock.releaseLock(); }
  return cplResponse_(envelope,result,props);
}

function cplDeliverLocked_(inquiry,props,result) {
  var key="CPL_NOTIFICATION_" + inquiry.submissionId;
  var stored=props.getProperty(key);
  var ledger;
  try {
    ledger=stored===null ? null : JSON.parse(stored);
    if (stored!==null && (!ledger || typeof ledger!=="object" || Array.isArray(ledger))) throw new Error("LEDGER_INVALID");
  }
  catch (_) { result.notification="ambiguous"; result.errorCode="LEDGER_INVALID"; return; }
  if (ledger && (ledger.version!==2 || ["pending","sending","sent","ambiguous"].indexOf(ledger.notification)===-1
      || typeof ledger.contentHash!=="string" || !/^[0-9a-f]{64}$/.test(ledger.contentHash)
      || !cplIso_(ledger.createdAt) || ledger.createdAt!==inquiry.createdAt
      || (ledger.notification==="sent" && !cplIso_(ledger.sentAt)))) {
    result.notification="ambiguous"; result.errorCode="LEDGER_INVALID"; return;
  }
  var contentHash=cplSha_(JSON.stringify(cplContent_(inquiry)));
  if (ledger && (ledger.contentHash!==contentHash || ledger.reference!==inquiry.reference)) {
    result.notification="failed"; result.errorCode="PAYLOAD_IDENTITY_CONFLICT"; return;
  }
  if (!ledger) {
    ledger={ version:2,contentHash:contentHash,reference:inquiry.reference,createdAt:inquiry.createdAt,notification:"pending",archive:"disabled" };
    try { cplSaveLedger_(props,key,ledger); }
    catch (_) { result.notification="failed"; result.notificationRetryable=true; result.errorCode="LEDGER_UNAVAILABLE"; return; }
  }
  if (ledger.notification==="sent") { result.notification="sent"; result.sentAt=ledger.sentAt; }
  else if (ledger.notification==="sending" || ledger.notification==="ambiguous") {
    result.notification="ambiguous"; result.errorCode="SEND_OUTCOME_AMBIGUOUS";
  } else if (!inquiry.delivery.notify) {
    result.notification="not_started"; result.notificationRetryable=true; result.errorCode="SEND_NOT_STARTED";
  } else {
    var quota;
    try { quota=MailApp.getRemainingDailyQuota(); } catch (_) { quota=0; }
    if (quota<1) {
      result.notification="failed"; result.notificationRetryable=true; result.errorCode="MAIL_QUOTA_UNAVAILABLE";
    } else {
      // Persist "sending" before MailApp. Mail and PropertiesService cannot share
      // a transaction; unknown outcomes require reconciliation, never a resend.
      ledger.notification="sending"; ledger.startedAt=new Date().toISOString();
      if (inquiry.createdAt<cplCutoff_(props)) ledger.recoveryUsedAt=ledger.startedAt;
      try { cplSaveLedger_(props,key,ledger); }
      catch (_) { result.notification="failed"; result.notificationRetryable=true; result.errorCode="LEDGER_UNAVAILABLE"; return; }
      try { MailApp.sendEmail(cplMail_(inquiry)); }
      catch (_) {
        ledger.notification="ambiguous"; ledger.errorCode="MAIL_SEND_OUTCOME_UNKNOWN";
        try { cplSaveLedger_(props,key,ledger); } catch (_) { /* durable "sending" remains */ }
        result.notification="ambiguous"; result.errorCode="MAIL_SEND_OUTCOME_UNKNOWN"; return;
      }
      ledger.notification="sent"; ledger.sentAt=new Date().toISOString();
      try { cplSaveLedger_(props,key,ledger); }
      catch (_) { result.notification="ambiguous"; result.errorCode="SENT_LEDGER_WRITE_FAILED"; return; }
      result.notification="sent"; result.sentAt=ledger.sentAt;
    }
  }
  // Optional archive follows notification and never blocks the email path.
  if (!inquiry.delivery.archive || props.getProperty("ARCHIVE_ENABLED")!=="true") result.archive="disabled";
  else if (ledger.archive==="synced") result.archive="synced";
  else {
    try { cplArchive_(inquiry,props); ledger.archive="synced"; cplSaveLedger_(props,key,ledger); result.archive="synced"; }
    catch (_) { result.archive="failed"; result.archiveRetryable=true; result.errorCode="ARCHIVE_FAILED"; }
  }
}

function cplContent_(p) {
  return { submissionId:p.submissionId,reference:p.reference,createdAt:p.createdAt,payloadHash:p.payloadHash,
    name:p.name,email:p.email,company:p.company,phone:p.phone,serviceCategory:p.serviceCategory,teamSize:p.teamSize,
    currentTools:p.currentTools,interest:p.interest,workflowProblem:p.workflowProblem,scenarioInterest:p.scenarioInterest,
    marketingConsent:p.marketingConsent,sourcePath:p.sourcePath };
}
function cplValidInquiry_(p,id) {
  if (!p || typeof p!=="object" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)
      || p.submissionId!==id || !/^CPL-[0-9A-F]{8}$/.test(p.reference) || !cplIso_(p.createdAt)
      || !/^[0-9a-f]{64}$/.test(p.payloadHash) || typeof p.marketingConsent!=="boolean"
      || !p.delivery || typeof p.delivery.notify!=="boolean" || typeof p.delivery.archive!=="boolean") return false;
  var limits={ name:120,email:254,company:160,phone:40,serviceCategory:40,teamSize:20,currentTools:300,interest:40,
    workflowProblem:2000,scenarioInterest:40,sourcePath:200 };
  for(var field in limits) {
    var value=p[field];
    if (value===null && field!=="name" && field!=="email" && field!=="workflowProblem") continue;
    if (typeof value!=="string" || value.length>limits[field] || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) return false;
  }
  if (!p.name || !p.workflowProblem || !/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(p.email)
      || /[\r\n]/.test(p.name+(p.company||"")+(p.phone||""))) return false;
  var canonical={ name:p.name,email:p.email,company:p.company,phone:p.phone,serviceCategory:p.serviceCategory,teamSize:p.teamSize,
    currentTools:p.currentTools,interest:p.interest,workflowProblem:p.workflowProblem,scenarioInterest:p.scenarioInterest,
    marketingConsent:p.marketingConsent,sourcePath:p.sourcePath };
  return cplSha_(JSON.stringify(canonical))===p.payloadHash;
}
function cplCutoff_(props) {
  var cutoff=props.getProperty("NOTIFICATION_ENABLED_AFTER");
  return cplIso_(cutoff) ? new Date(cutoff).toISOString() : null;
}
function cplEligible_(p,props) {
  if (p.reference==="CPL-2AA16BBF") return false;
  var cutoff=cplCutoff_(props);
  if (!cutoff) return false;
  if (p.createdAt>=cutoff) return true;
  var allow=(props.getProperty("NOTIFICATION_RECOVERY_REFERENCES")||"").split(",").map(function(value) { return value.trim().toUpperCase(); });
  return p.reference==="CPL-347301C3" && allow.indexOf(p.reference)!==-1;
}
function cplMail_(p) {
  var submitted=Utilities.formatDate(new Date(p.createdAt),"America/New_York","yyyy-MM-dd HH:mm:ss z");
  var interests={ voice:"CPL AI Voice Agents",chat:"CPL AI Chat Agents",both:"Voice + Chat","not-sure":"Not sure yet" };
  var pairs=[
    ["Reference",p.reference],["Submitted",submitted+" (America/New_York)"],["Name",p.name],["Email",p.email],
    ["Business / company",p.company],["Phone",p.phone],["Business website / existing tools",p.currentTools],
    ["Interest",interests[p.interest]||p.interest],["What they would like help handling",p.workflowProblem],
    ["Service category",p.serviceCategory],["Team size",p.teamSize],["Scenario interest",p.scenarioInterest],
    ["Marketing consent",p.marketingConsent?"Yes":"No"],["Source page",p.sourcePath],["Submitted timestamp (UTC)",p.createdAt]
  ];
  var body="New CPL Demo Request\n\n"+pairs.map(function(pair) { return pair[0]+": "+(pair[1]||"Not provided"); }).join("\n\n")
    +"\n\nThis is a demo request, not a confirmed appointment.";
  var html="<h2>New CPL Demo Request</h2><table>"+pairs.map(function(pair) {
    return "<tr><th align=\"left\" valign=\"top\" style=\"padding:8px\">"+cplEscape_(pair[0])
      +"</th><td style=\"padding:8px;white-space:pre-wrap\">"+cplEscape_(pair[1]||"Not provided")+"</td></tr>";
  }).join("")+"</table><p>This is a demo request, not a confirmed appointment.</p>";
  return { to:"astarrett@cyberpiratelabs.com",replyTo:p.email,name:"Cyber Pirate Labs",
    subject:"New CPL Demo Request — "+(p.company||"Company not provided")+" — "+p.reference,body:body,htmlBody:html };
}
function cplArchive_(p,props) {
  var sheetId=props.getProperty("SHEET_ID"),folderId=props.getProperty("FOLDER_ID");
  if (!sheetId && !folderId) throw new Error("ARCHIVE_UNCONFIGURED");
  if (sheetId) {
    var sheet=SpreadsheetApp.openById(sheetId).getSheets()[0],headers=Object.keys(cplContent_(p));
    if(sheet.getLastRow()===0) sheet.appendRow(headers);
    var values=cplContent_(p);
    var row=headers.map(function(key) { var value=values[key]; return typeof value==="string" && /^[=+\-@\t\r]/.test(value) ? "'"+value : value; });
    var found=sheet.getLastRow()>1 ? sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(p.submissionId).matchEntireCell(true).findNext() : null;
    if(found) sheet.getRange(found.getRow(),1,1,row.length).setValues([row]); else sheet.appendRow(row);
  }
  if(folderId) {
    var folder=DriveApp.getFolderById(folderId),fileName=p.submissionId+".json",files=folder.getFilesByName(fileName);
    var content=JSON.stringify(cplContent_(p),null,2);
    if(files.hasNext()) files.next().setContent(content); else folder.createFile(fileName,content,MimeType.PLAIN_TEXT);
  }
}
function cplResult_(p) {
  return { version:2,submissionId:p.submissionId,reference:p.reference,payloadHash:p.payloadHash,recipient:"astarrett@cyberpiratelabs.com",
    archive:"disabled",notification:"failed",archiveRetryable:false,notificationRetryable:false,errorCode:"" };
}
function cplResponse_(request,result,props) {
  var payload=JSON.stringify(result);
  return cplJson_({ version:2,timestamp:request.timestamp,submissionId:request.submissionId,payload:payload,
    signature:cplSign_(props.getProperty("HMAC_SECRET"),"response:"+request.timestamp,request.submissionId,payload) });
}
function cplVerify_(e,secret) {
  if(!secret || secret.length<16 || typeof e.timestamp!=="string" || !/^\d{10,16}$/.test(e.timestamp)
      || typeof e.submissionId!=="string" || typeof e.payload!=="string" || e.payload.length>12000
      || typeof e.signature!=="string" || !/^[0-9a-f]{64}$/.test(e.signature)
      || Math.abs(Date.now()-Number(e.timestamp))>300000) return false;
  return cplEqual_(cplSign_(secret,e.timestamp,e.submissionId,e.payload),e.signature);
}
function cplSign_(secret,timestamp,id,payload) { return cplHex_(Utilities.computeHmacSha256Signature(timestamp+"."+id+"."+cplSha_(payload),secret,Utilities.Charset.UTF_8)); }
function cplSha_(value) { return cplHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8)); }
function cplHex_(bytes) { return bytes.map(function(value) { return ((value+256)%256).toString(16).padStart(2,"0"); }).join(""); }
function cplEqual_(a,b) { var diff=a.length^b.length; for(var i=0;i<Math.max(a.length,b.length);i++) diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0); return diff===0; }
function cplIso_(value) { return typeof value==="string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) && isFinite(Date.parse(value)); }
function cplSaveLedger_(props,key,ledger) { props.setProperty(key,JSON.stringify(ledger)); }
function cplEscape_(value) { return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function cplJson_(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }