// Base commune des vidéos : outils d'animation, squelettes des personnages, sous-titres, barre de chapitres, caméra.
// Chaque page définit avant d'appeler renderAt : POSE, JUMPS, EXPR, walking(t), CHAPTERS, CAPTIONS, DURATION,
// et HERO = 'rezo' (le technicien, dans rezo.js) ou 'ping' (le petit routeur).
const INK='#151A2E',BODY='#3D5AFE',LEG='#2B3EA8',MINT='#2ED3A6',YEL='#FFC93C',ORA='#FF6B3D',SCR='#0E1630',EYE='#EAFBFF',WHITE='#FFFFFF';
const $=id=>document.getElementById(id);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,p)=>a+(b-a)*p;
const out3=x=>1-Math.pow(1-clamp(x),3);
const back=x=>{x=clamp(x);const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
// visible entre a et b, avec apparition « pop » et disparition en fondu
function show(id,t,a,b,o={}){
  const e=$(id);if(!e)return;
  if(t<a||t>b+0.35){e.style.opacity=0;e.style.transform='scale(.001)';return;}
  const pin=o.slam?clamp((t-a)/0.22):clamp((t-a)/0.4);
  let s=o.slam?lerp(2.4,1,out3(pin)):back(pin);
  const fo=clamp((b+0.35-t)/0.35),ex=clamp((t-b)/0.35);
  const op=Math.min(clamp((t-a)/0.12),fo);
  s*=1-0.18*out3(ex);
  const x=o.x||0,y=(o.y||0)+36*ex*ex,r=(o.r||0)+(o.slam?0:4*ex);
  if(o.float)s*=1+0.015*Math.sin(t*3+(o.ph||0));
  e.style.opacity=op;
  e.style.transform=`translate(${x}px,${y}px) rotate(${r}deg) scale(${Math.max(.001,s)})`;
}

// ---------- Ping : squelette animé ----------
const D2R=Math.PI/180;
const inOut=x=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
// bras : angle de l'épaule (0 = vers le bas, positif = vers l'extérieur) et pli du coude
const ARM={rest:[16,-6],wave:[140,30],point:[128,-6],side:[96,-4],shrug:[62,92],cheer:[166,6],hip:[46,-118],think:[26,-152],present:[72,40]};
function armAngles(name,t,ph,T=ARM){
  let [a1,a2]=T[name];
  if(name==='wave'){a2+=30*Math.sin(t*11+ph);a1+=6*Math.sin(t*11+ph+1);}
  else if(name==='cheer'){a1+=8*Math.sin(t*9+ph);a2+=8*Math.sin(t*9+ph+.6);}
  else if(name==='point'||name==='side'){a1+=3*Math.sin(t*2.2+ph);a2+=2*Math.sin(t*3.1+ph);}
  else if(name==='shrug'){a1+=5*Math.sin(t*3+ph);}
  else{a1+=3*Math.sin(t*2.4+ph);a2+=4*Math.sin(t*2.4+ph+.8);}
  return [a1,a2];
}
function poseAt(t,T=ARM){
  let i=0;for(let k=0;k<POSE.length;k++)if(t>=POSE[k][0])i=k;
  const cur=POSE[i],prev=POSE[Math.max(0,i-1)],p=i===0?1:inOut((t-cur[0])/0.32);
  const mix=(side)=>{const a=armAngles(prev[side],t,side*2,T),b=armAngles(cur[side],t,side*2,T);return [lerp(a[0],b[0],p),lerp(a[1],b[1],p)];};
  const nm=p<0.5?prev:cur;
  return {names:{L:nm[1],R:nm[2]},L:mix(1),R:mix(2),look:[lerp(prev[3][0],cur[3][0],p),lerp(prev[3][1],cur[3][1],p)],tilt:lerp(prev[4],cur[4],p)};
}
function armPath(S,dir,[a1,a2]){
  const l1=54,l2=50;
  const E=[S[0]+dir*l1*Math.sin(a1*D2R),S[1]+l1*Math.cos(a1*D2R)];
  const H=[E[0]+dir*l2*Math.sin((a1+a2)*D2R),E[1]+l2*Math.cos((a1+a2)*D2R)];
  const C=[2*E[0]-(S[0]+H[0])/2,2*E[1]-(S[1]+H[1])/2];
  return {d:`M${S[0]} ${S[1]} Q${C[0].toFixed(1)} ${C[1].toFixed(1)} ${H[0].toFixed(1)} ${H[1].toFixed(1)}`,H};
}
// saut : anticipation (écrasé), vol (étiré), atterrissage (écrasé)
function jumpAt(t){
  for(const j of JUMPS){const u=t-j;
    if(u>-0.15&&u<0){const q=Math.sin(Math.PI/2*(u+0.15)/0.15);return {y:0,sx:1+0.1*q,sy:1-0.12*q};}
    if(u>=0&&u<0.46){const c=Math.abs(Math.cos(Math.PI*u/0.46));return {y:-150*Math.sin(Math.PI*u/0.46),sx:1-0.06*c,sy:1+0.09*c};}
    if(u>=0.46&&u<0.68){const q=Math.sin(Math.PI*(u-0.46)/0.22);return {y:0,sx:1+0.12*q,sy:1-0.14*q};}
  }
  return {y:0,sx:1,sy:1};
}
function pingY(t){const j=jumpAt(t);const w=walking(t)?-5*Math.abs(Math.sin(t*16)):0;return Math.sin(t*2.4)*5+j.y+w;}
// bouche : enveloppe de la voix si elle existe, sinon syllabes simulées pendant les sous-titres
function talkAt(t){
  if(window.MOUTH){const v=window.MOUTH[Math.round(t*60)];return v||0;}
  for(const [a,b] of CAPTIONS){if(t>=a&&t<=b-0.15){const u=t-a;return Math.pow(Math.max(0,Math.sin(2*Math.PI*4.4*u)),0.7)*(0.6+0.4*Math.sin(2*Math.PI*1.6*u+1));}}
  return 0;
}
function blinkAt(t){const u=t%3.4;let b=u>3.25?Math.sin(Math.PI*(u-3.25)/0.15):0;const w=(t+1.1)%10.2;if(w>9.85&&w<10.0)b=Math.max(b,Math.sin(Math.PI*(w-9.85)/0.15));return b;}
function face(expr,blink,look,talk){
  const [lx,ly]=look,k=1-0.92*blink;
  const open=(cx,cy,c)=>`<ellipse cx="${cx}" cy="${cy}" rx="${(15-3*talk).toFixed(1)}" ry="${(3+13*talk).toFixed(1)}" fill="#0B0F1E" stroke="${c}" stroke-width="5"/>`;
  if(expr==='happy')return `<path d="M156 246 Q178 214 200 246" fill="none" stroke="${EYE}" stroke-width="9" stroke-linecap="round"/><path d="M220 246 Q242 214 264 246" fill="none" stroke="${EYE}" stroke-width="9" stroke-linecap="round"/><path d="M182 260 Q210 ${(296+16*talk).toFixed(1)} 238 260 Z" fill="${MINT}" stroke="#0B0F1E" stroke-width="3"/>`;
  if(expr==='error')return `<path d="M160 218 L196 254 M196 218 L160 254" stroke="${ORA}" stroke-width="9" stroke-linecap="round"/><path d="M224 218 L260 254 M260 218 L224 254" stroke="${ORA}" stroke-width="9" stroke-linecap="round"/>`+(talk>0.08?open(210,278,ORA):`<path d="M186 278 Q194 268 202 278 Q210 288 218 278 Q226 268 234 278" fill="none" stroke="${ORA}" stroke-width="6" stroke-linecap="round"/>`);
  let eyes,mouth;
  if(expr==='curious'){
    eyes=`<ellipse cx="178" cy="240" rx="19" ry="${(22*k).toFixed(1)}" fill="${EYE}"/><ellipse cx="242" cy="232" rx="25" ry="${(30*k).toFixed(1)}" fill="${EYE}"/><circle cx="${178+lx}" cy="${240+ly*0.8}" r="${(9*k).toFixed(1)}" fill="${SCR}"/><circle cx="${242+lx*1.1}" cy="${232+ly}" r="${(12*k).toFixed(1)}" fill="${SCR}"/><circle cx="${247+lx}" cy="${226+ly}" r="${(4*k).toFixed(1)}" fill="${WHITE}"/>`;
    mouth=talk>0.08?open(210,276,MINT):`<circle cx="210" cy="276" r="8" fill="none" stroke="${MINT}" stroke-width="6"/>`;
  }else if(expr==='smirk'){
    eyes=`<ellipse cx="178" cy="238" rx="22" ry="${(24*k).toFixed(1)}" fill="${EYE}"/><ellipse cx="242" cy="238" rx="22" ry="${(24*k).toFixed(1)}" fill="${EYE}"/><circle cx="${180+lx}" cy="${242+ly*0.6}" r="${(10*k).toFixed(1)}" fill="${SCR}"/><circle cx="${244+lx}" cy="${242+ly*0.6}" r="${(10*k).toFixed(1)}" fill="${SCR}"/><rect x="152" y="208" width="52" height="24" fill="${SCR}"/><rect x="216" y="208" width="52" height="24" fill="${SCR}"/>`;
    mouth=talk>0.08?open(214,274,MINT):`<path d="M194 276 Q222 286 238 264" fill="none" stroke="${MINT}" stroke-width="6" stroke-linecap="round"/>`;
  }else{
    eyes=`<ellipse cx="178" cy="236" rx="22" ry="${(26*k).toFixed(1)}" fill="${EYE}"/><ellipse cx="242" cy="236" rx="22" ry="${(26*k).toFixed(1)}" fill="${EYE}"/><circle cx="${178+lx}" cy="${236+ly}" r="${(10*k).toFixed(1)}" fill="${SCR}"/><circle cx="${242+lx}" cy="${236+ly}" r="${(10*k).toFixed(1)}" fill="${SCR}"/><circle cx="${182+lx}" cy="${231+ly}" r="${(4*k).toFixed(1)}" fill="${WHITE}"/><circle cx="${246+lx}" cy="${231+ly}" r="${(4*k).toFixed(1)}" fill="${WHITE}"/>`;
    mouth=talk>0.08?open(210,276,MINT):`<path d="M190 270 Q210 286 230 270" fill="none" stroke="${MINT}" stroke-width="6" stroke-linecap="round"/>`;
  }
  return eyes+mouth;
}
function pingSVG(t,expr){
  const P=poseAt(t),j=jumpAt(t),talk=talkAt(t),blink=(expr==='happy'||expr==='error')?0:blinkAt(t);
  // micro-mouvements des yeux
  const sac=Math.floor(t/0.8),look=[P.look[0]+1.5*Math.sin(sac*12.9898),P.look[1]+1.2*Math.sin(sac*78.233)];
  const vy=(pingY(t)-pingY(t-0.04))/0.04;
  const sp=clamp(vy*0.03,-16,16);           // les antennes traînent derrière le mouvement
  const jit=expr==='error'?2.5*Math.sin(t*47):0;
  const aL=[120+4*Math.sin(t*3.3)+jit,70+sp],aR=[302+4*Math.sin(t*3.1+1)-jit,74+sp];
  const walk=walking(t)?Math.sin(t*16):0;
  const legL=-12*Math.max(0,walk),legR=-12*Math.max(0,-walk);
  const breathe=1+0.012*Math.sin(t*2.4);
  const sx=j.sx/Math.sqrt(breathe),sy=j.sy*breathe*(1+0.02*talk);
  const tipL=expr==='error'?ORA:MINT,tipR=expr==='error'?ORA:YEL;
  const sig=0.25+0.75*Math.max(talk,0.3*Math.abs(Math.sin(t*3)));
  const al=armPath([114,292],-1,P.L),ar=armPath([306,292],1,P.R);
  const sway=6*Math.sin(t*2.1);
  const air=clamp(-j.y/150);
  return `<svg width="420" height="500" viewBox="0 0 420 500" style="overflow:visible" aria-hidden="true">
<ellipse cx="210" cy="468" rx="${(130*(1-0.35*air)*j.sx).toFixed(1)}" ry="${(14*(1-0.35*air)).toFixed(1)}" fill="#000" opacity="${(0.28*(1-0.5*air)).toFixed(2)}"/>
<g transform="translate(0 ${pingY(t).toFixed(1)}) translate(210 458) rotate(${P.tilt.toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(-210 -458)">
<path d="M300 372 C ${370+sway} 380, ${392+sway} 430, ${352+sway*0.6} 458" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
<path d="M300 372 C ${370+sway} 380, ${392+sway} 430, ${352+sway*0.6} 458" fill="none" stroke="${MINT}" stroke-width="8" stroke-linecap="round"/>
<g transform="translate(${(sway*0.6).toFixed(1)} 0) rotate(-20 351 460)"><rect x="334" y="448" width="34" height="24" rx="5" fill="#F7F9FC" stroke="${INK}" stroke-width="5"/><rect x="341" y="452" width="20" height="6" rx="2" fill="${YEL}"/></g>
<g transform="translate(0 ${legL})"><rect x="158" y="384" width="36" height="58" rx="16" fill="${LEG}" stroke="${INK}" stroke-width="6"/><ellipse cx="172" cy="446" rx="32" ry="15" fill="${ORA}" stroke="${INK}" stroke-width="6"/></g>
<g transform="translate(0 ${legR})"><rect x="226" y="384" width="36" height="58" rx="16" fill="${LEG}" stroke="${INK}" stroke-width="6"/><ellipse cx="248" cy="446" rx="32" ry="15" fill="${ORA}" stroke="${INK}" stroke-width="6"/></g>
<path d="M150 160 Q ${(140+(aL[0]-120)*0.4).toFixed(1)} 116 ${aL[0].toFixed(1)} ${aL[1].toFixed(1)}" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
<path d="M270 160 Q ${(284+(aR[0]-302)*0.4).toFixed(1)} 118 ${aR[0].toFixed(1)} ${aR[1].toFixed(1)}" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
<circle cx="${aL[0].toFixed(1)}" cy="${aL[1].toFixed(1)}" r="15" fill="${tipL}" stroke="${INK}" stroke-width="6"/>
<circle cx="${aR[0].toFixed(1)}" cy="${aR[1].toFixed(1)}" r="15" fill="${tipR}" stroke="${INK}" stroke-width="6"/>
<g transform="translate(${(aR[0]-302).toFixed(1)} ${(aR[1]-74).toFixed(1)})" opacity="${sig.toFixed(2)}"><path d="M326 52 Q 340 72 328 94" fill="none" stroke="${ORA}" stroke-width="5" stroke-linecap="round"/><path d="M340 38 Q 364 72 344 108" fill="none" stroke="${ORA}" stroke-width="5" stroke-linecap="round" opacity=".7"/></g>
<rect x="100" y="150" width="220" height="244" rx="50" fill="${BODY}" stroke="${INK}" stroke-width="6"/>
<rect x="124" y="164" width="56" height="9" rx="4.5" fill="${WHITE}" opacity="0.35"/>
<path d="M104 222 Q 104 126 210 124 Q 316 126 316 222" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
<rect x="84" y="200" width="32" height="60" rx="13" fill="${ORA}" stroke="${INK}" stroke-width="6"/>
<rect x="304" y="200" width="32" height="60" rx="13" fill="${ORA}" stroke="${INK}" stroke-width="6"/>
<path d="M100 252 Q 104 310 160 312" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
<ellipse cx="166" cy="312" rx="10" ry="8" fill="${talk>0.08?MINT:INK}" stroke="${INK}" stroke-width="3"/>
<g transform="translate(${(look[0]*0.4).toFixed(1)} ${(look[1]*0.3).toFixed(1)})">
<rect x="128" y="186" width="164" height="112" rx="26" fill="${SCR}" stroke="${INK}" stroke-width="6"/>
${face(expr,blink,look,talk)}
</g>
<circle cx="152" cy="352" r="7" fill="${expr==='error'?ORA:MINT}" stroke="${INK}" stroke-width="4"/>
<circle cx="176" cy="352" r="7" fill="${expr==='error'?ORA:(talk>0.3||Math.sin(t*6)>0.6?MINT:'#1E6F5C')}" stroke="${INK}" stroke-width="4"/>
<circle cx="200" cy="352" r="7" fill="${expr==='error'?ORA:YEL}" stroke="${INK}" stroke-width="4"/>
<rect x="240" y="342" width="26" height="20" rx="4" fill="${SCR}" stroke="${INK}" stroke-width="3"/>
<rect x="274" y="342" width="26" height="20" rx="4" fill="${SCR}" stroke="${INK}" stroke-width="3"/>
<path d="${al.d}" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/>
<path d="${al.d}" fill="none" stroke="${BODY}" stroke-width="22" stroke-linecap="round"/>
<circle cx="${al.H[0].toFixed(1)}" cy="${al.H[1].toFixed(1)}" r="20" fill="${WHITE}" stroke="${INK}" stroke-width="6"/>
<path d="${ar.d}" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/>
<path d="${ar.d}" fill="none" stroke="${BODY}" stroke-width="22" stroke-linecap="round"/>
<circle cx="${ar.H[0].toFixed(1)}" cy="${ar.H[1].toFixed(1)}" r="20" fill="${WHITE}" stroke="${INK}" stroke-width="6"/>
</g>
</svg>`;
}
function exprAt(t){let e='content';for(const [a,x] of EXPR)if(t>=a)e=x;return e;}

function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function subtitle(t){
  for(const [a,b,txt] of CAPTIONS){
    if(t<a||t>b+0.12)continue;
    // espaces insécables du français : jamais de « ? » ou « ! » seul en début de ligne
    const words=txt.replace(/ ([?!:;»…])/g,'\u00a0$1').replace(/« /g,'«\u00a0').split(' ');
    const w=words.map(x=>x.length+1),tot=w.reduce((p,q)=>p+q,0);
    const f=clamp((t-a)/((b-a)*0.86))*tot;
    let acc=0,n=0;for(let i=0;i<words.length;i++){if(f>=acc-0.001)n=i+1;acc+=w[i];}
    return words.slice(0,n).map((x,i)=>i===n-1&&t<b?`<span class="on">${esc(x)}</span>`:esc(x)).join(' ');
  }
  return '';
}


// ---------- barre de chapitres (en haut) ----------
function chrome(t){
  let ci=0;CHAPTERS.forEach((c,i)=>{if(t>=c[0])ci=i;});
  $('chipText').textContent=CHAPTERS[ci][1];
  const since=t-CHAPTERS[ci][0];
  $('chip').style.transform=`scale(${ci===0&&since<0.4?back(since/0.4):(since<0.4?lerp(0.85,1,back(since/0.4)):1)})`;
  $('fill').style.width=(clamp(t/DURATION)*100).toFixed(2)+'%';
  const marks=CHAPTERS.slice(1).map(c=>c[0]);
  if(!$('mk0'))marks.forEach((c,i)=>{const m=document.createElement('i');m.className='mk';m.id='mk'+i;m.style.left=(c/DURATION*100)+'%';$('track').appendChild(m);});
  marks.forEach((c,i)=>{const m=$('mk'+i);m.classList.toggle('on',t>=c);m.style.transform=`rotate(45deg) scale(${t>=c&&t-c<0.4?back((t-c)/0.4):1})`;});
  return {ci,since};
}
// ---------- le personnage à l'écran ----------
function placeHero(t,x,y,s){
  const ex=exprAt(t);
  const sinceE=t-([...EXPR].reverse().find(e=>t>=e[0])||[0])[0];
  if(ex==='error'&&sinceE<0.6)x+=9*Math.sin(t*70)*(1-sinceE/0.6);
  $('ping').innerHTML=(typeof HERO!=='undefined'&&HERO==='rezo'?rezoFrame:pingSVG)(t,ex);
  $('ping').style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
}
// ---------- caméra : poussée à chaque chapitre, dérive lente, secousses ----------
function camera(t,ci,since,shakes){
  const push=ci>0?1+0.06*(1-out3(clamp(since/0.8))):1;
  let cx=Math.sin(t*0.45)*6,cy=Math.cos(t*0.37)*5;
  for(const t0 of shakes||[])if(t>=t0&&t<t0+0.6){const k=Math.exp(-(t-t0)*8);cx+=18*Math.sin((t-t0)*90)*k;cy+=11*Math.cos((t-t0)*77)*k;}
  $('stage').style.transform=`translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) scale(${(push*(1+0.01*Math.sin(t*0.3))).toFixed(4)})`;
}
