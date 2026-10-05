import { describe, expect, it } from "vitest";
import { applyDeliveryReport, deliverInquiry, EXCLUDED_QA_REFERENCE, RECOVERY_REFERENCE } from "../shared/inquiry/google";
import { handleInquiryPost, retryDue, savedMessage } from "../shared/inquiry/http";
import { claimDelivery, findBySubmissionId, releaseDelivery, updateDelivery } from "../shared/inquiry/repository";
import type { Sql } from "../shared/inquiry/types";
import { validateInquiry } from "../shared/inquiry/validate";
import { createScriptMock, mockedBridgeFetch, TEST_CUTOFF, TEST_HMAC } from "./apps-script.mock";
import { createTestSql } from "./sql";

const origin="https://example.com";
const baseEnv={RATE_LIMIT_SALT:"local-testing-salt-only",TURNSTILE_SECRET:"mock-only"};
const bridgeEnv={...baseEnv,GOOGLE_APPS_SCRIPT_URL:"https://script.google.com/macros/s/mocked/exec",
  GOOGLE_HMAC_SECRET:TEST_HMAC,NOTIFICATION_ENABLED_AFTER:TEST_CUTOFF,GOOGLE_ARCHIVE_ENABLED:"false"};
const verified:typeof fetch=async()=>new Response('{"success":true}');
async function save(sql:Sql,now=Date.now()) {
  const body={name:"Synthetic QA",email:"synthetic@example.com",company:"Synthetic QA Services",interest:"both",
    submissionId:crypto.randomUUID(),turnstileToken:"mock"};
  const request=new Request(origin+"/api/inquiries",{method:"POST",headers:{"content-type":"application/json",origin},body:JSON.stringify(body)});
  const result=await handleInquiryPost(request,sql,baseEnv,verified,now);
  const record=await findBySubmissionId(sql,body.submissionId);
  if (!record) throw new Error("mock lead not stored");
  return {body,request,result,record};
}
describe("Worker delivery safety using SQLite and mocked provider services",()=>{
  it("keeps the saved/reference confirmation when a downstream database claim throws",async()=>{
    const sql=createTestSql();
    const faulty:Sql={...sql,run:async(query,...params)=>{
      if(query.includes("inquiry_delivery_claims")) throw new Error("mocked downstream SQL fault");
      return sql.run(query,...params);
    }};
    const {result}=await save(faulty);
    expect(result.status).toBe(201);
    expect(result.json.saved).toBe(true);
    expect(result.json.message).toContain("has been received");
    expect(result.json.message).not.toMatch(/Google|D1|configured|database/);
    expect((await sql.get<{count:number}>("SELECT COUNT(*) AS count FROM inquiries"))?.count).toBe(1);
  });
  it("holds historical pending rows when enabling the bridge and excludes old QA even if allowlisted",async()=>{
    const sql=createTestSql(),old=await save(sql,Date.parse("2025-12-01T00:00:00.000Z"));
    await sql.run("UPDATE inquiries SET public_reference = ?, google_status = 'pending', notify_status = 'pending' WHERE id = ?",EXCLUDED_QA_REFERENCE,old.record.id);
    const recovery=await save(sql,Date.parse("2025-12-02T00:00:00.000Z"));
    await sql.run("UPDATE inquiries SET public_reference = ? WHERE id = ?",RECOVERY_REFERENCE,recovery.record.id);
    const unrelated=await save(sql,Date.parse("2025-12-03T00:00:00.000Z"));
    const runtime=createScriptMock(),fetchImpl=mockedBridgeFetch(runtime);
    expect(await retryDue(sql,bridgeEnv,fetchImpl)).toBe(0);
    runtime.properties.set("NOTIFICATION_RECOVERY_REFERENCES",RECOVERY_REFERENCE+","+EXCLUDED_QA_REFERENCE);
    const allowed={...bridgeEnv,NOTIFICATION_RECOVERY_REFERENCES:RECOVERY_REFERENCE+","+EXCLUDED_QA_REFERENCE};
    expect(await retryDue(sql,allowed,fetchImpl)).toBe(1);
    expect(runtime.mails).toHaveLength(1);
    expect(runtime.mails[0].subject).toContain(RECOVERY_REFERENCE);
    expect(await retryDue(sql,allowed,fetchImpl)).toBe(0);
    expect((await sql.get<{notify_status:string}>("SELECT notify_status FROM inquiries WHERE id = ?",unrelated.record.id))?.notify_status).toBe("pending_unconfigured");
    expect((await sql.get<{notify_status:string}>("SELECT notify_status FROM inquiries WHERE id = ?",old.record.id))?.notify_status).toBe("pending");
  });
  it("does not scan or call an endpoint without valid explicit cutoff/configuration",async()=>{
    const sql=createTestSql();
    await save(sql);
    let calls=0;
    const fetchImpl:typeof fetch=async()=>{calls++;return new Response("{}");};
    expect(await retryDue(sql,{...bridgeEnv,NOTIFICATION_ENABLED_AFTER:""},fetchImpl)).toBe(0);
    expect(await retryDue(sql,{...bridgeEnv,GOOGLE_APPS_SCRIPT_URL:"https://other.example.com/exec"},fetchImpl)).toBe(0);
    expect(calls).toBe(0);
  });
  it("claims a record for only one concurrent delivery",async()=>{
    const sql=createTestSql(),{record}=await save(sql),runtime=createScriptMock();
    const fetchImpl=mockedBridgeFetch(runtime);
    const outcomes=await Promise.all([
      deliverInquiry(sql,bridgeEnv,record,fetchImpl,Date.now()),
      deliverInquiry(sql,bridgeEnv,record,fetchImpl,Date.now()),
    ]);
    expect(runtime.mails).toHaveLength(1);
    expect(outcomes.some(item=>item.notifyStatus==="sent")).toBe(true);
    expect((await sql.get<{count:number}>("SELECT COUNT(*) AS count FROM inquiry_delivery_claims"))?.count).toBe(0);
  });
  it("expires a stuck claim and prevents the stale token from overwriting a newer sent result",async()=>{
    const sql=createTestSql(),{record}=await save(sql),now=Date.now();
    const oldClaim=await claimDelivery(sql,record.id,now);
    expect(oldClaim).toBeTruthy();
    expect(await claimDelivery(sql,record.id,now+1)).toBeNull();
    const freshClaim=await claimDelivery(sql,record.id,now+90_001);
    expect(freshClaim).toBeTruthy();
    await updateDelivery(sql,record.id,{notifyStatus:"sent",notifyConfirmedAt:new Date(now+90_001).toISOString()},freshClaim!);
    const late=await applyDeliveryReport(sql,record,{archive:"disabled",notification:"failed",notificationRetryable:true},now+95_000,oldClaim!);
    expect(late.notifyStatus).toBe("sent");
    await releaseDelivery(sql,record.id,oldClaim!);
    expect((await sql.get<{claim_token:string}>("SELECT claim_token FROM inquiry_delivery_claims WHERE inquiry_id = ?",record.id))?.claim_token).toBe(freshClaim);
    await releaseDelivery(sql,record.id,freshClaim!);
  });
  it("bounds pre-send quota retries at eight and never sends",async()=>{
    const sql=createTestSql(),{record}=await save(sql),runtime=createScriptMock({quota:0});
    const fetchImpl=mockedBridgeFetch(runtime);
    let now=Date.now();
    let updated=await deliverInquiry(sql,bridgeEnv,record,fetchImpl,now);
    for(let index=1;index<8;index++) {
      now=Date.parse(updated.notifyNextAt!);
      expect(await retryDue(sql,bridgeEnv,fetchImpl,now)).toBe(1);
      updated=(await findBySubmissionId(sql,record.submissionId))!;
    }
    expect(updated.notifyAttempts).toBe(8);
    expect(updated.notifyNextAt).toBeNull();
    expect(await retryDue(sql,bridgeEnv,fetchImpl,now+1000000000)).toBe(0);
    expect(runtime.mails).toHaveLength(0);
  });
  it("queries the ledger after transport failure and only re-enables sending after a known not-started result",async()=>{
    const sql=createTestSql(),{record}=await save(sql),runtime=createScriptMock(),bridge=mockedBridgeFetch(runtime);
    let calls=0; const actions:boolean[]=[];
    const fetchImpl:typeof fetch=async(input,init)=>{
      const envelope=JSON.parse(String(init?.body));actions.push(JSON.parse(envelope.payload).delivery.notify);
      if(++calls===1) throw new Error("mocked network failure before provider");
      return bridge(input,init);
    };
    let now=Date.now();
    let updated=await deliverInquiry(sql,bridgeEnv,record,fetchImpl,now);
    expect(updated.notifyStatus).toBe("ambiguous");
    now=Date.parse(updated.notifyNextAt!);
    await retryDue(sql,bridgeEnv,fetchImpl,now);
    updated=(await findBySubmissionId(sql,record.submissionId))!;
    expect(updated.notifyStatus).toBe("failed");
    expect(runtime.mails).toHaveLength(0);
    await retryDue(sql,bridgeEnv,fetchImpl,Date.parse(updated.notifyNextAt!));
    expect(actions).toEqual([true,false,true]);
    expect(runtime.mails).toHaveLength(1);
  });
  it("never displays internal delivery diagnostics in received confirmations",async()=>{
    const sql=createTestSql(),{record}=await save(sql);
    // A valid random reference can contain D1; audit only the explanatory copy.
    const publicReference="CPL-D1227373";
    for(const notifyStatus of ["sent","held","pending_unconfigured","failed","ambiguous"] as const) {
      const message=savedMessage({...record,publicReference,notifyStatus,notifyError:"SECRET_INTERNAL_DIAGNOSTIC"});
      expect(message).toContain(publicReference);
      expect(message).toContain("not a confirmed appointment");
      expect(message.replace(publicReference,"")).not.toMatch(/Google|D1|SECRET|configured|database|archive/);
      if(notifyStatus!=="sent") expect(message).toContain("astarrett@cyberpiratelabs.com");
    }
  });
  it.each(["name","email","company","phone"])("rejects unsafe header content in %s in server validation",field=>{
    const result=validateInquiry({name:"Synthetic QA",email:"sample@example.com",company:"Synthetic",interest:"voice",
      [field]:"sample\r\nBcc:other@example.com"});
    expect(result.ok).toBe(false);
    expect(result.errors[field as "name"]).toBeTruthy();
  });
});