(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  // Built-in network: distances measured on the 4E map.
  const RAILS = [
    ["Krona Peak","Irontown",104],["Irontown","Vulyar",315],["Korth","Rekkenmark",112],["Korth","Atur",195],
    ["Atur","Vedykar",148],["Vedykar","Fort Zombie",142],["Sharn","First Tower",44],["First Tower","Wroat",250],
    ["Wroat","Hatheril",478],["Hatheril","Starilaskur",223],["Hatheril","Sword Keep",106],["Wroat","Starilaskur",617],
    ["Starilaskur","Sterngate",269],["Starilaskur","Vathirond",198],["Vathirond","Aruldusk",142],["Aruldusk","Sigilstar",99],
    ["Sigilstar","Flamekeep",194],["Sword Keep","Marketplace",96],["Marketplace","Passage",255],["Passage","Fairhaven",227],
    ["Fairhaven","Thaliost",361],["Sterngate","Zolanberg",214],["Zolanberg","Korranberg",195]
  ];
  const FIXED_LINKS = [["Vedykar","Vulyar",147],["Vulyar","Gatherhold",302]];
  const BROKEN_LINKS = [["Thaliost","Rekkenmark"],["Fort Zombie","Vathirond"],["Vathirond","Sterngate"]];

  const BASE_STATIONS = {
    "Sharn": {x:220,y:690,l:[-12,25,"end"]}, "First Tower": {x:210,y:615,l:[-12,5,"end"]},
    "Wroat": {x:280,y:515,l:[-12,5,"end"]}, "Hatheril": {x:390,y:470,l:[-12,-12,"end"]},
    "Sword Keep": {x:375,y:395,l:[-12,5,"end"]}, "Marketplace": {x:330,y:330,l:[-12,5,"end"]},
    "Passage": {x:345,y:255,l:[-12,5,"end"]}, "Fairhaven": {x:375,y:170,l:[-12,5,"end"]},
    "Thaliost": {x:500,y:120,l:[0,-15,"middle"]}, "Rekkenmark": {x:585,y:135,l:[0,23,"middle"]},
    "Korth": {x:665,y:115,l:[0,-15,"middle"]}, "Atur": {x:745,y:150,l:[10,-10,"start"]},
    "Vedykar": {x:745,y:220,l:[-12,5,"end"]}, "Fort Zombie": {x:655,y:245,l:[-12,20,"end"]},
    "Vulyar": {x:845,y:225,l:[10,-10,"start"]}, "Irontown": {x:930,y:185,l:[12,5,"start"]},
    "Krona Peak": {x:965,y:110,l:[10,-10,"start"]}, "Gatherhold": {x:845,y:320,l:[10,5,"start"]},
    "Flamekeep": {x:530,y:255,l:[10,-10,"start"]}, "Sigilstar": {x:530,y:330,l:[10,5,"start"]},
    "Aruldusk": {x:555,y:405,l:[10,5,"start"]}, "Vathirond": {x:610,y:455,l:[10,-10,"start"]},
    "Starilaskur": {x:485,y:480,l:[-12,20,"end"]}, "Sterngate": {x:500,y:570,l:[-12,5,"end"]},
    "Zolanberg": {x:550,y:640,l:[-12,5,"end"]}, "Korranberg": {x:610,y:700,l:[10,5,"start"]}
  };

  const BASE_FARES = [
    {source:"erlw",sourceName:"Rising from the Last War (5E)",tier:"Any seat",price:.5,basis:"mile"},
    {source:"wgte",sourceName:"Wayfinder's Guide to Eberron (5E)",tier:"Standard",price:1,basis:"day"},
    {source:"wgte",sourceName:"Wayfinder's Guide to Eberron (5E)",tier:"Luxury",price:4,basis:"day"},
    {source:"ecg",sourceName:"Eberron Campaign Guide (4E)",tier:"Steerage",price:.03,basis:"mile"},
    {source:"ecg",sourceName:"Eberron Campaign Guide (4E)",tier:"Standard",price:.2,basis:"mile"},
    {source:"ecg",sourceName:"Eberron Campaign Guide (4E)",tier:"First class",price:.5,basis:"mile"}
  ];
  const OLD_STATIONS=structuredClone(BASE_STATIONS);
  Object.entries(window.RAIL_ATLAS.positions).forEach(([name,[x,y]])=>{
    BASE_STATIONS[name]={x:x/3.2,y:y/3.2,l:[7,-7,"start"]};
  });
  BASE_STATIONS.Thaliost.l=[-7,-7,"end"];
  BASE_STATIONS["First Tower"].l=[7,10,"start"];
  const DEFAULTS = {speed:30,layover:1,routeMode:"fastest",trainLoop:false,trainStops:true,fares:[],connections:[],disabledConnections:[],customStations:[]};
  // localStorage can be unavailable (private mode, blocked site data) or full; never let that break the app.
  const STORAGE_KEY="lightningRailSettings";
  function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function storageSet(key,value) { try { localStorage.setItem(key,value); return true; } catch { return false; } }

  const $ = id => document.getElementById(id);
  const els = {
    svg:$("railMap"),viewport:$("mapViewport"),stage:$("mapStage"),railLines:$("railLines"),stationLayer:$("stationLayer"),
    from:$("fromStation"),to:$("toStation"),fromMode:$("fromModeButton"),toMode:$("toModeButton"),hint:$("selectionHint"),
    error:$("routeError"),stations:$("stations"),routeList:$("routeList"),fareList:$("fareList"),fareFilter:$("fareFilter"),
    dialog:$("settingsDialog"),speed:$("speedInput"),
    layover:$("layoverInput"),fareRows:$("fareRows"),tooltip:$("stationTooltip"),toast:$("toast"),
    networkButton:$("networkButton"),networkEditor:$("networkEditor"),networkFrom:$("networkFrom"),networkTo:$("networkTo"),
    networkFromLabel:$("networkFromLabel"),networkToLabel:$("networkToLabel"),networkDistance:$("networkDistance"),
    networkError:$("networkError"),customRouteList:$("customRouteList"),customRouteCount:$("customRouteCount"),
    removeNetworkRoute:$("removeNetworkRoute"),removedRouteList:$("removedRouteList"),removedRouteCount:$("removedRouteCount"),
    connectionsTab:$("connectionsTab"),townsTab:$("townsTab"),connectionTools:$("connectionTools"),townTools:$("townTools"),
    townName:$("townName"),townRegion:$("townRegion"),townPlacementStatus:$("townPlacementStatus"),townError:$("townError"),
    placeTownButton:$("placeTownButton"),saveTownButton:$("saveTownButton"),customTownList:$("customTownList"),customTownCount:$("customTownCount")
  };

  let settings = loadSettings();
  let activeField = "from";
  let currentJourney = null;
  let view = {scale:1,x:0,y:0};
  let drag = null;
  let networkEditing = false;
  let networkActiveField = "from";
  let networkPanel = "connections";
  let townPlacementArmed = false;
  let draftTownPoint = null;
  let suppressMapClick = false;
  let editingTown = null;


  // Pure migration: returns a migrated copy plus the backups that should be written before saving it.
  function migrateSaved(input) {
    let saved=structuredClone(input);
    const backups=[];
    if (saved.atlasVersion !== 1) {
      backups.push(["lightningRailSettingsBeforeAtlas",structuredClone(input)]);
      const additions=window.RAIL_ATLAS.towns.map(([name,x,y,region])=>({name,x:x/3.2,y:y/3.2,region,origin:"Reference map / unverified"}));
      const custom=(Array.isArray(saved.customStations) ? saved.customStations : []).map(station=>{
        // Approximate relocation follows nearby built-in stations; originals stay in the backup.
        let weight=0, dx=0, dy=0;
        Object.entries(OLD_STATIONS).forEach(([name,p])=>{
          const w=1/(Math.pow(p.x-station.x,2)+Math.pow(p.y-station.y,2)+25);
          weight+=w; dx+=(BASE_STATIONS[name].x-p.x)*w; dy+=(BASE_STATIONS[name].y-p.y)*w;
        });
        return {...station,x:Math.max(0,Math.min(1200,station.x+dx/weight)),y:Math.max(0,Math.min(760,station.y+dy/weight)),origin:station.origin || "Your town · relocated"};
      });
      const names=new Set(custom.map(s=>String(s.name).toLowerCase()));
      saved.customStations=[...custom,...additions.filter(s=>!names.has(s.name.toLowerCase()))];
      const byName=name=>saved.customStations.find(s=>String(s.name).toLowerCase()===name.toLowerCase())?.name || name;
      const connections=new Map((Array.isArray(saved.connections) ? saved.connections : []).filter(Array.isArray).map(c=>[edgeKey(c[0],c[1]),c]));
      const removed=new Set(Array.isArray(saved.disabledConnections) ? saved.disabledConnections : []);
      [...FIXED_LINKS,...window.RAIL_ATLAS.routes.map(([a,b,h])=>[a,b,h*30])].forEach(([a,b,d])=>{
        a=byName(a); b=byName(b); const key=edgeKey(a,b);
        if (!connections.has(key) && !removed.has(key)) connections.set(key,[a,b,d]);
      });
      saved.connections=[...connections.values()];
      saved.atlasVersion=1; saved.showCustom=true;
    }
    if (!saved.bridgeCorrection) {
      backups.push(["lightningRailSettingsBeforeBridgeCorrection",structuredClone(saved)]);
      saved.connections=(saved.connections || []).filter(c=>edgeKey(c[0],c[1])!==edgeKey("Thaliost","Rekkenmark"));
      saved.bridgeCorrection=true;
    }
    return {saved,backups};
  }

  // Validates any saved/imported object into a clean settings object.
  function normalizeSettings(saved) {
    const customStations=Array.isArray(saved.customStations) ? saved.customStations.filter(station => {
      const name=String(station?.name || "").trim(), x=Number(station?.x), y=Number(station?.y);
      return name && !name.includes("|") && !BASE_STATIONS[name] && Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1200 && y >= 0 && y <= 760;
    }).map(station => ({name:String(station.name).trim(),region:String(station.region || "").trim(),x:Number(station.x),y:Number(station.y),origin:String(station.origin || "Your town")})) : [];
    const knownStation=name => !!BASE_STATIONS[name] || customStations.some(station => station.name === name);
    const savedConnections=Array.isArray(saved.connections) ? saved.connections.filter(connection =>
      Array.isArray(connection) && connection[0] !== connection[1] && knownStation(connection[0]) && knownStation(connection[1]) && Number(connection[2]) > 0 && Number.isFinite(Number(connection[2]))
    ) : [];
    const fares=Array.isArray(saved.fares) ? saved.fares.filter(fare => fare && typeof fare === "object").map(fare => ({
      name:String(fare.name || ""),tier:String(fare.tier || ""),price:Math.max(0,Number(fare.price) || 0),basis:["mile","day","hour"].includes(fare.basis) ? fare.basis : "mile"
    })) : [];
    return {
      speed:Number(saved.speed) > 0 ? Number(saved.speed) : DEFAULTS.speed,
      layover:Number(saved.layover) >= 0 ? Number(saved.layover) : DEFAULTS.layover,
      routeMode:saved.routeMode === "shortest" ? "shortest" : "fastest",
      trainLoop:saved.trainLoop === true,trainStops:saved.trainStops !== false,
      fares,
      connections:savedConnections.map(([from,to,miles]) => [from,to,Number(miles)]),
      disabledConnections:Array.isArray(saved.disabledConnections) ? [...new Set(saved.disabledConnections.filter(key => typeof key === "string" && isBuiltInEdge(key)))] : [],
      customStations,atlasVersion:1,bridgeCorrection:true,showCustom:saved.showCustom !== false
    };
  }

  // Fresh install: defaults plus the seeded reference-map towns and railways.
  function seededDefaults() { return normalizeSettings(migrateSaved(structuredClone(DEFAULTS)).saved); }

  function loadSettings() {
    const rawText=storageGet(STORAGE_KEY);
    let raw=null;
    if (rawText) {
      try { raw=JSON.parse(rawText); } catch { raw=null; }
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        // Unreadable data: keep a copy instead of silently overwriting it, then start from seeded defaults.
        storageSet("lightningRailSettingsCorrupt",rawText);
        raw=null;
      }
    }
    try {
      const {saved,backups}=migrateSaved(raw || structuredClone(DEFAULTS));
      if (raw) backups.forEach(([key,value]) => { if (!storageGet(key)) storageSet(key,JSON.stringify(value)); });
      const result=normalizeSettings(saved);
      // Save once so removing an imported record does not cause it to reappear on reload.
      storageSet(STORAGE_KEY,JSON.stringify(result));
      return result;
    } catch {
      if (rawText) storageSet("lightningRailSettingsCorrupt",rawText);
      return seededDefaults();
    }
  }
  function isBuiltInEdge(key) { return RAILS.some(connection => edgeKey(connection[0],connection[1]) === key); }
  function getRails() {
    const merged=new Map();
    [...RAILS,...(settings.showCustom === false ? [] : settings.connections)].forEach(connection => merged.set(edgeKey(connection[0],connection[1]),connection));
    return [...merged.entries()].filter(([key]) => !settings.disabledConnections.includes(key)).map(([,connection]) => connection);
  }
  function getStation(name) {
    return BASE_STATIONS[name] || settings.customStations.find(station => station.name === name) || null;
  }
  function getStationNames(all=false) { return [...Object.keys(BASE_STATIONS),...(all || settings.showCustom !== false ? settings.customStations.map(station => station.name) : [])].sort((a,b) => a.localeCompare(b)); }
  function edgeKey(a,b) { return [a,b].sort().join("|"); }
  function svgElement(tag,attributes={}) {
    const node = document.createElementNS(SVG_NS,tag);
    Object.entries(attributes).forEach(([key,value]) => node.setAttribute(key,value));
    return node;
  }

  function makeGraph() {
    const graph = {};
    getRails().forEach(([a,b,distance]) => {
      (graph[a] ||= []).push({name:b,distance});
      (graph[b] ||= []).push({name:a,distance});
    });
    return graph;
  }

  // Each leg takes miles / speed, plus a layover whenever the train passes through a stop.
  // "fastest" minimises hours (ties: fewer miles); "shortest" minimises miles (ties: fewer hours).
  function shortestPath(start,end,mode=settings.routeMode) {
    const graph = makeGraph();
    if (!graph[start] || !graph[end]) return null;
    const speed=settings.speed > 0 ? settings.speed : DEFAULTS.speed, layover=settings.layover >= 0 ? settings.layover : 0;
    const nodes = Object.keys(graph);
    const hours = Object.fromEntries(nodes.map(node => [node,Infinity]));
    const miles = Object.fromEntries(nodes.map(node => [node,Infinity]));
    const [primary,secondary] = mode === "shortest" ? [miles,hours] : [hours,miles];
    const better = (p,s,node) => p < primary[node] || (p === primary[node] && s < secondary[node]);
    const previous = {};
    const unvisited = new Set(nodes);
    hours[start] = 0; miles[start] = 0;
    while (unvisited.size) {
      let current = null;
      for (const node of unvisited) if (current === null || better(primary[node],secondary[node],current)) current = node;
      if (current === null || primary[current] === Infinity) break;
      unvisited.delete(current);
      if (current === end) break;
      graph[current].forEach(edge => {
        const h = hours[current] + edge.distance/speed + (current === start ? 0 : layover), m = miles[current] + edge.distance;
        if (mode === "shortest" ? better(m,h,edge.name) : better(h,m,edge.name)) { hours[edge.name] = h; miles[edge.name] = m; previous[edge.name] = current; }
      });
    }
    if (primary[end] === Infinity) return null;
    const path = [];
    for (let at=end; at; at=previous[at]) { path.unshift(at); if (at === start) break; }
    const segments = path.slice(0,-1).map((from,index) => {
      const to = path[index+1];
      return {from,to,distance:graph[from].find(edge => edge.name === to).distance};
    });
    return {path,segments,distance:segments.reduce((sum,segment) => sum+segment.distance,0),hours:hours[end]};
  }

  function normalizedStation(value) {
    const needle = value.trim().toLocaleLowerCase();
    return getStationNames().find(name => name.toLocaleLowerCase() === needle) || null;
  }

  function trackPoints(a,b) {
    const start=getStation(a), end=getStation(b);
    const dx=end.x-start.x, dy=end.y-start.y, diagonal=Math.min(Math.abs(dx),Math.abs(dy));
    const bend=Math.abs(dx)>Math.abs(dy) ? {x:end.x-Math.sign(dx)*diagonal,y:start.y} : {x:start.x,y:end.y-Math.sign(dy)*diagonal};
    return [start,bend,end];
  }
  function lineFor(a,b,className) {
    return svgElement("polyline",{points:trackPoints(a,b).map(p=>p.x+","+p.y).join(" "),class:className,fill:"none","stroke-linejoin":"round"});
  }

  function renderMap() {
    const routeEdges = new Set(currentJourney ? currentJourney.segments.map(segment => edgeKey(segment.from,segment.to)) : []);
    const customEdges = new Set(settings.connections.map(connection => edgeKey(connection[0],connection[1])));
    const base = document.createDocumentFragment();
    const highlights = document.createDocumentFragment();
    getRails().forEach(([a,b]) => {
      const hit=lineFor(a,b,"rail-hit");
      hit.addEventListener("click",event => { event.stopPropagation(); if (networkEditing) selectNetworkConnection(a,b); });
      base.append(lineFor(a,b,"rail-base"),lineFor(a,b,customEdges.has(edgeKey(a,b)) ? "rail-custom" : "rail-line"),hit);
      if (routeEdges.has(edgeKey(a,b))) highlights.append(lineFor(a,b,"rail-route-under"),lineFor(a,b,"rail-route"));
    });
    BROKEN_LINKS.forEach(([a,b]) => { if (!getRails().some(c=>edgeKey(c[0],c[1])===edgeKey(a,b))) base.append(lineFor(a,b,"rail-broken")); });
    if (networkEditing && els.networkFrom.value && els.networkTo.value && els.networkFrom.value !== els.networkTo.value) {
      const selectedExists=getRails().some(connection => edgeKey(connection[0],connection[1]) === edgeKey(els.networkFrom.value,els.networkTo.value));
      highlights.append(lineFor(els.networkFrom.value,els.networkTo.value,selectedExists ? "rail-edit-selected" : "rail-preview"));
    }
    els.railLines.replaceChildren(base,highlights);

    const stations = document.createDocumentFragment();
    getStationNames().forEach(name => {
      const point=getStation(name), [dx,dy,anchor]=point.l || [10,-10,"start"];
      const targetLabel=networkEditing ? networkPanel === "towns" ? "existing station" : `custom route ${networkActiveField}` : activeField === "from" ? "departure" : "destination";
      const group=svgElement("g",{class:"station",tabindex:"0",role:"button","aria-label":`${name}. Select as ${targetLabel}.`,transform:`translate(${point.x} ${point.y})`});
      if (!BASE_STATIONS[name]) group.classList.add("custom");
      if (currentJourney?.path.includes(name)) group.classList.add("on-route");
      if (name === normalizedStation(els.from.value)) group.classList.add("selected","start");
      if (name === normalizedStation(els.to.value)) group.classList.add("selected","end");
      if (networkEditing && name === els.networkFrom.value) group.classList.add("editor-from");
      if (networkEditing && name === els.networkTo.value) group.classList.add("editor-to");
      group.append(svgElement("circle",{class:"station-hit",r:"19"}),svgElement("circle",{class:"station-dot",r:"5"}));
      const label=svgElement("text",{class:"station-label",x:dx,y:dy,"text-anchor":anchor}); label.textContent=name; group.append(label);
      group.addEventListener("click",event => { event.stopPropagation(); chooseStation(name); });
      group.addEventListener("keydown",event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); chooseStation(name); } });
      group.addEventListener("pointerenter",event => showStationTooltip(name,event));
      group.addEventListener("pointermove",event => positionTooltip(event));
      group.addEventListener("pointerleave",hideTooltip);
      stations.append(group);
    });
    if (networkEditing && networkPanel === "towns" && draftTownPoint) {
      const {x,y}=draftTownPoint, draft=svgElement("g",{class:"station-draft",transform:`translate(${x} ${y})`,"aria-hidden":"true"});
      draft.append(svgElement("circle",{r:"14"}),svgElement("line",{x1:"-22",y1:"0",x2:"22",y2:"0"}),svgElement("line",{x1:"0",y1:"-22",x2:"0",y2:"22"}));
      stations.append(draft);
    }
    els.stationLayer.replaceChildren(stations);
  }

  function setActiveField(field) {
    activeField = field;
    els.fromMode.classList.toggle("active",field === "from");
    els.toMode.classList.toggle("active",field === "to");
    els.hint.innerHTML = `<span></span>Click a station for ${field === "from" ? "departure" : "destination"} · Right-click or long-press for map tools`;
    renderMap();
  }

  function chooseStation(name) {
    if (networkEditing && networkPanel === "towns") return;
    if (networkEditing) {
      if (networkActiveField === "from") {
        els.networkFrom.value=name;
        if (els.networkTo.value === name) els.networkTo.value="";
        setNetworkActiveField("to");
      } else {
        els.networkTo.value=name;
        if (els.networkFrom.value === name) els.networkFrom.value="";
        setNetworkActiveField("from");
      }
      els.networkError.hidden=true; renderMap(); return;
    }
    if (activeField === "from") {
      els.from.value = name;
      if (name === normalizedStation(els.to.value)) els.to.value = "";
      setActiveField("to");
    } else {
      els.to.value = name;
      if (name === normalizedStation(els.from.value)) els.from.value = "";
      setActiveField("from");
    }
    planJourney();
  }

  function planJourney() {
    els.error.hidden = true;
    const start=normalizedStation(els.from.value), end=normalizedStation(els.to.value);
    if (!start || !end) return showError("Choose two visible stations connected by active railway.");
    if (start === end) return showError("Choose two different stations.");
    const journey=shortestPath(start,end);
    if (!journey) return showError(`No active lightning rail route connects ${start} and ${end}.`);
    currentJourney={...journey,start,end};
    renderAltNote(start,end);
    // Keep the address bar shareable: opening this link plans the same journey.
    try { history.replaceState(null,"","#"+new URLSearchParams({from:start,to:end})); } catch {}
    renderJourney(); renderMap(); fitRoute();
    // The train departs only when the route itself changes, not on every settings tweak.
    $("trainButton").disabled=false;
    const trainKey=journey.path.join("|");
    if (trainKey !== lastTrainKey) { lastTrainKey=trainKey; if (!reducedMotion.matches) startTrain(); }
  }
  // Tells the user what the other route preference would change; clicking the note switches to it.
  function renderAltNote(start,end) {
    const note=$("altNote"), shortestNow=settings.routeMode === "shortest";
    const other=shortestPath(start,end,shortestNow ? "fastest" : "shortest");
    const miles=other ? Math.abs(other.distance-currentJourney.distance) : 0, hours=other ? Math.abs(other.hours-currentJourney.hours) : 0;
    note.hidden=!(miles > 1e-9 || hours > 1e-9);
    if (note.hidden) return;
    note.textContent=shortestNow
      ? `Fastest route is ${formatDuration(hours)} quicker but ${miles.toLocaleString()} mi longer · switch`
      : `Shortest route saves ${miles.toLocaleString()} mi but takes ${formatDuration(hours)} longer · switch`;
  }

  // ---------------------------------------------------------------------
  // Cosmetic train: runs once along each newly planned route (replay with the ▶ map button).
  // Each car sits on two points of the path, so the consist bends with the track.
  // ---------------------------------------------------------------------
  const TRAIN={cars:4,len:9,wid:3.6,gap:1.3,trail:8,corner:9,dwell:.7,loopPause:.6};
  const trainLayer=$("trainLayer");
  const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  let trainRun=null, lastTrainKey="";

  // Route as drawn on the map (same bends as the rails), with rounded corners, resampled at even steps.
  function trainPath(journey,stopAtStations) {
    const rails=getRails(), raw=[], stops=[0]; let length=0;
    for (const segment of journey.segments) {
      const rail=rails.find(connection => edgeKey(connection[0],connection[1]) === edgeKey(segment.from,segment.to));
      if (!rail) return null;
      const points=trackPoints(rail[0],rail[1]).map(point => [point.x,point.y]);
      if (rail[0] !== segment.from) points.reverse();
      points.forEach(point => {
        const last=raw[raw.length-1], gap=last ? Math.hypot(last[0]-point[0],last[1]-point[1]) : 1;
        if (gap > .01) { if (last) length+=gap; raw.push(point); }
      });
      stops.push(length);
    }
    if (raw.length < 2) return null;
    const round=[raw[0]];
    for (let i=1; i<raw.length-1; i++) {
      const a=raw[i-1], b=raw[i], c=raw[i+1], la=Math.hypot(a[0]-b[0],a[1]-b[1]), lc=Math.hypot(c[0]-b[0],c[1]-b[1]), d=Math.min(TRAIN.corner,la/2,lc/2);
      const p=[b[0]+(a[0]-b[0])/la*d,b[1]+(a[1]-b[1])/la*d], q=[b[0]+(c[0]-b[0])/lc*d,b[1]+(c[1]-b[1])/lc*d];
      for (let k=0; k<=8; k++) { const t=k/8, u=1-t; round.push([u*u*p[0]+2*u*t*b[0]+t*t*q[0],u*u*p[1]+2*u*t*b[1]+t*t*q[1]]); }
    }
    round.push(raw[raw.length-1]);
    const cum=[0]; for (let i=1; i<round.length; i++) cum.push(cum[i-1]+Math.hypot(round[i][0]-round[i-1][0],round[i][1]-round[i-1][1]));
    const len=cum[cum.length-1], n=Math.max(2,Math.round(len/1.5)+1), step=len/(n-1), xs=new Float32Array(n), ys=new Float32Array(n);
    for (let i=0, j=0; i<n; i++) {
      const s=Math.min(len,i*step); while (j < round.length-2 && cum[j+1] < s) j++;
      const span=cum[j+1]-cum[j], f=span > 0 ? Math.min(1,Math.max(0,(s-cum[j])/span)) : 0;
      xs[i]=round[j][0]+(round[j+1][0]-round[j][0])*f; ys[i]=round[j][1]+(round[j+1][1]-round[j][1])*f;
    }
    const at=s => { const q=Math.min(len,Math.max(0,s))/step, i=Math.min(Math.floor(q),n-2), f=q-i; return [xs[i]+(xs[i+1]-xs[i])*f,ys[i]+(ys[i+1]-ys[i])*f]; };
    // Time → distance table: the train eases out of the first station and brakes at the end.
    // With stopAtStations it also brakes into every intermediate station and stands there for TRAIN.dwell seconds.
    const scale=len/(length || 1), marks=stops.map(stop => stop*scale), size=Math.ceil(len)+1, table=new Float32Array(size);
    const halts=stopAtStations ? marks.slice(1,-1) : [], ends=[marks[0],marks[marks.length-1]];
    const pace=new Float32Array(size); let moving=0;
    for (let i=0; i<size; i++) {
      let p=1;
      ends.forEach(mark => { const d=(i-mark)/16; p=Math.min(p,1-.92*Math.exp(-d*d)); });
      halts.forEach(mark => { const d=(i-mark)/13; p=Math.min(p,1-.94*Math.exp(-d*d)); });
      pace[i]=p; moving+=1/p;
    }
    const travel=Math.min(9,Math.max(4.5,3.5+len/130)), duration=travel+halts.length*TRAIN.dwell;
    const dwellUnits=moving*TRAIN.dwell/travel, dwellAt=new Set(halts.map(mark => Math.min(size-2,Math.round(mark))));
    let total=0;
    for (let i=0; i<size; i++) { table[i]=total; total+=1/pace[i]; if (dwellAt.has(i)) total+=dwellUnits; }
    const distanceAt=progress => {
      if (progress >= 1) return len;
      const target=progress*total; let lo=0, hi=size-1;
      while (hi-lo > 1) { const mid=lo+hi>>1; if (table[mid] <= target) lo=mid; else hi=mid; }
      return Math.min(len,lo+(target-table[lo])/((table[hi]-table[lo]) || 1));
    };
    return {len,at,distanceAt,duration};
  }
  function buildTrainNodes() {
    const {cars,len,wid,trail}=TRAIN, nodes={trail:[],cars:[]};
    for (let i=0; i<trail; i++) { const line=svgElement("line",{class:"train-trail"}); nodes.trail.push(line); trainLayer.append(line); }
    for (let k=cars-1; k>=0; k--) {
      const car=svgElement("g",{class:"train-car"});
      car.append(svgElement("ellipse",{class:"train-glow",rx:len*.66,ry:wid*1.15}));
      car.append(k === 0
        ? svgElement("path",{class:"train-body",d:`M${-len/2},${-wid/2}L${len/2-wid*.7},${-wid/2}Q${len/2+wid*.25},0 ${len/2-wid*.7},${wid/2}L${-len/2},${wid/2}Z`})
        : svgElement("rect",{class:"train-body",x:-len/2,y:-wid/2,width:len,height:wid,rx:wid*.3}));
      car.append(svgElement("line",{class:"train-stripe",x1:-len*.34,y1:0,x2:len*(k === 0 ? .2 : .34),y2:0}));
      nodes.cars[k]=car; trainLayer.append(car);
    }
    // The bound elemental: a ring of lightning ahead of the crew car.
    nodes.ring=svgElement("g",{class:"train-ring"});
    nodes.ring.append(svgElement("circle",{r:wid*2.6,fill:"url(#trainAura)"}),svgElement("ellipse",{class:"train-ring-soft",rx:wid*.3,ry:wid*1.08}),svgElement("ellipse",{class:"train-ring-core",rx:wid*.3,ry:wid*1.08}));
    nodes.bolt=svgElement("polyline",{class:"train-bolt",fill:"none"}); nodes.ring.append(nodes.bolt);
    trainLayer.append(nodes.ring);
    return nodes;
  }
  function stopTrain() { trainRun=null; trainLayer.replaceChildren(); trainLayer.removeAttribute("opacity"); }
  function startTrain() {
    stopTrain();
    const path=currentJourney && trainPath(currentJourney,settings.trainStops);
    if (!path) return;
    // Drawn larger when the whole map is in view, so the train stays readable at any zoom.
    const zoom=Math.min(2.8,Math.max(1.2,3.4/view.scale));
    const run=trainRun={path,nodes:buildTrainNodes(),start:null,duration:path.duration,last:0,lastT:0,frame:0};
    const {cars,trail}=TRAIN, len=TRAIN.len*zoom, wid=TRAIN.wid*zoom, gap=TRAIN.gap*zoom, deg=180/Math.PI;
    const tick=now => {
      if (trainRun !== run) return;
      if (run.start === null) run.start=now;
      const t=(now-run.start)/1000, s=path.distanceAt(Math.min(1,t/run.duration));
      const fade=Math.min(1,t/.45)*(t > run.duration+.8 ? 1-(t-run.duration-.8)/.7 : 1);
      if (t > run.duration && fade <= 0) {
        if (!settings.trainLoop) return stopTrain();
        // Looping: after a short pause off-screen the train departs again from the first station.
        if (t > run.duration+1.5+TRAIN.loopPause) { run.start=now; run.last=0; run.lastT=0; }
        trainLayer.setAttribute("opacity","0"); return requestAnimationFrame(tick);
      }
      trainLayer.setAttribute("opacity",fade.toFixed(3));
      const dt=Math.max(.001,t-run.lastT), speed=Math.min(1.3,Math.max(0,(s-run.last)/dt/(path.len/run.duration))); run.last=s; run.lastT=t; run.frame++;
      run.nodes.cars.forEach((car,k) => {
        const front=s-k*(len+gap), rear=front-len;
        if (rear < 0) return car.setAttribute("display","none");
        const a=path.at(front), b=path.at(rear);
        car.removeAttribute("display");
        car.setAttribute("transform",`translate(${((a[0]+b[0])/2).toFixed(2)} ${((a[1]+b[1])/2).toFixed(2)}) rotate(${(Math.atan2(a[1]-b[1],a[0]-b[0])*deg).toFixed(1)}) scale(${zoom.toFixed(2)})`);
      });
      const back=s-cars*(len+gap)+gap, tail=30*zoom*(.3+.7*Math.min(1,speed));
      run.nodes.trail.forEach((line,i) => {
        const from=back-tail*i/trail, to=back-tail*(i+1)/trail, f=1-i/trail;
        if (to < 0) return line.setAttribute("display","none");
        const a=path.at(from), b=path.at(to);
        line.removeAttribute("display");
        line.setAttribute("x1",a[0].toFixed(2)); line.setAttribute("y1",a[1].toFixed(2)); line.setAttribute("x2",b[0].toFixed(2)); line.setAttribute("y2",b[1].toFixed(2));
        line.setAttribute("stroke-width",(wid*(.25+.5*f)).toFixed(2)); line.setAttribute("opacity",(.5*f*f*Math.min(1,speed+.15)).toFixed(3));
      });
      const head=path.at(s+.6*zoom), behind=path.at(s-1.2*zoom);
      run.nodes.ring.setAttribute("transform",`translate(${head[0].toFixed(2)} ${head[1].toFixed(2)}) rotate(${(Math.atan2(head[1]-behind[1],head[0]-behind[0])*deg).toFixed(1)}) scale(${zoom.toFixed(2)})`);
      run.nodes.ring.setAttribute("opacity",(.72+.28*Math.sin(t*31)*Math.sin(t*17.3)).toFixed(3));
      if (run.frame%3 === 0) {   // a short crackle of lightning off the ring
        const angle=Math.random()*Math.PI*2; const w=TRAIN.wid; let x=Math.cos(angle)*w*.3, y=Math.sin(angle)*w*1.05; const points=[x.toFixed(2)+","+y.toFixed(2)];
        for (let j=0; j<3; j++) { x+=(Math.random()-.65)*w*.9; y+=(Math.random()-.5)*w*.9; points.push(x.toFixed(2)+","+y.toFixed(2)); }
        run.nodes.bolt.setAttribute("points",points.join(" "));
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function showError(message) {
    currentJourney=null; stopTrain(); lastTrainKey=""; $("trainButton").disabled=true; $("altNote").hidden=true; els.error.textContent=message; els.error.hidden=false;
    $("summaryFrom").textContent=els.from.value || "Choose station"; $("summaryTo").textContent=els.to.value || "Choose station";
    ["distanceValue","timeValue","stopsValue"].forEach(id=>$(id).textContent="–");
    els.routeList.replaceChildren(); els.fareList.replaceChildren(); renderMap();
  }

  function renderJourney() {
    const journey=currentJourney;
    const stops=Math.max(0,journey.path.length-2);
    $("summaryFrom").textContent=journey.start; $("summaryTo").textContent=journey.end;
    $("distanceValue").textContent=journey.distance.toLocaleString(); $("timeValue").textContent=formatDuration(journey.hours);
    $("stopsValue").textContent=stops; $("timeNote").textContent=settings.layover ? `with ${settings.layover}h layovers` : "no scheduled layovers";
    els.routeList.replaceChildren(...journey.path.map((station,index) => {
      const item=document.createElement("li");
      const descriptor=index===0 ? "Departure" : index===journey.path.length-1 ? "Arrival" : `Stop ${index}`;
      const segment=journey.segments[index];
      item.innerHTML=`<span class="route-dot"></span><div><strong>${escapeHtml(station)}</strong><small>${descriptor}</small></div><span class="route-distance">${segment ? `${segment.distance.toLocaleString()} mi` : ""}</span>`;
      return item;
    }));
    renderFares();
  }

  function renderFares() {
    if (!currentJourney) return els.fareList.replaceChildren();
    const fares=visibleFares();
    els.fareList.replaceChildren(...fares.map(fare => {
      const item=document.createElement("article"); item.className=`fare-item${fare.source === "custom" ? " custom" : ""}`;
      const basis=fare.basis === "mile" ? `${fare.price} gp per mile` : fare.basis === "hour" ? `${fare.price} gp per hour` : `${fare.price} gp per day`;
      item.innerHTML=`<div class="fare-name"><strong>${escapeHtml(fare.tier)}</strong><span>${escapeHtml(fare.sourceName)} · ${basis}</span></div><div class="money"><b>${formatMoney(ticketPrice(fare))}</b><small>estimated fare</small></div>`;
      return item;
    }));
    if (!fares.length) {
      const empty=document.createElement("p"); empty.className="empty-fares"; empty.textContent="No custom fares have been added yet."; els.fareList.append(empty);
    }
  }

  // One ticket, rounded to whole copper.
  function ticketPrice(fare) { return Math.round(calculateFare(fare,currentJourney)*100)/100; }
  function visibleFares() {
    const filter=els.fareFilter.value;
    return [...BASE_FARES,...settings.fares.map(fare => ({...fare,source:"custom",sourceName:fare.name || "Custom fare"}))].filter(fare => filter === "all" || fare.source === filter);
  }
  function calculateFare(fare,journey) {
    const price=Number(fare.price) || 0;
    if (fare.basis === "mile") return journey.distance*price;
    if (fare.basis === "hour") return journey.hours*price;
    return journey.hours/24*price;
  }
  function formatDuration(hours) {
    const total=Math.round(hours*60), days=Math.floor(total/1440), remaining=total%1440, hrs=Math.floor(remaining/60), mins=remaining%60;
    return days ? `${days}d ${hrs}h ${mins}m` : hrs ? `${hrs}h ${mins}m` : `${mins}m`;
  }
  function formatMoney(gold) {
    const copper=Math.max(0,Math.round((Number(gold) || 0)*100));
    const gp=Math.floor(copper/100), sp=Math.floor((copper%100)/10), cp=copper%10, parts=[];
    if (gp) parts.push(`${gp.toLocaleString()} gp`); if (sp) parts.push(`${sp} sp`); if (cp || !parts.length) parts.push(`${cp} cp`);
    return parts.join(" ");
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"]/g,char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char])); }

  function updateTransform(animate=true) {
    els.stage.classList.toggle("atlas-detail",view.scale >= 2.8);
    els.viewport.style.transition=animate ? "transform .28s ease" : "none";
    els.viewport.setAttribute("transform",`translate(${view.x} ${view.y}) scale(${view.scale})`);
  }
  function clampView() {
    const pad=80;
    view.x=Math.min(pad,Math.max(1200-1200*view.scale-pad,view.x));
    view.y=Math.min(pad,Math.max(760-760*view.scale-pad,view.y));
  }
  function zoomAt(factor,cx=600,cy=380,animate=true) {
    const next=Math.min(8,Math.max(1,view.scale*factor));
    const ratio=next/view.scale;
    view.x=cx-(cx-view.x)*ratio; view.y=cy-(cy-view.y)*ratio; view.scale=next;
    clampView(); updateTransform(animate);
  }
  function fitRoute() {
    if (!currentJourney) { view={scale:1,x:0,y:0}; return updateTransform(); }
    const points=currentJourney.path.map(name => getStation(name));
    const xs=points.map(p=>p.x), ys=points.map(p=>p.y);
    const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
    const width=Math.max(260,maxX-minX+190), height=Math.max(210,maxY-minY+160);
    const scale=Math.min(3.5,Math.max(1,Math.min(1060/width,650/height)));
    view={scale,x:600-((minX+maxX)/2)*scale,y:380-((minY+maxY)/2)*scale}; clampView(); updateTransform();
  }
  function pointerToMap(event) {
    const point=els.svg.createSVGPoint();
    point.x=event.clientX; point.y=event.clientY;
    return point.matrixTransform(els.svg.getScreenCTM().inverse());
  }
  function pointerToWorld(event) {
    const point=els.svg.createSVGPoint();
    point.x=event.clientX; point.y=event.clientY;
    return point.matrixTransform(els.viewport.getScreenCTM().inverse());
  }

  function closeMapMenu(restoreFocus=false) {
    const menu=$("mapContextMenu");
    menu.hidden=true;
    if (restoreFocus) els.svg.focus();
  }
  function openMapMenu(event) {
    event.preventDefault(); hideTooltip();
    const point=pointerToWorld(event), menu=$("mapContextMenu");
    const matrix=els.viewport.getScreenCTM();
    const tolerance=14/Math.hypot(matrix.a,matrix.b);
    const town=getStationNames().find(name => Math.hypot(getStation(name).x-point.x,getStation(name).y-point.y) <= tolerance);
    let nearest=null, best=tolerance;
    if (!town) getRails().forEach(connection => {
      const points=trackPoints(connection[0],connection[1]);
      points.slice(1).forEach((b,i)=>{
      const a=points[i];
      const dx=b.x-a.x, dy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy || 1)));
      const distance=Math.hypot(point.x-a.x-t*dx,point.y-a.y-t*dy);
      if (distance<best) { best=distance; nearest=connection; }
      });
    });
    menu.replaceChildren();
    const title=document.createElement("strong");
    title.textContent=town || (nearest ? nearest[0]+" ↔ "+nearest[1] : "Map actions");
    menu.append(title);
    const action=(label,run,danger=false) => {
      const button=document.createElement("button");
      button.type="button"; button.role="menuitem"; button.textContent=label;
      if (danger) button.className="danger";
      button.addEventListener("click",()=>{ closeMapMenu(); run(); });
      menu.append(button);
    };
    if (town) {
      if (!BASE_STATIONS[town]) {
        action("Edit / move town",()=>editCustomTown(town));
        action("Remove custom town…",()=>removeCustomTown(town),true);
      }
      action("Directions from here",()=>{ closeNetworkEditor(); els.from.value=town; setActiveField("to"); planJourney(); });
      action("Directions to here",()=>{ closeNetworkEditor(); els.to.value=town; setActiveField("from"); planJourney(); });
      action("Connect from this town",()=>{ openNetworkEditor(); els.networkFrom.value=town; els.networkTo.value=""; els.networkDistance.value=""; setNetworkActiveField("to"); els.networkTo.focus(); });
    } else if (nearest) {
      const edit=()=>{ openNetworkEditor(); selectNetworkConnection(nearest[0],nearest[1]); };
      action("Edit connection",()=>{ edit(); els.networkDistance.focus(); els.networkDistance.select(); });
      action("Remove connection…",()=>{
        if (window.confirm("Remove the connection between "+nearest[0]+" and "+nearest[1]+"?")) { edit(); removeSelectedNetworkRoute(); }
      },true);
    } else {
      action("Place town here",()=>{
        openNetworkEditor(); setNetworkPanel("towns"); resetTownEditor(); startTownPlacement(); selectTownPosition(event); els.townName.focus();
      });
    }
    menu.hidden=false;
    menu.style.left=Math.max(8,Math.min(event.clientX,window.innerWidth-menu.offsetWidth-8))+"px";
    menu.style.top=Math.max(8,Math.min(event.clientY,window.innerHeight-menu.offsetHeight-8))+"px";
    menu.querySelector("button").focus();
  }

  function showStationTooltip(name,event) {
    const station=getStation(name), region=station?.region ? ` · ${station.region}` : "";
    els.tooltip.textContent=networkEditing && networkPanel === "towns" ? `${name}${region}` : `${name}${region} · click to set ${networkEditing ? `route ${networkActiveField}` : activeField}`;
    els.tooltip.hidden=false; positionTooltip(event);
  }
  function positionTooltip(event) { els.tooltip.style.left=`${event.clientX}px`; els.tooltip.style.top=`${event.clientY}px`; }
  function hideTooltip() { els.tooltip.hidden=true; }
  function toast(message) { els.toast.textContent=message; els.toast.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>els.toast.classList.remove("show"),Math.max(1800,message.length*55)); }

  function persistSettings() {
    if (!storageSet(STORAGE_KEY,JSON.stringify(settings))) toast("Browser storage is unavailable: changes will be lost on reload. Use Export backup.");
  }
  function setNetworkActiveField(field) {
    networkActiveField=field;
    els.networkFromLabel.classList.toggle("active",field === "from");
    els.networkToLabel.classList.toggle("active",field === "to");
    updateNetworkActions(); renderMap();
  }
  function setNetworkPanel(panel) {
    networkPanel=panel;
    const connections=panel === "connections";
    els.connectionsTab.classList.toggle("active",connections); els.connectionsTab.setAttribute("aria-selected",String(connections));
    els.townsTab.classList.toggle("active",!connections); els.townsTab.setAttribute("aria-selected",String(!connections));
    els.connectionTools.hidden=!connections; els.townTools.hidden=connections;
    els.stage.classList.toggle("editing-network",connections && networkEditing);
    if (connections) cancelTownPlacement();
    renderMap();
  }
  function openNetworkEditor() {
    networkEditing=true; els.networkEditor.hidden=false; els.networkButton.setAttribute("aria-expanded","true");
    els.hint.hidden=true; els.error.hidden=true; setNetworkPanel("connections"); setNetworkActiveField("from"); renderCustomRoutes(); renderRemovedRoutes(); renderCustomTowns();
  }
  function closeNetworkEditor() {
    networkEditing=false; els.networkEditor.hidden=true; els.networkButton.setAttribute("aria-expanded","false");
    cancelTownPlacement(); els.stage.classList.remove("editing-network","editing-towns"); els.hint.hidden=false; els.networkError.hidden=true; els.townError.hidden=true; renderMap();
  }
  function selectNetworkConnection(from,to) {
    els.networkFrom.value=from; els.networkTo.value=to;
    const connection=getRails().find(item => edgeKey(item[0],item[1]) === edgeKey(from,to));
    els.networkDistance.value=connection ? connection[2] : "";
    els.networkError.hidden=true; updateNetworkActions(); renderMap();
  }
  function updateNetworkActions() {
    const from=els.networkFrom.value,to=els.networkTo.value;
    const exists=from && to && getRails().some(connection => edgeKey(connection[0],connection[1]) === edgeKey(from,to));
    els.removeNetworkRoute.disabled=!exists;
  }
  function addNetworkRoute() {
    const from=els.networkFrom.value, to=els.networkTo.value, miles=Number(els.networkDistance.value);
    if (!from || !to) return showNetworkError("Choose both stations.");
    if (from === to) return showNetworkError("A connection needs two different stations.");
    if (!(miles > 0) || !Number.isFinite(miles)) return showNetworkError("Enter a finite distance greater than zero.");
    const key=edgeKey(from,to);
    settings.connections=settings.connections.filter(connection => edgeKey(connection[0],connection[1]) !== key);
    settings.disabledConnections=settings.disabledConnections.filter(disabledKey => disabledKey !== key);
    settings.connections.push([from,to,miles]); persistSettings();
    els.networkDistance.value=miles; els.networkError.hidden=true; renderCustomRoutes(); renderRemovedRoutes(); updateNetworkActions(); planJourney(); renderMap(); toast("Custom connection saved");
  }
  function showNetworkError(message) { els.networkError.textContent=message; els.networkError.hidden=false; }
  function removeNetworkRoute(index) {
    settings.connections.splice(index,1); persistSettings(); renderCustomRoutes(); renderRemovedRoutes(); updateNetworkActions(); planJourney(); renderMap(); toast("Custom connection removed");
  }
  function removeSelectedNetworkRoute() {
    const from=els.networkFrom.value,to=els.networkTo.value;
    if (!from || !to) return;
    const key=edgeKey(from,to);
    settings.connections=settings.connections.filter(connection => edgeKey(connection[0],connection[1]) !== key);
    if (isBuiltInEdge(key) && !settings.disabledConnections.includes(key)) settings.disabledConnections.push(key);
    persistSettings(); els.networkDistance.value=""; renderCustomRoutes(); renderRemovedRoutes(); updateNetworkActions(); planJourney(); renderMap(); toast("Connection removed from the network");
  }
  function restoreBuiltInRoute(key) {
    settings.disabledConnections=settings.disabledConnections.filter(disabledKey => disabledKey !== key); persistSettings();
    renderRemovedRoutes(); updateNetworkActions(); planJourney(); renderMap(); toast("Built-in connection restored");
  }
  function renderCustomRoutes() {
    els.customRouteCount.textContent=settings.connections.length;
    els.customRouteList.replaceChildren(...settings.connections.map((connection,index) => {
      const [from,to,miles]=connection, item=document.createElement("div"); item.className="custom-route-item";
      item.innerHTML=`<strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong><span>${Number(miles).toLocaleString()} mi</span><button type="button" aria-label="Remove ${escapeHtml(from)} to ${escapeHtml(to)}">×</button>`;
      const edit=document.createElement("button"); edit.type="button"; edit.textContent="Edit"; edit.setAttribute("aria-label","Edit "+from+" to "+to);
      edit.addEventListener("click",()=>{ enableCustom(); setNetworkPanel("connections"); selectNetworkConnection(from,to); els.networkDistance.focus(); });
      item.insertBefore(edit,item.querySelector("button"));
      item.querySelector("button:last-child").addEventListener("click",()=>removeNetworkRoute(index));
      const source=document.createElement("small"); source.textContent=window.RAIL_ATLAS.routes.some(r=>edgeKey(r[0],r[1])===edgeKey(from,to)) ? "Reference map / unverified · editable miles" : "Custom connection";
      item.querySelector("strong").append(source); return item;
    }));
    if (!settings.connections.length) {
      const empty=document.createElement("p"); empty.className="custom-route-empty"; empty.textContent="No custom connections yet."; els.customRouteList.append(empty);
    }
  }
  // Reference-map railways that were seeded once and have since been deleted; both towns must still exist.
  function removedReferenceRoutes() {
    const present=new Set(settings.connections.map(connection => edgeKey(connection[0],connection[1])));
    return [...FIXED_LINKS,...window.RAIL_ATLAS.routes.map(([a,b,h])=>[a,b,h*30])]
      .filter(([a,b]) => !present.has(edgeKey(a,b)) && !isBuiltInEdge(edgeKey(a,b)) && getStation(a) && getStation(b));
  }
  function restoreReferenceRoute(connection) {
    const key=edgeKey(connection[0],connection[1]);
    if (!settings.connections.some(item => edgeKey(item[0],item[1]) === key)) settings.connections.push([...connection]);
    persistSettings(); renderCustomRoutes(); renderRemovedRoutes(); updateNetworkActions(); planJourney(); renderMap(); toast("Reference-map connection restored");
  }
  function renderRemovedRoutes() {
    const reference=removedReferenceRoutes();
    const row=(from,to,note,restore) => {
      const item=document.createElement("div"); item.className="custom-route-item removed";
      item.innerHTML=`<strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong><span>${note}</span><button type="button" aria-label="Restore ${escapeHtml(from)} to ${escapeHtml(to)}">Restore</button>`;
      item.querySelector("button").addEventListener("click",restore); return item;
    };
    els.removedRouteCount.textContent=settings.disabledConnections.length+reference.length;
    els.removedRouteList.replaceChildren(
      ...settings.disabledConnections.map(key => { const [from,to]=key.split("|"); return row(from,to,"built-in",()=>restoreBuiltInRoute(key)); }),
      ...reference.map(connection => row(connection[0],connection[1],`reference map · ${connection[2].toLocaleString()} mi`,()=>restoreReferenceRoute(connection)))
    );
    if (!settings.disabledConnections.length && !reference.length) {
      const empty=document.createElement("p"); empty.className="custom-route-empty"; empty.textContent="No connections removed."; els.removedRouteList.append(empty);
    }
  }
  function startTownPlacement() {
    draftTownPoint=null; els.saveTownButton.disabled=true;
    townPlacementArmed=true; els.stage.classList.add("editing-towns"); els.placeTownButton.classList.add("active");
    els.placeTownButton.textContent="Click the map"; els.townError.hidden=true;
    els.townPlacementStatus.classList.remove("ready"); els.townPlacementStatus.querySelector("span").textContent="Click an empty position on the map";
  }
  function cancelTownPlacement() {
    townPlacementArmed=false; els.stage.classList.remove("editing-towns"); els.placeTownButton.classList.remove("active"); els.placeTownButton.textContent="Place on map";
  }
  function selectTownPosition(event) {
    if (!networkEditing || networkPanel !== "towns" || !townPlacementArmed || suppressMapClick) return;
    const point=pointerToWorld(event);
    if (point.x<0 || point.x>1200 || point.y<0 || point.y>760) return showTownError("Choose a position inside the map.");
    draftTownPoint=point; cancelTownPlacement();
    els.townPlacementStatus.classList.add("ready");
    els.townPlacementStatus.querySelector("span").textContent=`Position selected · ${Math.round(draftTownPoint.x)}, ${Math.round(draftTownPoint.y)}`;
    els.saveTownButton.disabled=false; els.townError.hidden=true; renderMap();
  }
  function addCustomTown() {
    const name=els.townName.value.trim(), region=els.townRegion.value.trim();
    if (!name) return showTownError("Enter a town name.");
    if (name.includes("|") || name in Object.prototype) return showTownError("Please use a different town name without the | character.");
    if (getStationNames(true).some(existing => existing !== editingTown && existing.toLocaleLowerCase() === name.toLocaleLowerCase())) return showTownError("A station with this name already exists.");
    if (!draftTownPoint) return showTownError("Place the town on the map first.");
    if (editingTown) {
      const old=editingTown, station=settings.customStations.find(s=>s.name===old);
      Object.assign(station,{name,region,x:draftTownPoint.x,y:draftTownPoint.y});
      settings.connections=settings.connections.map(([a,b,d])=>[a===old ? name : a,b===old ? name : b,d]);
      [els.from,els.to].forEach(input=>{ if(input.value===old) input.value=name; });
    } else settings.customStations.push({name,region,x:draftTownPoint.x,y:draftTownPoint.y,origin:"Your town"});
    settings.showCustom=true; $("showCustom").checked=true;
    editingTown=null; $("cancelTownEdit").hidden=true; persistSettings();
    draftTownPoint=null; els.townName.value=""; els.townRegion.value=""; els.saveTownButton.disabled=true;
    els.townPlacementStatus.classList.remove("ready"); els.townPlacementStatus.querySelector("span").textContent="No map position selected";
    refreshStationOptions(); renderCustomTowns(); renderCustomRoutes(); renderRemovedRoutes(); planJourney(); toast(`${name} saved`);
  }
  function showTownError(message) { els.townError.textContent=message; els.townError.hidden=false; }
  function renderCustomTowns() {
    els.customTownCount.textContent=settings.customStations.length;
    els.customTownList.replaceChildren(...settings.customStations.map(station => {
      const item=document.createElement("div"); item.className="custom-route-item";
      item.innerHTML=`<strong>${escapeHtml(station.name)}<span>${escapeHtml(station.region)}</span><small>${escapeHtml(station.origin || "Your town")}</small></strong><button type="button">Edit</button><button type="button" aria-label="Remove ${escapeHtml(station.name)}">×</button>`;
      item.querySelector("button").addEventListener("click",()=>editCustomTown(station.name));
      item.querySelector("button:last-child").addEventListener("click",()=>removeCustomTown(station.name));
      return item;
    }));
    if (!settings.customStations.length) {
      const empty=document.createElement("p"); empty.className="custom-route-empty"; empty.textContent="No custom towns yet."; els.customTownList.append(empty);
    }
  }
  function enableCustom() { settings.showCustom=true; $("showCustom").checked=true; persistSettings(); refreshStationOptions(); }
  function editCustomTown(name) {
    enableCustom(); openNetworkEditor(); setNetworkPanel("towns");
    const station=settings.customStations.find(s=>s.name===name);
    editingTown=name; draftTownPoint={x:station.x,y:station.y};
    els.townName.value=name; els.townRegion.value=station.region || "";
    els.saveTownButton.disabled=false; $("cancelTownEdit").hidden=false;
    els.townPlacementStatus.querySelector("span").textContent="Editing "+name+" · Place on map to move";
    els.townPlacementStatus.classList.add("ready");
    view={scale:4,x:600-station.x*4,y:380-station.y*4}; clampView(); updateTransform(); renderMap(); els.townName.focus();
  }
  function resetTownEditor() {
    editingTown=null; draftTownPoint=null; cancelTownPlacement();
    els.townName.value=""; els.townRegion.value=""; els.saveTownButton.disabled=true; $("cancelTownEdit").hidden=true;
    els.townPlacementStatus.querySelector("span").textContent="No map position selected"; els.townPlacementStatus.classList.remove("ready"); renderMap();
  }
  function removeCustomTown(name) {
    const count=settings.connections.filter(c=>c[0]===name || c[1]===name).length;
    if (!window.confirm("Remove "+name+" and its "+count+" custom connections? Export a backup first if you want to restore them later.")) return;
    settings.customStations=settings.customStations.filter(s=>s.name!==name);
    settings.connections=settings.connections.filter(c=>c[0]!==name && c[1]!==name);
    if (editingTown===name) resetTownEditor();
    persistSettings(); refreshStationOptions(); renderCustomTowns(); renderCustomRoutes(); renderRemovedRoutes(); updateNetworkActions(); planJourney(); toast("Town and connections removed");
  }
  function refreshStationOptions() {
    const fromValue=els.networkFrom.value, toValue=els.networkTo.value;
    const stationOptions=getStationNames().map(name=>Object.assign(document.createElement("option"),{value:name,textContent:name}));
    els.stations.replaceChildren(...stationOptions.map(option=>option.cloneNode(true)));
    els.networkFrom.replaceChildren(Object.assign(document.createElement("option"),{value:"",textContent:"Choose station"}),...stationOptions.map(option=>option.cloneNode(true)));
    els.networkTo.replaceChildren(Object.assign(document.createElement("option"),{value:"",textContent:"Choose station"}),...stationOptions.map(option=>option.cloneNode(true)));
    els.networkFrom.value=getStation(fromValue) ? fromValue : ""; els.networkTo.value=getStation(toValue) ? toValue : "";
  }

  function addFareRow(fare={name:"",tier:"",price:"",basis:"mile"}) {
    const row=$("fareTemplate").content.firstElementChild.cloneNode(true);
    ["name","tier","price","basis"].forEach(field => row.querySelector(`[data-field="${field}"]`).value=fare[field] ?? "");
    row.querySelector(".remove-button").addEventListener("click",()=>row.remove()); els.fareRows.append(row);
  }
  function openSettings() {
    els.speed.value=settings.speed; els.layover.value=settings.layover;
    $("trainLoopInput").checked=settings.trainLoop; $("trainStopsInput").checked=settings.trainStops;
    els.fareRows.replaceChildren(); settings.fares.forEach(addFareRow); $("settingsError").hidden=true; els.dialog.showModal();
  }
  function saveSettings() {
    const fares=[];
    for (const row of els.fareRows.children) {
      const field=name => row.querySelector(`[data-field="${name}"]`);
      const name=field("name").value.trim(), tier=field("tier").value.trim(), priceText=field("price").value.trim(), price=Number(priceText);
      if (!name && !tier && !priceText) continue; // untouched row
      // Incomplete rows are reported instead of being dropped silently.
      const missing=!name ? "name" : !tier ? "tier" : !priceText || !Number.isFinite(price) || price < 0 ? "price" : null;
      if (missing) {
        $("settingsError").textContent=missing === "price" ? "Every custom fare needs a price of zero or more." : `Every custom fare needs a ${missing === "tier" ? "class" : "name"}. Fill it in or remove the row.`;
        $("settingsError").hidden=false; field(missing).focus(); return;
      }
      fares.push({name,tier,price,basis:field("basis").value});
    }
    $("settingsError").hidden=true;
    const trainLoop=$("trainLoopInput").checked, trainStops=$("trainStopsInput").checked, trainChanged=trainLoop !== settings.trainLoop || trainStops !== settings.trainStops;
    settings={...settings,speed:Math.max(1,Number(els.speed.value)||30),layover:Math.max(0,Number(els.layover.value)||0),fares,trainLoop,trainStops};
    persistSettings(); els.dialog.close(); planJourney(); toast("Journey settings saved");
    if (trainChanged && currentJourney) startTrain(); // show the new train behaviour straight away
  }

  els.fromMode.addEventListener("click",()=>setActiveField("from")); els.toMode.addEventListener("click",()=>setActiveField("to"));
  els.from.addEventListener("focus",()=>setActiveField("from")); els.to.addEventListener("focus",()=>setActiveField("to"));
  [els.from,els.to].forEach(input => input.addEventListener("change",planJourney));
  $("swapButton").addEventListener("click",()=>{ [els.from.value,els.to.value]=[els.to.value,els.from.value]; planJourney(); });
  els.fareFilter.addEventListener("change",renderFares);
  els.networkButton.addEventListener("click",()=>networkEditing ? closeNetworkEditor() : openNetworkEditor());
  $("closeNetworkButton").addEventListener("click",closeNetworkEditor);
  els.connectionsTab.addEventListener("click",()=>setNetworkPanel("connections"));
  els.townsTab.addEventListener("click",()=>setNetworkPanel("towns"));
  els.networkFromLabel.addEventListener("click",()=>setNetworkActiveField("from"));
  els.networkToLabel.addEventListener("click",()=>setNetworkActiveField("to"));
  els.networkFrom.addEventListener("change",()=>{ if (els.networkFrom.value === els.networkTo.value) els.networkTo.value=""; if (els.networkFrom.value && els.networkTo.value) selectNetworkConnection(els.networkFrom.value,els.networkTo.value); setNetworkActiveField("to"); });
  els.networkTo.addEventListener("change",()=>{ if (els.networkTo.value === els.networkFrom.value) els.networkFrom.value=""; if (els.networkFrom.value && els.networkTo.value) selectNetworkConnection(els.networkFrom.value,els.networkTo.value); setNetworkActiveField("from"); });
  $("addNetworkRoute").addEventListener("click",addNetworkRoute);
  els.removeNetworkRoute.addEventListener("click",removeSelectedNetworkRoute);
  els.placeTownButton.addEventListener("click",startTownPlacement);
  els.saveTownButton.addEventListener("click",addCustomTown);
  $("cancelTownEdit").addEventListener("click",resetTownEditor);
  $("showCustom").checked=settings.showCustom !== false;
  $("showCustom").addEventListener("change",()=>{
    settings.showCustom=$("showCustom").checked; persistSettings(); resetTownEditor(); refreshStationOptions(); updateNetworkActions(); planJourney();
  });
  $("exportNetwork").addEventListener("click",()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(settings,null,2)],{type:"application/json"}));
    const a=document.createElement("a"); a.href=url; a.download="khorvaire-network.json"; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $("importNetwork").addEventListener("click",()=>$("importFile").click());
  $("importFile").addEventListener("change",async event=>{
    const file=event.target.files[0]; event.target.value="";
    if (!file) return;
    let imported;
    try {
      const data=JSON.parse(await file.text());
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("not an object");
      imported=normalizeSettings(migrateSaved(data).saved);
    } catch { return toast("This file is not a valid network backup."); }
    const summary=`${imported.customStations.length} custom towns, ${imported.connections.length} custom connections, ${imported.disabledConnections.length} removed built-in connections, ${imported.fares.length} custom fares`;
    if (!window.confirm(`Replace your current network and settings with this backup?\n\n${summary}`)) return;
    storageSet("lightningRailSettingsBeforeImport",JSON.stringify(settings));
    settings=imported; persistSettings();
    resetTownEditor(); $("showCustom").checked=settings.showCustom !== false;
    setRouteMode(settings.routeMode); refreshStationOptions(); renderCustomRoutes(); renderRemovedRoutes(); renderCustomTowns(); updateNetworkActions(); planJourney();
    toast("Backup imported");
  });
  $("settingsButton").addEventListener("click",openSettings); $("addFare").addEventListener("click",()=>addFareRow());
  // Enter in any field saves; the close button no longer acts as the form's default button.
  els.dialog.querySelector("form").addEventListener("submit",event=>{ event.preventDefault(); saveSettings(); });
  $("closeSettings").addEventListener("click",()=>els.dialog.close());
  const setRouteMode=mode=>{
    settings.routeMode=mode === "shortest" ? "shortest" : "fastest";
    [["modeFastest","fastest"],["modeShortest","shortest"]].forEach(([id,value])=>{ $(id).classList.toggle("active",settings.routeMode === value); $(id).setAttribute("aria-pressed",String(settings.routeMode === value)); });
  };
  $("modeFastest").addEventListener("click",()=>{ setRouteMode("fastest"); persistSettings(); planJourney(); });
  $("modeShortest").addEventListener("click",()=>{ setRouteMode("shortest"); persistSettings(); planJourney(); });
  setRouteMode(settings.routeMode);
  $("resetSettings").addEventListener("click",()=>{
    if (!window.confirm("Reset rail speed, layover and custom fares to defaults?\n\nYour towns and railways are kept.")) return;
    settings={...settings,speed:DEFAULTS.speed,layover:DEFAULTS.layover,fares:[]}; persistSettings();
    els.speed.value=settings.speed; els.layover.value=settings.layover; els.fareRows.replaceChildren(); $("settingsError").hidden=true; planJourney(); toast("Journey settings reset");
  });
  $("resetNetwork").addEventListener("click",()=>{
    if (!window.confirm("Reset towns and railways to atlas defaults?\n\nYour own towns, connections and removals will be lost. Fares, speed and layover are kept.")) return;
    storageSet("lightningRailSettingsBeforeReset",JSON.stringify(settings));
    settings={...seededDefaults(),speed:settings.speed,layover:settings.layover,fares:settings.fares,routeMode:settings.routeMode,trainLoop:settings.trainLoop,trainStops:settings.trainStops}; persistSettings();
    resetTownEditor(); $("showCustom").checked=true; refreshStationOptions(); renderCustomRoutes(); renderRemovedRoutes(); renderCustomTowns(); updateNetworkActions(); planJourney(); toast("Atlas network restored");
  });
  $("copyButton").addEventListener("click",async()=>{
    if (!currentJourney) return;
    const j=currentJourney, stops=Math.max(0,j.path.length-2);
    const lines=[
      `${j.start} to ${j.end} (${settings.routeMode} route)`,
      `${j.distance.toLocaleString()} miles · ${formatDuration(j.hours)} · ${stops} ${stops === 1 ? "stop" : "stops"}`,
      "",
      ...j.segments.map(segment => `${segment.from} → ${segment.to}: ${segment.distance.toLocaleString()} mi`),
      "",
      "Fares per passenger:",
      ...visibleFares().map(fare => `${fare.tier} (${fare.sourceName}): ${formatMoney(ticketPrice(fare))}`),
      "",
      location.href
    ];
    try { await navigator.clipboard.writeText(lines.join("\n")); toast("Itinerary copied"); } catch { toast("Could not copy itinerary"); }
  });
  $("copyLinkButton").addEventListener("click",async()=>{
    try { await navigator.clipboard.writeText(location.href); toast("Link to this journey copied"); } catch { toast("Could not copy link"); }
  });
  $("altNote").addEventListener("click",()=>$(settings.routeMode === "shortest" ? "modeFastest" : "modeShortest").click());
  // A shared link (#from=…&to=…) overrides the default journey.
  const linked=new URLSearchParams(location.hash.slice(1));
  [["from",els.from],["to",els.to]].forEach(([key,input])=>{ const name=normalizedStation(linked.get(key) || ""); if (name) input.value=name; });
  $("trainButton").addEventListener("click",startTrain);
  $("zoomInButton").addEventListener("click",()=>zoomAt(1.25)); $("zoomOutButton").addEventListener("click",()=>zoomAt(.8)); $("fitButton").addEventListener("click",fitRoute);
  els.svg.addEventListener("wheel",event=>{ event.preventDefault(); const point=pointerToMap(event); zoomAt(event.deltaY<0?1.14:.88,point.x,point.y,false); },{passive:false});
  els.svg.addEventListener("pointerdown",event=>{ if (event.button !== 0 || event.target.closest(".station, .rail-hit") || (networkEditing && networkPanel === "towns" && townPlacementArmed)) return; drag={clientX:event.clientX,clientY:event.clientY,x:view.x,y:view.y,moved:false}; els.svg.setPointerCapture(event.pointerId); els.svg.classList.add("dragging"); });
  els.svg.addEventListener("pointermove",event=>{ if (!drag) return; if (Math.hypot(event.clientX-drag.clientX,event.clientY-drag.clientY)>4) drag.moved=true; const rect=els.svg.getBoundingClientRect(); view.x=drag.x+(event.clientX-drag.clientX)*1200/rect.width; view.y=drag.y+(event.clientY-drag.clientY)*760/rect.height; clampView(); updateTransform(false); });
  els.svg.addEventListener("pointerup",event=>{ if (!drag) return; suppressMapClick=drag.moved; drag=null; els.svg.releasePointerCapture(event.pointerId); els.svg.classList.remove("dragging"); setTimeout(()=>{ suppressMapClick=false; },0); });
  els.svg.addEventListener("pointercancel",()=>{ drag=null; els.svg.classList.remove("dragging"); });
  els.svg.addEventListener("click",selectTownPosition);
  els.svg.setAttribute("tabindex","0");
  // Touch devices: long-press opens the same map menu (iOS never fires contextmenu; Android may, so avoid opening twice).
  let longPress=null, lastMenuOpen=0, suppressClickUntil=0;
  const cancelLongPress=()=>{ if (longPress) { clearTimeout(longPress.timer); longPress=null; } };
  els.svg.addEventListener("pointerdown",event=>{
    if (event.pointerType !== "touch" || !event.isPrimary) return cancelLongPress();
    cancelLongPress();
    const {clientX,clientY}=event;
    longPress={clientX,clientY,timer:setTimeout(()=>{
      longPress=null;
      if (drag) { drag=null; els.svg.classList.remove("dragging"); }
      lastMenuOpen=Date.now(); suppressClickUntil=Date.now()+700;
      openMapMenu({clientX,clientY,preventDefault(){}});
    },550)};
  },true);
  els.svg.addEventListener("pointermove",event=>{ if (longPress && Math.hypot(event.clientX-longPress.clientX,event.clientY-longPress.clientY)>8) cancelLongPress(); },true);
  ["pointerup","pointercancel"].forEach(type=>els.svg.addEventListener(type,cancelLongPress,true));
  els.svg.addEventListener("click",event=>{ if (Date.now()<suppressClickUntil) { event.stopPropagation(); event.preventDefault(); } },true);
  els.svg.addEventListener("contextmenu",event=>{
    cancelLongPress();
    if (Date.now()-lastMenuOpen<700) return event.preventDefault();
    lastMenuOpen=Date.now(); openMapMenu(event);
  });
  document.addEventListener("pointerdown",event=>{ if (!event.target.closest("#mapContextMenu")) closeMapMenu(); });
  document.addEventListener("keydown",event=>{
    const menu=$("mapContextMenu");
    if (menu.hidden) return;
    if (event.key==="Escape") { event.preventDefault(); closeMapMenu(true); }
    if (event.key==="Tab") closeMapMenu();
    if (["ArrowDown","ArrowUp","Home","End"].includes(event.key)) {
      event.preventDefault();
      const buttons=[...menu.querySelectorAll("button")], index=buttons.indexOf(document.activeElement);
      const next=event.key==="Home" ? 0 : event.key==="End" ? buttons.length-1 : (index+(event.key==="ArrowDown" ? 1 : -1)+buttons.length)%buttons.length;
      buttons[next].focus();
    }
  });
  window.addEventListener("resize",()=>closeMapMenu());
  window.addEventListener("scroll",()=>closeMapMenu(),true);
  els.dialog.addEventListener("click",event=>{ if (event.target===els.dialog) els.dialog.close(); });

  refreshStationOptions(); renderCustomRoutes(); renderRemovedRoutes(); renderCustomTowns(); updateNetworkActions(); renderMap(); planJourney();
})();
