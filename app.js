(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const RAILS_4E = [
    ["Krona Peak","Irontown",104],["Irontown","Vulyar",315],["Korth","Rekkenmark",112],["Korth","Atur",195],
    ["Atur","Vedykar",148],["Vedykar","Fort Zombie",142],["Sharn","First Tower",44],["First Tower","Wroat",250],
    ["Wroat","Hatheril",478],["Hatheril","Starilaskur",223],["Hatheril","Sword Keep",106],["Wroat","Starilaskur",617],
    ["Starilaskur","Sterngate",269],["Starilaskur","Vathirond",198],["Vathirond","Aruldusk",142],["Aruldusk","Sigilstar",99],
    ["Sigilstar","Flamekeep",194],["Sword Keep","Marketplace",96],["Marketplace","Passage",255],["Passage","Fairhaven",227],
    ["Fairhaven","Thaliost",361],["Sterngate","Zolanberg",214],["Zolanberg","Korranberg",195]
  ];
  const RAILS_3E = [
    ["Krona Peak","Irontown",142],["Irontown","Vulyar",456],["Korth","Rekkenmark",141],["Korth","Atur",332],
    ["Atur","Vedykar",227],["Vedykar","Fort Zombie",239],["Sharn","First Tower",56],["First Tower","Wroat",417],
    ["Wroat","Hatheril",717],["Hatheril","Starilaskur",372],["Hatheril","Sword Keep",150],["Wroat","Starilaskur",939],
    ["Starilaskur","Sterngate",369],["Starilaskur","Vathirond",287],["Vathirond","Aruldusk",262],["Aruldusk","Sigilstar",166],
    ["Sigilstar","Flamekeep",300],["Sword Keep","Marketplace",97],["Marketplace","Passage",369],["Passage","Fairhaven",348],
    ["Fairhaven","Thaliost",617],["Sterngate","Zolanberg",386],["Zolanberg","Korranberg",300]
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
  const DEFAULTS = {source:"4e",speed:30,layover:1,fares:[],connections:[],disabledConnections:[],customStations:[]};

  const $ = id => document.getElementById(id);
  const els = {
    svg:$("railMap"),viewport:$("mapViewport"),stage:$("mapStage"),railLines:$("railLines"),stationLayer:$("stationLayer"),
    from:$("fromStation"),to:$("toStation"),fromMode:$("fromModeButton"),toMode:$("toModeButton"),hint:$("selectionHint"),
    error:$("routeError"),stations:$("stations"),routeList:$("routeList"),fareList:$("fareList"),fareFilter:$("fareFilter"),
    headerSource:$("headerDistanceSource"),dialog:$("settingsDialog"),source:$("distanceSource"),speed:$("speedInput"),
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

  function migrateAtlas(saved) {
    if (saved.atlasVersion === 1) return saved;
    const old=structuredClone(saved);
    const additions=window.RAIL_ATLAS.towns.map(([name,x,y,region])=>({name,x:x/3.2,y:y/3.2,region,origin:"Reference map / unverified"}));
    const custom=(saved.customStations || []).map(station=>{
      // Keep the old coordinates in a backup; approximate relocation follows nearby built-in stations.
      let weight=0, dx=0, dy=0;
      Object.entries(OLD_STATIONS).forEach(([name,p])=>{
        const w=1/(Math.pow(p.x-station.x,2)+Math.pow(p.y-station.y,2)+25);
        weight+=w; dx+=(BASE_STATIONS[name].x-p.x)*w; dy+=(BASE_STATIONS[name].y-p.y)*w;
      });
      return {...station,x:Math.max(0,Math.min(1200,station.x+dx/weight)),y:Math.max(0,Math.min(760,station.y+dy/weight)),origin:station.origin || "Your town · relocated"};
    });
    const names=new Set(custom.map(s=>s.name.toLowerCase()));
    saved.customStations=[...custom,...additions.filter(s=>!names.has(s.name.toLowerCase()))];
    const byName=name=>saved.customStations.find(s=>s.name.toLowerCase()===name.toLowerCase())?.name || name;
    const connections=new Map((saved.connections || []).map(c=>[edgeKey(c[0],c[1]),c]));
    const removed=new Set(saved.disabledConnections || []);
    [...FIXED_LINKS,...window.RAIL_ATLAS.routes.map(([a,b,h])=>[a,b,h*30])].forEach(([a,b,d])=>{
      a=byName(a); b=byName(b); const key=edgeKey(a,b);
      if (!connections.has(key) && !removed.has(key)) connections.set(key,[a,b,d]);
    });
    saved.connections=[...connections.values()];
    saved.atlasVersion=1; saved.showCustom=true;
    // Save once so removing an imported record does not cause it to reappear on reload.
    if (!localStorage.getItem("lightningRailSettingsBeforeAtlas")) localStorage.setItem("lightningRailSettingsBeforeAtlas",JSON.stringify(old));
    localStorage.setItem("lightningRailSettings",JSON.stringify(saved));
    return saved;
  }

  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem("lightningRailSettings"));
      const saved=migrateAtlas(raw && typeof raw === "object" ? raw : structuredClone(DEFAULTS));
      if (!saved.bridgeCorrection) {
        localStorage.setItem("lightningRailSettingsBeforeBridgeCorrection",JSON.stringify(saved));
        saved.connections=(saved.connections || []).filter(c=>edgeKey(c[0],c[1])!==edgeKey("Thaliost","Rekkenmark"));
        saved.bridgeCorrection=true;
        localStorage.setItem("lightningRailSettings",JSON.stringify(saved));
      }
      const customStations=Array.isArray(saved.customStations) ? saved.customStations.filter(station => {
        const name=String(station?.name || "").trim(), x=Number(station?.x), y=Number(station?.y);
        return name && !BASE_STATIONS[name] && Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1200 && y >= 0 && y <= 760;
      }).map(station => ({name:String(station.name).trim(),region:String(station.region || "").trim(),x:Number(station.x),y:Number(station.y),origin:String(station.origin || "Your town")})) : [];
      const knownStation=name => !!BASE_STATIONS[name] || customStations.some(station => station.name === name);
      const savedConnections=Array.isArray(saved.connections) ? saved.connections.filter(connection => {
        if (!Array.isArray(connection) || !knownStation(connection[0]) || !knownStation(connection[1]) || !(Number(connection[2]) > 0)) return false;
        return true;
      }) : [];
      return {
        source:saved.source === "3e" ? "3e" : "4e",
        speed:Number(saved.speed) > 0 ? Number(saved.speed) : DEFAULTS.speed,
        layover:Number(saved.layover) >= 0 ? Number(saved.layover) : DEFAULTS.layover,
        fares:Array.isArray(saved.fares) ? saved.fares : [],
        connections:savedConnections.map(([from,to,miles]) => [from,to,Number(miles)]),
        disabledConnections:Array.isArray(saved.disabledConnections) ? [...new Set(saved.disabledConnections.filter(key => isBuiltInEdge(key)))] : [],
        customStations,atlasVersion:1,bridgeCorrection:true,showCustom:saved.showCustom !== false
      };
    } catch { return {...DEFAULTS,fares:[],connections:[],disabledConnections:[],customStations:[]}; }
  }

  function getBuiltInRails() { return settings.source === "3e" ? RAILS_3E : RAILS_4E; }
  function isBuiltInEdge(key) { return [...RAILS_4E,...RAILS_3E].some(connection => edgeKey(connection[0],connection[1]) === key); }
  function getRails() {
    const merged=new Map();
    [...getBuiltInRails(),...(settings.showCustom === false ? [] : settings.connections)].forEach(connection => merged.set(edgeKey(connection[0],connection[1]),connection));
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

  function shortestPath(start,end) {
    const graph = makeGraph();
    if (!graph[start] || !graph[end]) return null;
    const distance = Object.fromEntries(Object.keys(graph).map(node => [node,Infinity]));
    const previous = {};
    const unvisited = new Set(Object.keys(graph));
    distance[start] = 0;
    while (unvisited.size) {
      let current = null;
      for (const node of unvisited) if (current === null || distance[node] < distance[current]) current = node;
      if (current === null || distance[current] === Infinity) break;
      unvisited.delete(current);
      if (current === end) break;
      graph[current].forEach(edge => {
        const candidate = distance[current] + edge.distance;
        if (candidate < distance[edge.name]) { distance[edge.name] = candidate; previous[edge.name] = current; }
      });
    }
    if (distance[end] === Infinity) return null;
    const path = [];
    for (let at=end; at; at=previous[at]) { path.unshift(at); if (at === start) break; }
    const segments = path.slice(0,-1).map((from,index) => {
      const to = path[index+1];
      return {from,to,distance:graph[from].find(edge => edge.name === to).distance};
    });
    return {path,segments,distance:distance[end]};
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
    els.hint.innerHTML = `<span></span>Click a station for ${field === "from" ? "departure" : "destination"} · Right-click for map tools`;
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
    const stops=Math.max(0,journey.path.length-2);
    journey.hours=journey.distance/settings.speed+stops*settings.layover;
    currentJourney={...journey,start,end};
    renderJourney(); renderMap(); fitRoute();
  }

  function showError(message) {
    currentJourney=null; els.error.textContent=message; els.error.hidden=false;
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
    const filter=els.fareFilter.value;
    const custom=settings.fares.map(fare => ({...fare,source:"custom",sourceName:fare.name || "Custom fare"}));
    const fares=[...BASE_FARES,...custom].filter(fare => filter === "all" || fare.source === filter);
    els.fareList.replaceChildren(...fares.map(fare => {
      const item=document.createElement("article"); item.className=`fare-item${fare.source === "custom" ? " custom" : ""}`;
      const basis=fare.basis === "mile" ? `${fare.price} gp per mile` : fare.basis === "hour" ? `${fare.price} gp per hour` : `${fare.price} gp per day`;
      item.innerHTML=`<div class="fare-name"><strong>${escapeHtml(fare.tier)}</strong><span>${escapeHtml(fare.sourceName)} · ${basis}</span></div><div class="money"><b>${formatMoney(calculateFare(fare,currentJourney))}</b><small>estimated fare</small></div>`;
      return item;
    }));
    if (!fares.length) {
      const empty=document.createElement("p"); empty.className="empty-fares"; empty.textContent="No custom fares have been added yet."; els.fareList.append(empty);
    }
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
  function zoomAt(factor,cx=600,cy=380) {
    const next=Math.min(8,Math.max(1,view.scale*factor));
    const ratio=next/view.scale;
    view.x=cx-(cx-view.x)*ratio; view.y=cy-(cy-view.y)*ratio; view.scale=next;
    clampView(); updateTransform();
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
        openNetworkEditor(); setNetworkPanel("towns"); startTownPlacement(); selectTownPosition(event); els.townName.focus();
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
  function toast(message) { els.toast.textContent=message; els.toast.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>els.toast.classList.remove("show"),1800); }

  function persistSettings() { localStorage.setItem("lightningRailSettings",JSON.stringify(settings)); }
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
    settings.connections.splice(index,1); persistSettings(); renderCustomRoutes(); updateNetworkActions(); planJourney(); renderMap(); toast("Custom connection removed");
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
  function renderRemovedRoutes() {
    els.removedRouteCount.textContent=settings.disabledConnections.length;
    els.removedRouteList.replaceChildren(...settings.disabledConnections.map(key => {
      const [from,to]=key.split("|"), item=document.createElement("div"); item.className="custom-route-item removed";
      item.innerHTML=`<strong>${escapeHtml(from)} → ${escapeHtml(to)}</strong><span>disabled</span><button type="button">Restore</button>`;
      item.querySelector("button").addEventListener("click",()=>restoreBuiltInRoute(key)); return item;
    }));
    if (!settings.disabledConnections.length) {
      const empty=document.createElement("p"); empty.className="custom-route-empty"; empty.textContent="No built-in connections removed."; els.removedRouteList.append(empty);
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
    refreshStationOptions(); renderCustomTowns(); renderCustomRoutes(); planJourney(); toast(`${name} saved`);
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
    persistSettings(); refreshStationOptions(); renderCustomTowns(); renderCustomRoutes(); updateNetworkActions(); planJourney(); toast("Town and connections removed");
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
    els.source.value=settings.source; els.speed.value=settings.speed; els.layover.value=settings.layover;
    els.fareRows.replaceChildren(); settings.fares.forEach(addFareRow); els.dialog.showModal();
  }
  function saveSettings() {
    const fares=[...els.fareRows.children].map(row => ({
      name:row.querySelector('[data-field="name"]').value.trim(),tier:row.querySelector('[data-field="tier"]').value.trim(),
      price:Number(row.querySelector('[data-field="price"]').value),basis:row.querySelector('[data-field="basis"]').value
    })).filter(fare => fare.name && fare.tier && fare.price >= 0);
    settings={...settings,source:els.source.value,speed:Math.max(1,Number(els.speed.value)||30),layover:Math.max(0,Number(els.layover.value)||0),fares};
    persistSettings(); syncSourceControls(); els.dialog.close(); planJourney(); toast("Journey settings saved");
  }
  function syncSourceControls() { els.source.value=settings.source; els.headerSource.value=settings.source; }

  els.fromMode.addEventListener("click",()=>setActiveField("from")); els.toMode.addEventListener("click",()=>setActiveField("to"));
  els.from.addEventListener("focus",()=>setActiveField("from")); els.to.addEventListener("focus",()=>setActiveField("to"));
  [els.from,els.to].forEach(input => input.addEventListener("change",planJourney));
  $("swapButton").addEventListener("click",()=>{ [els.from.value,els.to.value]=[els.to.value,els.from.value]; planJourney(); });
  els.headerSource.addEventListener("change",()=>{ settings.source=els.headerSource.value; persistSettings(); syncSourceControls(); planJourney(); });
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
  $("settingsButton").addEventListener("click",openSettings); $("addFare").addEventListener("click",()=>addFareRow()); $("saveSettings").addEventListener("click",saveSettings);
  $("resetSettings").addEventListener("click",()=>{
    if (!window.confirm("Reset fares, custom towns, and railways to atlas defaults?")) return;
    settings=migrateAtlas(structuredClone(DEFAULTS)); resetTownEditor(); $("showCustom").checked=true; syncSourceControls(); els.speed.value=settings.speed; els.layover.value=settings.layover; els.fareRows.replaceChildren(); refreshStationOptions(); renderCustomRoutes(); renderRemovedRoutes(); renderCustomTowns(); updateNetworkActions(); planJourney(); toast("Atlas defaults restored");
  });
  $("copyButton").addEventListener("click",async()=>{
    if (!currentJourney) return;
    const text=`${currentJourney.start} to ${currentJourney.end}\n${currentJourney.distance} miles · ${formatDuration(currentJourney.hours)}\n${currentJourney.path.join(" → ")}`;
    try { await navigator.clipboard.writeText(text); toast("Itinerary copied"); } catch { toast("Could not copy itinerary"); }
  });
  $("zoomInButton").addEventListener("click",()=>zoomAt(1.25)); $("zoomOutButton").addEventListener("click",()=>zoomAt(.8)); $("fitButton").addEventListener("click",fitRoute);
  els.svg.addEventListener("wheel",event=>{ event.preventDefault(); const point=pointerToMap(event); zoomAt(event.deltaY<0?1.14:.88,point.x,point.y); },{passive:false});
  els.svg.addEventListener("pointerdown",event=>{ if (event.button !== 0 || event.target.closest(".station, .rail-hit") || (networkEditing && networkPanel === "towns" && townPlacementArmed)) return; drag={clientX:event.clientX,clientY:event.clientY,x:view.x,y:view.y,moved:false}; els.svg.setPointerCapture(event.pointerId); els.svg.classList.add("dragging"); });
  els.svg.addEventListener("pointermove",event=>{ if (!drag) return; if (Math.hypot(event.clientX-drag.clientX,event.clientY-drag.clientY)>4) drag.moved=true; const rect=els.svg.getBoundingClientRect(); view.x=drag.x+(event.clientX-drag.clientX)*1200/rect.width; view.y=drag.y+(event.clientY-drag.clientY)*760/rect.height; clampView(); updateTransform(false); });
  els.svg.addEventListener("pointerup",event=>{ if (!drag) return; suppressMapClick=drag.moved; drag=null; els.svg.releasePointerCapture(event.pointerId); els.svg.classList.remove("dragging"); setTimeout(()=>{ suppressMapClick=false; },0); });
  els.svg.addEventListener("pointercancel",()=>{ drag=null; els.svg.classList.remove("dragging"); });
  els.svg.addEventListener("click",selectTownPosition);
  els.svg.setAttribute("tabindex","0");
  els.svg.addEventListener("contextmenu",openMapMenu);
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

  refreshStationOptions(); syncSourceControls(); renderCustomRoutes(); renderRemovedRoutes(); renderCustomTowns(); updateNetworkActions(); renderMap(); planJourney();
})();
