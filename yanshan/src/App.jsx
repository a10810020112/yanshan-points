import { useState, useEffect, useCallback, useRef } from "react";

// ─── LOGO ────────────────────────────────────────────────────
const LOGO_SRC = "/logo.png";

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════
const LEVELS = [
  { lv:1, name:"入砚童生", min:0,    max:199,   emoji:"📜", color:"#94A3B8", bg:"rgba(148,163,184,0.12)" },
  { lv:2, name:"砚田耕者", min:200,  max:599,   emoji:"🖌️", color:"#86EFAC", bg:"rgba(134,239,172,0.12)" },
  { lv:3, name:"行云执笔", min:600,  max:1199,  emoji:"💨", color:"#34D399", bg:"rgba(52,211,153,0.12)"  },
  { lv:4, name:"铁画银钩", min:1200, max:1999,  emoji:"⚡", color:"#F59E0B", bg:"rgba(245,158,11,0.12)"  },
  { lv:5, name:"锦章妙手", min:2000, max:2999,  emoji:"🏮", color:"#F97316", bg:"rgba(249,115,22,0.12)"  },
  { lv:6, name:"凌云翰墨", min:3000, max:4999,  emoji:"🦅", color:"#C084FC", bg:"rgba(192,132,252,0.12)" },
  { lv:7, name:"冠冕书将", min:5000, max:7999,  emoji:"👑", color:"#F5C842", bg:"rgba(245,200,66,0.12)"  },
  { lv:8, name:"翰林小师", min:8000, max:11999, emoji:"🏛️", color:"#FB923C", bg:"rgba(251,146,60,0.12)"  },
  { lv:9, name:"墨林宗匠", min:12000,max:Infinity,emoji:"🌟",color:"#E879F9",bg:"rgba(232,121,249,0.15)" },
];

const QUICK_ADD = [
  { label:"准时到课",     pts:10,  icon:"⏰" },
  { label:"坐姿握笔规范", pts:10,  icon:"✍️" },
  { label:"完成课堂练习", pts:20,  icon:"📝" },
  { label:"作品完成度高", pts:30,  icon:"🎨" },
  { label:"课后作业完成", pts:30,  icon:"📚" },
  { label:"连续4次出勤",  pts:50,  icon:"🔥" },
  { label:"参加作品展示", pts:100, icon:"🖼️" },
  { label:"参加比赛/展览",pts:200, icon:"🏆" },
  { label:"获奖",         pts:300, icon:"🥇" },
];
const QUICK_DEDUCT = [
  { label:"未带工具",       pts:-10, icon:"🔧" },
  { label:"迟到严重",       pts:-10, icon:"⏱️" },
  { label:"课堂打闹",       pts:-20, icon:"😤" },
  { label:"作业长期未完成", pts:-20, icon:"📭" },
];
const SHOP_ITEMS = [
  { id:1,  name:"贴纸",         cost:100,  icon:"⭐" },
  { id:2,  name:"小文具",       cost:300,  icon:"✏️" },
  { id:3,  name:"优先选座卡",   cost:300,  icon:"🪑" },
  { id:4,  name:"免作业卡",     cost:500,  icon:"🎫" },
  { id:5,  name:"毛笔",         cost:800,  icon:"🖌️" },
  { id:6,  name:"作品上墙展示", cost:1000, icon:"🖼️" },
  { id:7,  name:"墨汁",         cost:1000, icon:"🖤" },
  { id:8,  name:"家长群表扬",   cost:1200, icon:"📣" },
  { id:9,  name:"宣纸礼包",     cost:1500, icon:"📜" },
  { id:10, name:"专属奖状",     cost:2000, icon:"🏅" },
  { id:11, name:"作品装裱一次", cost:3000, icon:"🏛️" },
];
const STUDENT_COLORS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#06B6D4","#84CC16","#F472B6","#A78BFA","#FB923C","#38BDF8"];
const AVATAR_EMOJIS  = ["🐉","🦁","🐯","🦊","🐼","🐨","🦄","🐸","🦋","🌸","⭐","🌙","🔥","💎","🌊","🍀"];

