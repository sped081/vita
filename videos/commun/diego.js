// Diego : l'animateur de la série. Style animation moderne (traits fins colorés, dégradés).
// Même cadre que Rézo : viewBox -20 -24 460 660, pieds à y = 618. La tête est dessinée dans ses
// coordonnées de buste (400 × 560), puis placée sur le corps (échelle 0,9).
const DG = {
  skin: '#C08A62', hair: '#2E1C12', hairHi: '#7A5236', eye: '#4E8A5A', brow: '#24150D',
  shirt: '#C23B3B', tee: '#F4F1EA', jeans: '#34507E', shoe: '#F4F4F2',
};
const dgHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const dgTo = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const dgDark = (h, k) => dgTo(dgHex(h).map((v) => v * (1 - k)));
const dgLight = (h, k) => dgTo(dgHex(h).map((v) => v + (255 - v) * k));
const g1 = (n) => n.toFixed(1);
const dP = (d, f, s, w = 3, x = '') => `<path d="${d}" fill="${f}"${s ? ` stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"` : ''}${x}></path>`;
const dL = (d, s, w = 3, x = '') => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${x}></path>`;
const dC = (cx, cy, r, f, s, w = 3, x = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}"${s ? ` stroke="${s}" stroke-width="${w}"` : ''}${x}></circle>`;

const DG_HEAD = 'M200 118 C258 118 292 154 292 212 C292 262 286 296 268 316 C250 334 226 344 200 344 C174 344 150 334 132 316 C114 296 108 262 108 212 C108 154 142 118 200 118 Z';
const DG_EYE = ['M142 241 C147 224 177 219 188 236 C178 251 152 253 142 241 Z', 'M258 241 C253 224 223 219 212 236 C222 251 248 253 258 241 Z'];
const DG_BROW = ['M136 212 C150 199 178 198 194 205 L193 216 C176 210 154 211 139 222 Z', 'M264 212 C250 199 222 198 206 205 L207 216 C224 210 246 211 261 222 Z'];

function dgDefs() {
  const C = DG;
  return `<defs>
<clipPath id="dg-h"><path d="${DG_HEAD}"></path></clipPath><clipPath id="dg-el"><path d="${DG_EYE[0]}"></path></clipPath><clipPath id="dg-er"><path d="${DG_EYE[1]}"></path></clipPath>
<linearGradient id="dg-sk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dgLight(C.skin, .08)}"></stop><stop offset=".55" stop-color="${C.skin}"></stop><stop offset="1" stop-color="${dgDark(C.skin, .1)}"></stop></linearGradient>
<linearGradient id="dg-hr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${dgLight(C.hair, .28)}"></stop><stop offset=".55" stop-color="${C.hair}"></stop><stop offset="1" stop-color="${dgDark(C.hair, .2)}"></stop></linearGradient>
<radialGradient id="dg-ir"><stop offset="0" stop-color="${dgLight(C.eye, .35)}"></stop><stop offset=".7" stop-color="${C.eye}"></stop><stop offset="1" stop-color="${dgDark(C.eye, .35)}"></stop></radialGradient>
<radialGradient id="dg-bl"><stop offset="0" stop-color="#FF7A7A" stop-opacity=".22"></stop><stop offset="1" stop-color="#FF7A7A" stop-opacity="0"></stop></radialGradient>
<pattern id="dg-plaid" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="${C.shirt}"></rect><rect y="14" width="40" height="10" fill="${dgDark(C.shirt, .3)}" opacity=".75"></rect><rect x="14" width="10" height="40" fill="${dgDark(C.shirt, .3)}" opacity=".75"></rect><rect y="31" width="40" height="2" fill="#F2D0C0" opacity=".5"></rect><rect x="31" width="2" height="40" fill="#F2D0C0" opacity=".5"></rect></pattern>
<linearGradient id="dg-jn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${dgLight(C.jeans, .1)}"></stop><stop offset="1" stop-color="${dgDark(C.jeans, .12)}"></stop></linearGradient>
</defs>`;
}

