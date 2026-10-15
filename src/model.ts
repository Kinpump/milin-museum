export const STATUS_LABELS = {
  MAINTAIN: '维持', IMPROVE: '希望改善', OBSERVE: '暂时观察', ACCEPTED: '接受现状',
  PLANNED: '已有计划', PAUSED: '暂时搁置', DONE: '一次性处理已完成', UNKNOWN: '尚未判断',
} as const;
export type Status = keyof typeof STATUS_LABELS;
export type Subject = 'hair' | 'length' | 'smoothness' | 'color' | 'density' | 'style' | 'eyelid';
export type ISODate = string;
export type Value = { kind: 'unknown'; unit?: string } | { kind: 'number'; value: number; unit: string } | { kind: 'text'; value: string };
export interface Attribute {
  id: Subject; featureId: 'hair' | 'eye'; name: string; currentValue: Value; status: Status;
  description: string; lastUpdated: string; target?: string;
  naturalChange?: { description: string; knowledgeId?: string; model: 'stable' | 'linear_range' };
  ceiling: { kind: 'UNKNOWN' | 'OPEN' | 'LIMITED' | 'FIXED'; description: string };
}
export interface Person { id: string; name: string; sex: 'female'; age: number; ageAsOf: ISODate; height: number; weight: number }
export interface Routine { id: string; subject: Subject; title: string; cadence: string; active: boolean }
export interface Maintenance { id: string; subject: Subject; title: string; intervalMonths: number; approximate: boolean; active: boolean; plannedDate?: ISODate }
export interface Decision { id: string; subject: 'hair' | 'eyelid'; choice: 'DO' | 'DO_NOT' | 'DEFER' | 'ACCEPT'; statement: string; decidedOn: ISODate; supersedesId?: string }
export type EventPayload =
  | { kind: 'measurement'; lengthCm: number }
  | { kind: 'haircut'; removedCm: number }
  | { kind: 'maintenance'; maintenanceId: string }
  | { kind: 'observation'; text: string }
  | { kind: 'decision'; decisionId: string; statement: string }
  | { kind: 'status'; before: Status; after: Status }
  | { kind: 'edit'; summary: string };
