import { S, TASKS, say } from './00-state';
import { X } from './registry';
import { FM, H, HK, IT, LT, lv, pbs, skPet } from './01-species-pets';
import { RFN, ctime, gateOk, refineDone } from './02-gear-data';
import { hrCount } from './03-world-expeditions';
import { A, CSK, DISH, LD, asg, cl, cookDone, craftDone, mspd, tt } from './07-gear-ui';
// Party helpers. (Script-mode file: all src/*.ts share one global scope and are concatenated in filename order.)
export const fighters=()=>Object.keys(S.hired).filter(k=>asg(k).k=='war');
export const pm=()=>(FM[S.form]||FM.steady).party+X.cb('pmult');
export const pk=(n:string)=>Math.min(({taken:.45,speed:.4} as any)[n]||99,fighters().reduce((s,k)=>s+(H[k].pk[n]||0)*(1+(cl(k)-1)*.02)*pm()*(H[k].pet?1.25:1),0));
export function mxp(k:string,x:number){const b=cl(k);S.cx[k]=(S.cx[k]||0)+x*(H[k].pet?1.5:1);if(cl(k)>b)say(H[k].n+' reaches level '+cl(k)+'.')}
export function ldx(x:number){const b=LD();S.xp.Leadership+=x;const a=LD();if(a>b){const u=HK.filter(k=>H[k].lt>b&&H[k].lt<=a).map(k=>H[k].n);say('Leadership reaches level '+a+'.'+(LT.some(l=>l>b&&l<=a)?' New party slot.':'')+(u.length?' Now available: '+u.join(', ')+'.':''))}}
export function validTask(t:any){return !!t&&((!!TASKS[t.k]&&TASKS[t.k].valid(t))||t.k=='war'||t.k=='idle'||t.k=='bar'||t.k=='exp'||(t.k=='s'&&!!A.find(a=>a.id==t.id))||(t.k=='k'&&!!DISH[t.id])||(t.k=='f'&&!!IT[t.id]&&t.id[0]!='t')||(t.k=='r'&&!!RFN[t.id]))}
export function assign(k:string,kind:string,id?:any){
  if(!S.hired[k]||asg(k).k=='exp')return;
  const t=S.mt[k];
  if(kind=='bar'){if(X.buL('bar')>0)S.mt[k]={k:'bar'};return}
  if(kind=='war'||kind=='idle'){S.mt[k]={k:kind};return}
  if(t&&t.k==kind&&t.id==id){S.mt[k]={k:'idle'};return}
  S.mt[k]={k:kind,id,p:0};
}
export const mdur=(k:string,t:any)=>(t.k=='s'?tt(A.find(a=>a.id==t.id)):t.k=='k'?3.5*Math.max(.3,1-X.cb('spd','Cooking')):t.k=='r'?6*Math.max(.3,1-X.cb('spd',RFN[t.id].sk)):ctime(t.id)*Math.max(.3,1-X.cb('spd',CSK(t.id))))/(mspd(k)*pbs(k,X.skOf(t)));
export function memAct(k:string,t:any){
  const bail=()=>{S.mt[k]={k:'idle'}};
  if(t.k=='s'){const a=A.find(x=>x.id==t.id);if(!a||lv(S.xp[a.sk])<a.lv||!gateOk(a.gate))return bail();skPet(a.sk);const yn=1+(Math.random()<lv(S.xp[a.sk])*.004+X.cb('yld',a.sk)+(pbs(k,a.sk)>1?.15:0)?1:0);const pn=X.famCut(k,yn);S.inv[a.item]=(S.inv[a.item]||0)+pn;hrCount(a,pn);mxp(k,a.xp*.6);ldx(a.xp*.5)}
  else if(t.k=='k')cookDone(t.id,k);
  else if(t.k=='f'){if(lv(S.xp[CSK(t.id)])<IT[t.id].req)return bail();craftDone(t.id,k)}
  else if(t.k=='r'){if(lv(S.xp[RFN[t.id].sk])<RFN[t.id].req)return bail();refineDone(t.id,k)}
}

Object.defineProperties(X,{pk:{get:()=>pk,configurable:true},mxp:{get:()=>mxp,configurable:true},ldx:{get:()=>ldx,configurable:true},validTask:{get:()=>validTask,configurable:true},fighters:{get:()=>fighters,configurable:true},pm:{get:()=>pm,configurable:true}});