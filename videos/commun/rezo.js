// Rézo : le technicien réseau de Montréal, en cartoon. Dessin en SVG (viewBox 0 -20 420 660, pieds à y = 618).
// rezoSVG(options) dessine une pose ; rezoFrame(t, expr) l'anime à partir des chronologies de la page.
const RZ = { ink: '#151A2E', hair: '#2A1E1A', mouth: '#5A1A2A', tongue: '#FF7A8A', yel: '#FFC93C', ora: '#FF6B3D', denim: '#26315E', eye: '#FFFFFF' };
const RZ_COLORS = { skin: '#A86B4C', hoodie: '#3D5AFE', tuque: '#2ED3A6' };
const f1 = (n) => n.toFixed(1);

// bras : angle de l'épaule (0 = vers le bas, positif = vers l'extérieur) et pli du coude
function rzArm(S, dir, [a1, a2]) {
  const r = Math.PI / 180, l1 = 66, l2 = 62;
  const E = [S[0] + dir * l1 * Math.sin(a1 * r), S[1] + l1 * Math.cos(a1 * r)];
  const H = [E[0] + dir * l2 * Math.sin((a1 + a2) * r), E[1] + l2 * Math.cos((a1 + a2) * r)];
  const C = [2 * E[0] - (S[0] + H[0]) / 2, 2 * E[1] - (S[1] + H[1]) / 2];
  return { d: `M${S[0]} ${S[1]} Q${f1(C[0])} ${f1(C[1])} ${f1(H[0])} ${f1(H[1])}`, H, ang: a1 + a2 };
}
function rzHand(H, dir, ang, kind, skin) {
  const r = Math.PI / 180, ux = dir * Math.sin(ang * r), uy = Math.cos(ang * r), [x, y] = H, I = RZ.ink;
  if (kind === 'point') {
    const fx = x + ux * 30, fy = y + uy * 30;
    return `<path d="M${f1(x)} ${f1(y)} L${f1(fx)} ${f1(fy)}" stroke="${I}" stroke-width="20" stroke-linecap="round"></path>` +
      `<path d="M${f1(x)} ${f1(y)} L${f1(fx)} ${f1(fy)}" stroke="${skin}" stroke-width="10" stroke-linecap="round"></path>` +
      `<circle cx="${f1(x)}" cy="${f1(y)}" r="19" fill="${skin}" stroke="${I}" stroke-width="5"></circle>`;
  }
  const tx = x + (-uy * dir) * 16 + ux * 4, ty = y + (ux * dir) * 16 + uy * 4;
  return `<circle cx="${f1(x)}" cy="${f1(y)}" r="21" fill="${skin}" stroke="${I}" stroke-width="5"></circle>` +
    `<ellipse cx="${f1(tx)}" cy="${f1(ty)}" rx="9" ry="13" transform="rotate(${f1(-dir * ang)} ${f1(tx)} ${f1(ty)})" fill="${skin}" stroke="${I}" stroke-width="5"></ellipse>` +
    `<path d="M${f1(x + ux * 8)} ${f1(y + uy * 8)} l${f1(ux * 8)} ${f1(uy * 8)}" stroke="${I}" stroke-width="3.5" stroke-linecap="round"></path>`;
}