export interface HistoryEvent { id: string; subject: Subject | 'person'; occurredOn: ISODate; recordedAt: string; note: string; payload: EventPayload; voidedAt?: string; voidReason?: string }
export interface MuseumDocument {
  schemaVersion: 1; revision: number; updatedAt: string;
  person: Person;
  regions: { id: string; name: string; personId: string }[];
  features: { id: 'hair' | 'eye'; regionId: string; name: string; status: Status; description: string }[];
  attributes: Attribute[];
  knowledge: { id: string; title: string; description: string; source: 'user_provided_example' | 'personal_observation'; rateMin: number; rateMax: number }[];
  routines: Routine[]; maintenance: Maintenance[]; decisions: Decision[];
  interventions: { id: string; subject: Subject; title: string; description: string }[];
  history: HistoryEvent[];
}
export const STORAGE_KEY = 'milin-museum:v1';
export const BACKUP_KEY = 'milin-museum:last-valid';
export function localDate(d = new Date()): ISODate {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function validDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0,10) === s;
}
export function daysBetween(a: ISODate,b: ISODate): number { return (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`))/86400000; }
export function addMonths(date: ISODate, count: number): ISODate {
  const [y,m,d] = date.split('-').map(Number);
  const target = new Date(Date.UTC(y,m-1+count,1));
  const last = new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  target.setUTCDate(Math.min(d,last)); return target.toISOString().slice(0,10);
}
export function uid(): string { return crypto.randomUUID(); }
export function makeEvent(subject: HistoryEvent['subject'], occurredOn: ISODate, payload: EventPayload, note=''): HistoryEvent {
  return {id:uid(),subject,occurredOn,recordedAt:new Date().toISOString(),note,payload};
}
export function seed(today = localDate()): MuseumDocument {
  const now = new Date().toISOString();
  const base = (id: Subject, name: string, value: Value, status: Status, description=''): Attribute => ({id,featureId:id==='eyelid'?'eye':'hair',name,currentValue:value,status,description,lastUpdated:now,ceiling:{kind:'UNKNOWN',description:'尚未确定个人变化边界。'}});
  return {
    schemaVersion:1,revision:0,updatedAt:now,
    person:{id:'milin',name:'米琳',sex:'female',age:30,ageAsOf:today,height:165,weight:60},
    regions:[{id:'head',name:'头部',personId:'milin'}],
    features:[{id:'hair',regionId:'head',name:'头发',status:'MAINTAIN',description:'黑色，中长发。'},{id:'eye',regionId:'head',name:'眼睛',status:'OBSERVE',description:'眼部档案。'}],
    attributes:[
      {...base('length','长度',{kind:'unknown',unit:'cm'},'OBSERVE'),naturalChange:{description:'使用可调整的增长区间估算；个人速度可能不同。',knowledgeId:'hair-growth',model:'linear_range'}},
      base('smoothness','柔顺度',{kind:'text',value:'正常'},'MAINTAIN'),
      base('color','颜色',{kind:'text',value:'黑色'},'MAINTAIN'),
      base('density','密度',{kind:'unknown'},'UNKNOWN'),
      base('style','发型',{kind:'text',value:'中长发'},'MAINTAIN'),
      {...base('eyelid','眼皮',{kind:'text',value:'内双眼皮'},'ACCEPTED','不使用双眼皮贴；不使用双眼皮胶。'),naturalChange:{description:'长期基本稳定（初始示例描述）。',model:'stable'},ceiling:{kind:'LIMITED',description:'存在可选干预方式，目前没有改变意愿。'}},
    ],
    knowledge:[{id:'hair-growth',title:'头发生长',description:'1–1.5 cm / 月是初始示例假设，可根据个人观察调整。',source:'user_provided_example',rateMin:1,rateMax:1.5}],
    routines:[{id:'conditioner',subject:'smoothness',title:'使用护发素',cadence:'每 2 天',active:true},{id:'dry',subject:'smoothness',title:'洗头后注意吹干',cadence:'每次洗头后',active:true},{id:'care',subject:'smoothness',title:'根据状态使用护发产品',cadence:'按需',active:true}],
    maintenance:[{id:'straightening',subject:'smoothness',title:'离子烫',intervalMonths:12,approximate:true,active:true}],
    decisions:[{id:'initial-eyelid-decision',subject:'eyelid',choice:'ACCEPT',statement:'暂无进行双眼皮手术的计划。',decidedOn:today}],
    interventions:[{id:'eyelid-surgery',subject:'eyelid',title:'双眼皮手术',description:'仅保存可选方式，当前没有实施计划。'}],history:[],
  };
}
export function attribute(doc: MuseumDocument,id: Subject): Attribute { const a=doc.attributes.find(a=>a.id===id); if(!a) throw new Error('属性不存在'); return a; }
export function getStatus(doc: MuseumDocument,subject: Subject): Status { return subject==='hair' ? doc.features.find(f=>f.id==='hair')!.status : attribute(doc,subject).status; }
export function changeStatus(doc: MuseumDocument, subject: Subject, after: Status): void {
  const before=getStatus(doc,subject); if(before===after) return;
  if(subject==='hair') doc.features.find(f=>f.id==='hair')!.status=after;
  else { const a=attribute(doc,subject); a.status=after;a.lastUpdated=new Date().toISOString(); }
  doc.history.push(makeEvent(subject,localDate(),{kind:'status',before,after}));
}
export function historyFor(doc: MuseumDocument, exhibit: 'hair'|'eyelid'): HistoryEvent[] {
  const subjects=exhibit==='hair'?['hair','length','smoothness','color','density','style']:['eyelid'];
  return doc.history.filter(e=>subjects.includes(e.subject)).sort(compareEvents).reverse();
}
function compareEvents(a:HistoryEvent,b:HistoryEvent):number {return a.occurredOn.localeCompare(b.occurredOn)||a.recordedAt.localeCompare(b.recordedAt);}
export function currentDecision(doc: MuseumDocument,subject:'hair'|'eyelid'):Decision|undefined {
  const all=doc.decisions.filter(d=>d.subject===subject);const superseded=new Set(all.map(d=>d.supersedesId));
  return all.filter(d=>!superseded.has(d.id)).at(-1);
}
export interface Projection { known: boolean; min?: number; max?: number; baseline?: HistoryEvent; error?: string; cuts: number }
export function projectHair(doc: MuseumDocument,asOf=localDate()):Projection {
  const events=doc.history.filter(e=>!e.voidedAt&&e.subject==='length'&&e.occurredOn<=asOf).sort(compareEvents);
  const baseline=events.filter(e=>e.payload.kind==='measurement').at(-1);
  if(!baseline||baseline.payload.kind!=='measurement') return {known:false,cuts:0};
  const growth=doc.knowledge.find(k=>k.id==='hair-growth')!;
  const cuts=events.filter(e=>e.payload.kind==='haircut'&&compareEvents(e,baseline)>0).reduce((sum,e)=>sum+(e.payload.kind==='haircut'?e.payload.removedCm:0),0);
  const months=daysBetween(baseline.occurredOn,asOf)/(365.2425/12);
  const min=baseline.payload.lengthCm+months*growth.rateMin-cuts;
  const max=baseline.payload.lengthCm+months*growth.rateMax-cuts;
  if(min<0) return {known:true,baseline,cuts,error:'剪发记录与增长估算存在冲突，请重新测量并记录长度。'};
  return {known:true,min,max,baseline,cuts};
}
export function maintenanceDates(doc:MuseumDocument,item:Maintenance,asOf=localDate()):{last?:ISODate;next?:ISODate} {
  const last=doc.history.filter(e=>!e.voidedAt&&e.payload.kind==='maintenance'&&e.payload.maintenanceId===item.id&&e.occurredOn<=asOf).sort(compareEvents).at(-1)?.occurredOn;
  return {last,next:last&&item.active?addMonths(last,item.intervalMonths):undefined};
}
export function hairLevel(doc:MuseumDocument):'short'|'medium'|'long' {
  const p=projectHair(doc);
  if(p.known&&!p.error&&p.min!==undefined&&p.max!==undefined){const n=(p.min+p.max)/2;return n<20?'short':n<40?'medium':'long';}
  const style=attribute(doc,'style').currentValue;
  if(style.kind==='text'&&style.value==='短发')return 'short';
  if(style.kind==='text'&&style.value==='长发')return 'long';
  return 'medium';
}
export function refreshLengthRecord(doc:MuseumDocument):void {
  const a=attribute(doc,'length'),p=projectHair(doc);
  a.currentValue=p.baseline?.payload.kind==='measurement'?{kind:'number',value:p.baseline.payload.lengthCm,unit:'cm'}:{kind:'unknown',unit:'cm'};
  a.lastUpdated=new Date().toISOString();
}
export function voidRecord(doc:MuseumDocument,eventId:string,reason:string):void {
  const ev=doc.history.find(e=>e.id===eventId);
  if(!ev||ev.voidedAt)throw new Error('记录不存在或已作废。');
  if(!['measurement','haircut','maintenance','observation'].includes(ev.payload.kind))throw new Error('这类记录请通过更新档案修改。');
  if(!reason.trim())throw new Error('请填写作废原因。');
  ev.voidedAt=new Date().toISOString();ev.voidReason=reason.trim();
  refreshLengthRecord(doc);
  doc.history.push(makeEvent(ev.subject,localDate(),{kind:'edit',summary:`作废 ${ev.occurredOn} 的记录：${reason.trim()}`}));
}
