// Functional body-navigation diagram. Geometry and hotspots share one viewBox.
export function bodyDiagram(selected:'hair'|'eyelid',level:'short'|'medium'|'long'):string {
  const bottom={short:143,medium:186,long:232}[level];
  return `<svg class="body-model" viewBox="0 0 460 600" role="img" aria-labelledby="body-title body-desc">
    <title id="body-title">米琳的身体导航</title><desc id="body-desc">柔和的女性站姿示意，头发和眼皮展品可通过旁边按钮打开。人物不是精确身体模拟。</desc>
    <defs><linearGradient id="dress" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c1ccbe"/><stop offset="1" stop-color="#84998e"/></linearGradient><linearGradient id="skin" x1="0" x2="1"><stop stop-color="#d7b6a0"/><stop offset=".55" stop-color="#edd4bd"/><stop offset="1" stop-color="#d5b29e"/></linearGradient></defs>
    <path class="arch" d="M78 473V205a152 152 0 01304 0v268"/>
    <path class="guide" d="M64 479h332M230 30v505"/>
    <ellipse cx="230" cy="552" rx="89" ry="12" fill="#596f5f" opacity=".10"/>
    <g class="person-figure">
      <path d="M183 366q7 66 15 117l-4 49q1 12 14 10l14-5 6-70 1-104M232 363l5 102 11 70q15 13 27 4l-10-55 4-118" fill="url(#skin)" stroke="#b89480" stroke-width="1.1"/>
      <path d="M194 527q10 8 20 2l8 9q-4 13-25 12l-8-3zM249 529q11 6 17-2l15 14q1 8-15 9l-17-7z" fill="#4d5550"/>
      <path d="M178 180q-14 10-22 42l-20 85-8 42q1 13 9 12l9-17 9-40 25-66M282 181q15 10 22 44l19 80 10 41q-1 15-9 14l-10-19-7-36-28-65" fill="url(#skin)" stroke="#b89480" stroke-width="1.1"/>
      <path d="M209 141v25l-29 16 13 85-20 116q49 19 112 0l-20-116 13-85-28-16v-25" fill="url(#dress)" stroke="#83988b" stroke-width="1.2"/>
      <path d="M209 151v15l-17 11q35 30 69 0l-13-11v-15" fill="url(#skin)"/>
      <path d="M185 191l8 73m76-73-4 73M193 271q35 9 72 0M204 297l-10 71m62-71 10 72" fill="none" stroke="#6c8475" opacity=".32"/>
      <path data-select="hair" class="hair-shape ${selected==='hair'?'selected-part':''}" d="M186 102q-1-55 44-56 47 0 48 56l8 ${bottom-102}q-20 12-33-2l-5-51h-37l-7 51q-18 13-30 0z" fill="#363c38"/>
      <ellipse data-select="eyelid" cx="230" cy="110" rx="35" ry="47" fill="url(#skin)"/>
      <path data-select="hair" d="M192 102q-7-38 28-43 42-7 49 40-27-8-40-25-9 24-37 28" fill="#363c38"/>
      <path d="M202 109q7-4 14 0m28 0q7-4 14 0" stroke="#544e45" stroke-width="1.5" fill="none"/>
      <path class="eyelid-shape ${selected==='eyelid'?'selected-part':''}" d="M203 115q6 4 12 0m30 0q6 4 12 0" stroke="#514b43" stroke-width="1.7" fill="none"/>
      <path d="M229 119l-3 11h6m-11 11q9 5 18-1" stroke="#b58375" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <rect data-select="eyelid" x="197" y="103" width="67" height="23" fill="transparent"/>
    </g>
    <path d="M177 79H116l-20 18H48" class="connector ${selected==='hair'?'active':''}"/><circle cx="180" cy="79" r="4" class="marker"/>
    <path d="M260 115h53l19 20h67" class="connector ${selected==='eyelid'?'active':''}"/><circle cx="260" cy="115" r="4" class="marker"/>
    <text x="82" y="518" class="svg-caption">FIG. 01</text><text x="304" y="518" class="svg-caption">SELF ARCHIVE</text>
  </svg>`;
}
export function eyeInset():string {return `<svg viewBox="0 0 240 90" aria-label="眼皮局部定位示意，不代表实际外观" role="img"><path d="M38 50q38-38 74 0M129 50q38-38 74 0" fill="none" stroke="#8d7466" stroke-width="2"/><path d="M38 53q38-28 74 0M129 53q38-28 74 0" fill="none" stroke="#40574d" stroke-width="3"/><path d="M41 54q35 18 68 0M132 54q35 18 68 0" fill="none" stroke="#b99b89"/><circle cx="75" cy="49" r="6" fill="#4b5047"/><circle cx="166" cy="49" r="6" fill="#4b5047"/><path d="M100 13h38m-19 0v17" stroke="#829484" fill="none"/></svg>`;}
