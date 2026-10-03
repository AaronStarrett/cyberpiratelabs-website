import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { createContext, Script } from "node:vm";
import type { InquiryRecord } from "../shared/inquiry/types";
import { archiveBody } from "../shared/inquiry/google";
import { canonicalPayload } from "../shared/inquiry/validate";
import { sha256Hex, signEnvelope } from "../shared/inquiry/sign";

export const TEST_HMAC = "local-mocked-contract-secret-only";
export const TEST_CUTOFF = "2026-01-01T00:00:00.000Z";
export type MailOptions = { to:string; replyTo:string; name:string; subject:string; body:string; htmlBody:string };
export type ScriptOptions = {
  quota?:number; lockAvailable?:boolean; sendThrows?:boolean; failSentLedger?:boolean;
  archiveThrows?:boolean; props?:Record<string,string>; now?:number;
};
export function createScriptMock(options: ScriptOptions = {}) {
  const properties = new Map(Object.entries({
    HMAC_SECRET:TEST_HMAC, OWNER_EMAIL:"astarrett@cyberpiratelabs.com",
    NOTIFICATION_ENABLED_AFTER:TEST_CUTOFF, ARCHIVE_ENABLED:"false", ...options.props,
  }));
  const mails:MailOptions[] = [];
  const sheetRows:unknown[][] = [];
  let released=0;
  let legacyCalls=0;
  let archiveCalls=0;
  let clock = options.now ?? Date.now();
  class ScriptDate extends Date {
    constructor(value?:string | number) { super(value ?? clock); }
    static now() { return clock; }
  }
  const context=createContext({
    Date:ScriptDate,
    PropertiesService:{ getScriptProperties:()=>({
      getProperty:(key:string)=>properties.get(key) ?? null,
      setProperty:(key:string,value:string)=>{
        if(options.failSentLedger && key.startsWith("CPL_NOTIFICATION_") && JSON.parse(value).notification==="sent") throw new Error("mocked ledger fault");
        properties.set(key,value);
      },
    }) },
    LockService:{ getScriptLock:()=>({ tryLock:()=>options.lockAvailable!==false, releaseLock:()=>{released+=1;} }) },
    MailApp:{
      getRemainingDailyQuota:()=>options.quota ?? 50,
      sendEmail:(mail:MailOptions)=>{mails.push(mail); if(options.sendThrows) throw new Error("mocked send outcome unknown");},
    },
    Utilities:{
      Charset:{UTF_8:"UTF-8"}, DigestAlgorithm:{SHA_256:"SHA-256"},
      computeDigest:(_algorithm:string,value:string)=>[...createHash("sha256").update(value).digest()],
      computeHmacSha256Signature:(value:string,secret:string)=>[...createHmac("sha256",secret).update(value).digest()],
      formatDate:(date:Date,timezone:string)=>date.toISOString()+" ["+timezone+"]",
    },
    ContentService:{ MimeType:{JSON:"application/json"}, createTextOutput:(body:string)=>({
      setMimeType:()=>({getContent:()=>body}),
    }) },
    SpreadsheetApp:{ openById:()=>{
      archiveCalls+=1;
      if(options.archiveThrows) throw new Error("mocked archive unavailable");
      return {getSheets:()=>[{
        getLastRow:()=>sheetRows.length, appendRow:(row:unknown[])=>sheetRows.push(row),
        getRange:()=>({createTextFinder:()=>({matchEntireCell:()=>({findNext:()=>null})})}),
      }]};
    } },
    DriveApp:{getFolderById:()=>{throw new Error("mocked archive not configured");}},
    MimeType:{PLAIN_TEXT:"text/plain"},
    legacyWebsitePost_:()=>{legacyCalls+=1;return {getContent:()=>JSON.stringify({legacy:true})};},
  });
  new Script(readFileSync(new URL("../google/apps-script/Notification.gs",import.meta.url),"utf8")).runInContext(context);
  return {
    properties,mails,sheetRows,
    setNow(value:number) { clock=value; },
    get released() {return released;},get legacyCalls() {return legacyCalls;},get archiveCalls() {return archiveCalls;},
    invoke(envelope:unknown): Record<string,unknown> {
      const handler=context.doPost as (event:unknown)=>{getContent:()=>string};
      return JSON.parse(handler({postData:{contents:JSON.stringify(envelope)}}).getContent());
    },
    authorize():number { return (context.cplAuthorizeNotification as ()=>number)(); },
  };
}
export async function testRecord(overrides:Partial<InquiryRecord> = {}):Promise<InquiryRecord> {
  const record:InquiryRecord={
    id:crypto.randomUUID(),submissionId:crypto.randomUUID(),publicReference:"CPL-12345678",
    createdAt:new Date().toISOString(),payloadHash:"",
    name:"Synthetic QA <Sample>",email:"synthetic@example.com",company:"Synthetic QA & Services",
    phone:"+1 (555) 010-0142",serviceCategory:null,teamSize:null,currentTools:"https://example.com",
    interest:"both",workflowProblem:"Synthetic questions\nSecond line <script>alert(1)</script>",
    scenarioInterest:null,marketingConsent:false,sourcePath:"/demo/",
    googleStatus:"pending",notifyStatus:"pending",googleAttempts:0,notifyAttempts:0,
    googleNextAt:null,notifyNextAt:null,googleError:null,notifyError:null,googleConfirmedAt:null,notifyConfirmedAt:null,
    ...overrides,
  };
  record.payloadHash=await sha256Hex(canonicalPayload({...record,honeypot:""}));
  return record;
}
export async function testEnvelope(record:InquiryRecord,now=Date.now(),actions={notify:true,archive:false}) {
  const timestamp=String(now);
  const payload=JSON.stringify({...JSON.parse(archiveBody(record)),delivery:actions});
  return {timestamp,submissionId:record.submissionId,payload,signature:await signEnvelope(TEST_HMAC,timestamp,record.submissionId,payload)};
}
export function decodedResult(envelope:Record<string,unknown>):Record<string,unknown> {
  return JSON.parse(String(envelope.payload));
}
export function mockedBridgeFetch(runtime:ReturnType<typeof createScriptMock>):typeof fetch {
  return async (_input,init)=>{
    const envelope=JSON.parse(String(init?.body));
    runtime.setNow(Number(envelope.timestamp));
    return new Response(JSON.stringify(runtime.invoke(envelope)),{status:200,headers:{"content-type":"application/json"}});
  };
}