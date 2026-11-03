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
// élan (un petit recul), puis le geste avec un léger dépassement
function snap(u){u=clamp(u);if(u<0.16)return -0.07*Math.sin(Math.PI*u/0.16);const v=(u-0.16)/0.84,c1=1.3,c3=c1+1;return 1+c3*Math.pow(v-1,3)+c1*Math.pow(v-1,2);}
function poseAt(t,T=ARM){
  let i=0;for(let k=0;k<POSE.length;k++)if(t>=POSE[k][0])i=k;
  const cur=POSE[i],prev=POSE[Math.max(0,i-1)],u=t-cur[0];
  const pa=i===0?1:snap(u/0.42),p=i===0?1:inOut(u/0.3);
  const mix=(side)=>{const a=armAngles(prev[side],t,side*2,T),b=armAngles(cur[side],t,side*2,T);return [lerp(a[0],b[0],pa),lerp(a[1],b[1],pa)];};
  const nm=pa<0.5?prev:cur;
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
// hauteur du personnage : Rézo saute un peu moins haut que Ping
function heroY(t){return pingY(t)-(typeof HERO!=='undefined'&&HERO==='rezo'?0.3*jumpAt(t).y:0);}
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
    let acc=0;const ti=words.map((x,i)=>{const v=a+(acc/tot)*(b-a)*0.86;acc+=w[i];return v;});
    const n=ti.filter(v=>t>=v-0.001).length;
    return words.slice(0,n).map((x,i)=>{
      const k=clamp((t-ti[i])/0.18),sc=1.35-0.35*back(k),dy=14*(1-out3(k));
      const st=k<1?` style="display:inline-block;transform:translateY(${dy.toFixed(1)}px) scale(${sc.toFixed(3)})"`:'';
      return i===n-1&&t<b?`<span class="on"${st}>${esc(x)}</span>`:(st?`<span${st}>${esc(x)}</span>`:esc(x));
    }).join(' ');
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
  // boîte de 420 × 500 à (30, 880), mise à l'échelle depuis le bas au centre
  const P=(lx,ly)=>[30+x+210+(lx-210)*s,880+y+500+(ly-500)*s];
  const rz=typeof HERO!=='undefined'&&HERO==='rezo';
  window.HERO_POS={feet:P(210,470),face:P(rz?212:210,(rz?85:240)+heroY(t)),s,x,y};
}
// ---------- caméra : poussée à chaque chapitre, dérive lente, secousses ----------
function camera(t,ci,since,shakes){
  const push=ci>0?1+0.06*(1-out3(clamp(since/0.8))):1;
  let cx=Math.sin(t*0.45)*6,cy=Math.cos(t*0.37)*5;
  for(const t0 of shakes||[])if(t>=t0&&t<t0+0.6){const k=Math.exp(-(t-t0)*8);cx+=18*Math.sin((t-t0)*90)*k;cy+=11*Math.cos((t-t0)*77)*k;}
  $('stage').style.transform=`translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px) scale(${(push*(1+0.01*Math.sin(t*0.3))).toFixed(4)})`;
  setAt(t,cx,cy);wipeAt(t);shotAt(t);fxAt(t);
}