function getLevel(p){ return [...LEVELS].reverse().find(l=>p>=l.min)||LEVELS[0]; }
function getNextLevel(p){ return LEVELS.find(l=>p<l.min)||null; }
function fmt(n){ return (n||0).toLocaleString(); }
function fmtDate(iso){ const d=new Date(iso); return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function currentMonthKey(){ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()}`; }
function monthKey(iso){ const d=new Date(iso); return `${d.getFullYear()}-${d.getMonth()}`; }
function genId(){ return Date.now()+Math.random().toString(36).slice(2,8); }
function R(){ return Math.random(); }

const LS_STUDENTS="ys:students", LS_HISTORY="ys:history", LS_REDEEMS="ys:redeems", LS_HW="ys:homework", LS_PARENT_AVATAR="ys:parent_avatars";
const lsGet=(k,d)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; }};
const lsSet=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{}};

async function compressImage(file,maxW=1200,q=0.75){
  return new Promise(res=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{
      const sc=Math.min(1,maxW/Math.max(img.width,img.height));
      const c=document.createElement("canvas");
      c.width=img.width*sc; c.height=img.height*sc;
      c.getContext("2d").drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL("image/jpeg",q)); URL.revokeObjectURL(url);
    }; img.src=url;
  });
}

// ═══════════════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════════════
const TEACHER_CSS = `
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@400;500;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{font-family:'Noto Sans SC',sans-serif;background:#080C14;color:#E2E8F0;min-height:100vh;-webkit-tap-highlight-color:transparent;}
::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
input,select,textarea,button{font-family:'Noto Sans SC',sans-serif;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
@keyframes popIn{0%{transform:scale(0.4) rotate(-12deg);opacity:0;}65%{transform:scale(1.1) rotate(2deg);}100%{transform:scale(1) rotate(0);opacity:1;}}
@keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
@keyframes countUp{from{transform:scale(.5) translateY(12px);opacity:0;}to{transform:scale(1) translateY(0);opacity:1;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes spinR{to{transform:rotate(-360deg);}}
@keyframes confFall{0%{transform:translateY(-10px) rotate(0);opacity:1;}100%{transform:translateY(110vh) rotate(var(--r,720deg));opacity:0;}}
@keyframes inkSpread{0%{transform:scale(0);opacity:.8;border-radius:50%;}100%{transform:scale(5);opacity:0;border-radius:40%;}}
@keyframes leafFall{0%{transform:translateY(-20px) rotate(var(--r0,0deg));opacity:1;}100%{transform:translateY(110vh) rotate(var(--r1,360deg));opacity:0;}}
@keyframes cloudDrift{from{transform:translateX(-30%);}to{transform:translateX(130%);}}
@keyframes boltFlash{0%,88%,100%{opacity:0;}89%,94%{opacity:1;}92%,96%{opacity:.3;}}
@keyframes sparkOut{0%{transform:scale(0) rotate(var(--r,0deg));opacity:1;}100%{transform:scale(1.8) rotate(var(--r,0deg));opacity:0;}}
@keyframes fwRing{0%{transform:scale(.2);opacity:.9;}100%{transform:scale(2.8);opacity:0;}}
@keyframes fwPetal{0%{transform:translate(0,0);opacity:1;}100%{transform:translate(var(--tx,0),var(--ty,0));opacity:0;}}
@keyframes sway{0%,100%{transform:rotate(-8deg);}50%{transform:rotate(8deg);}}
@keyframes orbitSpin{to{transform:rotate(360deg);}}
@keyframes orbitR{to{transform:rotate(-360deg);}}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(.3);}50%{opacity:1;transform:scale(1.4);}}
@keyframes goldRay{to{transform:rotate(360deg);}}
@keyframes ringExpand{0%{transform:scale(.2);opacity:.9;}100%{transform:scale(3.2);opacity:0;}}
@keyframes goldRain{0%{transform:translateY(-20px) rotate(var(--r0,0deg));opacity:1;}100%{transform:translateY(110vh) rotate(var(--r1,360deg));opacity:0;}}
@keyframes crownGlow{0%,100%{filter:drop-shadow(0 0 8px #F5C842) drop-shadow(0 0 24px #F59E0B);}50%{filter:drop-shadow(0 0 28px #F5C842) drop-shadow(0 0 70px #F59E0B) drop-shadow(0 0 120px #EF4444);}}
@keyframes eagleFly{from{transform:translateX(-120%);}to{transform:translateX(120%);}}
@keyframes logoGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(134,239,172,0.3));}50%{filter:drop-shadow(0 0 16px rgba(134,239,172,0.6)) drop-shadow(0 0 32px rgba(134,239,172,0.3));}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
`;

const PARENT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body{font-family:'Noto Sans SC',sans-serif;background:#F7F3EE;color:#2D2416;min-height:100vh;-webkit-tap-highlight-color:transparent;}
::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.1);border-radius:3px;}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 10%,rgba(210,180,140,0.25),transparent 50%),radial-gradient(ellipse at 80% 90%,rgba(180,160,120,0.2),transparent 50%);pointer-events:none;z-index:0;}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
@keyframes countUp{from{transform:scale(.5);opacity:0;}to{transform:scale(1);opacity:1;}}
@keyframes logoFadeIn{from{opacity:0;transform:scale(0.9);}to{opacity:1;transform:scale(1);}}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
@keyframes spin{to{transform:rotate(360deg);}}
.pcard{background:rgba(255,255,255,0.72);backdrop-filter:blur(12px);border:1px solid rgba(139,105,20,0.15);border-radius:16px;box-shadow:0 2px 16px rgba(0,0,0,0.06);}
.pwarm{background:linear-gradient(135deg,rgba(255,252,240,0.9),rgba(255,248,225,0.9));border:1px solid rgba(139,105,20,0.2);border-radius:16px;box-shadow:0 4px 20px rgba(139,105,20,0.08);}
.upload-zone{border:2px dashed rgba(139,105,20,0.3);border-radius:14px;padding:28px;text-align:center;background:rgba(255,248,220,0.4);cursor:pointer;}
.upload-zone.drag{border-color:rgba(139,105,20,0.6);background:rgba(255,248,220,0.7);}
.notif-dot{width:7px;height:7px;background:#EF4444;border-radius:50%;position:absolute;top:-1px;right:-1px;animation:pulse 1.5s ease-in-out infinite;}
`;

// ═══════════════════════════════════════════════════
// TIER BG ANIMATIONS
// ═══════════════════════════════════════════════════
function LvBg1({c}){
  const lv=["🍃","🌿","🌱","✿"];
  const lf=Array.from({length:12},(_,i)=>({l:`${5+R()*88}%`,d:`${R()*2.5}s`,u:`${2.5+R()*1.5}s`,r0:`${(R()-.5)*40}deg`,r1:`${(R()-.5)*200}deg`,e:lv[i%4],s:12+R()*12}));
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",borderRadius:"inherit"}}>
    {[0,1,2].map(i=><div key={i} style={{position:"absolute",top:"50%",left:"50%",width:100,height:100,marginLeft:-50,marginTop:-50,background:`${c}44`,animation:`inkSpread ${2+i*.5}s ease-out ${i*.4}s infinite`}}/>)}
    {lf.map((p,i)=><div key={i} style={{position:"absolute",left:p.l,top:-30,fontSize:p.s,"--r0":p.r0,"--r1":p.r1,animation:`leafFall ${p.u} ease-in ${p.d} infinite`}}>{p.e}</div>)}
  </div>;
}
function LvBg2({c}){
  const cs=Array.from({length:5},(_,i)=>({t:`${8+i*18}%`,d:`${i*.6}s`,u:`${3.5+i*.7}s`,o:.2+i*.05}));
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",borderRadius:"inherit"}}>
    <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 30%,${c}22,transparent 70%)`}}/>
    {cs.map((x,i)=><div key={i} style={{position:"absolute",top:x.t,left:0,right:0,height:2,background:`linear-gradient(to right,transparent,${c},transparent)`,opacity:x.o,animation:`cloudDrift ${x.u} ease-in-out ${x.d} infinite`}}/>)}
  </div>;
}
function LvBg3({c}){
  const bolts=Array.from({length:5},(_,i)=>({l:`${8+i*18}%`,d:`${i*.6+R()*.3}s`,u:`${.7+R()*.4}s`}));
  const sparks=Array.from({length:14},(_,i)=>({l:`${R()*100}%`,t:`${R()*100}%`,r:`${R()*360}deg`,d:`${R()*2}s`,s:4+R()*7}));
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",borderRadius:"inherit"}}>
    {bolts.map((b,i)=><div key={i} style={{position:"absolute",left:b.l,top:0,width:2,height:"100%",background:`linear-gradient(to bottom,transparent,${c},#fff,${c},transparent)`,animation:`boltFlash ${b.u} ease-in-out ${b.d} infinite`,filter:"blur(1px)"}}/>)}
    {sparks.map((s,i)=><div key={i} style={{position:"absolute",left:s.l,top:s.t,width:s.s,height:s.s,borderRadius:"50%",background:c,"--r":s.r,animation:`sparkOut 1.2s ease-out ${s.d} infinite`}}/>)}
  </div>;
}
function LvBg4({c}){
  const fw=["#F5C842","#EF4444","#F97316","#EC4899","#fff"];
  const rings=Array.from({length:8},(_,i)=>({l:`${10+R()*80}%`,t:`${8+R()*70}%`,d:`${R()*2.5}s`,u:`${1+R()*.8}s`,fc:fw[i%5]}));
  const petals=Array.from({length:16},(_,i)=>({l:`${20+R()*60}%`,t:`${20+R()*50}%`,tx:`${(R()-.5)*80}px`,ty:`${(R()-.5)*80}px`,d:`${R()*2.5}s`,fc:fw[i%5],s:4+R()*6}));
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",borderRadius:"inherit"}}>
    {rings.map((r,i)=><div key={i} style={{position:"absolute",left:r.l,top:r.t,width:24,height:24,marginLeft:-12,marginTop:-12,borderRadius:"50%",border:`2px solid ${r.fc}`,animation:`fwRing ${r.u} ease-out ${r.d} infinite`}}/>)}
    {petals.map((p,i)=><div key={i} style={{position:"absolute",left:p.l,top:p.t,width:p.s,height:p.s,borderRadius:"50%",background:p.fc,"--tx":p.tx,"--ty":p.ty,animation:`fwPetal 1.4s ease-out ${p.d} infinite`}}/>)}
  </div>;
}
function LvBg5({c}){
  const stars=Array.from({length:24},(_,i)=>({l:`${R()*100}%`,t:`${R()*100}%`,s:2+R()*5,d:`${R()*4}s`,u:`${.6+R()*1.4}s`}));
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",borderRadius:"inherit"}}>
    <div style={{position:"absolute",inset:"-50%",background:`conic-gradient(from 0deg,transparent,${c}18 90deg,transparent 180deg,${c}12 270deg,transparent)`,animation:"goldRay 6s linear infinite"}}/>
    {[55,82,112].map((r,i)=><div key={i} style={{position:"absolute",top:"50%",left:"50%",width:r*2,height:r*2,marginLeft:-r,marginTop:-r,borderRadius:"50%",border:`1px solid ${c}${i===0?"55":"33"}`,animation:`${i%2===0?"orbitSpin":"orbitR"} ${5+i*2}s linear infinite`}}/>)}
    {stars.map((s,i)=><div key={i} style={{position:"absolute",left:s.l,top:s.t,width:s.s,height:s.s,borderRadius:"50%",background:c,boxShadow:`0 0 6px ${c}`,animation:`twinkle ${s.u} ease-in-out ${s.d} infinite`}}/>)}
    <div style={{position:"absolute",top:"6%",fontSize:26,animation:"eagleFly 3.5s ease-in-out .6s infinite"}}>🦅</div>
  </div>;
}
function LvBg6({c}){
  const stars=Array.from({length:32},(_,i)=>({l:`${R()*100}%`,t:`${R()*100}%`,s:2+R()*6,d:`${R()*4}s`,u:`${.4+R()*1.2}s`}));
  const rain=["⭐","✨","💫","🌟","👑","⚡","💎"].map((e,i)=>({e,l:`${3+i*13}%`,d:`${R()*3}s`,u:`${2+R()*1.5}s`,r0:`${(R()-.5)*30}deg`,r1:`${(R()-.5)*120}deg`,s:12+R()*12}));
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",borderRadius:"inherit"}}>
    <div style={{position:"absolute",inset:"-60%",background:`conic-gradient(from 0deg,transparent,${c}22,transparent,${c}14,transparent,${c}18,transparent)`,animation:"goldRay 4s linear infinite",opacity:.7}}/>
    {[38,66,96,136].map((r,i)=><div key={i} style={{position:"absolute",top:"50%",left:"50%",width:r*2,height:r*2,marginLeft:-r,marginTop:-r,borderRadius:"50%",border:`${i===0?2:1}px solid ${c}${i===0?"66":"33"}`,animation:`ringExpand ${1.8+i*.5}s ease-out ${i*.4}s infinite`}}/>)}
    {stars.map((s,i)=><div key={i} style={{position:"absolute",left:s.l,top:s.t,width:s.s,height:s.s,borderRadius:"50%",background:c,boxShadow:`0 0 10px ${c}`,animation:`twinkle ${s.u} ease-in-out ${s.d} infinite`}}/>)}
    {rain.map((p,i)=><div key={i} style={{position:"absolute",left:p.l,top:-30,fontSize:p.s,"--r0":p.r0,"--r1":p.r1,animation:`goldRain ${p.u} ease-in ${p.d} infinite`}}>{p.e}</div>)}
  </div>;
}
function TierBg({lv,color}){
  if(lv<=2) return <LvBg1 c={color}/>;
  if(lv===3) return <LvBg2 c={color}/>;
  if(lv===4) return <LvBg3 c={color}/>;
  if(lv===5) return <LvBg4 c={color}/>;
  if(lv<=7)  return <LvBg5 c={color}/>;
  return <LvBg6 c={color}/>;
}

// ═══════════════════════════════════════════════════
// CONFETTI
// ═══════════════════════════════════════════════════
function Confetti({active,lv}){
  if(!active) return null;
  const cnt=[20,30,42,56,72,90,110,130,160][Math.min(lv-1,8)];
  const pals=[["#94A3B8","#CBD5E1","#fff"],["#86EFAC","#A3E635","#fff"],["#34D399","#10B981","#fff"],["#F59E0B","#FCD34D","#fff"],["#F97316","#F5C842","#EF4444","#fff"],["#C084FC","#A855F7","#F5C842","#fff","#EC4899"],["#F5C842","#FDE68A","#F59E0B","#EF4444","#fff"],["#FB923C","#F5C842","#EF4444","#fff","#C084FC"],["#E879F9","#F5C842","#fff","#EF4444","#EC4899","#C084FC"]];
  const colors=pals[Math.min(lv-1,8)];
  return <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:9997,overflow:"hidden"}}>
    {Array.from({length:cnt},(_,i)=>{
      const s=lv>=7?7+R()*14:5+R()*10;
      return <div key={i} style={{position:"absolute",left:`${5+R()*90}%`,top:-20,width:s,height:s,background:colors[i%colors.length],borderRadius:["50%","3px","50%","0"][i%4],animation:`confFall ${1.5+R()*2.5}s ease-in ${R()*.9}s forwards`,"--r":`${(R()>.5?1:-1)*(360+R()*720)}deg`,boxShadow:lv>=6?`0 0 5px ${colors[i%colors.length]}`:"none"}}/>;
    })}
  </div>;
}

// ═══════════════════════════════════════════════════
// CELEBRATION MODAL
// ═══════════════════════════════════════════════════
const CEL_CFG=[
  {blur:5,maxW:360,eS:"2.8rem",tS:"1.2rem",nS:"1.5rem",pS:"2.4rem",btn:"✨ 继续加油！",bg:"linear-gradient(135deg,#3B82F6,#64748B)"},
  {blur:6,maxW:370,eS:"3rem",  tS:"1.3rem",nS:"1.6rem",pS:"2.6rem",btn:"✨ 继续加油！",bg:"linear-gradient(135deg,#10B981,#3B82F6)"},
  {blur:7,maxW:380,eS:"3.2rem",tS:"1.35rem",nS:"1.7rem",pS:"2.8rem",btn:"💨 乘势而上！",bg:"linear-gradient(135deg,#34D399,#3B82F6)"},
  {blur:8,maxW:390,eS:"3.4rem",tS:"1.45rem",nS:"1.9rem",pS:"3.1rem",btn:"⚡ 继续冲刺！",bg:"linear-gradient(135deg,#F59E0B,#EF4444)"},
  {blur:9,maxW:400,eS:"3.7rem",tS:"1.55rem",nS:"2rem",  pS:"3.5rem",btn:"🏮 再接再厉！",bg:"linear-gradient(135deg,#F97316,#F5C842)"},
  {blur:10,maxW:420,eS:"4rem", tS:"1.7rem",nS:"2.2rem", pS:"3.9rem",btn:"🦅 凌云而上！",bg:"linear-gradient(135deg,#C084FC,#8B5CF6,#3B82F6)"},
  {blur:12,maxW:430,eS:"4.3rem",tS:"1.85rem",nS:"2.4rem",pS:"4.3rem",btn:"👑 书写荣耀！",bg:"linear-gradient(135deg,#F5C842,#F59E0B,#EF4444)"},
  {blur:14,maxW:440,eS:"4.6rem",tS:"2rem",nS:"2.6rem",pS:"4.8rem",btn:"🏛️ 翰林之路！",bg:"linear-gradient(135deg,#FB923C,#F5C842,#EF4444,#C084FC)"},
  {blur:16,maxW:460,eS:"5rem", tS:"2.2rem",nS:"2.9rem",pS:"5.4rem",btn:"🌟 宗匠降临！",bg:"linear-gradient(135deg,#E879F9,#F5C842,#EF4444,#F5C842,#E879F9)"},
];
const TITLE_TX=["里程碑达成！","初显风采！","✦ 称号晋升！","⚡ 等级突破！","🎆 荣耀晋阶！","🌌 传说降临！","✨ 书将加冕！","🏛️ 翰林入列！","🌟 宗匠诞生！！"];
const CARD_BGS=["linear-gradient(160deg,#0e151e,#080C14)","linear-gradient(160deg,#0f1e14,#080C14)","linear-gradient(160deg,#0a1f18,#080C14)","linear-gradient(160deg,#1f1700,#080C14)","linear-gradient(160deg,#1f0d00,#080C14)","linear-gradient(160deg,#160020,#080C14)","linear-gradient(160deg,#221600,#1a0e00,#080C14)","linear-gradient(160deg,#2a1200,#1a0800,#080C14)","linear-gradient(160deg,#2a003a,#1a0020,#080C14)"];

function CelebrationModal({item,onClose}){
  const [vis,setVis]=useState(false);
  const [showConf,setShowConf]=useState(false);
  useEffect(()=>{ if(item){requestAnimationFrame(()=>setTimeout(()=>setVis(true),30));setShowConf(true);}else{setVis(false);setShowConf(false);} },[item]);
  if(!item) return null;
  const {student,newLevel,pts}=item;
  const lv=newLevel.lv, cfg=CEL_CFG[Math.min(lv-1,8)], c=newLevel.color, idx=Math.min(lv-1,8);
  return <>
    <Confetti active={showConf} lv={lv}/>
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:`rgba(0,0,0,${.72+idx*.025})`,backdropFilter:`blur(${cfg.blur}px)`}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:CARD_BGS[idx],border:`1px solid ${c}${lv>=6?"88":"55"}`,boxShadow:`0 0 ${30+idx*12}px ${c}44, 0 30px 60px rgba(0,0,0,.8)`,borderRadius:lv>=6?28:22,padding:lv>=7?"44px 30px 36px":"34px 26px 28px",textAlign:"center",maxWidth:cfg.maxW,width:"88%",position:"relative",overflow:"hidden",transform:vis?"scale(1)":"scale(0.5)",opacity:vis?1:0,transition:"transform .55s cubic-bezier(0.34,1.56,0.64,1), opacity .3s"}}>
        <TierBg lv={lv} color={c}/>
        <div style={{position:"relative",zIndex:2}}>
          {lv>=4&&<div style={{display:"inline-flex",alignItems:"center",gap:5,background:`${c}22`,border:`1px solid ${c}55`,borderRadius:20,padding:"3px 14px",marginBottom:12,fontSize:".75rem",fontWeight:700,color:c}}>Lv.{lv} {newLevel.name}</div>}
          <div style={{fontSize:cfg.eS,marginBottom:10,display:"inline-block",animation:lv>=7?"crownGlow 1.8s ease-in-out infinite":"popIn .6s cubic-bezier(0.34,1.56,0.64,1) both"}}>{newLevel.emoji}</div>
          <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:cfg.tS,marginBottom:8,background:lv>=5?`linear-gradient(135deg,${c},#fff,${c})`:`linear-gradient(135deg,${c},#ffffffcc)`,backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:lv>=5?"shimmer 2.5s linear infinite":"none"}}>{TITLE_TX[idx]}</div>
          <div style={{fontFamily:"'Ma Shan Zheng',serif",fontSize:cfg.nS,fontWeight:900,marginBottom:6,textShadow:lv>=6?`0 0 25px ${c}88`:"none"}}>{student.name}</div>
          <div style={{fontSize:cfg.pS,fontWeight:900,color:c,lineHeight:1,marginBottom:4,textShadow:`0 0 ${20+idx*12}px ${c}`,animation:"countUp .55s cubic-bezier(0.34,1.56,0.64,1) .15s both"}}>{fmt(pts)}</div>
          <div style={{fontSize:".72rem",color:"#475569",marginBottom:16}}>累计积分</div>
          <div style={{background:`${c}18`,border:`1px solid ${c}44`,borderRadius:12,padding:"10px 14px",marginBottom:22,fontSize:lv>=6?".88rem":".8rem",lineHeight:1.55,color:c,fontWeight:600}}>
            <div>{newLevel.emoji} Lv.{lv} {newLevel.name}</div>
            <div style={{fontSize:".7rem",color:`${c}bb`,marginTop:3,fontWeight:400}}>积分范围 {fmt(newLevel.min)}–{newLevel.max===Infinity?"∞":fmt(newLevel.max)}</div>
          </div>
          <button onClick={onClose} onTouchStart={onClose} style={{width:"100%",padding:lv>=6?16:13,fontSize:lv>=6?"1.05rem":".95rem",fontWeight:700,border:"none",borderRadius:12,cursor:"pointer",touchAction:"manipulation",background:cfg.bg,backgroundSize:"200% auto",animation:lv>=5?"shimmer 2s linear infinite":"none",color:"#fff",boxShadow:lv>=5?`0 4px 20px ${c}55`:"none"}}>{cfg.btn}</button>
        </div>
      </div>
    </div>
  </>;
}