// visage, dans les coordonnées du buste. expr : content, curious, happy, panic, sly
function dgFace(expr, look, talk, blink) {
  const C = DG, so = dgDark(C.skin, .4), sd = dgDark(C.skin, .16), ink = '#24150F';
  const lx = Math.max(-5, Math.min(5, look[0])), ly = Math.max(-4, Math.min(4, look[1]));
  // yeux : ouverture selon l'expression et le clignement
  let k = { happy: 0.55, panic: 1.12, sly: 0.62, curious: 1.05 }[expr] || 1;
  k *= 1 - 0.92 * blink;
  const pupil = expr === 'panic' ? 4 : 5.8;
  const eye = (i, cx) => {
    const sh = expr === 'sly' ? 3 : 0;
    return `<g transform="translate(0 ${g1(238 + sh)}) scale(1 ${k.toFixed(3)}) translate(0 -238)">` +
      dP(DG_EYE[i], '#FFFFFF') + `<g clip-path="url(#dg-e${i ? 'r' : 'l'})">` +
      dC(g1(cx + lx), g1(238.5 + ly), 12.5, 'url(#dg-ir)') + dC(g1(cx + lx), g1(238.5 + ly), 12.5, 'none', dgDark(C.eye, .55), 2) +
      dC(g1(cx + lx), g1(239.5 + ly), pupil, '#140D09') +
      dP(`M${g1(cx + lx - 9)} ${g1(234 + ly)} Q${g1(cx + lx - 5)} ${g1(228 + ly)} ${g1(cx + lx + 1)} ${g1(229 + ly)} Q${g1(cx + lx - 4)} ${g1(232 + ly)} ${g1(cx + lx - 6)} ${g1(237 + ly)} Z`, '#FFFFFF', '', 0, ' opacity=".9"') +
      dC(g1(cx + lx + 5), g1(244 + ly), 1.8, '#FFFFFF') + `</g>` +
      dL(i ? 'M260 242 C253 222 223 216 210 234' : 'M140 242 C147 222 177 216 190 234', ink, 4.4) + `</g>`;
  };
  // sourcils : déplacement et rotation selon l'expression ; ils montent quand il parle
  const up = -3 * talk;
  const B = {
    content: [[0, 0], [0, 0]], happy: [[-4, 0], [-4, 0]], curious: [[-10, -4], [1, 0]],
    panic: [[-6, -9], [-6, 9]], sly: [[4, 8], [-8, -6]],
  }[expr] || [[0, 0], [0, 0]];
  const brow = (i) => `<path d="${DG_BROW[i]}" fill="${C.brow}" transform="translate(0 ${g1(B[i][0] + up)}) rotate(${B[i][1]} ${i ? 235 : 165} 210)"></path>`;
  // bouche
  const o = Math.max(0, Math.min(1, talk));
  const open = (a) => dP(`M180 300 Q200 ${g1(295 - 2 * a)} 222 299 Q${g1(212)} ${g1(312 + 24 * a)} 200 ${g1(313 + 24 * a)} Q${g1(188)} ${g1(312 + 24 * a)} 180 300 Z`, '#4A1A1E', so, 2) +
    dP(`M183 300 Q200 ${g1(297 - 2 * a)} 219 299 L218 305 Q200 303 184 306 Z`, '#FFFFFF') +
    `<ellipse cx="200" cy="${g1(307 + 15 * a)}" rx="${g1(10 + 2 * a)}" ry="${g1(3 + 4 * a)}" fill="#D96A6A"></ellipse>`;
  let mouth;
  if (expr === 'panic') mouth = o > 0.06 ? `<ellipse cx="200" cy="${g1(306 + 4 * o)}" rx="${g1(9 + 3 * o)}" ry="${g1(10 + 8 * o)}" fill="#4A1A1E" stroke="${so}" stroke-width="2"></ellipse>` : dL('M184 306 Q192 300 200 306 Q208 312 216 306', so, 3);
  else if (o > 0.06) mouth = open(o);
  else if (expr === 'happy') mouth = open(0.55);
  else if (expr === 'sly') mouth = dL('M184 304 Q204 310 222 296', so, 3) + dL('M222 296 L226 293', so, 2.5);
  else if (expr === 'curious') mouth = dL('M190 306 Q201 302 212 307', so, 3);
  else mouth = dP('M178 300 Q200 323 224 299 Q200 307 178 300 Z', '#FFFFFF', so, 2.5) + dL('M178 300 Q200 307 224 299', so, 2.5);
  const sweat = expr === 'panic' ? dP('M296 170 Q306 190 306 200 A10 10 0 1 1 286 200 Q286 190 296 170 Z', '#7FD3FF', '#3A8FC0', 2.5) : '';
  return {
    eyes: eye(0, 167) + eye(1, 233), brows: brow(0) + brow(1), mouth, sweat,
    shade: dP('M140 232 C150 220 178 218 190 232 L190 226 C176 212 150 214 140 226 Z', sd, '', 0, ' opacity=".55"') + dP('M260 232 C250 220 222 218 210 232 L210 226 C224 212 250 214 260 226 Z', sd, '', 0, ' opacity=".55"'),
  };
}

