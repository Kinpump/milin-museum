import { z } from 'zod';
import { STORAGE_KEY, BACKUP_KEY, STATUS_LABELS, validDate, seed, type MuseumDocument } from './model.ts';
const date=z.string().refine(validDate,'无效日期');
const time=z.iso.datetime();
const text=z.string().max(20000);
const id=z.string().min(1).max(200);
const status=z.enum(Object.keys(STATUS_LABELS) as [keyof typeof STATUS_LABELS,...(keyof typeof STATUS_LABELS)[]]);
const subject=z.enum(['hair','length','smoothness','color','density','style','eyelid']);
const positive=z.number().finite().positive();
const value=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('unknown'),unit:text.optional()}),
  z.object({kind:z.literal('number'),value:z.number().finite().nonnegative(),unit:text}),
  z.object({kind:z.literal('text'),value:text}),
]);
const payload=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('measurement'),lengthCm:z.number().min(0).max(300)}),
  z.object({kind:z.literal('haircut'),removedCm:positive.max(300)}),
  z.object({kind:z.literal('maintenance'),maintenanceId:id}),
  z.object({kind:z.literal('observation'),text}),
  z.object({kind:z.literal('decision'),decisionId:id,statement:text}),
  z.object({kind:z.literal('status'),before:status,after:status}),
  z.object({kind:z.literal('edit'),summary:text}),
]);
const schema=z.object({
  schemaVersion:z.literal(1),revision:z.number().int().nonnegative(),updatedAt:time,
  person:z.object({id,name:text.min(1),sex:z.literal('female'),age:z.number().int().min(0).max(130),ageAsOf:date,height:positive.max(250),weight:positive.max(400)}),
  regions:z.array(z.object({id,name:text,personId:id})),
  features:z.array(z.object({id:z.enum(['hair','eye']),regionId:id,name:text,status,description:text})),
  attributes:z.array(z.object({id:subject,featureId:z.enum(['hair','eye']),name:text,currentValue:value,status,description:text,lastUpdated:time,target:text.optional(),naturalChange:z.object({description:text,knowledgeId:id.optional(),model:z.enum(['stable','linear_range'])}).optional(),ceiling:z.object({kind:z.enum(['UNKNOWN','OPEN','LIMITED','FIXED']),description:text})})),
  knowledge:z.array(z.object({id,title:text,description:text,source:z.enum(['user_provided_example','personal_observation']),rateMin:z.number().min(0).max(5),rateMax:z.number().min(0).max(5)}).refine(k=>k.rateMin<=k.rateMax)),
  routines:z.array(z.object({id,subject,title:text.min(1),cadence:text.min(1),active:z.boolean()})),
  maintenance:z.array(z.object({id,subject,title:text.min(1),intervalMonths:z.number().int().min(1).max(120),approximate:z.boolean(),active:z.boolean(),plannedDate:date.optional()})),
  decisions:z.array(z.object({id,subject:z.enum(['hair','eyelid']),choice:z.enum(['DO','DO_NOT','DEFER','ACCEPT']),statement:text.min(1),decidedOn:date,supersedesId:id.optional()})),
  interventions:z.array(z.object({id,subject,title:text,description:text})),
  history:z.array(z.object({id,subject:z.union([subject,z.literal('person')]),occurredOn:date,recordedAt:time,note:text,payload,voidedAt:time.optional(),voidReason:text.optional()})),
}).superRefine((d,ctx)=>{
  const issue=(message:string)=>ctx.addIssue({code:'custom',message});
  for(const key of ['regions','features','attributes','knowledge','routines','maintenance','decisions','interventions','history'] as const){if(new Set(d[key].map(x=>x.id)).size!==d[key].length)issue(`${key} 中有重复记录`);}
  for(const required of ['length','smoothness','color','density','style','eyelid'])if(!d.attributes.some(a=>a.id===required))issue('缺少必要属性');
  for(const required of ['hair','eye'])if(!d.features.some(f=>f.id===required))issue('缺少必要部位');
  if(!d.knowledge.some(k=>k.id==='hair-growth'))issue('缺少增长假设');
  for(const r of d.regions)if(r.personId!==d.person.id)issue('人物关联错误');
  for(const f of d.features)if(!d.regions.some(r=>r.id===f.regionId))issue('区域关联错误');
  for(const a of d.attributes){if(!d.features.some(f=>f.id===a.featureId))issue('属性关联错误');if(a.naturalChange?.knowledgeId&&!d.knowledge.some(k=>k.id===a.naturalChange!.knowledgeId))issue('知识关联错误');}
  for(const e of d.history){const p=e.payload;if(p.kind==='maintenance'&&!d.maintenance.some(m=>m.id===p.maintenanceId))issue('维护记录关联错误');if(p.kind==='decision'&&!d.decisions.some(v=>v.id===p.decisionId))issue('决定关联错误');if((p.kind==='haircut'||p.kind==='measurement')&&e.subject!=='length')issue('长度记录关联错误');}
  for(const [index,dec] of d.decisions.entries())if(dec.supersedesId&&!d.decisions.slice(0,index).some(x=>x.id===dec.supersedesId&&x.subject===dec.subject))issue('决定版本关联错误');
});
export function parseDocument(raw:string):MuseumDocument { return schema.parse(JSON.parse(raw)); }
export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export type LoadResult = {doc:MuseumDocument;error?:string;raw?:string;fresh:boolean};
export function loadDocument(storage:StorageLike):LoadResult {
  let raw:string|null=null;
  try {raw=storage.getItem(STORAGE_KEY);if(raw===null)return {doc:seed(),fresh:true};return {doc:parseDocument(raw),fresh:false};}
  catch {return {doc:seed(),fresh:false,raw:raw??undefined,error:'本地档案无法读取。原数据未被覆盖，编辑已暂停。请先导出原始数据，或恢复有效备份。'};}
}
export function saveDocument(storage:StorageLike,doc:MuseumDocument,expectedRevision:number):MuseumDocument {
  const previous=storage.getItem(STORAGE_KEY);
  if(previous!==null){const latest=parseDocument(previous);if(latest.revision!==expectedRevision)throw new Error('另一窗口已更新档案。请先重新加载，再保存修改。');}
  else if(expectedRevision!==0)throw new Error('本地档案已被另一窗口移除。请重新加载后再编辑。');
  const next={...doc,revision:expectedRevision+1,updatedAt:new Date().toISOString()};
  const raw=JSON.stringify(next);parseDocument(raw);
  // Write backup first: a failed primary write leaves the last valid revision intact.
  if(previous)storage.setItem(BACKUP_KEY,previous);
  storage.setItem(STORAGE_KEY,raw);return next;
}
export function restoreDocument(storage:StorageLike,imported:MuseumDocument,expectedRaw:string|null):MuseumDocument {
  const current=storage.getItem(STORAGE_KEY);
  if(current!==expectedRaw)throw new Error('选择备份期间，另一窗口已更新档案。请重新加载后再恢复。');
  let prior:MuseumDocument|undefined;
  if(current!==null){try{prior=parseDocument(current);}catch{/* Preserve unreadable data separately. */}}
  const next=parseDocument(JSON.stringify({...imported,revision:(prior?.revision??imported.revision)+1,updatedAt:new Date().toISOString()}));
  if(current!==null)storage.setItem(prior?BACKUP_KEY:'milin-museum:unreadable-backup',current);
  storage.setItem(STORAGE_KEY,JSON.stringify(next));return next;
}