// ═══════════════════════════════════════════════════
// SHARED ATOMS
// ═══════════════════════════════════════════════════
const TC={ bg0:"#080C14",bg1:"#0D1320",bg2:"#111827",bg3:"#1a2235",border:"rgba(255,255,255,0.07)",gold:"#F5C842",green:"#10B981",red:"#EF4444",blue:"#3B82F6",purple:"#8B5CF6",text:"#E2E8F0",text2:"#64748B",text3:"#94A3B8" };
const tcard=(e={})=>({background:TC.bg2,border:`1px solid ${TC.border}`,borderRadius:18,padding:20,...e});
const tinp=()=>({background:TC.bg3,border:`1px solid ${TC.border}`,borderRadius:10,color:TC.text,padding:"10px 14px",fontSize:".9rem",fontFamily:"inherit",outline:"none",width:"100%"});
const tbtn=(bg,col="#fff",e={})=>({padding:"10px 18px",border:"none",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:".88rem",background:bg,color:col,touchAction:"manipulation",...e});

function TLvBadge({pts,small}){
  const lv=getLevel(pts);
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:lv.bg,border:`1px solid ${lv.color}55`,color:lv.color,borderRadius:20,padding:small?"2px 8px":"4px 12px",fontSize:small?".68rem":".76rem",fontWeight:700,whiteSpace:"nowrap"}}>{lv.emoji} Lv.{lv.lv} {lv.name}</span>;
}
function TAvatar({student,size=44}){
  return <div style={{width:size,height:size,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.4,background:`${student.color}22`,color:student.color,border:`2px solid ${student.color}44`,flexShrink:0}}>{student.avatar||student.name?.slice(-2)||"?"}</div>;
}
function TProgressBar({pts,lv,next,color}){
  if(!next) return <div style={{textAlign:"center",fontSize:".78rem",color:TC.gold}}>👑 已达最高称号！</div>;
  const pct=Math.min(100,Math.round((pts-lv.min)/(next.min-lv.min)*100));
  return <>
    <div style={{display:"flex",justifyContent:"space-between",fontSize:".7rem",color:TC.text2,marginBottom:4}}><span>距【{next.name}】还差 {fmt(next.min-pts)} 分</span><span>{pct}%</span></div>
    <div style={{background:"rgba(255,255,255,0.07)",borderRadius:4,height:5,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",borderRadius:4,background:`linear-gradient(to right,${color},${next.color})`,transition:"width .6s"}}/></div>
  </>;
}
function TModal({open,onClose,title,children}){
  if(!open) return null;
  return <div style={{position:"fixed",inset:0,zIndex:800,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{background:TC.bg1,border:`1px solid ${TC.border}`,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:500,maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}><div style={{width:36,height:3,background:"rgba(255,255,255,0.15)",borderRadius:2}}/></div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px 10px",flexShrink:0}}>
        <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1.1rem",color:TC.gold}}>{title}</div>
        <button onClick={onClose} style={{...tbtn("rgba(255,255,255,0.06)",TC.text2),width:28,height:28,padding:0,borderRadius:"50%",fontSize:".9rem"}}>✕</button>
      </div>
      <div style={{overflowY:"auto",padding:"0 20px 28px",flex:1}}>{children}</div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════
// TEACHER APP
// ═══════════════════════════════════════════════════
function TeacherApp({onBack}){
  const [students,setStudents]=useState(()=>lsGet(LS_STUDENTS,[]));
  const [history,setHistory]=useState(()=>lsGet(LS_HISTORY,[]));
  const [redeems,setRedeems]=useState(()=>lsGet(LS_REDEEMS,[]));
  const [tab,setTab]=useState("home");
  const [celQueue,setCelQueue]=useState([]);
  const [addModal,setAddModal]=useState(false);
  const [editStudent,setEditStudent]=useState(null);
  const [detailStudent,setDetailStudent]=useState(null);
  const [addPtsModal,setAddPtsModal]=useState(null);
  const [shopModal,setShopModal]=useState(false);
  const [shopStudent,setShopStudent]=useState(null);
  const [form,setForm]=useState({name:"",avatar:"",color:""});
  const [customPts,setCustomPts]=useState(0);
  const [customNote,setCustomNote]=useState("");
  const [customTeacher,setCustomTeacher]=useState("");
  const [hwCount,setHwCount]=useState(0);
  const [lbTab,setLbTab]=useState("total");
  const [pendingHw,setPendingHw]=useState([]);

  useEffect(()=>lsSet(LS_STUDENTS,students),[students]);
  useEffect(()=>lsSet(LS_HISTORY,history),[history]);
  useEffect(()=>lsSet(LS_REDEEMS,redeems),[redeems]);
  useEffect(()=>{ const hw=lsGet(LS_HW,[]); setPendingHw(hw.filter(h=>h.status==="pending")); },[tab]);

  const sorted=[...students].sort((a,b)=>(b.points||0)-(a.points||0));
  const mk=currentMonthKey();
  const monthMap=useCallback(()=>{ const m={}; students.forEach(s=>m[s.id]=0); history.forEach(h=>{ if(monthKey(h.time)===mk&&m[h.studentId]!==undefined) m[h.studentId]+=h.pts; }); return m; },[students,history,mk])();
  const prevMK=(()=>{ const d=new Date(); d.setMonth(d.getMonth()-1); return `${d.getFullYear()}-${d.getMonth()}`; })();
  const prevMap=useCallback(()=>{ const m={}; students.forEach(s=>m[s.id]=0); history.forEach(h=>{ if(monthKey(h.time)===prevMK&&m[h.studentId]!==undefined) m[h.studentId]+=h.pts; }); return m; },[students,history])();

  function openAdd(){ setForm({name:"",avatar:AVATAR_EMOJIS[Math.floor(R()*16)],color:STUDENT_COLORS[students.length%12]}); setAddModal(true); }
  function openEdit(s){ setEditStudent(s); setForm({name:s.name,avatar:s.avatar||"",color:s.color||STUDENT_COLORS[0]}); }
  function saveStudent(){
    if(!form.name.trim()) return;
    if(addModal){ const ns={id:genId(),name:form.name.trim(),avatar:form.avatar,color:form.color,points:0,achievedLevels:[]}; setStudents(p=>[...p,ns]); setAddModal(false); }
    else{ setStudents(p=>p.map(s=>s.id===editStudent.id?{...s,...form,name:form.name.trim()}:s)); setEditStudent(null); }
  }
  function deleteStudent(id){ if(!confirm("确认删除？"))return; setStudents(p=>p.filter(s=>s.id!==id)); setHistory(p=>p.filter(h=>h.studentId!==id)); }

  function applyPoints(student,pts,reason,note="",teacher=""){
    if(!pts) return;
    const prev=student.points||0, npts=Math.max(0,prev+pts);
    const rec={id:genId(),studentId:student.id,studentName:student.name,pts,reason,note,teacher,time:new Date().toISOString(),total:npts};
    const achieved=[...(student.achievedLevels||[])];
    const prevLv=getLevel(prev), newLv=getLevel(npts);
    const newCel=[];
    if(newLv.lv>prevLv.lv){ for(let lv=prevLv.lv+1;lv<=newLv.lv;lv++){ const ld=LEVELS.find(l=>l.lv===lv); if(ld&&!achieved.includes(lv)){ achieved.push(lv); newCel.push({student:{...student,points:npts},newLevel:ld,pts:npts}); } } }
    const prevH=Math.floor(prev/100), newH=Math.floor(npts/100);
    for(let h=prevH+1;h<=newH;h++){ const t=h*100,ak=`pts_${t}`; if(!achieved.includes(ak)){ achieved.push(ak); const ld=getLevel(t); newCel.push({student:{...student,points:npts},newLevel:ld,pts:npts}); } }
    setStudents(p=>p.map(s=>s.id===student.id?{...s,points:npts,achievedLevels:achieved}:s));
    setHistory(p=>[rec,...p]);
    if(newCel.length) setCelQueue(q=>[...q,...newCel]);
  }

  function submitAddPts(){
    if(!addPtsModal) return;
    const hwPts=(parseInt(hwCount)||0)*2, total=(parseInt(customPts)||0)+hwPts;
    if(!total) return;
    applyPoints(addPtsModal,total,customNote||(total>0?"加分":"扣分"),hwCount>0?`作业${hwCount}张(+${hwPts}分)`:"",customTeacher);
    setAddPtsModal(null); setCustomPts(0); setCustomNote(""); setCustomTeacher(""); setHwCount(0);
  }
  function redeemItem(student,item){
    if((student.points||0)<item.cost){ alert("积分不足！"); return; }
    if(!confirm(`确认为 ${student.name} 兑换「${item.name}」(${item.cost}分)？`)) return;
    applyPoints(student,-item.cost,`兑换：${item.name}`);
    setRedeems(p=>[{id:genId(),studentId:student.id,studentName:student.name,itemName:item.name,cost:item.cost,time:new Date().toISOString()},...p]);
  }
  function approveHw(hwId,studentId,approve){
    const hw=lsGet(LS_HW,[]); const updated=hw.map(h=>h.id!==hwId?h:{...h,status:approve?"approved":"rejected",reviewedAt:new Date().toISOString()});
    lsSet(LS_HW,updated);
    if(approve){ const s=students.find(x=>x.id===studentId); if(s) applyPoints(s,2,"家长上传作业","老师已审核","系统"); }
    setPendingHw(p=>p.filter(h=>h.id!==hwId)); alert(approve?"已批准！已为学生加 2 分":"已拒绝");
  }

  const tabs=[{k:"home",icon:"🏠",label:"首页"},{k:"input",icon:"✍️",label:"录入"},{k:"leaderboard",icon:"🏆",label:"排行"},{k:"shop",icon:"🛍️",label:"商城"},{k:"students",icon:"👥",label:"学生"},{k:"export",icon:"📤",label:"导出"}];

  return <>
    <style>{TEACHER_CSS}</style>
    <CelebrationModal item={celQueue[0]} onClose={()=>setCelQueue(q=>q.slice(1))}/>

    {/* Add/Edit Student Modal */}
    <TModal open={addModal||!!editStudent} onClose={()=>{setAddModal(false);setEditStudent(null);}} title={addModal?"添加学生":"编辑学生"}>
      <div style={{marginBottom:12}}><div style={{fontSize:".75rem",color:TC.text2,marginBottom:5}}>学生姓名</div><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="输入姓名" style={tinp()} onKeyDown={e=>e.key==="Enter"&&saveStudent()}/></div>
      <div style={{marginBottom:12}}><div style={{fontSize:".75rem",color:TC.text2,marginBottom:8}}>选择头像</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{AVATAR_EMOJIS.map(e=><button key={e} onClick={()=>setForm(f=>({...f,avatar:e}))} style={{width:40,height:40,borderRadius:10,border:`2px solid ${form.avatar===e?TC.gold:TC.border}`,background:form.avatar===e?"rgba(245,200,66,0.12)":TC.bg3,fontSize:"1.3rem",cursor:"pointer"}}>{e}</button>)}</div></div>
      <div style={{marginBottom:20}}><div style={{fontSize:".75rem",color:TC.text2,marginBottom:8}}>选择颜色</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{STUDENT_COLORS.map(cl=><button key={cl} onClick={()=>setForm(f=>({...f,color:cl}))} style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${form.color===cl?"#fff":TC.border}`,background:cl,cursor:"pointer"}}/>)}</div></div>
      <button onClick={saveStudent} style={{...tbtn(`linear-gradient(135deg,${TC.blue},${TC.purple})`),width:"100%",padding:13}}>✅ 保存</button>
    </TModal>

    {/* Student Detail Modal */}
    <TModal open={!!detailStudent} onClose={()=>setDetailStudent(null)} title={detailStudent?`${detailStudent.name} 的档案`:""}>
      {detailStudent&&(()=>{
        const s=students.find(x=>x.id===detailStudent.id)||detailStudent;
        const pts=s.points||0, lv=getLevel(pts), next=getNextLevel(pts);
        const mPts=monthMap[s.id]||0;
        const hist=history.filter(h=>h.studentId===s.id);
        return <>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,padding:14,background:TC.bg3,borderRadius:14}}>
            <TAvatar student={s} size={56}/>
            <div style={{flex:1}}><div style={{fontSize:"1.15rem",fontWeight:700,fontFamily:"'Ma Shan Zheng',serif"}}>{s.name}</div><TLvBadge pts={pts}/></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:"1.6rem",fontWeight:900,color:TC.gold}}>{fmt(pts)}</div><div style={{fontSize:".7rem",color:TC.text2}}>累计积分</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[["本月积分",fmt(mPts),TC.green],["历史记录",`${hist.length} 条`,TC.blue]].map(([l,v,c])=><div key={l} style={{background:TC.bg3,borderRadius:12,padding:"12px 14px",textAlign:"center"}}><div style={{fontSize:"1.2rem",fontWeight:700,color:c}}>{v}</div><div style={{fontSize:".7rem",color:TC.text2,marginTop:2}}>{l}</div></div>)}
          </div>
          <div style={{marginBottom:16}}><TProgressBar pts={pts} lv={lv} next={next} color={lv.color}/></div>
          <div style={{fontSize:".72rem",color:TC.text2,marginBottom:10,textTransform:"uppercase",letterSpacing:".1em"}}>积分记录</div>
          {hist.map(h=>{ const plus=h.pts>=0; return <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:TC.bg3,borderRadius:10,marginBottom:6}}><div style={{width:7,height:7,borderRadius:"50%",background:plus?TC.green:TC.red,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:".84rem"}}>{h.reason}{h.note?<span style={{color:TC.text2,fontSize:".75rem"}}> · {h.note}</span>:""}</div><div style={{fontSize:".68rem",color:TC.text2,marginTop:1}}>{fmtDate(h.time)}{h.teacher?` · ${h.teacher}`:""}</div></div><div style={{fontWeight:700,fontSize:".9rem",color:plus?TC.green:TC.red,whiteSpace:"nowrap"}}>{plus?"+":""}{h.pts}</div></div>; })}
        </>;
      })()}
    </TModal>

    {/* Add Points Modal */}
    <TModal open={!!addPtsModal} onClose={()=>{setAddPtsModal(null);setCustomPts(0);setCustomNote("");setCustomTeacher("");setHwCount(0);}} title={addPtsModal?`给 ${addPtsModal.name} 录入积分`:"录入积分"}>
      {addPtsModal&&<>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:TC.bg3,borderRadius:12,marginBottom:14}}>
          <TAvatar student={addPtsModal} size={42}/><div style={{flex:1}}><div style={{fontWeight:700}}>{addPtsModal.name}</div><TLvBadge pts={addPtsModal.points||0} small/></div><div style={{color:TC.gold,fontWeight:900,fontSize:"1.1rem"}}>{fmt(addPtsModal.points||0)}</div>
        </div>
        <div style={{marginBottom:12}}><div style={{fontSize:".72rem",color:TC.text2,marginBottom:7}}>⚡ 快捷加分</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>{QUICK_ADD.map(q=><button key={q.label} onClick={()=>{setCustomPts(q.pts);setCustomNote(q.label);}} style={{...tbtn(customNote===q.label?"rgba(16,185,129,0.2)":TC.bg3,customNote===q.label?TC.green:TC.text3),border:`1px solid ${customNote===q.label?"rgba(16,185,129,0.4)":TC.border}`,padding:"6px 8px",fontSize:".76rem",textAlign:"left",borderRadius:9}}>{q.icon} +{q.pts} {q.label}</button>)}</div></div>
        <div style={{marginBottom:12}}><div style={{fontSize:".72rem",color:TC.text2,marginBottom:7}}>📋 待改进</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>{QUICK_DEDUCT.map(q=><button key={q.label} onClick={()=>{setCustomPts(q.pts);setCustomNote(q.label);}} style={{...tbtn(customNote===q.label?"rgba(239,68,68,0.18)":TC.bg3,customNote===q.label?TC.red:TC.text3),border:`1px solid ${customNote===q.label?"rgba(239,68,68,0.4)":TC.border}`,padding:"6px 8px",fontSize:".76rem",textAlign:"left",borderRadius:9}}>{q.icon} {q.pts} {q.label}</button>)}</div></div>
        <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:12,padding:"10px 14px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><div style={{fontSize:".82rem",fontWeight:600,color:TC.green}}>📋 作业张数</div><div style={{fontSize:".68rem",color:TC.text2,marginTop:1}}>每张 +2 分</div></div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setHwCount(h=>Math.max(0,(parseInt(h)||0)-1))} style={{...tbtn("rgba(255,255,255,0.06)",TC.text),width:30,height:30,padding:0,borderRadius:7,fontSize:"1rem"}}>−</button>
              <div style={{textAlign:"center",minWidth:38}}><div style={{fontSize:"1.2rem",fontWeight:900,color:TC.green}}>{parseInt(hwCount)||0}</div>{hwCount>0&&<div style={{fontSize:".62rem",color:TC.green}}>+{(parseInt(hwCount)||0)*2}</div>}</div>
              <button onClick={()=>setHwCount(h=>(parseInt(h)||0)+1)} style={{...tbtn("rgba(16,185,129,0.15)",TC.green),width:30,height:30,padding:0,borderRadius:7,fontSize:"1rem"}}>+</button>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 90px",gap:8,marginBottom:10}}>
          <div><div style={{fontSize:".72rem",color:TC.text2,marginBottom:4}}>自定义积分</div><input type="number" value={customPts} onChange={e=>setCustomPts(e.target.value)} style={tinp()}/></div>
          <div><div style={{fontSize:".72rem",color:TC.text2,marginBottom:4}}>老师</div><input value={customTeacher} onChange={e=>setCustomTeacher(e.target.value)} placeholder="姓名" style={tinp()}/></div>
        </div>
        <div style={{marginBottom:12}}><div style={{fontSize:".72rem",color:TC.text2,marginBottom:4}}>备注原因</div><input value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="如：书法课·积极提问" style={tinp()}/></div>
        {(parseInt(customPts)||0)+(parseInt(hwCount)||0)*2!==0&&<div style={{background:TC.bg3,borderRadius:9,padding:"7px 12px",marginBottom:12,fontSize:".84rem",display:"flex",alignItems:"center",gap:8}}><span style={{color:TC.text2}}>预览：</span><span style={{fontWeight:700,color:((parseInt(customPts)||0)+(parseInt(hwCount)||0)*2)>=0?TC.green:TC.red,fontSize:".95rem"}}>{((parseInt(customPts)||0)+(parseInt(hwCount)||0)*2)>=0?"+":""}{(parseInt(customPts)||0)+(parseInt(hwCount)||0)*2} 分</span><span style={{color:TC.text2,fontSize:".75rem"}}>→ {fmt(Math.max(0,(addPtsModal.points||0)+(parseInt(customPts)||0)+(parseInt(hwCount)||0)*2))}</span></div>}
        <button onClick={submitAddPts} style={{...tbtn(`linear-gradient(135deg,${TC.blue},${TC.purple})`),width:"100%",padding:13,fontSize:"1rem"}}>✅ 确认录入</button>
      </>}
    </TModal>

    {/* Shop Modal */}
    <TModal open={shopModal} onClose={()=>{setShopModal(false);setShopStudent(null);}} title="积分兑换商城">
      <div style={{marginBottom:12}}><div style={{fontSize:".72rem",color:TC.text2,marginBottom:6}}>选择学生</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{sorted.map(s=><button key={s.id} onClick={()=>setShopStudent(shopStudent?.id===s.id?null:s)} style={{...tbtn(shopStudent?.id===s.id?`${s.color}33`:TC.bg3,shopStudent?.id===s.id?s.color:TC.text3),border:`1px solid ${shopStudent?.id===s.id?s.color+"55":TC.border}`,padding:"5px 12px",fontSize:".8rem",borderRadius:20}}>{s.avatar||s.name.slice(-2)} {s.name}</button>)}</div></div>
      {shopStudent&&<div style={{fontSize:".72rem",color:TC.gold,marginBottom:12,padding:"5px 10px",background:"rgba(245,200,66,0.08)",borderRadius:8}}>可用：⭐ {fmt(shopStudent.points||0)}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{SHOP_ITEMS.map(item=>{ const ok=shopStudent&&(shopStudent.points||0)>=item.cost; return <div key={item.id} style={{background:TC.bg3,border:`1px solid ${ok&&shopStudent?"rgba(245,200,66,0.25)":TC.border}`,borderRadius:12,padding:"12px 10px",textAlign:"center",opacity:shopStudent&&!ok?.5:1}}><div style={{fontSize:"1.6rem",marginBottom:4}}>{item.icon}</div><div style={{fontSize:".8rem",fontWeight:600,marginBottom:3}}>{item.name}</div><div style={{fontSize:".72rem",color:TC.gold,marginBottom:8}}>⭐ {fmt(item.cost)}</div><button onClick={()=>shopStudent&&redeemItem(shopStudent,item)} disabled={!shopStudent||!ok} style={{...tbtn(ok&&shopStudent?"linear-gradient(135deg,#F5C842,#F59E0B)":"rgba(255,255,255,0.04)",ok&&shopStudent?"#000":TC.text2),padding:"5px 0",fontSize:".72rem",width:"100%",borderRadius:7,opacity:ok?1:.5}}>{ok?"立即兑换":"积分不足"}</button></div>; })}</div>
    </TModal>

    {/* MAIN */}
    <div style={{maxWidth:600,margin:"0 auto"}}>
      {/* HEADER with LOGO */}
      <div style={{background:`linear-gradient(180deg,${TC.bg1},${TC.bg0})`,padding:"14px 16px 12px",position:"sticky",top:0,zIndex:100,borderBottom:`1px solid ${TC.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={onBack} style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${TC.border}`,background:"rgba(255,255,255,0.05)",color:TC.text2,fontSize:"1rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,flexShrink:0}} title="返回">‹</button>
          </div>
          <img src={LOGO_SRC} alt="研山书院" style={{position:"absolute",left:"50%",transform:"translateX(-50%)",height:"auto",width:130,maxWidth:130,objectFit:"contain",filter:"brightness(1.1)",opacity:.95,animation:"logoGlow 3s ease-in-out infinite"}}/>
          <div style={{display:"flex",gap:6}}>
            <button onClick={openAdd} style={{...tbtn("rgba(16,185,129,0.12)",TC.green),border:"1px solid rgba(16,185,129,0.3)",padding:"6px 12px",fontSize:".78rem",borderRadius:9}}>+ 学生</button>
            <button onClick={()=>setShopModal(true)} style={{...tbtn("rgba(245,200,66,0.1)",TC.gold),border:"1px solid rgba(245,200,66,0.25)",padding:"6px 12px",fontSize:".78rem",borderRadius:9}}>🛍️</button>
          </div>
        </div>
      </div>

      <div style={{padding:"14px 14px 90px",minHeight:"calc(100vh - 60px)",background:TC.bg0}}>

      {/* HOME */}
      {tab==="home"&&<div style={{animation:"fadeUp .3s ease"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
          {[["学生",students.length,TC.gold],["总积分",fmt(students.reduce((a,s)=>a+(s.points||0),0)),TC.blue],["最高分",fmt(sorted[0]?.points||0),TC.green]].map(([l,v,c])=><div key={l} style={{...tcard({padding:"12px 10px",textAlign:"center"}),}}><div style={{fontSize:"1.4rem",fontWeight:900,color:c}}>{v}</div><div style={{fontSize:".62rem",color:TC.text2,marginTop:2,textTransform:"uppercase",letterSpacing:".08em"}}>{l}</div></div>)}
        </div>
        {pendingHw.length>0&&<div style={{...tcard({padding:"12px 14px",marginBottom:12,border:"1.5px solid rgba(239,68,68,0.3)"})}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{position:"relative"}}><span>📬</span><div style={{position:"absolute",top:-2,right:-2,width:7,height:7,background:TC.red,borderRadius:"50%",animation:"pulse 1.5s infinite"}}/></div><div style={{fontWeight:700,color:TC.red,fontSize:".9rem"}}>待审核作业 ({pendingHw.length})</div></div>
          {pendingHw.slice(0,2).map(hw=><div key={hw.id} style={{background:TC.bg3,borderRadius:10,padding:10,marginBottom:6}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <img src={hw.imageData} alt="作业" style={{width:60,height:60,borderRadius:8,objectFit:"cover",border:`1px solid ${TC.border}`,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:".85rem"}}>{hw.studentName}</div><div style={{fontSize:".68rem",color:TC.text2}}>{fmtDate(hw.uploadedAt)}</div>{hw.note&&<div style={{fontSize:".72rem",color:TC.text3,marginTop:2}}>{hw.note}</div>}
                <div style={{display:"flex",gap:5,marginTop:7}}><button onClick={()=>approveHw(hw.id,hw.studentId,true)} style={{flex:1,padding:"5px 0",background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",border:"none",borderRadius:7,fontSize:".75rem",fontWeight:600,cursor:"pointer"}}>✅ 批准 +2分</button><button onClick={()=>approveHw(hw.id,hw.studentId,false)} style={{flex:1,padding:"5px 0",background:"rgba(239,68,68,0.1)",color:TC.red,border:`1px solid rgba(239,68,68,0.3)`,borderRadius:7,fontSize:".75rem",cursor:"pointer"}}>❌ 拒绝</button></div>
              </div>
            </div>
          </div>)}
        </div>}
        {!students.length?<div style={{textAlign:"center",padding:"40px 0",color:TC.text2}}><div style={{fontSize:"2.5rem",marginBottom:10}}>📜</div><div>尚无学生，点击右上角「+ 学生」开始</div></div>
          :sorted.map(s=>{ const pts=s.points||0, lv=getLevel(pts), next=getNextLevel(pts), mPts=monthMap[s.id]||0;
          return <div key={s.id} style={{...tcard({padding:0,marginBottom:10,overflow:"hidden"})}}>
            <div style={{position:"relative",padding:"13px 14px 11px"}}>
              <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:lv.color,borderRadius:"18px 0 0 18px"}}/>
              <div style={{display:"flex",alignItems:"center",gap:10,paddingLeft:6}}>
                <TAvatar student={s} size={44}/>
                <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}><span style={{fontFamily:"'Ma Shan Zheng',serif",fontSize:"1rem",fontWeight:700}}>{s.name}</span><TLvBadge pts={pts} small/></div><TProgressBar pts={pts} lv={lv} next={next} color={lv.color}/></div>
                <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:"1.2rem",fontWeight:900,color:TC.gold}}>{fmt(pts)}</div>{mPts>0&&<div style={{fontSize:".62rem",color:TC.green}}>本月+{fmt(mPts)}</div>}</div>
              </div>
              <div style={{display:"flex",gap:6,marginTop:9,paddingLeft:6}}>
                <button onClick={()=>setAddPtsModal(s)} style={{...tbtn(`linear-gradient(135deg,${TC.blue},${TC.purple})`),flex:1,padding:"6px 0",fontSize:".76rem",borderRadius:8}}>✍️ 录入</button>
                <button onClick={()=>setDetailStudent(s)} style={{...tbtn(TC.bg3,TC.text3),flex:1,padding:"6px 0",fontSize:".76rem",borderRadius:8,border:`1px solid ${TC.border}`}}>📋 详情</button>
              </div>
            </div>
          </div>;})}
      </div>}

      {/* INPUT */}
      {tab==="input"&&<div style={{animation:"fadeUp .3s ease"}}>
        <div style={{fontSize:".72rem",color:TC.text2,marginBottom:12,textTransform:"uppercase",letterSpacing:".1em"}}>选择学生快速录入</div>
        {sorted.map(s=><div key={s.id} style={{...tcard({padding:"11px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,cursor:"pointer"})}} onClick={()=>setAddPtsModal(s)}>
          <TAvatar student={s} size={38}/><div style={{flex:1}}><div style={{fontWeight:600,fontSize:".9rem"}}>{s.name}</div><TLvBadge pts={s.points||0} small/></div><div style={{color:TC.gold,fontWeight:700}}>{fmt(s.points||0)}</div><div style={{color:TC.text2,fontSize:".9rem"}}>›</div>
        </div>)}
        {history.length>0&&<><div style={{fontSize:".72rem",color:TC.text2,marginTop:16,marginBottom:10,textTransform:"uppercase",letterSpacing:".1em"}}>最近记录</div>{history.slice(0,8).map(h=>{ const plus=h.pts>=0; return <div key={h.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",background:TC.bg2,borderRadius:9,marginBottom:5,border:`1px solid ${TC.border}`}}><div style={{width:6,height:6,borderRadius:"50%",background:plus?TC.green:TC.red,flexShrink:0}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:".82rem"}}><strong>{h.studentName}</strong> · {h.reason}</div><div style={{fontSize:".66rem",color:TC.text2,marginTop:1}}>{fmtDate(h.time)}{h.teacher?` · ${h.teacher}`:""}</div></div><div style={{fontWeight:700,fontSize:".86rem",color:plus?TC.green:TC.red,whiteSpace:"nowrap"}}>{plus?"+":""}{h.pts}</div></div>; })}</>}
      </div>}

      {/* LEADERBOARD */}
      {tab==="leaderboard"&&<div style={{animation:"fadeUp .3s ease"}}>
        <div style={{display:"flex",gap:4,background:TC.bg2,border:`1px solid ${TC.border}`,borderRadius:11,padding:3,marginBottom:16}}>
          {[["total","🏅 总榜"],["month","📆 月榜"],["progress","📈 进步榜"]].map(([k,v])=><button key={k} onClick={()=>setLbTab(k)} style={{...tbtn(lbTab===k?`linear-gradient(135deg,${TC.blue},${TC.purple})`:"transparent",lbTab===k?"#fff":TC.text2),flex:1,borderRadius:8,padding:"7px 4px",fontSize:".76rem"}}>{v}</button>)}
        </div>
        {lbTab==="total"&&sorted.map((s,i)=>{ const rank=i+1,re=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null,lv=getLevel(s.points||0),barW=Math.round((s.points||0)/(sorted[0]?.points||1)*100);
          return <div key={s.id} onClick={()=>setDetailStudent(s)} style={{...tcard({padding:"11px 14px",marginBottom:7,cursor:"pointer",position:"relative",overflow:"hidden",background:rank===1?"rgba(245,200,66,0.06)":rank===2?"rgba(192,192,192,0.04)":rank===3?"rgba(180,120,60,0.04)":TC.bg2,borderColor:rank===1?"rgba(245,200,66,0.4)":rank===2?"rgba(192,192,192,0.3)":rank===3?"rgba(180,120,60,0.3)":TC.border})}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}><div style={{fontSize:re?"1.2rem":".95rem",fontWeight:900,width:26,textAlign:"center",flexShrink:0,color:rank===1?TC.gold:rank===2?"#C0C0C0":rank===3?"#CD7F32":TC.text2}}>{re||rank}</div><TAvatar student={s} size={38}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:".88rem",display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>{s.name}<TLvBadge pts={s.points||0} small/></div></div><div style={{fontSize:"1.1rem",fontWeight:900,color:TC.gold}}>{fmt(s.points||0)}</div></div>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"rgba(255,255,255,0.04)"}}><div style={{width:`${barW}%`,height:"100%",background:lv.color}}/></div>
          </div>;})}
        {lbTab==="month"&&[...students].sort((a,b)=>(monthMap[b.id]||0)-(monthMap[a.id]||0)).map((s,i)=>{ const mPts=monthMap[s.id]||0,rank=i+1,re=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":null,max=[...students].map(x=>monthMap[x.id]||0).sort((a,b)=>b-a)[0]||1;
          return <div key={s.id} style={{...tcard({padding:"11px 14px",marginBottom:7,position:"relative",overflow:"hidden"})}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}><div style={{fontSize:re?"1.2rem":".95rem",fontWeight:900,width:26,textAlign:"center",flexShrink:0,color:rank===1?TC.gold:rank===2?"#C0C0C0":rank===3?"#CD7F32":TC.text2}}>{re||rank}</div><TAvatar student={s} size={36}/><div style={{flex:1}}><div style={{fontWeight:600,fontSize:".88rem"}}>{s.name}</div></div><div style={{color:TC.green,fontWeight:900,fontSize:".95rem"}}>+{fmt(mPts)}</div></div>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:2,background:"rgba(255,255,255,0.04)"}}><div style={{width:`${Math.round(mPts/max*100)}%`,height:"100%",background:TC.green}}/></div>
          </div>;})}
        {lbTab==="progress"&&[...students].map(s=>({...s,diff:(monthMap[s.id]||0)-(prevMap[s.id]||0)})).sort((a,b)=>b.diff-a.diff).map((s,i)=><div key={s.id} style={{...tcard({padding:"11px 14px",marginBottom:7,display:"flex",alignItems:"center",gap:9})}}>
          <div style={{width:22,fontWeight:700,color:TC.text2,fontSize:".82rem"}}>{i+1}</div><TAvatar student={s} size={36}/><div style={{flex:1}}><div style={{fontWeight:600,fontSize:".86rem"}}>{s.name}</div><div style={{fontSize:".66rem",color:TC.text2}}>上月 {fmt(prevMap[s.id]||0)} · 本月 {fmt(monthMap[s.id]||0)}</div></div><div style={{fontWeight:900,fontSize:".95rem",color:s.diff>=0?TC.green:TC.red}}>{s.diff>=0?"+":""}{fmt(s.diff)}</div>
        </div>)}
        <div style={{marginTop:20,fontSize:".72rem",color:TC.text2,marginBottom:10,textTransform:"uppercase",letterSpacing:".1em"}}>各等级学员</div>
        {[...LEVELS].reverse().map(lv=>{ const next=LEVELS.find(l=>l.lv===lv.lv+1), members=sorted.filter(s=>(s.points||0)>=lv.min&&(!next||(s.points||0)<next.min)); if(!members.length) return null;
          return <div key={lv.lv} style={{background:TC.bg2,border:`1px solid ${lv.color}33`,borderLeft:`4px solid ${lv.color}`,borderRadius:13,padding:"11px 13px",marginBottom:7}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}><span style={{fontSize:"1rem"}}>{lv.emoji}</span><div><div style={{fontWeight:700,color:lv.color,fontSize:".86rem"}}>Lv.{lv.lv} {lv.name}</div><div style={{fontSize:".62rem",color:TC.text2}}>{fmt(lv.min)}–{lv.max===Infinity?"∞":fmt(lv.max)} · {members.length} 人</div></div></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{members.map(s=><span key={s.id} onClick={()=>setDetailStudent(s)} style={{display:"inline-flex",alignItems:"center",gap:3,background:`${s.color}18`,border:`1px solid ${s.color}33`,color:s.color,padding:"2px 9px",borderRadius:20,fontSize:".76rem",fontWeight:600,cursor:"pointer"}}>{s.avatar||s.name.slice(-2)} {fmt(s.points||0)}</span>)}</div>
          </div>;})}
      </div>}

      {/* SHOP */}
      {tab==="shop"&&<div style={{animation:"fadeUp .3s ease"}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>{sorted.map(s=><button key={s.id} onClick={()=>setShopStudent(shopStudent?.id===s.id?null:s)} style={{...tbtn(shopStudent?.id===s.id?`${s.color}33`:TC.bg2,shopStudent?.id===s.id?s.color:TC.text3),border:`1px solid ${shopStudent?.id===s.id?s.color+"55":TC.border}`,padding:"5px 12px",fontSize:".78rem",borderRadius:20}}>{s.avatar||s.name.slice(-2)} {s.name}</button>)}</div>
        {shopStudent&&<div style={{background:"rgba(245,200,66,0.08)",border:"1px solid rgba(245,200,66,0.25)",borderRadius:9,padding:"6px 12px",marginBottom:12,fontSize:".78rem",color:TC.gold}}>{shopStudent.name} 可用：⭐ {fmt(shopStudent.points||0)}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>{SHOP_ITEMS.map(item=>{ const ok=shopStudent&&(shopStudent.points||0)>=item.cost; return <div key={item.id} style={{background:TC.bg2,border:`1px solid ${ok&&shopStudent?"rgba(245,200,66,0.25)":TC.border}`,borderRadius:13,padding:"13px 10px",textAlign:"center",opacity:shopStudent&&!ok?.5:1}}><div style={{fontSize:"1.7rem",marginBottom:4}}>{item.icon}</div><div style={{fontSize:".8rem",fontWeight:600,marginBottom:3}}>{item.name}</div><div style={{fontSize:".72rem",color:TC.gold,marginBottom:8}}>⭐ {fmt(item.cost)}</div><button onClick={()=>shopStudent&&redeemItem(shopStudent,item)} disabled={!shopStudent||!ok} style={{...tbtn(ok&&shopStudent?"linear-gradient(135deg,#F5C842,#F59E0B)":"rgba(255,255,255,0.04)",ok&&shopStudent?"#000":TC.text2),padding:"5px 0",fontSize:".72rem",width:"100%",borderRadius:7,opacity:ok?1:.5}}>{!shopStudent?"选择学生":ok?"立即兑换":"积分不足"}</button></div>; })}</div>
        {redeems.length>0&&<><div style={{marginTop:16,fontSize:".72rem",color:TC.text2,marginBottom:8,textTransform:"uppercase",letterSpacing:".1em"}}>兑换记录</div>{redeems.slice(0,8).map(r=><div key={r.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 12px",background:TC.bg2,borderRadius:9,marginBottom:5,border:`1px solid ${TC.border}`}}><div style={{fontSize:"1.1rem"}}>{SHOP_ITEMS.find(i=>i.name===r.itemName)?.icon||"🎁"}</div><div style={{flex:1}}><div style={{fontSize:".82rem"}}><strong>{r.studentName}</strong> · {r.itemName}</div><div style={{fontSize:".66rem",color:TC.text2}}>{fmtDate(r.time)}</div></div><div style={{color:TC.red,fontWeight:700,fontSize:".82rem"}}>-{fmt(r.cost)}</div></div>)}</>}
      </div>}

      {/* STUDENTS */}
      {tab==="students"&&<div style={{animation:"fadeUp .3s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:".72rem",color:TC.text2,textTransform:"uppercase",letterSpacing:".1em"}}>全部学生 ({students.length})</div><button onClick={openAdd} style={{...tbtn("rgba(16,185,129,0.1)",TC.green),border:"1px solid rgba(16,185,129,0.3)",padding:"5px 12px",fontSize:".76rem",borderRadius:8}}>+ 添加</button></div>
        {sorted.map(s=>{ const pts=s.points||0,lv=getLevel(pts),next=getNextLevel(pts),mPts=monthMap[s.id]||0;
          return <div key={s.id} style={{...tcard({marginBottom:10,padding:"13px"})}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:9}}><TAvatar student={s} size={46}/><div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'Ma Shan Zheng',serif",fontSize:"1rem",fontWeight:700,marginBottom:3}}>{s.name}</div><TLvBadge pts={pts} small/></div><div style={{textAlign:"right"}}><div style={{fontSize:"1.1rem",fontWeight:900,color:TC.gold}}>{fmt(pts)}</div><div style={{fontSize:".62rem",color:TC.green}}>本月+{fmt(mPts)}</div></div></div>
            <TProgressBar pts={pts} lv={lv} next={next} color={lv.color}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginTop:9}}>
              <button onClick={()=>setAddPtsModal(s)} style={{...tbtn(`linear-gradient(135deg,${TC.blue},${TC.purple})`),padding:"6px 0",fontSize:".7rem",borderRadius:7}}>✍️录入</button>
              <button onClick={()=>setDetailStudent(s)} style={{...tbtn(TC.bg3,TC.text3),padding:"6px 0",fontSize:".7rem",borderRadius:7,border:`1px solid ${TC.border}`}}>📋详情</button>
              <button onClick={()=>openEdit(s)} style={{...tbtn("rgba(245,200,66,0.08)",TC.gold),padding:"6px 0",fontSize:".7rem",borderRadius:7,border:"1px solid rgba(245,200,66,0.2)"}}>✏️编辑</button>
              <button onClick={()=>deleteStudent(s.id)} style={{...tbtn("rgba(239,68,68,0.07)",TC.red),padding:"6px 0",fontSize:".7rem",borderRadius:7,border:"1px solid rgba(239,68,68,0.18)"}}>🗑️删除</button>
            </div>
          </div>;})}
      </div>}

      {/* EXPORT */}
      {tab==="export"&&<div style={{animation:"fadeUp .3s ease"}}>
        <div style={{...tcard({marginBottom:14,padding:18})}}>
          <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1rem",color:TC.gold,marginBottom:6}}>📤 导出数据给家长</div>
          <div style={{fontSize:".78rem",color:TC.text2,marginBottom:14,lineHeight:1.6}}>点击按钮生成最新数据码，将其发送给家长。家长在「家长端」输入数据码后即可查看孩子的积分情况。</div>
          <button className="" onClick={()=>{
            const payload={students:students.map(s=>({id:s.id,name:s.name,avatar:s.avatar,color:s.color,points:s.points||0,achievedLevels:s.achievedLevels||[]})),history:history.slice(0,300),exportedAt:new Date().toISOString(),version:2};
            const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
            lsSet("ys:export",encoded);
            navigator.clipboard?.writeText(encoded).catch(()=>{});
            alert("✅ 数据码已复制！\n\n请将此码发给家长，家长在「家长端」粘贴后即可查看孩子积分。");
          }} style={{...tbtn(`linear-gradient(135deg,${TC.blue},${TC.purple})`),width:"100%",padding:13,fontSize:".95rem"}}>📋 生成并复制数据码</button>
        </div>
        {pendingHw.length>0&&<div style={{...tcard({padding:16,border:"1.5px solid rgba(239,68,68,0.3)"})}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><span>📬</span><div style={{fontWeight:700,color:TC.red}}>待审核作业 ({pendingHw.length})</div></div>
          {pendingHw.map(hw=><div key={hw.id} style={{background:TC.bg3,borderRadius:10,padding:10,marginBottom:8}}>
            <div style={{display:"flex",gap:10}}><img src={hw.imageData} alt="" style={{width:64,height:64,borderRadius:8,objectFit:"cover",flexShrink:0}}/><div style={{flex:1}}><div style={{fontWeight:600,fontSize:".85rem"}}>{hw.studentName}</div><div style={{fontSize:".68rem",color:TC.text2}}>{fmtDate(hw.uploadedAt)}</div>{hw.note&&<div style={{fontSize:".72rem",color:TC.text3,marginTop:2}}>{hw.note}</div>}<div style={{display:"flex",gap:5,marginTop:7}}><button onClick={()=>approveHw(hw.id,hw.studentId,true)} style={{flex:1,padding:"5px 0",background:"linear-gradient(135deg,#10B981,#059669)",color:"#fff",border:"none",borderRadius:7,fontSize:".75rem",cursor:"pointer"}}>✅ 批准 +2分</button><button onClick={()=>approveHw(hw.id,hw.studentId,false)} style={{flex:1,padding:"5px 0",background:"rgba(239,68,68,0.1)",color:TC.red,border:`1px solid rgba(239,68,68,0.3)`,borderRadius:7,fontSize:".75rem",cursor:"pointer"}}>❌ 拒绝</button></div></div></div>
          </div>)}
        </div>}
        <div style={{...tcard({padding:14,marginTop:14})}}>
          <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:".9rem",color:TC.gold,marginBottom:10}}>📖 使用说明</div>
          {[["1","老师录入积分后","点击上方「生成并复制数据码」"],["2","把数据码发到家长群","微信复制粘贴即可"],["3","家长打开此页面","选择「家长端」"],["4","粘贴数据码","选择自己的孩子"],["5","家长可上传作业","老师在此审核通过自动 +2 分"]].map(([n,a,b])=><div key={n} style={{display:"flex",gap:9,alignItems:"flex-start",marginBottom:9}}><div style={{width:20,height:20,borderRadius:"50%",background:`linear-gradient(135deg,${TC.blue},${TC.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".68rem",fontWeight:700,color:"#fff",flexShrink:0}}>{n}</div><div><div style={{fontSize:".82rem",fontWeight:600}}>{a}</div><div style={{fontSize:".72rem",color:TC.text2}}>{b}</div></div></div>)}
        </div>
      </div>}

      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:600,background:"rgba(8,12,20,0.96)",backdropFilter:"blur(12px)",borderTop:`1px solid ${TC.border}`,display:"flex",justifyContent:"space-around",padding:"6px 0 calc(6px + env(safe-area-inset-bottom))",zIndex:200}}>
        {tabs.map(({k,icon,label,badge})=><button key={k} onClick={()=>setTab(k)} style={{...tbtn("transparent",tab===k?TC.gold:TC.text2),padding:"5px 8px",borderRadius:9,display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:".58rem",minWidth:46}}>
          <div style={{position:"relative"}}><span style={{fontSize:"1.25rem",filter:tab===k?`drop-shadow(0 0 6px ${TC.gold})`:"none"}}>{icon}</span>{k==="export"&&pendingHw.length>0&&<div style={{position:"absolute",top:-2,right:-2,width:7,height:7,background:TC.red,borderRadius:"50%",animation:"pulse 1.5s infinite"}}/>}</div>
          <span>{label}</span>
        </button>)}
      </div>
    </div>
  </>;
}

// ═══════════════════════════════════════════════════
// PARENT APP
// ═══════════════════════════════════════════════════
function ParentApp({onBack}){
  const [screen,setScreen]=useState("verify");
  const [codeInput,setCodeInput]=useState("");
  const [parsedData,setParsedData]=useState(null);
  const [selectedChildId,setSelectedChildId]=useState(null);
  const [tab,setTab]=useState("profile");
  const [avatarMap,setAvatarMap]=useState(()=>lsGet(LS_PARENT_AVATAR,{}));
  const [hwList,setHwList]=useState(()=>lsGet(LS_HW,[]));
  const [uploadModal,setUploadModal]=useState(false);
  const [uploadImg,setUploadImg]=useState(null);
  const [uploadNote,setUploadNote]=useState("");
  const [uploading,setUploading]=useState(false);
  const [dragOver,setDragOver]=useState(false);
  const fileRef=useRef();

  useEffect(()=>{
    const saved=lsGet("ys:export",null)||lsGet("ys:parent_code",null);
    if(saved&&typeof saved==="string") tryParseCode(saved,true);
    const sc=localStorage.getItem("ys:parent_child"); if(sc) setSelectedChildId(sc);
  },[]);

  function tryParseCode(code,silent=false){
    try{
      const json=JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if(!json.students) throw new Error("invalid");
      setParsedData(json); setScreen("home");
      lsSet("ys:parent_code",code.trim());
      if(!silent) alert("✅ 数据加载成功！");
    }catch{ if(!silent) alert("❌ 数据码无效，请重新复制"); }
  }
  function saveAvatar(id,emoji){ const m={...avatarMap,[id]:emoji}; setAvatarMap(m); lsSet(LS_PARENT_AVATAR,m); setParsedData(d=>({...d,students:d.students.map(s=>s.id===id?{...s,avatar:emoji}:s)})); }

  async function handleFile(file){
    if(!file||!file.type.startsWith("image/")) return;
    setUploading(true); const c=await compressImage(file); setUploadImg(c); setUploading(false); setUploadModal(true);
  }
  function submitHw(){
    if(!uploadImg||!selectedChildId) return;
    const child=parsedData.students.find(s=>s.id===selectedChildId);
    const hw={id:genId(),studentId:selectedChildId,studentName:child?.name||"",imageData:uploadImg,note:uploadNote,uploadedAt:new Date().toISOString(),status:"pending",pts:2};
    const updated=[hw,...hwList]; setHwList(updated); lsSet(LS_HW,updated);
    setUploadModal(false); setUploadImg(null); setUploadNote("");
    alert("✅ 作业已提交！等待老师审核后自动加 2 分 🎉");
  }

  const child=parsedData?.students.find(s=>s.id===selectedChildId);
  const childHist=(parsedData?.history||[]).filter(h=>h.studentId===selectedChildId);
  const mk=currentMonthKey();
  const monthPts=childHist.filter(h=>monthKey(h.time)===mk).reduce((a,h)=>a+(h.pts>0?h.pts:0),0);
  const myHw=hwList.filter(h=>h.studentId===selectedChildId);
  const pendingCount=myHw.filter(h=>h.status==="pending").length;

  if(screen==="verify") return <div style={{position:"relative",zIndex:1,padding:"0 16px",animation:"fadeUp .3s ease"}}>
    <div style={{padding:"12px 0 0",display:"flex",alignItems:"center"}}><button onClick={onBack} style={{border:"none",background:"transparent",cursor:"pointer",fontSize:"1.1rem",color:"#8B6914",padding:"4px 8px 4px 0"}}>‹ 返回</button></div>
    <div style={{textAlign:"center",padding:"50px 0 28px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <img src={LOGO_SRC} alt="研山书院" style={{height:"auto",width:"68%",maxWidth:240,objectFit:"contain",display:"block",margin:"0 auto",marginBottom:12,filter:"sepia(1) saturate(3) hue-rotate(15deg) brightness(0.6)",animation:"logoFadeIn .8s ease both"}}/>
      <div style={{fontSize:".75rem",color:"#94A3B8",letterSpacing:".12em"}}>家长成长档案</div>
    </div>
    <div className="pwarm" style={{padding:22,marginBottom:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(139,105,20,0.05)"}}/>
      <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1.05rem",color:"#8B6914",marginBottom:5}}>输入数据码</div>
      <div style={{fontSize:".75rem",color:"#64748B",marginBottom:12,lineHeight:1.6}}>由老师发送给您的数据码，粘贴后查看孩子积分。</div>
      <textarea value={codeInput} onChange={e=>setCodeInput(e.target.value)} placeholder="在此粘贴老师发送的数据码…" rows={4} style={{width:"100%",padding:"10px 12px",border:"1px solid rgba(139,105,20,0.25)",borderRadius:10,background:"rgba(255,255,255,0.6)",fontSize:".8rem",resize:"none",outline:"none",color:"#2D2416"}}/>
      <button onClick={()=>tryParseCode(codeInput)} style={{width:"100%",marginTop:10,padding:"13px",background:"linear-gradient(135deg,#D4A017,#F5C842,#D4A017)",backgroundSize:"200% auto",color:"#2D1800",fontWeight:700,border:"none",borderRadius:12,cursor:"pointer",fontSize:".95rem",boxShadow:"0 4px 14px rgba(212,160,23,0.3)",fontFamily:"inherit"}}>🔓 进入查看</button>
    </div>
    <div className="pcard" style={{padding:14}}>
      <div style={{fontSize:".78rem",color:"#64748B",lineHeight:1.7,textAlign:"center"}}>
        <div style={{marginBottom:4,fontWeight:600,color:"#8B6914"}}>💡 没有数据码？</div>
        <div>请联系老师，老师在积分系统中</div>
        <div>点击「导出」→「生成并复制数据码」后发给您</div>
      </div>
    </div>
  </div>;

  if(screen==="home"&&!selectedChildId) return <div style={{position:"relative",zIndex:1,padding:"20px 16px",animation:"fadeUp .3s ease"}}>
    <div style={{marginBottom:-10,display:"flex"}}><button onClick={onBack} style={{border:"none",background:"transparent",cursor:"pointer",fontSize:"1.1rem",color:"#8B6914",padding:"0 8px 8px 0"}}>‹ 返回</button></div>
    <div style={{textAlign:"center",padding:"16px 0 22px",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <img src={LOGO_SRC} alt="研山书院" style={{height:"auto",width:"55%",maxWidth:170,objectFit:"contain",display:"block",margin:"0 auto",marginBottom:8,filter:"sepia(1) saturate(3) hue-rotate(15deg) brightness(0.6)"}}/>
      <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1.2rem",color:"#8B6914"}}>请选择孩子</div>
    </div>
    {parsedData.students.map(s=>{const lv=getLevel(s.points||0);return <div key={s.id} className="pwarm" style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:10,cursor:"pointer"}} onClick={()=>{setSelectedChildId(s.id);localStorage.setItem("ys:parent_child",s.id);}}>
      <div style={{width:50,height:50,borderRadius:"50%",background:`${s.color}22`,border:`2px solid ${s.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.5rem",flexShrink:0}}>{avatarMap[s.id]||s.avatar||s.name?.slice(-2)}</div>
      <div style={{flex:1}}><div style={{fontFamily:"'Ma Shan Zheng',serif",fontSize:"1.1rem",fontWeight:700}}>{s.name}</div><span style={{display:"inline-flex",alignItems:"center",gap:4,background:`${lv.color}22`,border:`1px solid ${lv.color}55`,color:lv.color,borderRadius:20,padding:"2px 9px",fontSize:".7rem",fontWeight:700}}>{lv.emoji} Lv.{lv.lv} {lv.name}</span></div>
      <div style={{textAlign:"right"}}><div style={{fontSize:"1.2rem",fontWeight:700,color:"#D4A017"}}>{fmt(s.points||0)}</div><div style={{fontSize:".62rem",color:"#94A3B8"}}>积分</div></div>
    </div>;})}
    <button onClick={()=>{setScreen("verify");localStorage.removeItem("ys:parent_code");}} style={{width:"100%",marginTop:8,padding:"10px",background:"transparent",border:"1.5px solid rgba(139,105,20,0.3)",color:"#6B4C11",borderRadius:10,cursor:"pointer",fontSize:".84rem",fontFamily:"inherit"}}>更换数据码</button>
  </div>;

  if(!child) return null;
  const lv=getLevel(child.points||0), nextLv=getNextLevel(child.points||0);
  const pct=nextLv?Math.min(100,Math.round((child.points-lv.min)/(nextLv.min-lv.min)*100)):100;
  const r=52, circ=2*Math.PI*r, dash=circ*(pct/100);

  return <div style={{position:"relative",zIndex:1}}>
    <style>{`.upload-zone{border:2px dashed rgba(139,105,20,0.3);border-radius:14px;padding:28px;text-align:center;background:rgba(255,248,220,0.4);cursor:pointer;}.upload-zone.drag{border-color:rgba(139,105,20,0.6);background:rgba(255,248,220,0.7);}`}</style>
    {uploadModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:600,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget){setUploadModal(false);setUploadImg(null);}}}>
      <div style={{background:"#fffcf0",borderRadius:"24px 24px 0 0",padding:"20px 20px 32px",width:"100%",maxWidth:480,animation:"slideUp .3s ease"}}>
        <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1.1rem",color:"#8B6914",marginBottom:12,textAlign:"center"}}>提交作业</div>
        {uploadImg&&<img src={uploadImg} alt="" style={{width:"100%",borderRadius:12,marginBottom:12,maxHeight:240,objectFit:"cover"}}/>}
        <div style={{marginBottom:12}}><div style={{fontSize:".72rem",color:"#64748B",marginBottom:4}}>备注（选填）</div><input value={uploadNote} onChange={e=>setUploadNote(e.target.value)} placeholder="如：第3课临帖练习" style={{width:"100%",padding:"10px 12px",border:"1px solid rgba(139,105,20,0.25)",borderRadius:10,background:"rgba(255,255,255,0.6)",fontSize:".84rem",outline:"none",fontFamily:"inherit"}}/></div>
        <div style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:9,padding:"8px 12px",marginBottom:12,fontSize:".76rem",color:"#059669"}}>✅ 老师审核通过后 <strong>{child.name}</strong> 自动获得 +2 积分</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <button onClick={()=>{setUploadModal(false);setUploadImg(null);}} style={{padding:"11px",background:"transparent",border:"1.5px solid rgba(139,105,20,0.3)",color:"#6B4C11",borderRadius:10,cursor:"pointer",fontSize:".84rem",fontFamily:"inherit"}}>取消</button>
          <button onClick={submitHw} style={{padding:"11px",background:"linear-gradient(135deg,#D4A017,#F5C842)",color:"#2D1800",fontWeight:700,border:"none",borderRadius:10,cursor:"pointer",fontSize:".84rem",fontFamily:"inherit"}}>提交作业 ✨</button>
        </div>
      </div>
    </div>}
    <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

    {/* parent sticky top bar */}
    <div style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,252,240,0.95)",backdropFilter:"blur(8px)",borderBottom:"1px solid rgba(139,105,20,0.12)",padding:"10px 16px",display:"flex",alignItems:"center",position:"relative"}}>
      <button onClick={onBack} style={{border:"none",background:"transparent",cursor:"pointer",fontSize:"1rem",color:"#8B6914",padding:"2px 0",fontFamily:"inherit",position:"absolute",left:16,zIndex:1}}>‹ 返回</button>
      <img src={LOGO_SRC} alt="研山书院" style={{height:"auto",width:100,maxWidth:110,objectFit:"contain",display:"block",margin:"0 auto",filter:"sepia(1) saturate(3) hue-rotate(15deg) brightness(0.6)",opacity:.9}}/>
    </div>

    {tab==="profile"&&<>
      <div style={{background:`linear-gradient(160deg,${lv.color}22,rgba(247,243,238,0.95))`,borderBottom:"1px solid rgba(139,105,20,0.1)",padding:"20px 16px 18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:130,height:130,borderRadius:"50%",background:`${lv.color}10`}}/>
        <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14,position:"relative"}}>
          {/* avatar with edit */}
          <div style={{position:"relative"}}>
            <div style={{width:68,height:68,borderRadius:"50%",background:`${child.color}22`,border:`3px solid ${child.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"2rem",cursor:"pointer"}} onClick={()=>{const e=prompt("选择头像 (复制一个表情):\n"+AVATAR_EMOJIS.join(" "));if(e&&e.trim())saveAvatar(child.id,e.trim());}}>
              {avatarMap[child.id]||child.avatar||child.name?.slice(-2)}
              <div style={{position:"absolute",bottom:-2,right:-2,width:20,height:20,borderRadius:"50%",background:"#D4A017",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".6rem",border:"2px solid #F7F3EE",color:"#fff"}}>✏️</div>
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Ma Shan Zheng',serif",fontSize:"1.5rem",color:"#2D2416",lineHeight:1}}>{child.name}</div>
            <span style={{display:"inline-flex",alignItems:"center",gap:4,background:`${lv.color}22`,border:`1px solid ${lv.color}55`,color:lv.color,borderRadius:20,padding:"3px 10px",fontSize:".72rem",fontWeight:700,marginTop:4}}>{lv.emoji} Lv.{lv.lv} {lv.name}</span>
            <div style={{fontSize:".65rem",color:"#8B6914",marginTop:3,opacity:.7}}>点击头像可更换</div>
          </div>
          <div style={{textAlign:"right",flexDirection:"column",alignItems:"flex-end",display:"flex",gap:2}}>
            <img src={LOGO_SRC} alt="研山书院" style={{height:"auto",width:72,maxWidth:80,objectFit:"contain",filter:"sepia(1) saturate(3) hue-rotate(15deg) brightness(0.55)",opacity:.7}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[["总积分",fmt(child.points||0),"#D4A017"],["本月获得",`+${fmt(monthPts)}`,"#10B981"],["等级",`Lv.${lv.lv}`,lv.color]].map(([l,v,c])=><div key={l} style={{background:"rgba(255,255,255,0.55)",borderRadius:11,padding:"9px 6px",textAlign:"center",border:"1px solid rgba(139,105,20,0.1)"}}><div style={{fontSize:"1rem",fontWeight:700,color:c}}>{v}</div><div style={{fontSize:".6rem",color:"#94A3B8",marginTop:1}}>{l}</div></div>)}
        </div>
      </div>
      <div style={{padding:"14px 14px 90px"}}>
        <div className="pwarm" style={{padding:18,marginBottom:12,textAlign:"center"}}>
          <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:".88rem",color:"#8B6914",marginBottom:12}}>成长进度</div>
          <svg width={120} height={120} style={{overflow:"visible",display:"block",margin:"0 auto"}}>
            <circle cx={60} cy={60} r={r} fill="none" stroke="rgba(139,105,20,0.1)" strokeWidth={8}/>
            <circle cx={60} cy={60} r={r} fill="none" stroke={lv.color} strokeWidth={8} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} style={{filter:`drop-shadow(0 0 4px ${lv.color}88)`,transition:"stroke-dasharray .8s ease"}}/>
            <text x={60} y={55} textAnchor="middle" style={{fontSize:"1.5rem"}}>{lv.emoji}</text>
            <text x={60} y={74} textAnchor="middle" fill="#2D2416" style={{fontSize:".72rem",fontWeight:700,fontFamily:"'Noto Sans SC'"}}>{pct}%</text>
          </svg>
          {nextLv?<div style={{fontSize:".72rem",color:"#8B6914",marginTop:6}}>距【{nextLv.name}】还差 <strong>{fmt(nextLv.min-(child.points||0))}</strong> 分</div>:<div style={{fontSize:".72rem",color:"#D4A017"}}>👑 已达最高称号！</div>}
        </div>
        <div className="pcard" style={{padding:14,marginBottom:12}}>
          <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:".88rem",color:"#8B6914",marginBottom:10}}>等级路线图</div>
          {LEVELS.map((l,i)=>{ const reached=(child.points||0)>=l.min,current=lv.lv===l.lv;
            return <div key={l.lv} style={{display:"flex",alignItems:"center",gap:9,padding:"5px 0",opacity:reached?1:.35}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:reached?`${l.color}22`:"rgba(0,0,0,0.04)",border:`2px solid ${reached?l.color:"rgba(0,0,0,0.1)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:".85rem",boxShadow:current?`0 0 10px ${l.color}88`:"none"}}>{l.emoji}</div>
                {i<LEVELS.length-1&&<div style={{width:2,height:12,background:reached?"rgba(139,105,20,0.2)":"rgba(0,0,0,0.05)"}}/>}
              </div>
              <div style={{flex:1}}><span style={{fontSize:".8rem",fontWeight:current?700:400,color:current?l.color:"#2D2416"}}>Lv.{l.lv} {l.name}</span>{current&&<span style={{marginLeft:5,fontSize:".62rem",background:`${l.color}22`,color:l.color,padding:"1px 6px",borderRadius:10}}>当前</span>}</div>
              <div style={{fontSize:".66rem",color:"#94A3B8"}}>{fmt(l.min)}+</div>
            </div>;})}
        </div>
        <div className="pcard" style={{padding:14}}>
          <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:".88rem",color:"#8B6914",marginBottom:10}}>最近积分记录</div>
          {childHist.length===0?<div style={{textAlign:"center",padding:18,color:"#94A3B8",fontSize:".8rem"}}>暂无记录</div>
            :childHist.slice(0,8).map(h=>{ const plus=h.pts>=0; return <div key={h.id} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:"1px solid rgba(139,105,20,0.07)"}}><div style={{width:5,height:5,borderRadius:"50%",background:plus?"#10B981":"#EF4444",flexShrink:0}}/><div style={{flex:1}}><div style={{fontSize:".82rem",color:"#2D2416"}}>{h.reason}</div><div style={{fontSize:".66rem",color:"#94A3B8",marginTop:1}}>{fmtDate(h.time)}{h.teacher?` · ${h.teacher}`:""}</div></div><div style={{fontWeight:700,fontSize:".88rem",color:plus?"#10B981":"#EF4444"}}>{plus?"+":""}{h.pts}</div></div>; })}
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={()=>{setSelectedChildId(null);localStorage.removeItem("ys:parent_child");}} style={{flex:1,padding:"9px",background:"transparent",border:"1px solid rgba(139,105,20,0.3)",color:"#6B4C11",borderRadius:9,cursor:"pointer",fontSize:".78rem",fontFamily:"inherit"}}>切换孩子</button>
          <button onClick={()=>{setScreen("verify");localStorage.removeItem("ys:parent_code");}} style={{flex:1,padding:"9px",background:"transparent",border:"1px solid rgba(139,105,20,0.3)",color:"#6B4C11",borderRadius:9,cursor:"pointer",fontSize:".78rem",fontFamily:"inherit"}}>刷新数据</button>
        </div>
      </div>
    </>}

    {tab==="homework"&&<div style={{padding:"14px 14px 90px"}}>
      <div style={{textAlign:"center",marginBottom:16}}><div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1.1rem",color:"#8B6914"}}>作业提交</div><div style={{fontSize:".72rem",color:"#94A3B8",marginTop:3}}>每张作业经老师审核后 +2 积分</div></div>
      <div className={`upload-zone ${dragOver?"drag":""}`} style={{marginBottom:14}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}} onClick={()=>fileRef.current?.click()}>
        {uploading?<div style={{animation:"spin 1s linear infinite",fontSize:"1.5rem",display:"inline-block"}}>⏳</div>:<><div style={{fontSize:"2.2rem",marginBottom:8}}>📸</div><div style={{fontWeight:600,color:"#6B4C11",marginBottom:3}}>拍照上传作业</div><div style={{fontSize:".72rem",color:"#94A3B8"}}>点击拍照 或 拖放图片</div></>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:14}}>
        {[["已提交",myHw.length,"#6B4C11"],["已通过",myHw.filter(h=>h.status==="approved").length,"#10B981"],["待审核",pendingCount,"#F59E0B"]].map(([l,v,c])=><div key={l} className="pcard" style={{padding:"9px 6px",textAlign:"center"}}><div style={{fontSize:"1.1rem",fontWeight:700,color:c}}>{v}</div><div style={{fontSize:".6rem",color:"#94A3B8",marginTop:1}}>{l}</div></div>)}
      </div>
      {myHw.length===0?<div style={{textAlign:"center",padding:"28px 0",color:"#94A3B8"}}><div style={{fontSize:"1.8rem",marginBottom:8}}>📭</div><div>还没有提交作业记录</div></div>
        :myHw.map(hw=>{ const sm={pending:["审核中","#F59E0B"],approved:["已通过 +2分","#10B981"],rejected:["未通过","#EF4444"]}; const[st,sc]=sm[hw.status]||["未知","#94A3B8"];
          return <div key={hw.id} className="pcard" style={{marginBottom:9,overflow:"hidden"}}>
            <div style={{display:"flex",gap:9,padding:11}}>
              <img src={hw.imageData} alt="" style={{width:68,height:68,borderRadius:9,objectFit:"cover",border:"1px solid rgba(139,105,20,0.15)",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}><div style={{fontSize:".68rem",padding:"2px 7px",borderRadius:9,background:`${sc}18`,color:sc,fontWeight:600,border:`1px solid ${sc}33`}}>{st}</div></div>{hw.note&&<div style={{fontSize:".76rem",color:"#6B4C11",marginBottom:2}}>{hw.note}</div>}<div style={{fontSize:".65rem",color:"#94A3B8"}}>{fmtDate(hw.uploadedAt)}</div></div>
            </div>
          </div>;})}
    </div>}

    {tab==="shop"&&<div style={{padding:"14px 14px 90px"}}>
      <div style={{textAlign:"center",marginBottom:6}}><div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1.1rem",color:"#8B6914"}}>积分商城</div><div style={{fontSize:".72rem",color:"#94A3B8",marginTop:3}}>可用：<span style={{color:"#D4A017",fontWeight:700}}>⭐ {fmt(child.points||0)}</span></div></div>
      <div style={{fontSize:".7rem",color:"#94A3B8",textAlign:"center",marginBottom:12,padding:"5px 10px",background:"rgba(139,105,20,0.04)",borderRadius:7}}>💡 兑换请找老师操作，商城仅供浏览</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        {SHOP_ITEMS.map(item=>{ const ok=(child.points||0)>=item.cost;
          return <div key={item.id} className="pwarm" style={{padding:"13px 10px",textAlign:"center",border:ok?"1px solid rgba(212,160,23,0.3)":"1px solid rgba(139,105,20,0.1)",opacity:ok?1:.6}}>
            <div style={{fontSize:"1.7rem",marginBottom:5}}>{item.icon}</div>
            <div style={{fontSize:".8rem",fontWeight:600,marginBottom:3}}>{item.name}</div>
            <div style={{fontSize:".72rem",color:"#D4A017",fontWeight:700,marginBottom:7}}>⭐ {fmt(item.cost)}</div>
            <div style={{fontSize:".65rem",padding:"3px 7px",borderRadius:7,background:ok?"rgba(16,185,129,0.1)":"rgba(0,0,0,0.04)",color:ok?"#059669":"#94A3B8",fontWeight:ok?600:400}}>{ok?"✓ 积分足够":"还差 "+(item.cost-(child.points||0))+" 分"}</div>
          </div>;})}
      </div>
    </div>}

    {/* PARENT TAB BAR */}
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(255,252,240,0.95)",backdropFilter:"blur(12px)",borderTop:"1px solid rgba(139,105,20,0.15)",display:"flex",justifyContent:"space-around",padding:"6px 0 calc(8px + env(safe-area-inset-bottom))",zIndex:200}}>
      {[{k:"profile",icon:"🏠",label:"主页"},{k:"homework",icon:"📚",label:"作业",badge:pendingCount},{k:"shop",icon:"🛍️",label:"商城"}].map(({k,icon,label,badge})=><button key={k} onClick={()=>setTab(k)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"5px 10px",border:"none",background:"transparent",cursor:"pointer",minWidth:56,borderRadius:9,color:tab===k?"#8B6914":"#94A3B8"}}>
        <div style={{position:"relative"}}><span style={{fontSize:"1.3rem",filter:tab===k?"drop-shadow(0 0 5px rgba(139,105,20,0.5))":"none"}}>{icon}</span>{badge>0&&<div style={{position:"absolute",top:-1,right:-1,width:7,height:7,background:"#EF4444",borderRadius:"50%",animation:"pulse 1.5s infinite"}}/>}</div>
        <span style={{fontSize:".58rem",fontWeight:tab===k?700:400}}>{label}</span>
      </button>)}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════
export default function App(){
  const [mode,setMode]=useState("select");
  const [pinUnlocked,setPinUnlocked]=useState(false);
  const [pinInput,setPinInput]=useState("");
  const [pinError,setPinError]=useState(false);
  const [pinShake,setPinShake]=useState(false);
  const [showSetPin,setShowSetPin]=useState(false);
  const [newPin,setNewPin]=useState("");
  const [newPinConfirm,setNewPinConfirm]=useState("");
  const [pinStep,setPinStep]=useState(1);
  const TEACHER_PIN_KEY="ys:teacher_pin";

  function getPin(){ return localStorage.getItem(TEACHER_PIN_KEY)||"6361"; }

  function handleDigit(d){
    if(pinError){ setPinError(false); setPinInput(""); return; }
    const next=pinInput+d;
    setPinInput(next);
    if(next.length===4){
      if(next===getPin()){
        setPinUnlocked(true); setPinInput(""); setPinError(false);
      } else {
        setPinError(true); setPinShake(true);
        setTimeout(()=>{ setPinShake(false); setPinInput(""); setPinError(false); },650);
      }
    }
  }

  function handleBack(){ setPinInput(p=>p.slice(0,-1)); setPinError(false); }

  function handleSetPin(){
    if(pinStep===1){
      if(newPin.length!==4){ alert("请输入4位数字"); return; }
      setPinStep(2);
    } else {
      if(newPin!==newPinConfirm){ alert("两次输入不一致，请重新输入"); setNewPinConfirm(""); setPinStep(1); setNewPin(""); return; }
      localStorage.setItem(TEACHER_PIN_KEY,newPin);
      setShowSetPin(false); setNewPin(""); setNewPinConfirm(""); setPinStep(1);
      alert("密码已更新为："+newPin+"  请牢记！");
    }
  }

  // PIN screen for teacher
  if(mode==="teacher"&&!pinUnlocked) return <>
    <style>{TEACHER_CSS}</style>
    <style>{".pin-shake{animation:pinShake .55s ease;} @keyframes pinShake{0%,100%{transform:translateX(0);}20%,60%{transform:translateX(-9px);}40%,80%{transform:translateX(9px);}}"}</style>
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",background:TC.bg0,position:"relative"}}>
      <button onClick={()=>{setMode("select");setPinInput("");setPinError(false);}} style={{position:"absolute",top:20,left:16,border:"none",background:"transparent",color:TC.text2,fontSize:"1rem",cursor:"pointer",padding:"8px",fontFamily:"inherit"}}>‹ 返回</button>
      <img src={LOGO_SRC} alt="研山书院" style={{width:200,height:"auto",objectFit:"contain",filter:"brightness(1.05)",opacity:.9,marginBottom:8,animation:"logoGlow 3s ease-in-out infinite"}}/>
      <div style={{fontSize:".7rem",color:TC.text2,letterSpacing:".14em",marginBottom:40,marginTop:4}}>老师端 · 请输入访问密码</div>

      <div className={pinShake?"pin-shake":""} style={{display:"flex",gap:18,marginBottom:10}}>
        {[0,1,2,3].map(i=>(
          <div key={i} style={{width:15,height:15,borderRadius:"50%",
            background:i<pinInput.length?(pinError?"#EF4444":TC.gold):"transparent",
            border:`2px solid ${i<pinInput.length?(pinError?"#EF4444":TC.gold):"rgba(255,255,255,0.2)"}`,
            transition:"all .15s",
            boxShadow:i<pinInput.length&&!pinError?`0 0 10px ${TC.gold}66`:i<pinInput.length&&pinError?"0 0 10px #EF444466":"none"
          }}/>
        ))}
      </div>
      {pinError&&<div style={{color:"#EF4444",fontSize:".78rem",marginBottom:16,marginTop:8}}>密码错误，请重试</div>}
      {!pinError&&<div style={{height:32}}/>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:248}}>
        {[1,2,3,4,5,6,7,8,9,"","0","⌫"].map((d,i)=>{
          const isEmpty=d==="";
          const isDel=d==="⌫";
          return <button key={i}
            onClick={()=>{ if(isDel) handleBack(); else if(!isEmpty) handleDigit(String(d)); }}
            disabled={isEmpty}
            style={{height:66,borderRadius:16,
              border:`1px solid ${isDel?"rgba(239,68,68,0.3)":isEmpty?"transparent":TC.border}`,
              background:isDel?"rgba(239,68,68,0.08)":isEmpty?"transparent":"rgba(255,255,255,0.04)",
              color:isDel?"#EF4444":isEmpty?"transparent":TC.text,
              fontSize:isDel?"1.3rem":"1.5rem",fontWeight:600,
              cursor:isEmpty?"default":"pointer",
              fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent",
            }}
          >{d}</button>;
        })}
      </div>

      <div style={{marginTop:30,fontSize:".72rem",color:TC.text2,opacity:.55,textAlign:"center",lineHeight:1.8}}>
        <div>默认密码 <span style={{color:TC.gold,fontWeight:700,letterSpacing:".25em"}}>6361</span></div>
        <div>首次使用请及时修改密码</div>
      </div>
      <button onClick={()=>setShowSetPin(true)} style={{marginTop:12,border:"none",background:"transparent",color:TC.text2,fontSize:".72rem",cursor:"pointer",opacity:.5,fontFamily:"inherit",textDecoration:"underline"}}>修改密码</button>

      {showSetPin&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget){setShowSetPin(false);setNewPin("");setNewPinConfirm("");setPinStep(1);}}}>
        <div style={{background:TC.bg1,border:`1px solid ${TC.border}`,borderRadius:"24px 24px 0 0",padding:"22px 22px 38px",width:"100%",maxWidth:420}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><div style={{width:36,height:3,background:"rgba(255,255,255,0.15)",borderRadius:2}}/></div>
          <div style={{fontFamily:"'ZCOOL XiaoWei',serif",fontSize:"1.05rem",color:TC.gold,marginBottom:4,textAlign:"center"}}>修改老师访问密码</div>
          <div style={{fontSize:".73rem",color:TC.text2,marginBottom:18,textAlign:"center"}}>{pinStep===1?"设置新的4位数字密码":"请再次输入新密码确认"}</div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:".72rem",color:TC.text2,marginBottom:5}}>{pinStep===1?"新密码（4位数字）":"确认新密码"}</div>
            <input type="tel" maxLength={4}
              value={pinStep===1?newPin:newPinConfirm}
              onChange={e=>{ const v=e.target.value.replace(/[^0-9]/g,"").slice(0,4); pinStep===1?setNewPin(v):setNewPinConfirm(v); }}
              placeholder="请输入4位数字"
              style={{...tinp(),fontSize:"1.4rem",letterSpacing:".35em",textAlign:"center"}}
            />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:6}}>
            <button onClick={()=>{setShowSetPin(false);setNewPin("");setNewPinConfirm("");setPinStep(1);}} style={{...tbtn("rgba(255,255,255,0.06)",TC.text2),padding:12,borderRadius:12}}>取消</button>
            <button onClick={handleSetPin} style={{...tbtn(`linear-gradient(135deg,${TC.blue},${TC.purple})`),padding:12,borderRadius:12}}>{pinStep===1?"下一步 →":"确认修改"}</button>
          </div>
        </div>
      </div>}
    </div>
  </>;

  return <>
    {mode==="teacher"&&pinUnlocked&&<><style>{TEACHER_CSS}</style><TeacherApp onBack={()=>{setMode("select");setPinUnlocked(false);}}/></>}
    {mode==="parent"&&<><style>{PARENT_CSS}</style><ParentApp onBack={()=>setMode("select")}/></>}
    {mode==="select"&&<>
      <style>{TEACHER_CSS}</style>
      <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 20px 40px",background:TC.bg0}}>
        {/* LOGO */}
        <div style={{textAlign:"center",marginBottom:40,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <img src={LOGO_SRC} alt="研山书院" style={{width:"72%",maxWidth:300,height:"auto",objectFit:"contain",display:"block",margin:"0 auto",filter:"brightness(1.05)",opacity:.95,animation:"logoGlow 3s ease-in-out infinite, logoFadeIn .8s ease both"}}/>
          <div style={{marginTop:10,fontSize:".72rem",color:TC.text2,letterSpacing:".18em",textTransform:"uppercase"}}>积分成长系统</div>
        </div>
        <div style={{width:"100%",display:"flex",flexDirection:"column",gap:14}}>
          <button onClick={()=>setMode("teacher")} style={{...tbtn(`linear-gradient(135deg,${TC.bg2},${TC.bg3})`,"#E2E8F0"),padding:"20px",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",gap:12,borderRadius:16,border:`1px solid ${TC.border}`,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
            <span style={{fontSize:"1.6rem"}}>🎓</span>
            <div style={{textAlign:"left"}}><div style={{fontFamily:"'ZCOOL XiaoWei',serif",letterSpacing:".08em",fontSize:"1.05rem"}}>老师端</div><div style={{fontSize:".72rem",opacity:.6,marginTop:2}}>录入积分 · 管理学生 · 导出数据</div></div>
          </button>
          <button onClick={()=>setMode("parent")} style={{...tbtn("linear-gradient(135deg,#D4A017,#F5C842,#D4A017)","#2D1800"),padding:"20px",fontSize:"1rem",display:"flex",alignItems:"center",justifyContent:"center",gap:12,borderRadius:16,backgroundSize:"200% auto",boxShadow:"0 6px 24px rgba(212,160,23,0.35)"}}>
            <span style={{fontSize:"1.6rem"}}>👨‍👩‍👧</span>
            <div style={{textAlign:"left"}}><div style={{fontFamily:"'ZCOOL XiaoWei',serif",letterSpacing:".08em",fontSize:"1.05rem"}}>家长端</div><div style={{fontSize:".72rem",opacity:.7,marginTop:2}}>查看积分 · 上传作业 · 关注成长</div></div>
          </button>
        </div>
        <div style={{marginTop:28,padding:14,background:"rgba(255,255,255,0.03)",borderRadius:12,border:`1px solid ${TC.border}`,width:"100%"}}>
          <div style={{fontSize:".72rem",color:TC.text2,lineHeight:1.75,textAlign:"center"}}>
            <div style={{fontWeight:600,color:TC.text3,marginBottom:4,fontFamily:"'ZCOOL XiaoWei',serif",fontSize:".8rem"}}>使用说明</div>
            <div>① 老师端录入积分后，点「导出」生成数据码</div>
            <div>② 将数据码发送给家长</div>
            <div>③ 家长进入家长端，粘贴数据码查看孩子积分</div>
            <div>④ 家长上传作业，老师审核后自动 +2 分</div>
          </div>
        </div>
      </div>
    </>}
  </>;
}