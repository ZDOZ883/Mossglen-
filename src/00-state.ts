// Player state and the two helpers every module needs. Loaded first so everything can import it directly.
export let S:SaveState=null as any;
try{S=JSON.parse(localStorage.getItem('hollowbrook1')!)}catch(e){}
if(!S)S={sp:null,xp:{Foraging:0,Woodcutting:0,Fishing:0,Mining:0},inv:{},a:0,cur:null,p:0,hired:{},t:Date.now(),log:[]} as unknown as SaveState;
export const save=()=>{try{localStorage.setItem('hollowbrook1',JSON.stringify(S))}catch(e){}};
export const say=(m:any)=>{S.log.unshift(m);S.log=S.log.slice(0,12)};