function dgHead(expr, look, talk, blink) {
  const C = DG, so = dgDark(C.skin, .4), sd = dgDark(C.skin, .16), F = dgFace(expr, look, talk, blink);
  return [114, 286].map((x, i) => `<ellipse cx="${x}" cy="250" rx="13" ry="21" fill="${C.skin}" stroke="${so}" stroke-width="2.5"></ellipse>` + dL(i ? 'M282 240 Q290 250 283 262' : 'M118 240 Q110 250 117 262', so, 2)).join('') +
    dP(DG_HEAD, 'url(#dg-sk)', so, 2.5) +
    `<g clip-path="url(#dg-h)">` +
    dP('M250 118 C300 170 300 272 236 344 L320 344 L320 118 Z', sd, '', 0, ' opacity=".55"') +
    dL(DG_HEAD, dgLight(C.skin, .5), 7, ' opacity=".22" transform="translate(-5 0)"') +
    dP('M108 232 C110 316 160 354 200 354 C240 354 290 316 292 232 C284 292 254 322 236 324 Q200 308 164 324 C146 322 116 292 108 232 Z', 'url(#dg-hr)') +
    dL('M130 300 C150 330 180 344 200 346', C.hairHi, 2.5, ' opacity=".45"') + `</g>` +
    `<ellipse cx="152" cy="282" rx="24" ry="12" fill="url(#dg-bl)"></ellipse><ellipse cx="248" cy="282" rx="24" ry="12" fill="url(#dg-bl)"></ellipse>` +
    F.shade + F.eyes + F.brows +
    dL('M205 250 C207 264 211 272 207 279', so, 2.5, ' opacity=".75"') + dL('M191 283 Q200 290 210 283', so, 2.2, ' opacity=".6"') + `<ellipse cx="203" cy="275" rx="5" ry="3" fill="#FFFFFF" opacity=".28"></ellipse>` +
    F.mouth + dP('M174 294 Q200 280 226 294 Q216 300 200 296 Q184 300 174 294 Z', C.hair) +
    dP('M110 236 C96 150 140 100 202 100 C266 100 306 150 290 236 C286 200 276 180 262 172 C270 200 266 216 256 226 C252 196 236 176 214 170 C200 190 176 200 150 200 C140 210 134 222 132 236 C126 226 118 228 110 236 Z', 'url(#dg-hr)', dgDark(C.hair, .3), 2) +
    dL('M140 136 C170 112 230 108 262 128', C.hairHi, 4, ' opacity=".6"') + dL('M156 160 C176 150 196 148 214 150', C.hairHi, 3, ' opacity=".5"') +
    dL('M114 230 C110 250 114 268 120 276 M288 230 C292 250 288 268 282 276', 'url(#dg-hr)', 9) + F.sweat;
}

