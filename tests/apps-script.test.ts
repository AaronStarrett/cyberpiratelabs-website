import { describe, expect, it } from "vitest";
import { parseBridgeResponse, postArchive } from "../shared/inquiry/google";
import { signEnvelope } from "../shared/inquiry/sign";
import { createScriptMock, decodedResult, mockedBridgeFetch, testEnvelope, testRecord, TEST_CUTOFF, TEST_HMAC } from "./apps-script.mock";

const env={GOOGLE_APPS_SCRIPT_URL:"https://script.google.com/macros/s/mocked/exec",GOOGLE_HMAC_SECRET:TEST_HMAC,NOTIFICATION_ENABLED_AFTER:TEST_CUTOFF};
describe("Apps Script bridge contract (mocked services; no real mail)",()=>{
  it("sends readable HTML and plain text with a fixed recipient, correct Reply-To, all optional details, and safe escaping",async()=>{
    const record=await testRecord();
    const runtime=createScriptMock();
    const report=await postArchive(env,record,mockedBridgeFetch(runtime),Date.now());
    expect(report.notification).toBe("sent");
    expect(report.archive).toBe("disabled");
    expect(runtime.mails).toHaveLength(1);
    const mail=runtime.mails[0];
    expect(mail.to).toBe("astarrett@cyberpiratelabs.com");
    expect(mail.replyTo).toBe(record.email);
    expect(mail.subject).toBe("New CPL Demo Request — Synthetic QA & Services — CPL-12345678");
    expect(mail.body).toContain("America/New_York");
    for(const value of [record.name,record.email,record.company,record.phone,record.currentTools,record.workflowProblem,record.sourcePath]) expect(mail.body).toContain(value);
    expect(mail.htmlBody).toContain("Synthetic QA &amp; Services");
    expect(mail.htmlBody).toContain("&lt;script&gt;");
    expect(mail.htmlBody).not.toContain("<script>");
  });
  it("returns the durable sent outcome on identical retries without another send",async()=>{
    const record=await testRecord(),runtime=createScriptMock();
    const first=runtime.invoke(await testEnvelope(record));
    const later=runtime.invoke(await testEnvelope(record,Date.now(),{notify:false,archive:false}));
    expect(decodedResult(first).notification).toBe("sent");
    expect(decodedResult(later).notification).toBe("sent");
    expect(runtime.mails).toHaveLength(1);
    expect(runtime.released).toBe(2);
  });
  it("rejects mutated payloads even when the shared signer re-signs them",async()=>{
    const record=await testRecord(),runtime=createScriptMock();
    runtime.invoke(await testEnvelope(record));
    const mutated=await testRecord({...record,company:"Another company"});
    const result=decodedResult(runtime.invoke(await testEnvelope(mutated)));
    expect(result.errorCode).toBe("PAYLOAD_IDENTITY_CONFLICT");
    expect(result.notificationRetryable).toBe(false);
    expect(runtime.mails).toHaveLength(1);
  });
  it("keeps email sent when the optional archive fails and skips email on archive retries",async()=>{
    const record=await testRecord();
    const runtime=createScriptMock({archiveThrows:true,props:{ARCHIVE_ENABLED:"true",SHEET_ID:"mocked-sheet"}});
    const first=decodedResult(runtime.invoke(await testEnvelope(record,Date.now(),{notify:true,archive:true})));
    const second=decodedResult(runtime.invoke(await testEnvelope(record,Date.now(),{notify:false,archive:true})));
    expect(first.notification).toBe("sent");
    expect(first.archive).toBe("failed");
    expect(first.archiveRetryable).toBe(true);
    expect(second.notification).toBe("sent");
    expect(runtime.archiveCalls).toBe(2);
    expect(runtime.mails).toHaveLength(1);
  });
  it("applies spreadsheet escaping only at the optional archive write",async()=>{
    const record=await testRecord({name:"=Synthetic QA"});
    const runtime=createScriptMock({props:{ARCHIVE_ENABLED:"true",SHEET_ID:"mocked-sheet"}});
    const result=decodedResult(runtime.invoke(await testEnvelope(record,Date.now(),{notify:true,archive:true})));
    expect(result.archive).toBe("synced");
    expect(runtime.mails[0].body).toContain("Phone: +1 (555)");
    expect(runtime.sheetRows[1]).toContain("'=Synthetic QA");
    expect(runtime.sheetRows[1]).toContain("'+1 (555) 010-0142");
  });
  it("treats zero quota as retryable before any send invocation",async()=>{
    const record=await testRecord(),runtime=createScriptMock({quota:0});
    const result=decodedResult(runtime.invoke(await testEnvelope(record)));
    expect(result.notification).toBe("failed");
    expect(result.notificationRetryable).toBe(true);
    expect(result.errorCode).toBe("MAIL_QUOTA_UNAVAILABLE");
    expect(runtime.mails).toHaveLength(0);
    expect(JSON.parse(runtime.properties.get("CPL_NOTIFICATION_"+record.submissionId)!).notification).toBe("pending");
  });
  it("persists ambiguity after a send throws and never blindly sends again",async()=>{
    const record=await testRecord(),runtime=createScriptMock({sendThrows:true});
    const first=decodedResult(runtime.invoke(await testEnvelope(record)));
    const second=decodedResult(runtime.invoke(await testEnvelope(record)));
    expect(first.notification).toBe("ambiguous");
    expect(first.notificationRetryable).toBe(false);
    expect(second.notification).toBe("ambiguous");
    expect(runtime.mails).toHaveLength(1);
  });
  it("retains the sending marker if a send succeeds but the sent-ledger write fails",async()=>{
    const record=await testRecord(),runtime=createScriptMock({failSentLedger:true});
    expect(decodedResult(runtime.invoke(await testEnvelope(record))).errorCode).toBe("SENT_LEDGER_WRITE_FAILED");
    expect(decodedResult(runtime.invoke(await testEnvelope(record))).notification).toBe("ambiguous");
    expect(JSON.parse(runtime.properties.get("CPL_NOTIFICATION_"+record.submissionId)!).notification).toBe("sending");
    expect(runtime.mails).toHaveLength(1);
  });
  it("does not send when the script lock is busy, and allows a later bounded retry",async()=>{
    const record=await testRecord(),runtime=createScriptMock({lockAvailable:false});
    const result=decodedResult(runtime.invoke(await testEnvelope(record)));
    expect(result.notification).toBe("not_started");
    expect(result.notificationRetryable).toBe(true);
    expect(runtime.mails).toHaveLength(0);
  });
  it.each(["email","name","company","phone"])("rejects CR/LF injection in %s before mail",async field=>{
    const record=await testRecord({[field]:"sample\r\nBcc:other@example.com"});
    const runtime=createScriptMock();
    const result=runtime.invoke(await testEnvelope(record));
    expect(result.errorCode).toBe("INVALID_PAYLOAD");
    expect(runtime.mails).toHaveLength(0);
  });
  it("ignores a payload recipient override and never uses it as To",async()=>{
    const record=await testRecord(),runtime=createScriptMock();
    const envelope=await testEnvelope(record);
    envelope.payload=JSON.stringify({...JSON.parse(envelope.payload),recipient:"other@example.com"});
    envelope.signature=await signEnvelope(TEST_HMAC,envelope.timestamp,record.submissionId,envelope.payload);
    expect(decodedResult(runtime.invoke(envelope)).notification).toBe("sent");
    expect(runtime.mails[0].to).toBe("astarrett@cyberpiratelabs.com");
  });
  it("rejects invalid HMAC, stale timestamps and a payload-hash mismatch without sending",async()=>{
    const record=await testRecord(),runtime=createScriptMock();
    const envelope=await testEnvelope(record);
    expect(runtime.invoke({...envelope,signature:"0".repeat(64)}).errorCode).toBe("AUTH_FAILED");
    expect(runtime.invoke(await testEnvelope(record,Date.now()-310000)).errorCode).toBe("AUTH_FAILED");
    expect(runtime.invoke(await testEnvelope({...record,payloadHash:"0".repeat(64)})).errorCode).toBe("INVALID_PAYLOAD");
    expect(runtime.mails).toHaveLength(0);
  });
  it("holds all old backlog and only allows the specified recovery once",async()=>{
    const old=await testRecord({createdAt:"2025-12-01T00:00:00.000Z"}),runtime=createScriptMock();
    expect(decodedResult(runtime.invoke(await testEnvelope(old))).notification).toBe("held");
    const recovery=await testRecord({...old,publicReference:"CPL-347301C3"});
    expect(decodedResult(runtime.invoke(await testEnvelope(recovery))).notification).toBe("held");
    runtime.properties.set("NOTIFICATION_RECOVERY_REFERENCES","CPL-347301C3,CPL-2AA16BBF");
    expect(decodedResult(runtime.invoke(await testEnvelope(recovery))).notification).toBe("sent");
    expect(decodedResult(runtime.invoke(await testEnvelope(recovery))).notification).toBe("sent");
    const qa=await testRecord({...old,publicReference:"CPL-2AA16BBF"});
    expect(decodedResult(runtime.invoke(await testEnvelope(qa))).notification).toBe("held");
    expect(runtime.mails).toHaveLength(1);
    expect(JSON.parse(runtime.properties.get("CPL_NOTIFICATION_"+recovery.submissionId)!).recoveryUsedAt).toBeTruthy();
  });
  it("defaults to held without a valid activation cutoff",async()=>{
    const record=await testRecord(),runtime=createScriptMock({props:{NOTIFICATION_ENABLED_AFTER:""}});
    expect(decodedResult(runtime.invoke(await testEnvelope(record))).notification).toBe("held");
    expect(runtime.mails).toHaveLength(0);
  });
  it("treats valid JSON with an unsupported ledger state as ambiguous without sending",async()=>{
    const record=await testRecord(),runtime=createScriptMock();
    runtime.properties.set("CPL_NOTIFICATION_"+record.submissionId,JSON.stringify({version:2,notification:"unknown"}));
    expect(decodedResult(runtime.invoke(await testEnvelope(record))).notification).toBe("ambiguous");
    expect(runtime.mails).toHaveLength(0);
  });
  it.each(["null","false","0","","[]"])("holds a present non-object ledger %s as ambiguous",async stored=>{
    const record=await testRecord(),runtime=createScriptMock();
    runtime.properties.set("CPL_NOTIFICATION_"+record.submissionId,stored);
    expect(decodedResult(runtime.invoke(await testEnvelope(record))).notification).toBe("ambiguous");
    expect(runtime.mails).toHaveLength(0);
    expect(runtime.properties.get("CPL_NOTIFICATION_"+record.submissionId)).toBe(stored);
  });
  it("preserves the legacy action router and authorizes quota without sending",()=>{
    const runtime=createScriptMock();
    expect(runtime.invoke({secret:"legacy",action:"discovery"}).legacy).toBe(true);
    expect(runtime.legacyCalls).toBe(1);
    expect(runtime.authorize()).toBe(50);
    expect(runtime.mails).toHaveLength(0);
  });
  it("accepts only a signed response bound to this identity, payload hash, reference, recipient and timestamp",async()=>{
    const record=await testRecord(),runtime=createScriptMock(),request=await testEnvelope(record);
    const response=runtime.invoke(request);
    expect((await parseBridgeResponse(response,env,record,request.timestamp))?.notification).toBe("sent");
    expect(await parseBridgeResponse({...response,signature:"0".repeat(64)},env,record,request.timestamp)).toBeNull();
    expect(await parseBridgeResponse(response,env,{...record,publicReference:"CPL-AAAAAAAA"},request.timestamp)).toBeNull();
    expect(await parseBridgeResponse(response,env,record,String(Number(request.timestamp)+1))).toBeNull();
    const payload=JSON.stringify({...decodedResult(response),recipient:"other@example.com"});
    const signed={...response,payload,signature:await signEnvelope(TEST_HMAC,"response:"+request.timestamp,record.submissionId,payload)};
    expect(await parseBridgeResponse(signed,env,record,request.timestamp)).toBeNull();
  });
});