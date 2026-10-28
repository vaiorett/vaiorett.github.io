/* Local-only interface icons and continuous vertical mathematical background strips. */
(function(){
 'use strict';
 const en=document.documentElement.lang==='en',root=document.body.dataset.root||'./';
 const PHI=(1+Math.sqrt(5))/2;
 const paths={
  sun:'M12 19a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0v-1a1 1 0 0 0-1-1m6.364-2.05a1 1 0 1 0-1.414 1.414l.707.707a1 1 0 0 0 1.414-1.414zm-11.314 0a1 1 0 0 0-1.414 0l-.707.707a1 1 0 0 0 1.414 1.414l.707-.707a1 1 0 0 0 0-1.414M12 6a6 6 0 1 0 0 12a6 6 0 0 0 0-12m8 5a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zM3 11a1 1 0 1 0 0 2h1a1 1 0 1 0 0-2zm16.071-6.071a1 1 0 0 0-1.414 0l-.707.707a1 1 0 1 0 1.414 1.414l.707-.707a1 1 0 0 0 0-1.414m-12.728 0a1 1 0 0 0-1.414 1.414l.707.707A1 1 0 1 0 7.05 5.636zM12 2a1 1 0 0 0-1 1v1a1 1 0 1 0 2 0V3a1 1 0 0 0-1-1',
  moon:'M13.574 3.137a1.01 1.01 0 0 0-1.097 1.408a6 6 0 0 1-7.931 7.931c-.747-.335-1.548.307-1.409 1.098A9 9 0 0 0 21 12c0-4.435-3.206-8.118-7.426-8.863',
  mail:'M3 5h18v14H3zM3 5l9 7 9-7',
  copy:'M9 9h12v12H9zM5 15H3V3h12v2'
 };
 function icon(name){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('width','20');
  svg.setAttribute('height','20');
  svg.setAttribute('aria-hidden','true');
  const p=document.createElementNS(svg.namespaceURI,'path');
  p.setAttribute('d',paths[name]);
  if(name==='sun'||name==='moon'){
   svg.setAttribute('fill','currentColor');
   p.setAttribute('fill','currentColor');
   if(name==='moon'){p.setAttribute('fill-rule','evenodd');p.setAttribute('clip-rule','evenodd');}
  }else{
   svg.setAttribute('fill','none');
   svg.setAttribute('stroke','currentColor');
   svg.setAttribute('stroke-width','1.6');
   svg.setAttribute('stroke-linecap','round');
   svg.setAttribute('stroke-linejoin','round');
  }
  svg.append(p);
  return svg;
 }
 function cross(x,y,s=6){return `<path class="bg-line" d="M${(x-s).toFixed(1)} ${y.toFixed(1)}h${(s*2).toFixed(1)}M${x.toFixed(1)} ${(y-s).toFixed(1)}v${(s*2).toFixed(1)}"/>`;}
 function polyPath(pts){
  let d='';
  for(let i=0;i<pts.length;i++)d+=(i===0?'M':'L')+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1);
  return d;
 }
 function seedFromId(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){
   h^=str.charCodeAt(i);
   h=Math.imul(h,16777619)>>>0;
  }
  return h||1;
 }
 function buildScene(page,height=2800){
  const H=Math.max(1200,Math.ceil(height));
  /* Continuous vertical mathematical coordinate rails and radian scale from y=0 to y=H */
  let rails=`<path class="bg-grid" d="M44 0v${H}M1396 0v${H}"/>`,ticks='';
  for(let y=60;y<H-30;y+=45){
   const major=(y-60)%360===0;
   const len=major?14:6;
   ticks+=`<path class="${major?'bg-line':'bg-grid'}" d="M44 ${y}h${len}M${1396-len} ${y}h${len}"/>`;
   if(major){
    const rad=((y-60)/360*0.5).toFixed(1);
    ticks+=`<path class="bg-grid" d="M44 ${y}h1352"/>`+cross(44,y,5)+cross(1396,y,5);
    ticks+=`<text class="bg-label" x="64" y="${y-6}">${rad}π · y=${y}</text>`;
   }
  }
  const base=rails+ticks;

  if(page==='home'){
   /* Primary Theme (Homepage): Continuous Coupled Fourier-Fibonacci Harmonic Ribbon
      x_k(y) = 720 + 390*sin(w*y + 0.4) + 165*cos(PHI*w*y + k*dp) + 75*sin((2*PHI-1)*w*y - 1.4*k*dp) */
   const w=2*Math.PI/1350,M=15,step=16;
   const strands=Array.from({length:M},()=>[]);
   let chords='',nodes='',ribbonFill='M';
   const leftEdge=[],rightEdge=[];
   for(let y=0;y<=H;y+=step){
    const spine=740+370*Math.sin(w*y+0.42)+95*Math.cos(w*y/PHI-0.3);
    for(let k=0;k<M;k++){
     const dp=(k/(M-1))*Math.PI*0.92;
     const x=spine+165*Math.cos(PHI*w*y+dp)+72*Math.sin((2*PHI-1)*w*y-1.35*dp);
     strands[k].push([x,y]);
    }
    leftEdge.push(strands[0][strands[0].length-1]);
    rightEdge.push(strands[M-1][strands[M-1].length-1]);
    if(y%(step*2)===0){
     const pA=strands[0][strands[0].length-1],pB=strands[M-1][strands[M-1].length-1];
     chords+=`<path class="bg-grid" d="M${pA[0].toFixed(1)} ${pA[1]}L${pB[0].toFixed(1)} ${pB[1]}"/>`;
    }
   }
   const fillPts=[...leftEdge,...rightEdge.reverse()];
   ribbonFill=`<polygon class="bg-fill-accent" points="${fillPts.map(p=>p[0].toFixed(1)+','+p[1]).join(' ')}"/>`;
   const curves=strands.map((pts,k)=>`<path class="${k===0||k===M-1?'bg-bold':k%3===0?'bg-dash':'bg-line'}" d="${polyPath(pts)}"/>`).join('');
   /* Stationary-point Golden Ratio Osculating Circles & Axonometric Invariant Cubes along the entire height */
   for(let y=280;y<H-160;y+=540){
    const cx=740+370*Math.sin(w*y+0.42)+95*Math.cos(w*y/PHI-0.3);
    const r1=180,r2=Math.round(r1/PHI),r3=Math.round(r2/PHI);
    nodes+=`<circle class="bg-fill" cx="${cx.toFixed(1)}" cy="${y}" r="${r1}"/>`;
    nodes+=`<circle class="bg-bold" cx="${cx.toFixed(1)}" cy="${y}" r="${r1}"/>`;
    nodes+=`<circle class="bg-line" cx="${cx.toFixed(1)}" cy="${y}" r="${r2}"/>`;
    nodes+=`<circle class="bg-dash" cx="${cx.toFixed(1)}" cy="${y}" r="${r3}"/>`;
    /* Inscribed 30-deg isometric hex-cube at harmonic node */
    const s=r2*0.85,dx=s*0.866,dy=s*0.5;
    nodes+=`<path class="bg-line" d="M${cx.toFixed(1)} ${(y-s).toFixed(1)}L${(cx+dx).toFixed(1)} ${(y-dy).toFixed(1)}v${s.toFixed(1)}L${cx.toFixed(1)} ${(y+s).toFixed(1)}L${(cx-dx).toFixed(1)} ${(y+dy).toFixed(1)}v-${s.toFixed(1)}ZM${(cx-dx).toFixed(1)} ${(y-dy).toFixed(1)}L${cx.toFixed(1)} ${y}L${(cx+dx).toFixed(1)} ${(y-dy).toFixed(1)}M${cx.toFixed(1)} ${y}v${s.toFixed(1)}"/>`;
    nodes+=`<circle class="bg-node" cx="${cx.toFixed(1)}" cy="${y}" r="4.5"/>`+cross(cx,y,12);
   }
   return base+ribbonFill+chords+curves+nodes+`<text class="bg-label" x="940" y="42">f(y) = Σ Aₙ·sin(n·ω·y + φₙ) · φ = 1.6180339</text>`;
  }

  if(page==='yunba-depot'){
   /* Secondary 01: Continuous Euler Clothoid Transition Spiral & Normal Curvature Comb (κ(s) = dθ/ds) */
   const w=2*Math.PI/1200,step=14,tracks=7;
   const lines=Array.from({length:tracks},()=>[]);
   let comb='',circles='';
   for(let y=0;y<=H;y+=step){
    const xc=720+420*Math.sin(w*y+0.25)+110*Math.sin(2*w*y+0.8);
    const dx=420*w*Math.cos(w*y+0.25)+220*w*Math.cos(2*w*y+0.8);
    const d2x=-420*w*w*Math.sin(w*y+0.25)-440*w*w*Math.sin(2*w*y+0.8);
    const norm=Math.hypot(dx,1);
    const nx=-1/norm,ny=dx/norm;
    for(let k=0;k<tracks;k++){
     const off=(k-(tracks-1)/2)*22;
     lines[k].push([xc+nx*off,y+ny*off]);
    }
    /* Mathematical Curvature Comb vectors proportional to second derivative d2x/dy2 */
    const combLen=d2x*95000;
    const cx=xc+nx*combLen,cy=y+ny*combLen;
    if(y%(step*2)===0){
     comb+=`<path class="bg-grid" d="M${xc.toFixed(1)} ${y}L${cx.toFixed(1)} ${cy.toFixed(1)}"/>`;
     comb+=`<circle class="bg-node" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2"/>`;
    }
    if(y>150&&y<H-150&&y%480===240){
     const R=Math.min(220,Math.max(90,Math.abs(1/(d2x||0.005))*0.35));
     const dir=d2x>=0?-1:1;
     const ox=xc+nx*R*dir,oy=y+ny*R*dir;
     circles+=`<circle class="bg-fill-accent" cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="${R.toFixed(1)}"/>`;
     circles+=`<circle class="bg-dash" cx="${ox.toFixed(1)}" cy="${oy.toFixed(1)}" r="${R.toFixed(1)}"/>`+cross(ox,oy,8);
    }
   }
   const trackPaths=lines.map((pts,k)=>`<path class="${k===3?'bg-bold':'bg-line'}" d="${polyPath(pts)}"/>`).join('');
   return base+circles+comb+trackPaths+`<text class="bg-label" x="960" y="42">CLOTHOID CURVATURE // κ(s) = dθ/ds = α·s</text>`;
  }

  if(page==='digital-assets'){
   /* Secondary 02: Continuous Geodesic Delaunay Triangulated Lattice Strip from y=0 to y=H */
   const cols=5,rowH=105,rows=Math.ceil(H/rowH)+1,w=2*Math.PI/1300;
   const grid=[];
   for(let r=0;r<=rows;r++){
    const y=r*rowH;
    const spine=720+340*Math.sin(w*y+0.5);
    const row=[];
    for(let c=0;c<cols;c++){
     const spread=(c-(cols-1)/2)*115+(r%2===1?52:-52);
     const x=spine+spread+38*Math.cos(r*PHI+c*1.3);
     const py=y+26*Math.sin(c*PHI+r*0.9);
     row.push([x,py]);
    }
    grid.push(row);
   }
   let tris='',nodes='';
   for(let r=0;r<rows;r++){
    for(let c=0;c<cols-1;c++){
     const p00=grid[r][c],p10=grid[r][c+1],p01=grid[r+1][c],p11=grid[r+1][c+1];
     const f1=(r+c)%4===0?'bg-fill-accent':(r+c)%3===0?'bg-fill':'';
     const f2=(r+c)%5===0?'bg-fill':'';
     tris+=`<polygon class="${f1} bg-line" points="${p00[0].toFixed(1)},${p00[1].toFixed(1)} ${p10[0].toFixed(1)},${p10[1].toFixed(1)} ${p01[0].toFixed(1)},${p01[1].toFixed(1)}"/>`;
     tris+=`<polygon class="${f2} bg-line" points="${p10[0].toFixed(1)},${p10[1].toFixed(1)} ${p11[0].toFixed(1)},${p11[1].toFixed(1)} ${p01[0].toFixed(1)},${p01[1].toFixed(1)}"/>`;
    }
    for(let c=0;c<cols;c++){
     const p=grid[r][c];
     if((r+c)%2===0)nodes+=`<circle class="bg-node" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.2"/>`;
    }
   }
   return base+tris+nodes+`<text class="bg-label" x="930" y="42">DELAUNAY SIMPLICIAL COMPLEX // χ = V - E + F</text>`;
  }

  if(page==='grandstand'){
   /* Secondary 03: Continuous Hyperbolic Paraboloid Ruled-Surface Envelope (z = x²/a² - y²/b²) */
   const w=2*Math.PI/1100,step=18,shift=180;
   const curveA=[],curveB=[];
   let rulings='',fills='';
   for(let y=0;y<=H+shift;y+=step){
    const xA=720+460*Math.sin(w*y+0.2);
    const xB=720-460*Math.sin(w*y+0.2+0.85);
    if(y<=H){curveA.push([xA,y]);curveB.push([xB,y]);}
   }
   for(let i=0;i<curveA.length;i++){
    const j=Math.min(curveB.length-1,i+10);
    const a=curveA[i],b=curveB[j];
    rulings+=`<path class="${i%5===0?'bg-dash':'bg-line'}" d="M${a[0].toFixed(1)} ${a[1]}L${b[0].toFixed(1)} ${b[1]}"/>`;
    if(i%12===0){
     rulings+=`<circle class="bg-node" cx="${a[0].toFixed(1)}" cy="${a[1]}" r="3.2"/>`;
     rulings+=`<circle class="bg-node" cx="${b[0].toFixed(1)}" cy="${b[1]}" r="3.2"/>`;
    }
   }
   return base+fills+rulings+`<path class="bg-bold" d="${polyPath(curveA)}"/><path class="bg-bold" d="${polyPath(curveB)}"/><text class="bg-label" x="930" y="42">HYPERBOLIC PARABOLOID // z = x²/a² - y²/b²</text>`;
  }

  if(page==='pedestrian-bridge'){
   /* Secondary 04: Continuous Coupled Catenary cosh(t) & Standing-Wave Truss Envelope */
   const w=2*Math.PI/980,step=20;
   const arch=[],deck=[],cent=[];
   let struts='',fills='M';
   for(let y=0;y<=H;y+=step){
    const phase=(y%490)/245-1;
    const cat=Math.cosh(phase*1.35)-1;
    const xCenter=720+310*Math.sin(w*y);
    const xArch=xCenter+240*Math.cos(w*y*0.5)-cat*165;
    const xDeck=xCenter-180*Math.cos(w*y*0.5)+cat*95;
    arch.push([xArch,y]);
    deck.push([xDeck,y]);
    cent.push([(xArch+xDeck)/2,y]);
   }
   for(let i=0;i<arch.length;i++){
    const a=arch[i],d=deck[i];
    struts+=`<path class="bg-line" d="M${a[0].toFixed(1)} ${a[1]}L${d[0].toFixed(1)} ${d[1]}"/>`;
    if(i<arch.length-1){
     const dNext=deck[i+1];
     struts+=`<path class="bg-grid" d="M${a[0].toFixed(1)} ${a[1]}L${dNext[0].toFixed(1)} ${dNext[1]}"/>`;
    }
    if(i%4===0)struts+=`<circle class="bg-node" cx="${a[0].toFixed(1)}" cy="${a[1]}" r="3"/>`;
   }
   const poly=[...arch,...[...deck].reverse()];
   fills=`<polygon class="bg-fill-accent" points="${poly.map(p=>p[0].toFixed(1)+','+p[1]).join(' ')}"/>`;
   return base+fills+struts+`<path class="bg-bold" d="${polyPath(arch)}"/><path class="bg-bold" d="${polyPath(deck)}"/><path class="bg-dash" d="${polyPath(cent)}"/><text class="bg-label" x="930" y="42">CATENARY ARCH ENVELOPE // x(y) = a·cosh(y/a)</text>`;
  }

  if(page==='residential'){
   /* Secondary 05: Continuous Fibonacci Golden-Ratio Subdivision & Logarithmic Spiral Strip */
   const blockH=520,blocks=Math.ceil(H/blockH);
   let geom='',spinePts=[];
   for(let b=0;b<blocks;b++){
    const y0=b*blockH+40;
    const flip=b%2===1;
    const w0=520,h0=321,w1=321,w2=199,w3=123,w4=76;
    const x0=flip?160:760;
    geom+=`<rect class="bg-fill-accent" x="${x0}" y="${y0}" width="${w1}" height="${w1}"/>`;
    geom+=`<rect class="bg-fill" x="${x0+w1}" y="${y0}" width="${w2}" height="${w2}"/>`;
    geom+=`<rect class="bg-bold" x="${x0}" y="${y0}" width="${w0}" height="${h0}"/>`;
    geom+=`<path class="bg-line" d="M${x0+w1} ${y0}v${h0}M${x0+w1} ${y0+w2}h${w2}M${x0+w1+w4} ${y0+w2}v${w3}"/>`;
    geom+=`<path class="bg-bold" d="M${x0} ${y0+w1} A ${w1} ${w1} 0 0 1 ${x0+w1} ${y0} A ${w2} ${w2} 0 0 1 ${x0+w0} ${y0+w2} A ${w3} ${w3} 0 0 1 ${x0+w1+w4} ${y0+h0}"/>`;
    /* Beatty sequence quasi-periodic vertical subdivisions */
    for(let n=1;n<=11;n++){
     const bx=x0+Math.round((n*PHI%1)*w0);
     geom+=`<path class="bg-grid" d="M${bx} ${y0}v${h0}"/>`;
    }
    spinePts.push([x0+w1,y0],[x0+w0,y0+w2],[x0+w1+w4,y0+h0]);
   }
   return base+geom+`<path class="bg-dash" d="${polyPath(spinePts)}"/><text class="bg-label" x="930" y="42">FIBONACCI PROGRESSION // lim(Fₙ₊₁/Fₙ) = φ = 1.618</text>`;
  }

  if(page==='product-rendering'){
   /* Secondary 06: Continuous Lissajous Phase-Modulated Ribbon & Polar Rhodonea (r = a·cos(4θ)) */
   const w=2*Math.PI/1150,M=11,step=15;
   const waves=Array.from({length:M},()=>[]);
   let roses='';
   for(let y=0;y<=H;y+=step){
    const xc=720+350*Math.sin(w*y+0.3);
    for(let k=0;k<M;k++){
     const d=(k/(M-1))*Math.PI;
     const x=xc+210*Math.sin(w*y*2+d)*Math.cos(w*y*0.5-d*0.5);
     waves[k].push([x,y]);
    }
   }
   /* Polar Rhodonea Rose Curve r = R * cos(4*theta) at focal nodes */
   for(let y=300;y<H-150;y+=575){
    const cx=720+350*Math.sin(w*y+0.3),R=165,pts=[];
    for(let a=0;a<=360;a+=3){
     const rad=a*Math.PI/180,r=R*Math.cos(4*rad);
     pts.push([cx+r*Math.cos(rad),y+r*Math.sin(rad)]);
    }
    roses+=`<circle class="bg-fill-accent" cx="${cx.toFixed(1)}" cy="${y}" r="${R}"/>`;
    roses+=`<circle class="bg-line" cx="${cx.toFixed(1)}" cy="${y}" r="${R}"/><circle class="bg-dash" cx="${cx.toFixed(1)}" cy="${y}" r="${(R/PHI).toFixed(1)}"/>`;
    roses+=`<path class="bg-bold" d="${polyPath(pts)}"/>`+cross(cx,y,10);
   }
   const wavePaths=waves.map((pts,k)=>`<path class="${k===0||k===M-1?'bg-bold':'bg-line'}" d="${polyPath(pts)}"/>`).join('');
   return base+roses+wavePaths+`<text class="bg-label" x="930" y="42">RHODONEA &amp; LISSAJOUS CAUSTIC // r(θ) = a·cos(4θ)</text>`;
  }

  if(page==='interior'){
   /* Secondary 07: Continuous Projective Pencil of Lines & Huygens Ray Caustic Envelope */
   const period=620,count=Math.ceil(H/period);
   let rays='',spine=[];
   for(let y=0;y<=H;y+=20){
    spine.push([720+420*Math.cos(2*Math.PI*y/1240),y]);
   }
   for(let c=0;c<=count;c++){
    const fy=c*period+220;
    const fx=c%2===0?1160:280;
    const targetX=c%2===0?140:1300;
    rays+=`<circle class="bg-fill-accent" cx="${fx}" cy="${fy}" r="150"/>`;
    /* Tangent envelope fan of 22 projective rays */
    for(let i=-10;i<=10;i++){
     const ty=fy+i*48;
     const mx=(fx+targetX)/2+i*28*(c%2===0?-1:1);
     const my=(fy+ty)/2-Math.abs(i)*18;
     rays+=`<path class="${i%4===0?'bg-bold':'bg-line'}" d="M${fx} ${fy} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${targetX} ${ty}"/>`;
    }
    rays+=`<circle class="bg-node" cx="${fx}" cy="${fy}" r="4.5"/>`+cross(fx,fy,12);
   }
   return base+`<path class="bg-dash" d="${polyPath(spine)}"/>`+rays+`<text class="bg-label" x="920" y="42">PROJECTIVE PENCIL &amp; CAUSTIC // (A,B;C,D) = CONST</text>`;
  }

  if(page==='cgi'){
   /* Secondary 08: Continuous Phase-Space Attractor Ribbon & Geodesic SO(3) Elliptical Rings */
   const w=2*Math.PI/1100,M=14,step=15;
   const trajectories=Array.from({length:M},()=>[]);
   let manifolds='';
   for(let y=0;y<=H;y+=step){
    const xc=720+380*Math.sin(w*y+0.2)+90*Math.cos(2.5*w*y);
    for(let k=0;k<M;k++){
     const angle=w*y*PHI+k*(2*Math.PI/M);
     const radius=140+55*Math.sin(w*y*0.8+k*0.4);
     const x=xc+radius*Math.cos(angle);
     trajectories[k].push([x,y]);
    }
   }
   for(let y=260;y<H-140;y+=520){
    const cx=720+380*Math.sin(w*y+0.2)+90*Math.cos(2.5*w*y);
    const tilt=((y/520)%2===0)?-24:24;
    manifolds+=`<circle class="bg-fill-accent" cx="${cx.toFixed(1)}" cy="${y}" r="175"/>`;
    manifolds+=`<circle class="bg-bold" cx="${cx.toFixed(1)}" cy="${y}" r="175"/>`;
    for(const r of [45,95,140]){
     manifolds+=`<ellipse class="bg-line" cx="${cx.toFixed(1)}" cy="${y}" rx="175" ry="${r}" transform="rotate(${tilt} ${cx.toFixed(1)} ${y})"/>`;
     manifolds+=`<ellipse class="bg-grid" cx="${cx.toFixed(1)}" cy="${y}" rx="${r}" ry="175" transform="rotate(${tilt} ${cx.toFixed(1)} ${y})"/>`;
    }
    manifolds+=cross(cx,y,10);
   }
   const trajPaths=trajectories.map((pts,k)=>`<path class="${k%4===0?'bg-bold':k%2===0?'bg-line':'bg-grid'}" d="${polyPath(pts)}"/>`).join('');
   return base+manifolds+trajPaths+`<text class="bg-label" x="930" y="42">SO(3) MANIFOLD &amp; PHASE FLOW // dx/dt = -∇H(x)</text>`;
  }

  if(page==='manage'||page==='guide'){
   /* Studio / Manager / Guide Minimalist Coordinate Sheet */
   const pts=[];
   for(let y=0;y<=H;y+=24)pts.push([1080+180*Math.sin(2*Math.PI*y/1200),y]);
   return base+`<path class="bg-line" d="${polyPath(pts)}"/><text class="bg-label" x="980" y="42">PARAMETRIC COORDINATE SHEET // STUDIO</text>`;
  }

  /* Deterministic Generative Mathematical Engine for ANY Newly Added Project Page in the Future:
     Every unique project slug hashes to its own mathematical parameters (frequencies, harmonics,
     epitrochoid/Chebyshev/Fermat/Toroidal topology) so no two future pages ever look the same. */
  const S=seedFromId(String(page));
  const mode=S%4;
  const pFreq=2+(S%5),qFreq=3+((S>>>3)%6);
  const period=960+((S>>>6)%480);
  const w=2*Math.PI/period;
  const phase0=((S>>>9)%360)*Math.PI/180;
  const M=10+((S>>>12)%7);
  const step=16;
  const strands=Array.from({length:M},()=>[]);
  let chords='',nodes='';
  for(let y=0;y<=H;y+=step){
   const spine=720+350*Math.sin(w*y+phase0)+85*Math.cos(w*y*PHI-phase0);
   for(let k=0;k<M;k++){
    const u=k/(M-1)-0.5;
    let offset=0;
    if(mode===0){
     /* Chebyshev Polynomial Coupled Harmonics T_p(cos t) */
     offset=190*Math.cos(pFreq*w*y+k*0.45)+65*Math.sin(qFreq*w*y-k*0.6);
    }else if(mode===1){
     /* Twisted Toroidal Möbius Strip Projection */
     offset=220*u*Math.cos(w*y*pFreq*0.5+phase0)+115*Math.sin(w*y*qFreq*0.35+k*0.5);
    }else if(mode===2){
     /* Wave-Packet Envelope Modulation */
     offset=(150+70*Math.cos(w*y*0.5+u*Math.PI))*Math.sin(w*y*pFreq+k*0.55);
    }else{
     /* Quasi-Periodic Jacobi Elliptic / Golden-Phase Braid */
     offset=175*Math.sin(w*y*PHI+k*2*Math.PI/M)+80*Math.cos(w*y*qFreq*0.4-k);
    }
    strands[k].push([spine+offset,y]);
   }
   if(y%(step*2)===0){
    const pA=strands[0][strands[0].length-1],pB=strands[M-1][strands[M-1].length-1];
    chords+=`<path class="bg-grid" d="M${pA[0].toFixed(1)} ${pA[1]}L${pB[0].toFixed(1)} ${pB[1]}"/>`;
   }
  }
  const nodeStride=500+((S>>>15)%180);
  const petals=3+((S>>>4)%7);
  for(let y=260;y<H-160;y+=nodeStride){
   const cx=720+350*Math.sin(w*y+phase0)+85*Math.cos(w*y*PHI-phase0);
   const R=145+((S>>>7)%45),rInner=Math.round(R/PHI);
   const pts=[];
   for(let a=0;a<=360;a+=4){
    const rad=a*Math.PI/180;
    /* Epitrochoid / Hypotrochoid / Fermat-Rose nodal locus unique to S */
    const radMod=R*(0.68+0.32*Math.cos(petals*rad+phase0));
    pts.push([cx+radMod*Math.cos(rad),y+radMod*Math.sin(rad)]);
   }
   nodes+=`<circle class="bg-fill-accent" cx="${cx.toFixed(1)}" cy="${y}" r="${R}"/>`;
   nodes+=`<circle class="bg-line" cx="${cx.toFixed(1)}" cy="${y}" r="${R}"/><circle class="bg-dash" cx="${cx.toFixed(1)}" cy="${y}" r="${rInner}"/>`;
   nodes+=`<path class="bg-bold" d="${polyPath(pts)}"/>`+cross(cx,y,10)+`<circle class="bg-node" cx="${cx.toFixed(1)}" cy="${y}" r="3.8"/>`;
  }
  const curves=strands.map((pts,k)=>`<path class="${k===0||k===M-1?'bg-bold':k%3===0?'bg-dash':'bg-line'}" d="${polyPath(pts)}"/>`).join('');
  return base+chords+curves+nodes+`<text class="bg-label" x="880" y="42">PARAMETRIC MANIFOLD // T(${pFreq},${qFreq}) · k=${petals} · ID:${String(page).toUpperCase()}</text>`;
 }
 function init(){
  const page=document.body.dataset.page||document.querySelector('[data-gallery]')?.dataset.gallery||(document.querySelector('.manager')?'manage':'guide');
  let stage=document.querySelector('.bg-stage');
  if(!stage){
   stage=document.createElement('div');
   stage.className='bg-stage';
   stage.dataset.bgTheme=page;
   stage.setAttribute('aria-hidden','true');
   document.body.prepend(stage);
  }
  let lastH=0;
  function renderStage(){
   const h=Math.max(window.innerHeight,document.documentElement.scrollHeight,document.body.scrollHeight);
   if(Math.abs(h-lastH)<80&&lastH>0)return;
   lastH=h;
   stage.style.height=h+'px';
   stage.innerHTML=`<svg viewBox="0 0 1440 ${h}" preserveAspectRatio="xMidYMin slice" xmlns="http://www.w3.org/2000/svg">${buildScene(page,h)}</svg>`;
  }
  renderStage();
  if(typeof ResizeObserver!=='undefined'){
   let timer=0;
   new ResizeObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(renderStage,180);
   }).observe(document.body);
  }
  window.addEventListener('load',renderStage,{once:true});
  document.querySelectorAll('[data-theme-select]').forEach(select=>{
   const label=select.closest('label');if(!label)return;
   const btn=document.createElement('button');
   btn.type='button';
   btn.className='button-light-primary md dark-mode-switch';
   btn.addEventListener('click',()=>{
    const isDark=document.documentElement.dataset.theme==='dark';
    select.value=isDark?'light':'dark';
    select.dispatchEvent(new Event('change',{bubbles:true}));
   });
   label.after(btn);label.hidden=true;
   function sync(){
    const isDark=document.documentElement.dataset.theme==='dark';
    document.documentElement.classList.toggle('dark',isDark);
    select.value=document.documentElement.dataset.themePreference||(isDark?'dark':'light');
    btn.replaceChildren(icon(isDark?'sun':'moon'));
    const labelText=isDark?(en?'Change to light mode':'切换到浅色模式'):(en?'Change to dark mode':'切换到深色模式');
    btn.setAttribute('aria-label',labelText);
    btn.title=labelText;
   }
   sync();
   new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','data-theme-preference']});
  });
  document.querySelectorAll('.site-header nav a').forEach(a=>a.classList.add('md','link-button','button-light-primary'));
  document.querySelectorAll('.language-switch a').forEach(a=>{
   a.classList.add('md','link-button',a.hasAttribute('aria-current')?'button-solid-primary':'button-light-primary');
   if(a.dataset.language==='en')a.textContent='English';
   if(a.dataset.language==='zh')a.textContent='中文';
  });
  document.querySelectorAll('.contact-links a[href^="mailto:"]').forEach(a=>{a.classList.add('contact-email');a.prepend(icon('mail'));});
  document.querySelectorAll('.copy-email').forEach(b=>b.prepend(icon('copy')));
  const logos={'Blender':'blender','3ds Max':'autodesk','SketchUp':'sketchup','Rhino':'rhinoceros','UG':'siemens','RealityCapture':'epicgames','UE5':'unrealengine','V-Ray':'vray','Corona':'coronarenderer','Chaos Vantage':'chaosvantage','D5':'d5render','Enscape':'enscape','AutoCAD':'autocad','天正建筑':'tarch','TArch':'tarch','Revit':'autodeskrevit','Gemini':'googlegemini','ChatGPT':'openai','Claude':'claude','ComfyUI':'comfyui','Comfy UI':'comfyui','Stable Diffusion':'stablediffusion','AIGC':'aigc','Photoshop':'adobephotoshop','InDesign':'adobeindesign','MS Office':'msoffice','Linux':'linux','Fedora KDE':'fedora','Fedora':'fedora','KDE':'kde','Ubuntu GNOME':'ubuntu','Ubuntu Gonme':'ubuntu','Ubuntu':'ubuntu','GNOME':'gnome'};
  const monograms={'V-Ray':'VR','Chaos Vantage':'CV','D5':'D5','Photoshop':'Ps','InDesign':'Id','AIGC':'AI','MS Office':'Of'};
  document.querySelectorAll('.skill-tags>span').forEach(tag=>{const tool=tag.textContent.trim();const match=Object.keys(logos).find(k=>k.toLowerCase()===tool.toLowerCase());const key=logos[tool]||(match&&logos[match]);if(key){const img=document.createElement('img');img.src=root+'assets/icons/'+key+'.svg';img.alt='';img.width=22;img.height=22;tag.prepend(img);}else{const mark=document.createElement('span');mark.className='tool-monogram';mark.setAttribute('aria-hidden','true');mark.textContent=monograms[tool]||tool.slice(0,2);tag.prepend(mark);}});
  initComparers();
 }
 function initComparers(container=document){
  container.querySelectorAll('[data-comparer]').forEach(el=>{
   if(el.__comparerInit)return;
   el.__comparerInit=true;
   const stage=el.querySelector('.compare-stage'),handle=el.querySelector('.compare-handle-line');
   const badgeBefore=el.querySelector('.compare-badge-before'),badgeAfter=el.querySelector('.compare-badge-after');
   if(!stage||!handle)return;
   const effect=el.querySelector('.compare-after'),original=el.querySelector('.compare-before');
   let originalReady=Boolean(original?.complete&&original.naturalWidth),requestedPos=0;
   function loadOriginal(){
    if(!original?.dataset.src)return;
    original.addEventListener('load',()=>{originalReady=true;setPos(requestedPos);},{once:true});
    if(original.dataset.srcset){original.srcset=original.dataset.srcset;delete original.dataset.srcset;}
    original.src=original.dataset.src;delete original.dataset.src;
   }
   async function effectReady(){
    if(!effect?.naturalWidth)return;
    try{await effect.decode();}catch{}
    loadOriginal();
   }
   if(effect?.complete&&effect.naturalWidth)effectReady();
   else effect?.addEventListener('load',effectReady,{once:true});
   let dragging=false,pos=0,resetTimer=null;
   function setPos(percent){
    requestedPos=Math.max(0,Math.min(100,percent));
    pos=originalReady?requestedPos:0;
    el.style.setProperty('--pos',pos+'%');
    handle.setAttribute('aria-valuenow',Math.round(pos));
    if(badgeBefore)badgeBefore.style.opacity=pos<12?'0':(pos<24?String((pos-12)/12):'1');
    if(badgeAfter)badgeAfter.style.opacity=pos>88?'0':(pos>76?String((88-pos)/12):'1');
   }
   function cancelReset(){
    if(resetTimer){clearTimeout(resetTimer);resetTimer=null;}
    el.classList.remove('is-resetting');
   }
   function resetToFinal(){
    cancelReset();
    el.classList.add('is-resetting');
    el.classList.remove('is-active','is-dragging');
    setPos(0);
    resetTimer=setTimeout(()=>{
     el.classList.remove('is-resetting');
     resetTimer=null;
    },260);
   }
   function posFromEvent(e){
    const rect=stage.getBoundingClientRect();
    if(rect.width<=0)return 0;
    const clientX=e.clientX!=null?e.clientX:(e.touches&&e.touches[0]?e.touches[0].clientX:0);
    return ((clientX-rect.left)/rect.width)*100;
   }
   stage.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse'){
     cancelReset();
     el.classList.add('is-active');
     setPos(posFromEvent(e));
    }else if(dragging){
     setPos(posFromEvent(e));
    }
   });
   stage.addEventListener('pointerleave',e=>{
    if(!dragging)resetToFinal();
   });
   stage.addEventListener('pointerdown',e=>{
    cancelReset();
    dragging=true;
    try{stage.setPointerCapture(e.pointerId);}catch{}
    el.classList.add('is-active','is-dragging');
    setPos(posFromEvent(e));
   });
   const stop=e=>{
    if(!dragging)return;
    dragging=false;
    try{stage.releasePointerCapture(e.pointerId);}catch{}
    el.classList.remove('is-dragging');
    if(e.pointerType!=='mouse'){
     resetToFinal();
    }else{
     const rect=stage.getBoundingClientRect();
     const inside=e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom;
     if(!inside)resetToFinal();
    }
   };
   stage.addEventListener('pointerup',stop);
   stage.addEventListener('pointercancel',stop);
   handle.addEventListener('focus',()=>{
    cancelReset();
    el.classList.add('is-active');
    if(pos===0)setPos(50);
   });
   handle.addEventListener('blur',resetToFinal);
   handle.addEventListener('keydown',e=>{
    const step=e.shiftKey?10:2;
    if(e.key==='ArrowLeft'){e.preventDefault();cancelReset();setPos(pos-step);}
    else if(e.key==='ArrowRight'){e.preventDefault();cancelReset();setPos(pos+step);}
    else if(e.key==='Home'){e.preventDefault();cancelReset();setPos(0);}
    else if(e.key==='End'){e.preventDefault();cancelReset();setPos(100);}
    else if(e.key==='Escape'){e.preventDefault();resetToFinal();}
    else if(e.key==='Enter'||e.key===' '){e.preventDefault();cancelReset();setPos(pos===0?50:0);}
   });
   setPos(0);
  });
 }
 window.initComparers=initComparers;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