// ---------- décor : l'atelier de Rézo, la nuit, avec vue sur Montréal ----------
function setSVG(){
  const I='#0B0F1E';
  let lit='';const B=[[548,1150,60,120],[612,1110,44,160],[660,1170,70,100],[740,1090,52,180],[796,1140,64,130],[864,1120,56,150]];
  B.forEach(([x,y,w,h],k)=>{for(let r=y+16;r<y+h-14;r+=26)for(let c=x+10;c<x+w-10;c+=18)lit+=`<rect class="lw" x="${c}" y="${r}" width="8" height="12" rx="2" fill="#FFC93C"/>`;});
  const units=[...Array(8).keys()].map(i=>`<rect x="978" y="${790+i*68}" width="120" height="54" rx="8" fill="#0E1630" stroke="${I}" stroke-width="4"/><circle class="rl" cx="1000" cy="${817+i*68}" r="7" fill="${i%3?'#2ED3A6':'#FFC93C'}"/><circle class="rl" cx="1022" cy="${817+i*68}" r="7" fill="#2ED3A6"/><rect x="1040" y="${812+i*68}" width="60" height="9" rx="4" fill="#2B3EA8"/>`).join('');
  return `<svg width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true">
<defs>
<linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121830"/><stop offset="1" stop-color="#1B2446"/></linearGradient>
<linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1A2350"/><stop offset="1" stop-color="#3A4FA6"/></linearGradient>
<radialGradient id="gPool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#3D5AFE" stop-opacity=".28"/><stop offset="1" stop-color="#3D5AFE" stop-opacity="0"/></radialGradient>
<clipPath id="cWin"><rect x="528" y="944" width="404" height="318" rx="16"/></clipPath>
</defs>
<rect width="1080" height="1372" fill="url(#gWall)"/>
${[180,360,540,720,900].map(x=>`<path d="M${x} 0 V1180" stroke="#FFFFFF" stroke-opacity=".035" stroke-width="3"/>`).join('')}
<rect y="1180" width="1080" height="192" fill="#000" opacity=".16"/><path d="M0 1180 H1080" stroke="#2B3EA8" stroke-opacity=".45" stroke-width="6"/>
<path d="M-20 232 Q270 284 540 238 T1100 236" fill="none" stroke="#2ED3A6" stroke-opacity=".32" stroke-width="9" stroke-linecap="round"/>
<path d="M-20 250 Q300 312 560 256 T1100 258" fill="none" stroke="#FFC93C" stroke-opacity=".26" stroke-width="8" stroke-linecap="round"/>
<g clip-path="url(#cWin)">
<rect x="528" y="944" width="404" height="318" fill="url(#gSky)"/>
${[[560,980],[640,1010],[700,972],[820,996],[900,1018],[760,1030]].map(([x,y])=>`<circle class="st" cx="${x}" cy="${y}" r="3" fill="#FFFFFF"/>`).join('')}
<circle cx="880" cy="990" r="22" fill="#FFF3C4" opacity=".9"/>
<path d="M520 1180 Q600 1084 700 1150 L700 1270 L520 1270 Z" fill="#141C3C"/>
<path d="M612 1066 V1112 M596 1080 H628" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/><circle cx="612" cy="1086" r="26" fill="#FFFFFF" opacity=".12"/>
${B.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h+40}" fill="#0E1530"/>`).join('')}
<path d="M880 1270 L904 1060 L916 1064 L904 1270 Z" fill="#0E1530"/><path d="M840 1270 Q900 1170 970 1270 Z" fill="#0E1530"/>
${lit}
</g>
<rect x="528" y="944" width="404" height="318" rx="16" fill="none" stroke="#2B3EA8" stroke-width="12"/>
<path d="M730 944 V1262 M528 1100 H932" stroke="#2B3EA8" stroke-width="10"/>
<rect x="514" y="1258" width="432" height="22" rx="8" fill="#2B3EA8" stroke="${I}" stroke-width="5"/>
<rect x="962" y="772" width="160" height="600" rx="14" fill="#1C2440" stroke="${I}" stroke-width="7"/>
${units}
<rect y="1372" width="1080" height="548" fill="#10162B"/>
<path d="M0 1372 H1080" stroke="#2B3EA8" stroke-width="7"/>
${[1430,1510,1620,1770].map(y=>`<path d="M0 ${y} H1080" stroke="#FFFFFF" stroke-opacity=".04" stroke-width="3"/>`).join('')}
<g id="rug"><ellipse cx="0" cy="8" rx="330" ry="70" fill="url(#gPool)"/><ellipse cx="0" cy="0" rx="230" ry="30" fill="#2B3EA8" opacity=".45"/><ellipse cx="0" cy="0" rx="196" ry="22" fill="none" stroke="#2ED3A6" stroke-opacity=".3" stroke-width="5"/></g>
</svg>`;
}
let SET_EL=null;
function setAt(t,cx,cy){
  const e=$('set');if(!e)return;
  if(!SET_EL){e.innerHTML=setSVG();SET_EL={lw:[...e.querySelectorAll('.lw')],rl:[...e.querySelectorAll('.rl')],st:[...e.querySelectorAll('.st')]};}
  e.style.transform=`translate(${(-cx*0.35).toFixed(1)}px,${(-cy*0.35).toFixed(1)}px)`;
  // le tapis lumineux suit le personnage
  const H=window.HERO_POS;if(H)$('rug').setAttribute('transform',`translate(${(H.feet[0]+cx*0.35).toFixed(1)} ${(H.feet[1]+14+cy*0.35).toFixed(1)}) scale(${H.s.toFixed(3)} 1)`);
  SET_EL.lw.forEach((w,i)=>{w.setAttribute('opacity',Math.sin(t*0.6+i*2.399)>-0.35?0.85:0.12);});
  SET_EL.rl.forEach((l,i)=>{l.setAttribute('opacity',Math.sin(t*7+i*1.7)>-0.2?1:0.25);});
  SET_EL.st.forEach((s,i)=>{s.setAttribute('opacity',(0.45+0.55*Math.abs(Math.sin(t*1.3+i))).toFixed(2));});
}

// ---------- transition : une bande de couleur balaie l'écran à chaque chapitre ----------
const WIPE_COLORS=['#2ED3A6','#FFC93C','#3D5AFE','#FF6B3D','#7A4DFF','#2ED3A6'];
function wipeAt(t){
  const a=$('wipe'),b=$('wipe2');if(!a)return;
  let k=-1;CHAPTERS.slice(1).forEach((c,i)=>{if(t>=c[0]-0.3&&t<c[0]+0.32)k=i;});
  if(k<0){a.style.opacity=0;b.style.opacity=0;return;}
  const t0=CHAPTERS[k+1][0]-0.3;
  const pos=(u)=>lerp(1300,-2000,inOut(clamp(u)));
  a.style.opacity=1;a.style.background=WIPE_COLORS[k%WIPE_COLORS.length];
  a.style.transform=`translateX(${pos((t-t0)/0.62).toFixed(0)}px) skewX(-16deg)`;
  b.style.opacity=1;b.style.transform=`translateX(${(pos((t-t0-0.05)/0.62)+780).toFixed(0)}px) skewX(-16deg)`;
}

// ---------- gros plans : la caméra zoome sur le visage (SHOTS = [[début, fin, zoom]]) ----------
function shotAt(t){
  const w=$('world');if(!w)return;
  let c=0,Z=1.9;
  for(const [a,b,z] of (typeof SHOTS!=='undefined'?SHOTS:[])){if(t>a&&t<b+0.32){const v=Math.min(out3((t-a)/0.22),1-inOut((t-b)/0.32));if(v>c){c=v;Z=z||1.9;}}}
  if(c<=0){w.style.transform='none';return;}
  const f=window.HERO_POS.face,z=1+(Z-1)*c,tx=lerp(f[0],540,c),ty=lerp(f[1],860,c);
  const sh=c*3*Math.sin(t*23);
  w.style.transform=`translate(${(tx-z*f[0]+sh).toFixed(1)}px,${(ty-z*f[1]).toFixed(1)}px) scale(${z.toFixed(4)})`;
}

// ---------- effets cartoon : poussière, lignes de vitesse, étincelles, « ! » et « ? » ----------
function fxAt(t){
  const e=$('fx');if(!e||!window.HERO_POS)return;
  const H=window.HERO_POS,[fx,fy]=H.feet,[hx,hy]=H.face,s=H.s;let o='';
  const puff=(x,y,r,a)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="#C9D3F2" opacity="${a.toFixed(2)}"/>`;
  for(const j of (typeof JUMPS!=='undefined'?JUMPS:[])){
    const u=t-(j+0.46);
    if(u>=0&&u<0.55){const q=u/0.55;for(let i=0;i<6;i++){const side=i%2?1:-1,d=(40+120*out3(q))*(0.7+0.15*(i>>1));o+=puff(fx+side*d,fy-6-24*q*((i>>1)+1)*0.5,(16-8*q)*(1+0.2*(i>>1))*s,0.75*(1-q));}}
    const v=t-j;
    if(v>0.02&&v<0.36){const q=(v-0.02)/0.34;for(const dx of [-46,0,46])o+=`<path d="M${(fx+dx*s).toFixed(1)} ${(fy-40+60*q).toFixed(1)} v${(70*s).toFixed(1)}" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="${(0.6*(1-q)).toFixed(2)}"/>`;}
  }
  for(const ev of (window.EVENTS||[]))if(ev.type==='step'){const u=t-ev.t;if(u>=0&&u<0.35){const q=u/0.35,side=Math.round(ev.t/0.196)%2?1:-1;o+=puff(fx+side*(34+30*q)*s,fy-4-10*q,(11-5*q)*s,0.6*(1-q));}}
  const star=(x,y,r,a)=>`<path d="M${x} ${y-r} Q${x+r*0.18} ${y-r*0.18} ${x+r} ${y} Q${x+r*0.18} ${y+r*0.18} ${x} ${y+r} Q${x-r*0.18} ${y+r*0.18} ${x-r} ${y} Q${x-r*0.18} ${y-r*0.18} ${x} ${y-r} Z" fill="#FFC93C" stroke="#0B0F1E" stroke-width="4" opacity="${a.toFixed(2)}"/>`;
  for(let i=1;i<EXPR.length;i++){
    const [t0,x]=EXPR[i],u=t-t0;if(u<0||u>0.8)continue;
    const pop=back(clamp(u/0.25)),fade=clamp((0.8-u)/0.25);
    if(x==='happy')[[-150,-120],[150,-150],[-120,40],[170,10]].forEach(([dx,dy],k)=>{const r=(k%2?16:22)*pop*s;if(r>0.5)o+=star((hx+dx*s).toFixed(1)*1,(hy+dy*s-20*u).toFixed(1)*1,r,fade);});
    if(x==='error'||x==='curious'){const ch=x==='error'?'!':'?',col=x==='error'?'#FF6B3D':'#FFC93C',sz=120*pop*s;
      if(sz>1)o+=`<text x="${(hx+150*s+Math.sin(u*40)*(x==='error'?4:0)).toFixed(1)}" y="${(hy-150*s).toFixed(1)}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${sz.toFixed(1)}" fill="${col}" stroke="#0B0F1E" stroke-width="8" paint-order="stroke" opacity="${fade.toFixed(2)}" transform="rotate(${x==='error'?8:-8} ${(hx+150*s).toFixed(1)} ${(hy-190*s).toFixed(1)})">${ch}</text>`;}
  }
  e.innerHTML=`<svg width="1080" height="1920" viewBox="0 0 1080 1920" aria-hidden="true">${o}</svg>`;
}
