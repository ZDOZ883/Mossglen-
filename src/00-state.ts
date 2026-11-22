// Player state and the two helpers every module needs. Loaded first so everything can import it directly.
export let S:SaveState=null as any;
try{S=JSON.parse(localStorage.getItem('hollowbrook1')!)}catch(e){}
if(!S)S={sp:null,xp:{Foraging:0,Woodcutting:0,Fishing:0,Mining:0},inv:{},a:0,cur:null,p:0,hired:{},t:Date.now(),log:[]} as unknown as SaveState;
export const save=()=>{try{localStorage.setItem('hollowbrook1',JSON.stringify(S))}catch(e){}};
export const say=(m:any)=>{S.log.unshift(m);S.log=S.log.slice(0,12)};
// Extension points so new skills plug in without editing every system: task kinds, effect sources, per-tick work, gather hooks.
export interface TaskKind{sk:string;dur:(c:any)=>number;done:(c:any)=>void;name:(c:any)=>string;valid:(c:any)=>boolean;mdur?:(k:string,t:any)=>number;mact?:(k:string,t:any)=>void;mname?:(t:any)=>string}
export const TASKS:Record<string,TaskKind>={};
export const FXSRC:(()=>FxEntry[])[]=[];
export const TICKS:((dt:number,quiet:any)=>void)[]=[];
export const GATHERED:((a:any)=>void)[]=[];