// bras : angle de l'épaule (0 = vers le bas, positif = vers l'extérieur) et pli du coude
const DG_POSES = { rest: [12, -8], wave: [140, 30], point: [130, 0], side: [96, -4], shrug: [62, 96], cheer: [168, 6], hip: [50, -120], think: [-40, -140], present: [72, 40], explain: [60, 50] };
function dgArm(S, dir, [a1, a2]) {
  const r = Math.PI / 180, l1 = 72, l2 = 70;
  const E = [S[0] + dir * l1 * Math.sin(a1 * r), S[1] + l1 * Math.cos(a1 * r)];
  const H = [E[0] + dir * l2 * Math.sin((a1 + a2) * r), E[1] + l2 * Math.cos((a1 + a2) * r)];
  const Cq = [2 * E[0] - (S[0] + H[0]) / 2, 2 * E[1] - (S[1] + H[1]) / 2];
  return { d: `M${S[0]} ${S[1]} Q${g1(Cq[0])} ${g1(Cq[1])} ${g1(H[0])} ${g1(H[1])}`, H, ang: a1 + a2 };
}
function dgHand(H, dir, ang, kind) {
  const C = DG, so = dgDark(C.skin, .4), r = Math.PI / 180, ux = dir * Math.sin(ang * r), uy = Math.cos(ang * r), [x, y] = H;
  const cuff = `<circle cx="${g1(x - ux * 14)}" cy="${g1(y - uy * 14)}" r="15" fill="${C.tee}" stroke="${dgDark(C.tee, .35)}" stroke-width="2.5"></circle>`;
  if (kind === 'point') {
    const fx = x + ux * 30, fy = y + uy * 30;
    return cuff + dL(`M${g1(x)} ${g1(y)} L${g1(fx)} ${g1(fy)}`, so, 15) + dL(`M${g1(x)} ${g1(y)} L${g1(fx)} ${g1(fy)}`, C.skin, 10) +
      dC(g1(x), g1(y), 17, C.skin, so, 2.5) + dL(`M${g1(x - uy * dir * 8)} ${g1(y + ux * dir * 8)} q${g1(ux * 6)} ${g1(uy * 6)} ${g1(ux * 10)} ${g1(uy * 10)}`, so, 2);
  }
  const tx = x + (-uy * dir) * 15 + ux * 4, ty = y + (ux * dir) * 15 + uy * 4;
  return cuff + dC(g1(x), g1(y), 19, C.skin, so, 2.5) +
    `<ellipse cx="${g1(tx)}" cy="${g1(ty)}" rx="8" ry="12" transform="rotate(${g1(-dir * ang)} ${g1(tx)} ${g1(ty)})" fill="${C.skin}" stroke="${so}" stroke-width="2.5"></ellipse>` +
    dL(`M${g1(x + ux * 8 - uy * dir * 5)} ${g1(y + uy * 8 + ux * dir * 5)} l${g1(ux * 7)} ${g1(uy * 7)} M${g1(x + ux * 8 + uy * dir * 5)} ${g1(y + uy * 8 - ux * dir * 5)} l${g1(ux * 7)} ${g1(uy * 7)}`, so, 2);
}

function diegoSVG(o = {}) {
  const C = DG, expr = o.expr || 'content', talk = o.talk || 0, look = o.look || [0, 0], blink = o.blink || 0;
  const aL = o.aL || DG_POSES.rest, aR = o.aR || DG_POSES.rest;
  const al = dgArm([142, 318], -1, aL), ar = dgArm([278, 318], 1, aR);
  const air = o.air || 0, sx = o.sx || 1, sy = o.sy || 1, tilt = o.tilt || 0, y = o.y || 0, ht = o.headTilt || 0;
  const jo = dgDark(C.jeans, .4), so = dgDark(C.skin, .4), sh = dgDark(C.shirt, .45);
  const leg = (x, lift, mirror) => `<g transform="translate(0 ${g1(lift || 0)})">` +
    `<rect x="${x}" y="440" width="34" height="156" rx="14" fill="url(#dg-jn)" stroke="${jo}" stroke-width="2.5"></rect>` +
    dL(`M${x + 17} 470 v100`, dgLight(C.jeans, .25), 2, ' opacity=".35"') +
    (mirror ? dP('M214 600 Q216 580 236 580 L258 580 Q286 580 286 604 L286 610 L214 610 Z', C.shoe, '#9AA0AE', 2.5) + `<rect x="210" y="602" width="84" height="14" rx="7" fill="#D9C6A5" stroke="#9A8A70" stroke-width="2.5"></rect>` + dL('M236 592 Q252 586 266 594', C.shirt, 4)
      : dP('M134 604 Q134 580 162 580 L184 580 Q206 580 206 600 L206 610 L134 610 Z', C.shoe, '#9AA0AE', 2.5) + `<rect x="126" y="602" width="84" height="14" rx="7" fill="#D9C6A5" stroke="#9A8A70" stroke-width="2.5"></rect>` + dL('M154 594 Q168 586 184 592', C.shirt, 4)) + `</g>`;
  const TORSO = 'M146 300 Q210 290 274 300 Q306 306 304 336 L292 440 Q290 460 270 460 L150 460 Q130 460 128 440 L116 336 Q114 306 146 300 Z';
  return `<svg width="${o.w || 420}" height="${o.h || 660}" viewBox="${o.viewBox || '-20 -24 460 660'}" style="overflow:visible;${o.style || ''}" ${o.label ? `role="img" aria-label="${o.label}"` : 'aria-hidden="true"'}>${dgDefs()}
<ellipse cx="210" cy="624" rx="${g1(124 * (1 - 0.35 * air) * sx)}" ry="${g1(12 * (1 - 0.35 * air))}" fill="#000" opacity="${(0.22 * (1 - 0.5 * air)).toFixed(2)}"></ellipse>
<g transform="translate(0 ${g1(y)}) translate(210 618) rotate(${g1(tilt)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(-210 -618)">
${leg(160, o.legL, false)}${leg(226, o.legR, true)}
${dP(TORSO, 'url(#dg-plaid)', sh, 2.5)}
${dP('M250 300 C300 316 304 380 292 440 Q290 460 270 460 L252 460 C262 410 262 340 236 304 Z', '#000', '', 0, ' opacity=".18"')}
${dP('M186 298 L234 298 L232 460 L188 460 Z', C.tee, dgDark(C.tee, .3), 2)}
${dL('M200 300 Q210 380 206 460', dgDark(C.tee, .15), 2, ' opacity=".6"')}
${dP('M186 298 L196 460 L176 460 L160 304 Z', 'url(#dg-plaid)', sh, 2.5)}${dP('M234 298 L224 460 L244 460 L260 304 Z', 'url(#dg-plaid)', sh, 2.5)}
${dC(186, 360, 4, '#F4F1EA', sh, 1.5)}${dC(188, 410, 4, '#F4F1EA', sh, 1.5)}
<rect x="190" y="262" width="40" height="46" rx="12" fill="url(#dg-sk)" stroke="${so}" stroke-width="2.5"></rect>
${dP('M190 280 Q210 300 230 280 L230 296 Q210 312 190 296 Z', dgDark(C.skin, .16))}
${dP('M188 294 Q210 312 232 294 L232 302 Q210 318 188 302 Z', C.tee, dgDark(C.tee, .3), 2)}
${dP('M180 290 L206 320 L166 330 L164 300 Z', 'url(#dg-plaid)', sh, 2.5)}${dP('M240 290 L214 320 L254 330 L256 300 Z', 'url(#dg-plaid)', sh, 2.5)}
<g transform="translate(${g1(o.headX || 0)} ${g1((o.headY || 0) - 2 * talk)}) rotate(${g1(ht)} 210 284)"><g transform="translate(30 -25.6) scale(0.9)">${dgHead(expr, look, talk, blink)}</g></g>
${dL(al.d, sh, 30)}${dL(al.d, 'url(#dg-plaid)', 25)}${dgHand(al.H, -1, al.ang, o.handL || 'open')}
${dL(ar.d, sh, 30)}${dL(ar.d, 'url(#dg-plaid)', 25)}${dgHand(ar.H, 1, ar.ang, o.handR || 'open')}
</g>
</svg>`;
}

