/* Lightning Rail Planner - standalone, no dependencies.
   Source mileages: https://github.com/grJDh/eberron-trains (read-only reference).
   Custom Tellyn links: published Sharn -> Flamekeep sample itinerary.
*/
(() => {
  'use strict';
  const STORAGE = 'house-orien-lightning-rail-planner-v1';
  const original4E = [
    ['Krona Peak','Irontown',104], ['Irontown','Vulyar',315],
    ['Korth','Rekkenmark',112], ['Korth','Atur',195], ['Atur','Vedykar',148],
    ['Vedykar','Fort Zombie',142], ['Sharn','First Tower',44],
    ['First Tower','Wroat',250], ['Wroat','Hatheril',478],
    ['Hatheril','Starilaskur',223], ['Hatheril','Sword Keep',106],
    ['Wroat','Starilaskur',617], ['Starilaskur','Sterngate',269],
    ['Starilaskur','Vathirond',198], ['Vathirond','Aruldusk',142],
    ['Aruldusk','Sigilstar',99], ['Sigilstar','Flamekeep',194],
    ['Sword Keep','Marketplace',96], ['Marketplace','Passage',255],
    ['Passage','Fairhaven',227], ['Fairhaven','Thaliost',361],
    ['Sterngate','Zolanberg',214], ['Zolanberg','Korranberg',195]
  ];
  const original3E = [
    ['Krona Peak','Irontown',142], ['Irontown','Vulyar',456],
    ['Korth','Rekkenmark',141], ['Korth','Atur',332], ['Atur','Vedykar',227],
    ['Vedykar','Fort Zombie',239], ['Sharn','First Tower',56],
    ['First Tower','Wroat',417], ['Wroat','Hatheril',717],
    ['Hatheril','Starilaskur',372], ['Hatheril','Sword Keep',150],
    ['Wroat','Starilaskur',939], ['Starilaskur','Sterngate',369],
    ['Starilaskur','Vathirond',287], ['Vathirond','Aruldusk',262],
    ['Aruldusk','Sigilstar',166], ['Sigilstar','Flamekeep',300],
    ['Sword Keep','Marketplace',97], ['Marketplace','Passage',369],
    ['Passage','Fairhaven',348], ['Fairhaven','Thaliost',617],
    ['Sterngate','Zolanberg',386], ['Zolanberg','Korranberg',300]
  ];
  // Coordinates are schematic (% of the canvas), not survey/GIS coordinates.
  const positions = {
    'Sharn':[11,83], 'First Tower':[17,78], 'Wroat':[27,73],
    'Hatheril':[43,67], 'Starilaskur':[58,67], 'Sword Keep':[45,55],
    'Marketplace':[52,49], 'Tellyn':[66,43], 'Sigilstar':[80,38],
    'Flamekeep':[84,31], 'Vathirond':[72,60], 'Aruldusk':[77,49],
    'Sterngate':[60,84], 'Zolanberg':[73,86], 'Korranberg':[85,85],
    'Passage':[40,38], 'Fairhaven':[33,24], 'Thaliost':[53,17],
    'Rekkenmark':[65,19], 'Korth':[72,26], 'Atur':[82,33],
    'Vedykar':[89,43], 'Fort Zombie':[95,54], 'Krona Peak':[88,9],
    'Irontown':[83,16], 'Vulyar':[87,23], 'Gatherhold':[81,60],
    'Arcanix':[38,31], 'Ardev':[22,64], 'Athandra':[69,54],
    'Avaroth':[68,22], 'Bastion':[18,89], 'Danthaven':[49,41],
    'Daskaran':[56,24], 'Eiben':[42,30], 'Galethspyre':[78,34],
    'Karrlakton':[85,37], 'Latheer':[77,23], 'New Cyre':[66,73],
    'Nowhere':[81,29], 'Sharavacion':[92,48], 'Sharpton':[30,66],
    'Soldit':[69,91], 'Teryk':[70,69], 'Threshold':[85,58],
    'Vom':[85,66], 'Xandrar':[36,35]
  };
  const defaultCustom = [
    {id:'original-custom-thaliost',a:'Thaliost',b:'Rekkenmark',miles:27,enabled:true,origin:'Original custom network'},
    {id:'original-custom-vedykar',a:'Vedykar',b:'Vulyar',miles:147,enabled:true,origin:'Original custom network'},
    {id:'original-custom-gatherhold',a:'Vulyar',b:'Gatherhold',miles:302,enabled:true,origin:'Original custom network'},
    {id:'planner-tellyn-1',a:'Marketplace',b:'Tellyn',miles:150,enabled:true,origin:'Recovered journey example'},
    {id:'planner-tellyn-2',a:'Tellyn',b:'Sigilstar',miles:150,enabled:true,origin:'Recovered journey example'}
  ];
  const builtinFares = [
    {name:'Any seat',source:'Rising from the Last War (5E)',group:'5E',rate:.5,method:'mile'},
    {name:'Standard',source:"Wayfinder’s Guide to Eberron (5E)",group:'5E',rate:1,method:'day'},
    {name:'Luxury',source:"Wayfinder’s Guide to Eberron (5E)",group:'5E',rate:4,method:'day'},
    {name:'Steerage',source:'Eberron Campaign Guide (4E)',group:'4E',rate:.03,method:'mile'},
    {name:'Standard',source:'Eberron Campaign Guide (4E)',group:'4E',rate:.2,method:'mile'},
    {name:'First class',source:'Eberron Campaign Guide (4E)',group:'4E',rate:.5,method:'mile'}
  ];
  const orienFares = [
    {name:'Steerage',source:'House Orien campaign classes',group:'Orien',rate:.005,method:'mile'},
    {name:'Economy seat',source:'House Orien campaign classes',group:'Orien',rate:.01,method:'mile'},
    {name:'Economy sleeper',source:'House Orien campaign classes',group:'Orien',rate:.02,method:'mile'},
    {name:'Business sleeper',source:'House Orien campaign classes',group:'Orien',rate:.05,method:'mile'},
    {name:'First class',source:'House Orien campaign classes',group:'Orien',rate:.1,method:'mile'}
  ];
  const initial = () => ({
    from:'Sharn',to:'Flamekeep',edition:'4E',speed:30,layover:1,fareFilter:'All',
    customConnections:defaultCustom.map(c=>({...c})),customStations:[],customFares:[]
  });
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (saved && typeof saved === 'object' && Array.isArray(saved.customConnections) && Array.isArray(saved.customStations) && Array.isArray(saved.customFares)) {
        return {...initial(),...saved,speed:Number(saved.speed)||30,layover:Math.max(0,Number(saved.layover)||0)};
      }
    } catch(_) { /* use defaults */ }
    return initial();
  }
  let state = load();
  let currentRoute = null;
  let view = {x:0,y:0,w:1000,h:700};
  let dragged = false;
  let dragStart = null;
  const el = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const safeNumber = (n) => typeof n === 'number' && Number.isFinite(n);
  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(_){} }
  function canon(text){return String(text||'').trim().replace(/\s+/g,' ')}
  function allNames(){
    return [...new Set([...original4E,...original3E].flatMap(x=>x.slice(0,2))
      .concat(state.customConnections.flatMap(x=>[x.a,x.b]))
      .concat(state.customStations.map(x=>x.name)))].filter(Boolean).sort((a,b)=>a.localeCompare(b));
  }
  function normalizeName(name){const value=canon(name);return allNames().find(n=>n.toLocaleLowerCase()===value.toLocaleLowerCase())||value;}
  function point(name){
    const custom = state.customStations.find(x=>x.name===name);
    const v = custom ? [custom.x,custom.y] : positions[name];
    if (v && safeNumber(Number(v[0])) && safeNumber(Number(v[1]))) return [Number(v[0])*10,Number(v[1])*7];
    let hash=0;for(const ch of name) hash=((hash*31)+ch.charCodeAt(0))|0;
    return [100+Math.abs(hash%790),100+Math.abs((hash>>8)%500)];
  }
  function getEdges(){
    const base = state.edition==='4E'?original4E:state.edition==='3E'?original3E:[];
    const connections = base.map(([a,b,miles])=>({a,b,miles,kind:'base'}));
    for(const c of state.customConnections) if(c.enabled!==false && Number(c.miles)>0) connections.push({...c,kind:'custom'});
    return connections;
  }
  function pathFinder(from,to,edges){
    if(!from||!to) return null;
    if(from===to) return {miles:0,path:[from],legs:[]};
    const nodes=new Map();
    for(const e of edges){
      if(!nodes.has(e.a))nodes.set(e.a,[]);
      if(!nodes.has(e.b))nodes.set(e.b,[]);
      nodes.get(e.a).push({node:e.b,miles:e.miles,kind:e.kind});
      nodes.get(e.b).push({node:e.a,miles:e.miles,kind:e.kind});
    }
    if(!nodes.has(from)||!nodes.has(to))return null;
    const distances=new Map([[from,0]]), previous=new Map(), visited=new Set();
    while(visited.size<nodes.size){
      let name=null,dist=Infinity;
      for(const node of nodes.keys()) if(!visited.has(node)&&(distances.get(node)??Infinity)<dist){name=node;dist=distances.get(node);}
      if(name===null||dist===Infinity)break;
      if(name===to)break;
      visited.add(name);
      for(const link of nodes.get(name)){
        const trial=dist+Number(link.miles);
        if(trial<(distances.get(link.node)??Infinity)){
          distances.set(link.node,trial);
          previous.set(link.node,{node:name,miles:link.miles,kind:link.kind});
        }
      }
    }
    if(!previous.has(to))return null;
    const path=[to],legs=[];
    for(let cursor=to;cursor!==from;){
      const entry=previous.get(cursor);
      if(!entry)return null;
      legs.unshift({from:entry.node,to:cursor,miles:entry.miles,kind:entry.kind});
      cursor=entry.node;path.unshift(cursor);
    }
    return {miles:distances.get(to),path,legs};
  }
  function routeTime(route){return route.miles/state.speed+Math.max(0,route.path.length-2)*state.layover;}
  function timeString(hours){
    const mins=Math.round(hours*60),days=Math.floor(mins/1440),remaining=mins%1440;
    const h=Math.floor(remaining/60),m=remaining%60;
    return (days?days+'d ':'')+h+'h '+String(m).padStart(2,'0')+'m';
  }
  const fmtMiles=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
  function formatGP(value){
    const copper=Math.max(0,Math.round(value*100));
    const gp=Math.floor(copper/100),sp=Math.floor(copper%100/10),cp=copper%10;
    return [gp?gp.toLocaleString('en-US')+' gp':'',sp?sp+' sp':'',cp?cp+' cp':''].filter(Boolean).join(' ')||'0 gp';
  }
  function setText(id,text){el(id).textContent=text;}
  function setFeedback(text,success=false,editor=false){const node=el(editor?'editor-feedback':'feedback');node.textContent=text;node.classList.toggle('success',success);}
  function svg(tag,attrs={},parent=el('rail-map')){
    const node=document.createElementNS(NS,tag);
    for(const [key,val] of Object.entries(attrs))node.setAttribute(key,String(val));
    parent.appendChild(node);return node;
  }
  function showMap(){
    const root=el('rail-map');root.replaceChildren();
    const terrain=svg('g',{'aria-hidden':'true'});
    svg('path',{d:'M92 165 C150 101 221 149 280 120 Q343 61 430 117 L536 93 Q631 46 727 97 L790 141 Q896 159 927 260 L961 379 L918 502 Q855 571 787 558 L701 629 L566 601 Q480 664 382 604 L274 610 Q174 536 107 473 L45 361 Z',class:'land-mass'},terrain);
    for(let i=1;i<=9;i++) svg('path',{d:`M ${i*100} 0 V 700`,class:'map-gridline'},terrain);
    for(let i=1;i<=6;i++) svg('path',{d:`M 0 ${i*100} H 1000`,class:'map-gridline'},terrain);
    const edges=getEdges();
    const selected=new Set(currentRoute?.legs.map(e=>[e.from,e.to].sort().join('|'))||[]);
    const railGroup=svg('g');
    for(const e of edges){const [x1,y1]=point(e.a),[x2,y2]=point(e.b);
      svg('path',{d:`M ${x1} ${y1} L ${x2} ${y2}`,class:'map-edge '+(e.kind==='custom'?'custom':'')},railGroup);
    }
    const pathGroup=svg('g');
    for(const e of (currentRoute?.legs||[])){
      const [x1,y1]=point(e.from),[x2,y2]=point(e.to);
      svg('path',{d:`M ${x1} ${y1} L ${x2} ${y2}`,class:'map-edge selected'},pathGroup);
    }
    const visible=new Set(edges.flatMap(e=>[e.a,e.b]).concat(state.customStations.map(x=>x.name)));
    const stationGroup=svg('g');
    for(const name of [...visible].sort()){
      const [x,y]=point(name);
      const status=name===state.from?'start':name===state.to?'end':'';
      const isSelected=currentRoute?.path.includes(name);
      const g=svg('g',{class:'map-station '+status+(currentRoute&&!isSelected?' dimmed':''),tabindex:'0',role:'button','aria-label':`Select ${name} as departure`},stationGroup);
      const t=svg('title',{},g);t.textContent=`${name} · select as departure`;
      svg('circle',{cx:x,cy:y,r:isSelected?8.3:6.3,class:'halo'},g);
      svg('circle',{cx:x,cy:y,r:2.5,class:'core'},g);
      const label=svg('text',{x:x+(x>790?-13:13),y:y-11,class:'station-label','text-anchor':x>790?'end':'start'},g);
      label.textContent=name;
      g.addEventListener('click',(event)=>{event.stopPropagation();if(dragged)return;state.from=name;persist();refresh();});
      g.addEventListener('keydown',(event)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();state.from=name;persist();refresh();}});
    }
    root.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
  }
  function zoom(multiplier,anchorX=view.x+view.w/2,anchorY=view.y+view.h/2){
    const newW=Math.max(300,Math.min(1800,view.w*multiplier));
    const newH=newW*.7;
    const u=(anchorX-view.x)/view.w,v=(anchorY-view.y)/view.h;
    view={x:anchorX-u*newW,y:anchorY-v*newH,w:newW,h:newH};
    el('rail-map').setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
  }
  function fitRoute(){
    if(!currentRoute||currentRoute.path.length<2){view={x:0,y:0,w:1000,h:700};showMap();return;}
    const coords=currentRoute.path.map(point),xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);
    const minX=Math.min(...xs)-100,maxX=Math.max(...xs)+100,minY=Math.min(...ys)-100,maxY=Math.max(...ys)+100;
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    const w=Math.max(400,maxX-minX,(maxY-minY)/.7);
    view={x:cx-w/2,y:cy-w*.35,w,h:w*.7};showMap();
  }
  function populateOptions(){
    const names=allNames(),data=el('station-options');data.replaceChildren();
    for(const name of names){const o=document.createElement('option');o.value=name;data.appendChild(o);}
  }
  function addFareRow(fare,route){
    const wrap=document.createElement('div');wrap.className='fare-row';
    const info=document.createElement('div');info.className='fare-meta';
    const name=document.createElement('strong');name.textContent=fare.name;
    const description=document.createElement('small');
    description.textContent=`${fare.source} · ${fare.rate} gp per ${fare.method==='day'?'day':'mile'}`;
    info.append(name,description);
    const amount=document.createElement('div');amount.className='fare-amount';
    const cost=fare.method==='day'?routeTime(route)/24*fare.rate:route.miles*fare.rate;
    amount.textContent=formatGP(cost);
    wrap.append(info,amount);return wrap;
  }
  function displayFares(){
    const box=el('fares');box.replaceChildren();
    if(!currentRoute){box.innerHTML='<div class="empty-state">Choose connected stations to see fares.</div>';return;}
    const fares=builtinFares.concat(orienFares,state.customFares.map(x=>({...x,group:'Custom',source:'Custom fare',method:'mile'})));
    const filtered=fares.filter(x=>state.fareFilter==='All'?(x.group==='5E'||x.group==='4E'||x.group==='Custom'):x.group===state.fareFilter);
    if(!filtered.length){box.innerHTML='<div class="empty-state">No fares in this category. Add a custom fare in the editor.</div>';return;}
    for(const fare of filtered)box.appendChild(addFareRow(fare,currentRoute));
  }
  function displayItinerary(){
    const box=el('itinerary');box.replaceChildren();
    if(!currentRoute){box.innerHTML='<div class="empty-state">No route found. Edit the network or choose another pair of stations.</div>';return;}
    for(let i=0;i<currentRoute.path.length;i++){
      const row=document.createElement('div');row.className='itinerary-row';
      const dot=document.createElement('div');dot.className='itinerary-node';
      const mid=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('small');
      name.textContent=currentRoute.path[i];
      sub.textContent=i===0?'Departure':i===currentRoute.path.length-1?'Arrival':`Stop ${i}`;
      mid.append(name,sub);
      const miles=document.createElement('span');miles.className='leg-mile';
      miles.textContent=i===0?'':`${fmtMiles(currentRoute.legs[i-1].miles)} mi`;
      row.append(dot,mid,miles);box.appendChild(row);
    }
  }
  function refresh(){
    state.from=normalizeName(state.from);state.to=normalizeName(state.to);
    currentRoute=pathFinder(state.from,state.to,getEdges());
    populateOptions();
    el('from').value=state.from;el('to').value=state.to;
    el('speed').value=state.speed;el('layover').value=state.layover;
    el('fare-filter').value=state.fareFilter;
    document.querySelectorAll('[data-edition]').forEach(b=>{b.classList.toggle('active',b.dataset.edition===state.edition);b.setAttribute('aria-pressed',String(b.dataset.edition===state.edition));});
    setText('result-from',state.from||'—');setText('result-to',state.to||'—');
    setText('distance',currentRoute?fmtMiles(currentRoute.miles):'—');
    setText('travel-time',currentRoute?timeString(routeTime(currentRoute)):'—');
    setText('stops',currentRoute?String(Math.max(0,currentRoute.path.length-2)):'—');
    setText('time-sub',state.layover?`with ${state.layover}h stopovers`:'no stopovers');
    setFeedback(!state.from||!state.to?'Select both stations.':currentRoute?'':`No route between ${state.from} and ${state.to}. Add a connection or try another station.`);
    displayFares();displayItinerary();showMap();
    if(el('editor').open)renderEditor();
  }
  function plan(){state.from=normalizeName(el('from').value);state.to=normalizeName(el('to').value);persist();refresh();fitRoute();}
  function uid(){return 'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function makeButton(label,fn,cls=''){
    const button=document.createElement('button');button.type='button';button.textContent=label;button.className='mini-btn '+cls;button.addEventListener('click',fn);return button;
  }
  function renderEditor(){
    const conns=el('connection-list');conns.replaceChildren();
    for(const c of state.customConnections){
      const row=document.createElement('div');row.className='editor-list-row';
      const info=document.createElement('span');info.textContent=`${c.a} ↔ ${c.b} · ${fmtMiles(c.miles)} mi`;
      const origin=document.createElement('small');origin.textContent=c.origin||'User-created';info.appendChild(origin);
      const actions=document.createElement('div');actions.className='actions';
      const check=document.createElement('input');check.type='checkbox';check.checked=c.enabled!==false;check.title='Enable connection';check.setAttribute('aria-label',`Enable ${c.a} to ${c.b}`);
      check.addEventListener('change',()=>{c.enabled=check.checked;persist();refresh();});
      actions.append(check,makeButton('Edit',()=>{
        const next=prompt(`Distance in miles: ${c.a} ↔ ${c.b}`,String(c.miles));
        if(next===null)return;const num=Number(next);
        if(!Number.isFinite(num)||num<=0){setFeedback('Distance must be greater than zero.',false,true);return;}
        c.miles=num;persist();refresh();
      }),makeButton('Remove',()=>{
        if(!confirm(`Remove custom connection ${c.a} ↔ ${c.b}?`))return;
        state.customConnections=state.customConnections.filter(x=>x.id!==c.id);persist();refresh();
      },'delete'));
      row.append(info,actions);conns.appendChild(row);
    }
    if(!state.customConnections.length)conns.innerHTML='<div class="empty-state">No custom connections.</div>';
    const stations=el('station-list');stations.replaceChildren();
    for(const st of state.customStations){
      const row=document.createElement('div');row.className='editor-list-row';
      const title=document.createElement('span');title.textContent=`${st.name} · (${st.x}, ${st.y})`;
      const actions=document.createElement('div');actions.className='actions';
      actions.append(makeButton('Rename',()=>{
        const name=canon(prompt('Station name:',st.name));if(!name||name===st.name)return;
        if(allNames().some(n=>n.toLowerCase()===name.toLowerCase())){setFeedback('Station name already exists.',false,true);return;}
        const old=st.name;st.name=name;
        for(const c of state.customConnections){if(c.a===old)c.a=name;if(c.b===old)c.b=name;}
        if(state.from===old)state.from=name;if(state.to===old)state.to=name;
        persist();refresh();
      }),makeButton('Move',()=>{
        const x=prompt('Map X (0–100)',String(st.x));if(x===null)return;
        const y=prompt('Map Y (0–100)',String(st.y));if(y===null)return;
        if(![x,y].every(n=>n!==''&&Number(n)>=0&&Number(n)<=100)){setFeedback('Coordinates must be 0–100.',false,true);return;}
        st.x=Number(x);st.y=Number(y);persist();refresh();
      }),makeButton('Remove',()=>{
        if(!confirm(`Remove station ${st.name} and its custom connections?`))return;
        state.customStations=state.customStations.filter(x=>x.id!==st.id);
        state.customConnections=state.customConnections.filter(x=>x.a!==st.name&&x.b!==st.name);
        persist();refresh();
      },'delete'));
      row.append(title,actions);stations.appendChild(row);
    }
    if(!state.customStations.length)stations.innerHTML='<div class="empty-state">No user-added stations yet.</div>';
    const fares=el('fare-list-editor');fares.replaceChildren();
    for(const fare of state.customFares){
      const row=document.createElement('div');row.className='editor-list-row';
      const info=document.createElement('span');info.textContent=`${fare.name} · ${fare.rate} gp/mile`;
      row.append(info,makeButton('Remove',()=>{state.customFares=state.customFares.filter(x=>x.id!==fare.id);persist();refresh();},'delete'));fares.appendChild(row);
    }
    if(!state.customFares.length)fares.innerHTML='<div class="empty-state">No additional fares. Original source fares and House Orien classes are available without editing.</div>';
  }
  function bind(){
    el('plan').addEventListener('click',plan);
    for(const id of ['from','to'])el(id).addEventListener('keydown',e=>{if(e.key==='Enter')plan();});
    el('swap').addEventListener('click',()=>{const a=el('from').value;el('from').value=el('to').value;el('to').value=a;plan();});
    document.querySelectorAll('[data-edition]').forEach(button=>button.addEventListener('click',()=>{state.edition=button.dataset.edition;persist();refresh();fitRoute();}));
    el('fare-filter').addEventListener('change',e=>{state.fareFilter=e.target.value;persist();displayFares();});
    el('journey-settings').addEventListener('click',()=>{const body=el('journey-settings-body');body.hidden=!body.hidden;});
    for(const id of ['speed','layover'])el(id).addEventListener('change',e=>{
      const n=Number(e.target.value);
      if(!Number.isFinite(n)||(id==='speed'&&(n<=0||n>200))||(id==='layover'&&(n<0||n>48))){setFeedback('Check your speed or layover settings.');refresh();return;}
      state[id]=n;persist();refresh();
    });
    el('copy-route').addEventListener('click',async()=>{
      if(!currentRoute){setFeedback('Nothing to copy yet.');return;}
      const text=[`${state.from} → ${state.to}`,`${fmtMiles(currentRoute.miles)} miles, ${timeString(routeTime(currentRoute))}`, ...currentRoute.path.map((name,i)=>`${i+1}. ${name}${i>0?' ('+fmtMiles(currentRoute.legs[i-1].miles)+' mi)':''}`)].join('\n');
      try{await navigator.clipboard.writeText(text);setFeedback('Itinerary copied.',true);}
      catch(_){const field=document.createElement('textarea');field.value=text;document.body.appendChild(field);field.select();try{document.execCommand('copy');setFeedback('Itinerary copied.',true);}catch(_e){setFeedback('Copy is unavailable in this browser.');}field.remove();}
    });
    el('zoom-in').addEventListener('click',()=>zoom(.78));el('zoom-out').addEventListener('click',()=>zoom(1.28));el('fit-route').addEventListener('click',fitRoute);
    const map=el('rail-map');
    map.addEventListener('wheel',e=>{e.preventDefault();const bounds=map.getBoundingClientRect();const u=(e.clientX-bounds.left)/bounds.width,v=(e.clientY-bounds.top)/bounds.height;zoom(e.deltaY>0?1.12:.89,view.x+view.w*u,view.y+view.h*v);},{passive:false});
    map.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragStart={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};dragged=false;map.setPointerCapture(e.pointerId);});
    map.addEventListener('pointermove',e=>{if(!dragStart)return;const deltaX=e.clientX-dragStart.x,deltaY=e.clientY-dragStart.y;
      if(Math.abs(deltaX)+Math.abs(deltaY)>5)dragged=true;
      if(!dragged)return;map.classList.add('dragging');const rect=map.getBoundingClientRect();
      view.x=dragStart.vx-deltaX*view.w/rect.width;view.y=dragStart.vy-deltaY*view.h/rect.height;
      map.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
    });
    function finishDrag(){dragStart=null;map.classList.remove('dragging');setTimeout(()=>{dragged=false;},0);}
    map.addEventListener('pointerup',finishDrag);map.addEventListener('pointercancel',finishDrag);
    el('edit-network').addEventListener('click',()=>{renderEditor();el('editor').showModal();});
    document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
      document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===button));
      document.querySelectorAll('.tab-panel').forEach(x=>x.hidden=x.id!=='tab-'+button.dataset.tab);
      setFeedback('',false,true);
    }));
    el('add-connection').addEventListener('submit',e=>{
      e.preventDefault();const a=normalizeName(el('conn-a').value),b=normalizeName(el('conn-b').value),miles=Number(el('conn-miles').value);
      if(!a||!b||a===b||!Number.isFinite(miles)||miles<=0){setFeedback('Choose two different stations and a positive distance.',false,true);return;}
      if(state.customConnections.some(c=>[c.a,c.b].sort().join('|')===[a,b].sort().join('|'))){setFeedback('A custom connection between these stations already exists. Use Edit instead.',false,true);return;}
      for(const name of [a,b])if(!positions[name]&&!state.customStations.some(x=>x.name===name))state.customStations.push({id:uid(),name,x:50,y:50});
      state.customConnections.push({id:uid(),a,b,miles,enabled:true,origin:'User-created'});
      el('conn-a').value='';el('conn-b').value='';el('conn-miles').value='';persist();refresh();setFeedback('Connection added.',true,true);
    });
    el('add-station').addEventListener('submit',e=>{
      e.preventDefault();const name=canon(el('station-name').value),x=Number(el('station-x').value),y=Number(el('station-y').value);
      if(!name||allNames().some(n=>n.toLowerCase()===name.toLowerCase())||![x,y].every(n=>Number.isFinite(n)&&n>=0&&n<=100)){
        setFeedback('Use a unique station name and coordinates between 0 and 100.',false,true);return;
      }
      state.customStations.push({id:uid(),name,x,y});el('station-name').value='';persist();refresh();setFeedback('Station added. Connect it to the railway to make journeys possible.',true,true);
    });
    el('add-fare').addEventListener('submit',e=>{
      e.preventDefault();const name=canon(el('fare-name').value),rate=Number(el('fare-rate').value);
      if(!name||!Number.isFinite(rate)||rate<0){setFeedback('Enter a fare name and valid nonnegative GP per mile.',false,true);return;}
      state.customFares.push({id:uid(),name,rate});el('fare-name').value='';el('fare-rate').value='';persist();refresh();setFeedback('Fare added.',true,true);
    });
    el('export-data').addEventListener('click',()=>{
      const file=new Blob([JSON.stringify({format:'house-orien-lightning-rail',version:1,...state},null,2)],{type:'application/json'});
      const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='lightning-rail-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
      setFeedback('Settings exported.',true,true);
    });
    el('import-data').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const data=JSON.parse(await file.text());
        if(!Array.isArray(data.customConnections)||!Array.isArray(data.customStations)||!Array.isArray(data.customFares))throw Error('Incorrect settings format.');
        if(data.customConnections.length>1000||data.customStations.length>1000||data.customFares.length>1000)throw Error('Import too large.');
        const connections=data.customConnections.map((c,i)=>{
          const a=canon(c.a),b=canon(c.b),miles=Number(c.miles);
          if(!a||!b||a===b||!Number.isFinite(miles)||miles<=0)throw Error(`Invalid connection ${i+1}`);
          return {id:uid(),a,b,miles,enabled:c.enabled!==false,origin:canon(c.origin)||'Imported'};
        });
        const stations=data.customStations.map((s,i)=>{
          const name=canon(s.name),x=Number(s.x),y=Number(s.y);
          if(!name||![x,y].every(n=>Number.isFinite(n)&&n>=0&&n<=100))throw Error(`Invalid station ${i+1}`);
          return {id:uid(),name,x,y};
        });
        const fares=data.customFares.map((f,i)=>{
          const name=canon(f.name),rate=Number(f.rate);
          if(!name||!Number.isFinite(rate)||rate<0)throw Error(`Invalid fare ${i+1}`);
          return {id:uid(),name,rate};
        });
        state.customConnections=connections;state.customStations=stations;state.customFares=fares;persist();refresh();setFeedback('Settings imported.',true,true);
      }catch(err){setFeedback(`Could not import: ${err.message}`,false,true);}finally{e.target.value='';}
    });
    el('reset-data').addEventListener('click',()=>{
      if(!confirm('Reset custom stations, connections, fares and journey settings to defaults?'))return;
      state=initial();persist();refresh();setFeedback('Defaults restored.',true,true);
    });
  }
  bind();refresh();fitRoute();
})();
