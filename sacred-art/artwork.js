"use strict";
(() => {
 const script=document.currentScript;
 const ROOT=new URL(".",script.src);
 const id=document.body.dataset.artwork;
 const root=document.getElementById("app");
 const peopleGuide="annunciation-saints.html";

 const imageUrl=p=>new URL(p.image,ROOT).href;
 const pageUrl=p=>new URL(p.page||"annunciation.html",ROOT).href;
 const E=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const add=(parent,...children)=>{for(const child of children)parent.append(child);return parent;};
 const link=(text,href,cls)=>{const a=E("a",cls,text);a.href=href;return a;};
 const card=(title)=>{const section=E("section","card");section.append(E("h2","",title));root.append(section);return section;};
 const pill=(txt)=>E("span","pill",txt);
 const external=(txt,url)=>{const a=link(txt,url);a.target="_blank";a.rel="noopener noreferrer";return a;};
 let all=[],painting=null;
 function setViewer(host,p){
  const who=E("p","muted small","Want to recognize people in other paintings, not just memorize names? ");who.append(link("Open the Annunciation identification guide",new URL(peopleGuide,ROOT).href));host.append(who);
  const view=E("div","viewer");view.setAttribute("role","region");view.setAttribute("aria-label","Zoomable "+p.title+" by "+p.artist);
  const artspace=E("div","artspace"),im=E("img");im.src=imageUrl(p);im.alt=p.artist+"'s "+p.title;im.decoding="async";
  artspace.append(im);view.append(artspace);host.append(view);
  const bar=E("div","controls"),plus=E("button","","+ Zoom in"),minus=E("button","","− Zoom out"),reset=E("button","secondary","Reset view"),readout=E("span","muted tiny","100%");
  for(const b of [plus,minus,reset])b.type="button";
  bar.append(plus,minus,reset,readout,E("span","tiny muted","Drag to explore • Scroll to zoom"));host.append(bar);
  let scale=1,x=0,y=0,baseW=0,baseH=0,drag=null;
  function layout(force=false){
   const vw=view.clientWidth,vh=view.clientHeight;
   const ratio=p.aspect||1.35;
   baseW=Math.min(vw,vh*ratio);baseH=baseW/ratio;
   artspace.style.width=baseW+"px";artspace.style.height=baseH+"px";
   if(force){x=(vw-baseW)/2;y=(vh-baseH)/2;scale=1;}
   render();
  }
  function render(){
   const w=view.clientWidth,h=view.clientHeight,zw=baseW*scale,zh=baseH*scale;
   x=zw<w?(w-zw)/2:Math.min(0,Math.max(w-zw,x));
   y=zh<h?(h-zh)/2:Math.min(0,Math.max(h-zh,y));
   artspace.style.transform="translate("+x+"px,"+y+"px) scale("+scale+")";readout.textContent=Math.round(scale*100)+"%";
  }
  function zoom(f,cx=view.clientWidth/2,cy=view.clientHeight/2){
   const old=scale;scale=Math.min(5,Math.max(1,scale*f));
   x=cx-(cx-x)*scale/old;y=cy-(cy-y)*scale/old;render();
  }
  plus.onclick=()=>zoom(1.3);minus.onclick=()=>zoom(1/1.3);reset.onclick=()=>layout(true);
  view.addEventListener("wheel",e=>{e.preventDefault();const rect=view.getBoundingClientRect();zoom(e.deltaY<0?1.14:1/1.14,e.clientX-rect.left,e.clientY-rect.top);},{passive:false});
  view.addEventListener("pointerdown",e=>{if(e.target.closest(".hotspot"))return;drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,x,y};view.setPointerCapture(e.pointerId);view.classList.add("dragging");});
  view.addEventListener("pointermove",e=>{if(!drag||drag.id!==e.pointerId)return;x=drag.x+e.clientX-drag.sx;y=drag.y+e.clientY-drag.sy;render();});
  const end=()=>{drag=null;view.classList.remove("dragging");};view.addEventListener("pointerup",end);view.addEventListener("pointercancel",end);
  const details=E("div","details"),buttons=E("div","detail-buttons"),panel=E("div","detail-panel");
  details.append(buttons,panel);host.append(details);
  let markers=[];
  function choose(spot){
   panel.replaceChildren();
   panel.append(E("h3","",spot.label),pill(spot.kind),E("p","",spot.text));
   for(const b of markers)b.setAttribute("aria-pressed",String(b.dataset.spot===spot.id));
  }
  p.hotspots.forEach((spot,index)=>{
   const marker=E("button","hotspot",String(index+1));marker.type="button";marker.style.left=spot.x+"%";marker.style.top=spot.y+"%";marker.dataset.spot=spot.id;
   marker.setAttribute("aria-label","Explore "+spot.label);marker.setAttribute("aria-pressed","false");marker.onclick=()=>choose(spot);artspace.append(marker);markers.push(marker);
   const btn=E("button","secondary",(index+1)+". "+spot.label);btn.type="button";btn.onclick=()=>choose(spot);buttons.append(btn);
  });
  if(p.hotspots.length)choose(p.hotspots[0]);
  const ro=new ResizeObserver(()=>layout(true));ro.observe(view);layout(true);
 }
 function setupQuiz(host,questions){
  let qi=0;
  const qTitle=E("h3"),opts=E("div","answers"),feedback=E("div","feedback","Choose an answer to see the explanation."),next=E("button","secondary","Next question");
  next.type="button";add(host,qTitle,opts,feedback,E("div","controls"));host.lastChild.append(next);
  function draw(){
   const q=questions[qi];qTitle.textContent=q.q;opts.replaceChildren();feedback.textContent="Choose an answer to see the explanation.";
   q.choices.forEach((answer,i)=>{
    const b=E("button","answer",String.fromCharCode(65+i)+". "+answer);b.type="button";
    b.onclick=()=>{
     for(const [index,button] of Array.from(opts.children).entries()){
      button.disabled=true;
      if(index===q.right)button.classList.add("correct");
      else if(index===i)button.classList.add("incorrect");
     }
     feedback.textContent=(i===q.right?"Correct! ":"Not quite. ")+q.why+" · Concept: "+q.id;
    };opts.append(b);
   });
  }
  next.onclick=()=>{qi=(qi+1)%questions.length;draw();};draw();
 }
 function setupComparison(host){
  const choices=all.filter(p=>p.subject===painting.subject&&p.available&&p.image);
  const layout=E("div","compare-fields"),fields=[];
  for(const heading of ["First painting","Second painting"]){
   const area=E("div");const lbl=E("label","",heading),select=E("select");const sid="choice"+fields.length;select.id=sid;lbl.htmlFor=sid;
   for(const p of choices){const opt=new Option(p.artist+" — "+p.title+" ("+p.date+")",p.id);select.append(opt);}
   fields.push(select);area.append(lbl,select);layout.append(area);
  }
  host.append(E("p","", "Pick any two works in this collection. Compare the setting, gestures, symbols, and historical context."));
  host.append(layout);
  fields[0].value=painting.id;
  const next=choices[(choices.findIndex(p=>p.id===painting.id)+1)%choices.length];
  if(next)fields[1].value=next.id;
  const bar=E("div","controls"),go=E("button","","Go Side by Side"),feedback=E("span","tiny muted");
  bar.append(go,feedback);host.append(bar);
  function validate(){go.disabled=fields[0].value===fields[1].value||!fields[0].value||!fields[1].value;feedback.textContent=go.disabled?"Choose two different paintings.":"Ready to compare.";}
  fields.forEach(s=>s.addEventListener("change",validate));
  go.onclick=()=>{if(go.disabled)return;location.href=new URL("compare.html?subject="+encodeURIComponent(painting.subject)+"&a="+encodeURIComponent(fields[0].value)+"&b="+encodeURIComponent(fields[1].value),ROOT).href;};
  validate();
 }
 function render(catalog,p){
  painting=p;all=catalog.paintings;
  document.title=p.artist+" — "+p.title+" | Acorn Academy";
  const heading=document.getElementById("pageTitle");heading.textContent=p.artist+"'s "+p.title;
  document.getElementById("pageSubtitle").textContent=p.date+" · "+p.museum;
  const art=card("Explore the Painting");
  add(art,E("p","lede",p.visual.setting),pill(p.date),pill(p.period),pill(p.medium));
  setViewer(art,p);
  const story=card("The Story in the Bible");
  story.append(E("p","", "In Luke 1:26–38, God sends the angel Gabriel to tell Mary that she will have a son named Jesus. Mary asks how this can happen, and then accepts the message. Each artist chooses how to picture that meeting."));
  add(story,E("p","", "The Bible does not describe every object in these paintings. Some things—such as wings, lilies, books, and gardens—come from the artists' own choices and religious traditions."));
  const links=E("div","controls");add(links,link("Read our child-friendly retelling",new URL("annunciation.html#story",ROOT).href,"button-link"),external("Read EasyEnglish Luke 1", "https://www.easyenglish.bible/bible/easy/luke/1/#26"),external("Read the US Catholic Bible","https://bible.usccb.org/bible/luke/1"));story.append(links);
  const hist=card("A Little Art History");hist.classList.add("history");
  for(const para of p.history_paragraphs||[])hist.append(E("p","",para));
  hist.append(E("p","tiny muted","Reference: "));hist.lastChild.append(external("Museum or collection information",p.source_url));
  const compare=card("Compare Two Paintings");setupComparison(compare);
  const q=card("Try an Art Detective Question");
  q.append(E("p","tiny muted","These questions are examples for Acorn Academy. They are not connected to the game's rewards or progress yet."));
  const qs=[...p.questions,{q:"What biblical story is shown in this painting?",choices:["The Annunciation","The Crucifixion","The Good Samaritan","The Last Supper"],right:0,why:"Gabriel visits Mary and tells her she will have a son named Jesus.",id:"ANN-STORY-IDENTITY"}];
  setupQuiz(q,qs);
  const rel=card("Explore More Annunciations");
  const grid=E("div","related");
  const other=all.filter(v=>v.available&&v.subject===p.subject&&v.id!==p.id).sort((a,b)=>Math.abs(a.year-p.year)-Math.abs(b.year-p.year)).slice(0,3);
  for(const item of other){
   const a=link("",pageUrl(item),"related-card"),im=E("img");im.src=imageUrl(item);im.alt=item.artist+"'s Annunciation";im.loading="lazy";
   add(a,im,E("strong","",item.artist),E("span","tiny muted",item.date));grid.append(a);
  }
  rel.append(grid, E("p"));rel.lastChild.append(link("View the full Annunciation collection",new URL("gallery.html",ROOT).href));
  const footer=E("footer","", "Educational prototype · Collection information is credited to museums and galleries. Artwork images are supplied for the family's project; this site does not grant reuse rights.");
  root.append(footer);
 }
 async function start(){
  try{
   const res=await fetch(new URL("../data/sacred-art-paintings.json",ROOT),{cache:"no-store"});
   if(!res.ok)throw Error("Painting collection not available");
   const catalog=await res.json(),p=catalog.paintings.find(v=>v.id===id&&v.available);
   if(!p)throw Error("This painting is not in the collection");
   root.replaceChildren();render(catalog,p);
  }catch(e){root.replaceChildren();const c=card("The page could not load");c.append(E("p","",e.message),link("Return to the gallery",new URL("gallery.html",ROOT).href));}
 }
 start();
})();