// visage : content, curious, happy, surprised, sly, panic ; talk ouvre la bouche, blink ferme les yeux
function rzFace(expr, look, talk, blink, skin) {
  const I = RZ.ink, H = RZ.hair, [lx, ly] = look, k = 1 - 0.9 * blink;
  const brow = (d) => `<path d="${d}" transform="translate(0 ${f1(-5 * talk)})" fill="none" stroke="${H}" stroke-width="12" stroke-linecap="round"></path>`;
  const eye = (cx, cy, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="27" ry="${f1(ry * k)}" fill="${RZ.eye}" stroke="${I}" stroke-width="5"></ellipse>`;
  const pup = (cx, cy, r) => blink > 0.6 ? '' : `<circle cx="${f1(cx + lx)}" cy="${f1(cy + ly)}" r="${r}" fill="${I}"></circle><circle cx="${f1(cx + lx + 2.5)}" cy="${f1(cy + ly - 2.5)}" r="2.2" fill="#FFFFFF"></circle>`;
  const open = (o) => `<ellipse cx="213" cy="${f1(252 + 6 * o)}" rx="${f1(30 - 6 * o)}" ry="${f1(8 + 18 * o)}" fill="${RZ.mouth}" stroke="${I}" stroke-width="5"></ellipse>` +
    `<path d="M${f1(189 + 4 * o)} ${f1(242 + 2 * o)} Q213 ${f1(236 + 2 * o)} ${f1(237 - 4 * o)} ${f1(242 + 2 * o)} L${f1(235 - 4 * o)} ${f1(249 + 2 * o)} Q213 ${f1(244 + 2 * o)} ${f1(191 + 4 * o)} ${f1(249 + 2 * o)} Z" fill="#FFFFFF"></path>` +
    `<ellipse cx="213" cy="${f1(262 + 12 * o)}" rx="${f1(14 - 2 * o)}" ry="${f1(4 + 4 * o)}" fill="${RZ.tongue}"></ellipse>`;
  const grin = `<path d="M168 240 Q212 296 258 238 Q212 254 168 240 Z" fill="${RZ.mouth}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path><path d="M178 243 Q212 252 248 242 L244 254 Q212 262 182 255 Z" fill="#FFFFFF"></path><path d="M213 250 L213 259" stroke="${I}" stroke-width="3"></path><ellipse cx="214" cy="270" rx="16" ry="6" fill="${RZ.tongue}"></ellipse>`;
  const talking = talk > 0.06;
  let out = '';
  if (expr === 'happy') {
    out = brow('M158 146 Q180 130 204 140') + brow('M222 140 Q246 130 268 146') +
      `<path d="M164 190 Q186 166 208 190" fill="none" stroke="${I}" stroke-width="7" stroke-linecap="round"></path><path d="M218 190 Q240 166 262 190" fill="none" stroke="${I}" stroke-width="7" stroke-linecap="round"></path>` +
      (talking ? open(Math.max(talk, 0.4)) : `<path d="M166 236 Q212 306 260 234 Q212 252 166 236 Z" fill="${RZ.mouth}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path><path d="M176 240 Q212 251 250 238 L246 251 Q212 261 180 252 Z" fill="#FFFFFF"></path><ellipse cx="214" cy="276" rx="18" ry="8" fill="${RZ.tongue}"></ellipse>`);
  } else if (expr === 'curious') {
    out = brow('M158 132 Q180 114 204 126') + brow('M222 148 Q246 142 268 150') +
      eye(186, 182, 32) + eye(240, 186, 28) + pup(190, 180, 7) + pup(244, 184, 7) +
      (talking ? open(talk) : `<path d="M196 256 Q214 250 232 258" fill="none" stroke="${I}" stroke-width="6" stroke-linecap="round"></path><circle cx="236" cy="258" r="3" fill="${I}"></circle>`);
  } else if (expr === 'surprised') {
    out = brow('M158 138 Q180 122 204 134') + brow('M222 134 Q246 122 268 138') +
      eye(186, 182, 34) + eye(240, 182, 34) + pup(186, 182, 5) + pup(240, 182, 5) +
      `<ellipse cx="213" cy="258" rx="${f1(16 + 4 * talk)}" ry="${f1(20 + 4 * talk)}" fill="${RZ.mouth}" stroke="${I}" stroke-width="5"></ellipse><ellipse cx="213" cy="268" rx="9" ry="5" fill="${RZ.tongue}"></ellipse>`;
  } else if (expr === 'sly') {
    out = brow('M160 156 Q182 150 204 162') + brow('M222 146 Q246 128 270 140') +
      eye(186, 186, 28) + eye(240, 184, 30) + pup(194, 192, 7) + pup(248, 190, 7) +
      `<path d="M158 184 Q186 166 214 184 L214 154 L158 154 Z" fill="${skin}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path><path d="M212 180 Q240 166 268 180 L268 150 L212 150 Z" fill="${skin}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path>` +
      (talking ? open(talk * 0.8) : `<path d="M176 250 Q214 262 256 232 Q252 262 222 268 Q196 270 176 250 Z" fill="${RZ.mouth}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path><path d="M186 254 Q218 260 250 240 L248 250 Q222 264 190 260 Z" fill="#FFFFFF"></path>`);
  } else if (expr === 'panic') {
    out = brow('M160 150 Q182 140 204 132') + brow('M222 132 Q244 140 266 150') +
      eye(186, 184, 30) + eye(240, 184, 30) + pup(186, 186, 4) + pup(240, 186, 4) +
      (talking ? open(talk) : `<path d="M176 256 Q186 244 196 256 Q206 268 216 256 Q226 244 236 256 Q246 268 252 256" fill="none" stroke="${I}" stroke-width="6" stroke-linecap="round"></path>`) +
      `<path d="M292 118 Q302 136 302 146 A10 10 0 1 1 282 146 Q282 136 292 118 Z" fill="#7FD3FF" stroke="${I}" stroke-width="4"></path>`;
  } else {
    out = brow('M158 150 Q180 138 204 146') + brow('M222 146 Q246 138 268 150') +
      eye(186, 184, 30) + eye(240, 184, 30) + pup(190, 188, 7) + pup(244, 188, 7) + (talking ? open(talk) : grin);
  }
  const nose = `<ellipse cx="216" cy="218" rx="22" ry="17" fill="${skin}" stroke="${I}" stroke-width="5"></ellipse><ellipse cx="216" cy="222" rx="16" ry="9" fill="#000" opacity=".1"></ellipse><ellipse cx="208" cy="212" rx="6" ry="4" fill="#FFFFFF" opacity=".45"></ellipse>`;
  const glasses = `<circle cx="186" cy="184" r="34" fill="none" stroke="${I}" stroke-width="7"></circle><circle cx="240" cy="184" r="34" fill="none" stroke="${I}" stroke-width="7"></circle><path d="M206 178 Q213 170 220 178" fill="none" stroke="${I}" stroke-width="7" stroke-linecap="round"></path><path d="M152 178 L140 174 M274 178 L286 174" stroke="${I}" stroke-width="6" stroke-linecap="round"></path><path d="M196 162 A24 24 0 0 1 208 176" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".8"></path><path d="M250 162 A24 24 0 0 1 262 176" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".8"></path>`;
  return out + nose + glasses;
}

const RZ_POSES = { rest: [14, -8], wave: [140, 32], point: [132, 0], side: [96, -4], shrug: [66, 96], cheer: [168, 6], hip: [48, -122], think: [150, -215], present: [72, 40], explain: [60, 50] };

function rezoSVG(o = {}) {
  const I = RZ.ink, skin = o.skin || RZ_COLORS.skin, hood = o.hoodie || RZ_COLORS.hoodie, tq = o.tuque || RZ_COLORS.tuque;
  const expr = o.expr || 'content', talk = o.talk || 0, look = o.look || [0, 0], blink = o.blink || 0;
  const aL = o.aL || RZ_POSES[o.armL || 'hip'], aR = o.aR || RZ_POSES[o.armR || 'point'];
  const al = rzArm([144, 322], -1, aL), ar = rzArm([276, 322], 1, aR);
  const handR = o.handR || ((o.armR || 'point') === 'point' ? 'point' : 'open');
  const air = o.air || 0, sx = o.sx || 1, sy = o.sy || 1, tilt = o.tilt || 0, y = o.y || 0;
  const swing = o.swing || 0, bob = o.bob || 0, ht = o.headTilt || 0;
  const leg = (x, lift, shoe) => `<g transform="translate(0 ${f1(lift || 0)})"><rect x="${x}" y="420" width="32" height="174" rx="14" fill="${RZ.denim}" stroke="${I}" stroke-width="5"></rect>${shoe}</g>`;
  const shoeL = `<path d="M136 604 Q136 580 162 580 L184 580 Q204 580 206 600 L206 610 L136 610 Z" fill="${RZ.ora}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path><rect x="128" y="602" width="82" height="16" rx="8" fill="#FFFFFF" stroke="${I}" stroke-width="5"></rect>`;
  const shoeR = `<path d="M214 600 Q216 580 236 580 L258 580 Q284 580 284 604 L284 610 L214 610 Z" fill="${RZ.ora}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path><rect x="210" y="602" width="82" height="16" rx="8" fill="#FFFFFF" stroke="${I}" stroke-width="5"></rect>`;
  return `<svg width="${o.w || 420}" height="${o.h || 660}" viewBox="${o.viewBox || '0 -20 420 660'}" style="overflow:visible;${o.style || ''}" ${o.label ? `role="img" aria-label="${o.label}"` : 'aria-hidden="true"'}>
<ellipse cx="210" cy="624" rx="${f1(124 * (1 - 0.35 * air) * sx)}" ry="${f1(12 * (1 - 0.35 * air))}" fill="#000" opacity="${(0.22 * (1 - 0.5 * air)).toFixed(2)}"></ellipse>
<g transform="translate(0 ${f1(y)}) translate(210 618) rotate(${f1(tilt)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(-210 -618)">
${leg(160, o.legL, shoeL)}${leg(228, o.legR, shoeR)}
<path d="M146 300 Q210 290 274 300 Q306 306 304 336 L290 424 Q288 444 268 444 L152 444 Q132 444 130 424 L116 336 Q114 306 146 300 Z" fill="${hood}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path>
<rect x="128" y="416" width="164" height="28" rx="12" fill="${hood}" stroke="${I}" stroke-width="5"></rect><rect x="131" y="419" width="158" height="22" rx="10" fill="#000" opacity=".2"></rect>
<path d="M168 388 L252 388 Q260 388 262 394 L266 410 L154 410 L158 394 Q160 388 168 388 Z" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="6" stroke-linejoin="round"></path>
<g transform="translate(210 370)"><circle r="7" fill="#FFFFFF"></circle><path d="M-16 -12 A20 20 0 0 1 16 -12" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"></path><path d="M-28 -22 A36 36 0 0 1 28 -22" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"></path></g>
<rect x="194" y="262" width="32" height="44" rx="10" fill="${skin}" stroke="${I}" stroke-width="5"></rect>
<path d="M160 302 Q210 342 260 302 Q250 284 210 284 Q170 284 160 302 Z" fill="${hood}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path><path d="M164 302 Q210 338 256 302 Q246 288 210 288 Q174 288 164 302 Z" fill="#000" opacity=".2"></path>
<path d="M194 316 L189 332 M226 316 L231 332" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"></path><circle cx="189" cy="336" r="5" fill="#FFFFFF" stroke="${I}" stroke-width="3"></circle><circle cx="231" cy="336" r="5" fill="#FFFFFF" stroke="${I}" stroke-width="3"></circle>
<g transform="translate(${f1(o.headX || 0)} ${f1(o.headY || 0)}) rotate(${f1(ht)} 210 290)">
<circle cx="138" cy="192" r="19" fill="${skin}" stroke="${I}" stroke-width="5"></circle><path d="M134 184 Q128 194 136 202" fill="none" stroke="${I}" stroke-width="3.5" stroke-linecap="round"></path>
<circle cx="286" cy="192" r="19" fill="${skin}" stroke="${I}" stroke-width="5"></circle><path d="M290 184 Q296 194 288 202" fill="none" stroke="${I}" stroke-width="3.5" stroke-linecap="round"></path>
<path d="M150 120 Q150 84 212 82 Q274 84 274 120 L288 216 Q292 274 232 278 L192 278 Q132 274 136 216 Z" fill="${skin}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path>
<path d="M140 150 q-6 12 2 22 q-8 8 0 18" fill="none" stroke="${RZ.hair}" stroke-width="9" stroke-linecap="round"></path><path d="M284 150 q6 12 -2 22 q8 8 0 18" fill="none" stroke="${RZ.hair}" stroke-width="9" stroke-linecap="round"></path>
${rzFace(expr, look, talk, blink, skin)}
<path d="M140 140 Q130 40 214 36 Q298 40 286 140 Z" fill="${tq}" stroke="${I}" stroke-width="5" stroke-linejoin="round"></path>
<path d="M178 54 Q176 90 180 118 M214 46 L214 118 M250 54 Q252 90 248 118" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="5" stroke-linecap="round"></path>
<rect x="128" y="116" width="168" height="38" rx="15" fill="${RZ.yel}" stroke="${I}" stroke-width="5"></rect>
<path d="M150 122 v26 M170 122 v26 M190 122 v26 M210 122 v26 M230 122 v26 M250 122 v26 M270 122 v26" stroke="#000" stroke-opacity=".14" stroke-width="4" stroke-linecap="round"></path>
<path d="M214 38 Q218 ${f1(2 + bob)} 258 ${f1(4 + bob)} Q294 8 300 40" fill="none" stroke="${I}" stroke-width="12" stroke-linecap="round"></path><path d="M214 38 Q218 ${f1(2 + bob)} 258 ${f1(4 + bob)} Q294 8 300 40" fill="none" stroke="${RZ.yel}" stroke-width="5" stroke-linecap="round"></path>
<g transform="rotate(${f1(-8 + swing)} 300 40)"><rect x="284" y="40" width="32" height="32" rx="6" fill="#F7F9FC" stroke="${I}" stroke-width="5"></rect><path d="M290 64 h20" stroke="${RZ.yel}" stroke-width="6"></path><rect x="294" y="72" width="12" height="9" rx="2" fill="#F7F9FC" stroke="${I}" stroke-width="4"></rect></g>
</g>
<path d="${al.d}" fill="none" stroke="${I}" stroke-width="36" stroke-linecap="round"></path><path d="${al.d}" fill="none" stroke="${hood}" stroke-width="26" stroke-linecap="round"></path>
${rzHand(al.H, -1, al.ang, o.handL || 'open', skin)}
<path d="${ar.d}" fill="none" stroke="${I}" stroke-width="36" stroke-linecap="round"></path><path d="${ar.d}" fill="none" stroke="${hood}" stroke-width="26" stroke-linecap="round"></path>
${rzHand(ar.H, 1, ar.ang, handR, skin)}
</g>
</svg>`;
}

// ---------- animation, à partir des chronologies de la page (POSE, JUMPS, walking, CAPTIONS) ----------
const RZ_EXPR = { content: 'content', curious: 'curious', happy: 'happy', error: 'panic', smirk: 'sly' };
const RZ_SCALE = 0.9;   // taille à l'écran ; les pieds restent au sol de la boîte de 420 × 500
function rezoFrame(t, expr) {
  const P = poseAt(t, RZ_POSES), j = jumpAt(t), talk = talkAt(t), e = RZ_EXPR[expr] || 'content';
  const blink = e === 'happy' || e === 'sly' ? 0 : blinkAt(t);
  const sac = Math.floor(t / 0.8), look = [P.look[0] * 0.8 + 1.2 * Math.sin(sac * 12.9898), P.look[1] * 0.8 + Math.sin(sac * 78.233)];
  const vy = (heroY(t) - heroY(t - 0.04)) / 0.04;
  const walk = walking(t) ? Math.sin(t * 16) : 0;
  const breathe = 1 + 0.01 * Math.sin(t * 2.4);
  const hand = (n) => (n === 'point' || n === 'side' ? 'point' : 'open');
  // bras qui balancent en marchant, sauf s'il salue
  const aL = [...P.L], aR = [...P.R];
  if (walk) { if (P.names.L !== 'wave') aL[0] += 20 * walk; if (P.names.R !== 'wave') aR[0] -= 20 * walk; }
  const C = window.HERO_COLORS || RZ_COLORS;
  return rezoSVG({
    ...C, expr: e, talk, look, blink, aL, aR, handL: hand(P.names.L), handR: hand(P.names.R),
    y: heroY(t) / RZ_SCALE, sx: j.sx / Math.sqrt(breathe), sy: j.sy * breathe, tilt: P.tilt + 1.2 * Math.sin(t * 1.1) + 3 * walk,
    headX: look[0] * 0.9, headY: look[1] * 0.5 - 3 * talk,
    legL: -16 * Math.max(0, walk), legR: -16 * Math.max(0, -walk),
    swing: clamp(vy * 0.08, -25, 25) + 7 * Math.sin(t * 3.2), bob: clamp(vy * 0.03, -8, 8),
    headTilt: 2 * Math.sin(t * 1.7) + look[0] * 0.5 + 3 * talk * Math.sin(t * 7), air: clamp(-j.y / 150),
    w: 460 * RZ_SCALE, h: 660 * RZ_SCALE, viewBox: '-20 -24 460 660',
    style: `position:absolute;left:${f1(210 - 230 * RZ_SCALE)}px;top:${f1(470 - 642 * RZ_SCALE)}px`,
  });
}
if (typeof module !== 'undefined') module.exports = { rezoSVG, rzFace, RZ, RZ_COLORS, RZ_POSES };
