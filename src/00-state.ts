// Player state and the two helpers every module needs. Loaded first so everything can import it directly.
export let gameState:SaveState=null as any;
try{gameState=JSON.parse(localStorage.getItem('hollowbrook1')!)}catch(e){}
if(!gameState)gameState={sp:null,xp:{Foraging:0,Woodcutting:0,Fishing:0,Mining:0},inv:{},a:0,cur:null,p:0,hired:{},bench:{},t:Date.now(),log:[]} as unknown as SaveState;
export const save=()=>{try{localStorage.setItem('hollowbrook1',JSON.stringify(gameState))}catch(e){}};
export const say=(m:any)=>{gameState.log.unshift(m);gameState.log=gameState.log.slice(0,12)};
// Extension points so new skills plug in without editing every system: task kinds, effect sources, per-tick work, gather hooks.
export interface TaskKind{sk:string;dur:(c:any)=>number;done:(c:any)=>void;name:(c:any)=>string;valid:(c:any)=>boolean;mdur?:(k:string,t:any)=>number;mact?:(k:string,t:any)=>void;mname?:(t:any)=>string}
export const TASKS:Record<string,TaskKind>={};
export const FXSRC:(()=>FxEntry[])[]=[];
export const TICKS:((dt:number,quiet:any)=>void)[]=[];
export const GATHERED:((a:any)=>void)[]=[];