// ---------- animation, à partir des chronologies de la page (POSE, JUMPS, walking, CAPTIONS) ----------
const DG_EXPR = { content: 'content', curious: 'curious', happy: 'happy', error: 'panic', smirk: 'sly' };
const DG_SCALE = 0.9;
function diegoFrame(t, expr) {
  const P = poseAt(t, DG_POSES), j = jumpAt(t), talk = talkAt(t), e = DG_EXPR[expr] || 'content';
  const blink = e === 'happy' ? 0 : blinkAt(t);
  const sac = Math.floor(t / 0.8), look = [P.look[0] * 0.8 + 1.2 * Math.sin(sac * 12.9898), P.look[1] * 0.8 + Math.sin(sac * 78.233)];
  const walk = walking(t) ? Math.sin(t * 16) : 0;
  const breathe = 1 + 0.01 * Math.sin(t * 2.4);
  const hand = (n) => (n === 'point' || n === 'side' ? 'point' : 'open');
  const aL = [...P.L], aR = [...P.R];
  if (walk) { if (P.names.L !== 'wave') aL[0] += 20 * walk; if (P.names.R !== 'wave') aR[0] -= 20 * walk; }
  return diegoSVG({
    expr: e, talk, look, blink, aL, aR, handL: hand(P.names.L), handR: hand(P.names.R),
    y: heroY(t) / DG_SCALE, sx: j.sx / Math.sqrt(breathe), sy: j.sy * breathe, tilt: P.tilt + 1.2 * Math.sin(t * 1.1) + 3 * walk,
    headX: look[0] * 0.9, headY: look[1] * 0.5, headTilt: 2 * Math.sin(t * 1.7) + look[0] * 0.5 + 3 * talk * Math.sin(t * 7),
    legL: -16 * Math.max(0, walk), legR: -16 * Math.max(0, -walk), air: clamp(-j.y / 150),
    w: 460 * DG_SCALE, h: 660 * DG_SCALE, viewBox: '-20 -24 460 660',
    style: `position:absolute;left:${g1(210 - 230 * DG_SCALE)}px;top:${g1(470 - 642 * DG_SCALE)}px`,
  });
}
if (typeof module !== 'undefined') module.exports = { diegoSVG, DG, DG_POSES };
