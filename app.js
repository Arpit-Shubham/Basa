const $=s=>document.querySelector(s),L=localStorage,A=$('#a'),P='\u25B6\uFE0E',Z='\u23F8\uFE0E';
const J=(k,d)=>{try{return JSON.parse(L[k])??d}catch{return d}};
let S=J('s',{inst:'',sv:0,ok:0}),lib=J('lib',{}),q=[],qi=-1,cur=[],tab='home',sub=null,res=[],sv='',dl=new Set(),th={},I=null,nu=null,ou=null,pre=0,sh=[];
lib.liked||=[];lib.recent||=[];lib.pl||=[];lib.plays||={};
const save=()=>{L.s=JSON.stringify(S);L.lib=JSON.stringify(lib)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const img=id=>th[id]||`https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const fmt=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='s';clearTimeout(t.h);t.h=setTimeout(()=>t.className='',2600)};
const db=new Promise((r,j)=>{const o=indexedDB.open('basa',1);o.onupgradeneeded=()=>o.result.createObjectStore('t',{keyPath:'id'});o.onsuccess=()=>r(o.result);o.onerror=j});
const tx=async(m,f)=>{const d=await db;return new Promise((r,j)=>{const t=d.transaction('t',m),s=f(t.objectStore('t'));t.oncomplete=()=>r(s.result);t.onerror=j})};
// ---- sources: only the audio stream is ever requested (Piped / Invidious)
const F=async(u,ms=7000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);bz(1);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t);bz(-1)}};
const pick=a=>{if(!a.length)throw 0;a.sort((x,y)=>x.b-y.b);return(S.sv?a[0]:a.reduce((p,c)=>Math.abs(c.b-128e3)<Math.abs(p.b-128e3)?c:p)).u};
const FB=['https://pipedapi.kavin.rocks','https://pipedapi.leptons.xyz','https://api.piped.private.coffee','https://piped-api.codespace.cz','https://api.piped.yt','https://pipedapi.drgns.space','https://pipedapi.reallyaweso.me','https://pipedapi.ducks.party','https://pipedapi.orangenet.cc','https://pipedapi.adminforge.de'];
async function insts(){if(I)return I;let p=[],v=[];
 const[a,b]=await Promise.allSettled([F('https://piped-instances.kavin.rocks/'),F('https://api.invidious.io/instances.json?sort_by=health')]);
 if(Array.isArray(a.value))p=a.value.sort((x,y)=>(y.uptime_30d||0)-(x.uptime_30d||0)).map(x=>x.api_url).filter(u=>/^https:/.test(u||''));
 if(Array.isArray(b.value))v=b.value.filter(x=>x[1]?.api&&x[1]?.cors&&x[1]?.type=='https').map(x=>x[1].uri);
 const c=S.inst.split(/[\s,]+/).filter(Boolean).map(u=>({u:u.replace(/\/$/,''),t:'?'}));
 return I=[...c,...p.slice(0,6).map(u=>({u,t:'p'})),...v.slice(0,6).map(u=>({u,t:'i'})),...FB.map(u=>({u,t:'p'})),{u:'https://inv.nadeko.net',t:'i'}]}
const API={p:{async search(b,q){const r=await F(`${b}/search?q=${encodeURIComponent(q)}&filter=music_songs`);return r.items.filter(x=>x.url?.includes('v=')).map(x=>({id:x.url.split('v=')[1],title:x.title,artist:x.uploaderName}))},
 async stream(b,id){const r=await F(`${b}/streams/${id}`,10000);return pick(r.audioStreams.filter(s=>/mp4/.test(s.mimeType)).map(s=>({u:s.url,b:s.bitrate})))}},
 i:{async search(b,q){const r=await F(`${b}/api/v1/search?q=${encodeURIComponent(q)}&type=video`);return r.filter(x=>x.videoId).map(x=>({id:x.videoId,title:x.title,artist:x.author}))},
 async stream(b,id){const r=await F(`${b}/api/v1/videos/${id}?local=true`,10000);return pick(r.adaptiveFormats.filter(s=>/^audio\/mp4/.test(s.type)).map(s=>({u:s.url[0]=='/'?b+s.url:s.url,b:+s.bitrate})))}}};
async function via(fn,...a){const l=await insts();for(let k=0;k<l.length;k+=3){try{const[r,n]=await Promise.any(l.slice(k,k+3).flatMap(n=>(n.t=='?'?['p','i']:[n.t]).map(t=>API[t][fn](n.u,...a).then(r=>[r,n]))));l.splice(l.indexOf(n),1);l.unshift(n);return r}catch{}}throw new Error('fail')}
// ---- player
async function src(t){const r=await tx('readonly',s=>s.get(t.id));if(r)return URL.createObjectURL(r.blob);if(nu?.id==t.id)return nu.u;return via('stream',t.id)}
function setSrc(u){if(ou)URL.revokeObjectURL(ou);ou=u.startsWith('blob:')?u:null;A.src=u}
function recent(t){lib.recent=[t,...lib.recent.filter(x=>x.id!=t.id)].slice(0,50);const p=lib.plays[t.id]||={t,n:0};p.n++;save()}
async function play(i,at){qi=i;const t=q[i];bf=1;ui(t);try{const u=await src(t);setSrc(u);if(at)A.addEventListener('loadedmetadata',()=>A.currentTime=at,{once:true});await A.play();recent(t)}catch{bf=0;sync();toast('Could not play. Open Library → Settings')}}
const next=d=>{if(q.length)play((qi+d+q.length)%q.length)};
function ui(t){pre=0;$('#nt').textContent=t.title;$('#na').textContent=t.artist||'';$('#art').src=img(t.id);$('#np').style.setProperty('--art',`url(${img(t.id)})`);sync();
 if('mediaSession'in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist||'',artwork:[{src:img(t.id),sizes:'320x180',type:'image/jpeg'}]})}
let bf=0;
function sync(){const t=q[qi],pa=A.paused,f=z=>bf?'<i class="sp"></i>':ic(pa?'play':'pause',z);$('#mp').innerHTML=f(26);$('#pp').innerHTML=f(36);$('#np').classList.toggle('playing',!pa);if(t)$('#lk').innerHTML=ic('heart',26,lib.liked.some(x=>x.id==t.id))}
A.onplay=A.onpause=sync;
A.onended=()=>{if(!q.length)return;const n=(qi+1)%q.length,t=q[n];if(nu?.id==t.id){qi=n;ui(t);setSrc(nu.u);A.play();recent(t)}else next(1)};
A.onerror=()=>{if(qi>=0&&!ou&&!A.rt){A.rt=1;nu=null;play(qi,A.currentTime).finally(()=>setTimeout(()=>A.rt=0,4000))}};
A.ontimeupdate=()=>{$('#np').style.setProperty('--p',(A.duration?A.currentTime/A.duration*100:0)+'%');$('#cu').textContent=fmt(A.currentTime);$('#du').textContent=fmt(A.duration);if(A.duration)$('#seek').value=A.currentTime/A.duration*100;
 if('mediaSession'in navigator&&A.duration)try{navigator.mediaSession.setPositionState({duration:A.duration,position:A.currentTime})}catch{}
 if(A.duration&&A.duration-A.currentTime<25&&q.length>1&&!pre){pre=1;const t=q[(qi+1)%q.length];dl.has(t.id)||via('stream',t.id).then(u=>nu={id:t.id,u}).catch(()=>{})}};
$('#seek').oninput=e=>{if(A.duration)A.currentTime=e.target.value/100*A.duration};
const tog=()=>A.paused?A.play():A.pause();
$('#mp').onclick=e=>{e.stopPropagation();tog()};$('#mn').onclick=e=>{e.stopPropagation();next(1)};$('#pp').onclick=tog;$('#pv').onclick=()=>next(-1);$('#nx').onclick=()=>next(1);
$('#bar').onclick=()=>$('#np').classList.add('open');$('#cl').onclick=()=>$('#np').classList.remove('open');
$('#lk').onclick=()=>q[qi]&&like(q[qi]);$('#mo').onclick=()=>q[qi]&&menu(q[qi]);
if('mediaSession'in navigator){const m=navigator.mediaSession;m.setActionHandler('play',()=>A.play());m.setActionHandler('pause',()=>A.pause());m.setActionHandler('previoustrack',()=>next(-1));m.setActionHandler('nexttrack',()=>next(1));try{m.setActionHandler('seekto',e=>A.currentTime=e.seekTime)}catch{}}
// ---- library actions
function like(t){const i=lib.liked.findIndex(x=>x.id==t.id);i<0?lib.liked.unshift(t):lib.liked.splice(i,1);save();sync();render()}
async function dlTrack(t,quiet){if(dl.has(t.id))return;if(!quiet)toast('Downloading…');
 try{const r=await fetch(await via('stream',t.id));if(!r.ok)throw 0;const blob=await r.blob();let thb;try{thb=await(await fetch(img(t.id))).blob()}catch{}
  await tx('readwrite',s=>s.put({id:t.id,t,blob,th:thb}));dl.add(t.id);navigator.storage?.persist?.();if(!quiet){toast('Saved for offline');render()}}
 catch{toast('Download blocked by this instance. Try another in Settings.')}}
async function dlAll(a){toast(`Downloading ${a.length} songs…`);for(const t of a)await dlTrack(t,1);toast('Done');render()}
const rmDl=async t=>{await tx('readwrite',s=>s.delete(t.id));dl.delete(t.id);render()};
const newPl=n=>{const p={id:Date.now().toString(36),n,t:[]};lib.pl.push(p);save();return p};
const addTo=(p,t)=>{if(!p.t.some(x=>x.id==t.id))p.t.push(t);save();toast('Added to '+p.n);render()};
function sheet(items){sh=items;$('#sh').innerHTML='<div class="kk"></div><div class="sc">'+items.map(([l],i)=>`<button data-k="${i}">${l}</button>`).join('')+'</div>';$('#sh').className='on'}
$('#sh').onclick=e=>{const b=e.target.closest('[data-k]');$('#sh').className='';if(b)sh[b.dataset.k][1]()};
function menu(t){const lk=lib.liked.some(x=>x.id==t.id),p=sub?.startsWith('pl:')&&lib.pl.find(x=>'pl:'+x.id==sub);
 sheet([[lk?'Remove from Liked Songs':'Add to Liked Songs',()=>like(t)],[dl.has(t.id)?'Remove download':'Download for offline',()=>dl.has(t.id)?rmDl(t):dlTrack(t)],['Add to playlist…',()=>sheet([['＋ New playlist',()=>{const n=prompt('Playlist name');if(n)addTo(newPl(n),t)}],...lib.pl.map(p=>[esc(p.n),()=>addTo(p,t)])])],['Play next',()=>{q.splice(qi+1,0,t);toast('Playing next')}],...(p?[['Remove from this playlist',()=>{p.t=p.t.filter(x=>x.id!=t.id);save();render()}]]:[])])}
// ---- views
const IC={play:'<path d="M7 4.8v14.4L19 12z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>',
pause:'<rect x="5.5" y="4.5" width="4.3" height="15" rx="1.5"/><rect x="14.2" y="4.5" width="4.3" height="15" rx="1.5"/>',
next:'<path d="M5 5.5v13L15 12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="16.5" y="5" width="3" height="14" rx="1.4"/>',
prev:'<path d="M19 5.5v13L9 12z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><rect x="4.5" y="5" width="3" height="14" rx="1.4"/>',
heart:'<path d="M12 20.6s-8.2-4.9-8.2-11A4.6 4.6 0 0112 7a4.6 4.6 0 018.2 2.6c0 6.1-8.2 11-8.2 11z"/>',
more:'<circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/>',
dl:'<path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>',
down:'<path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
back:'<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
gear:'<circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
shuf:'<path d="M4 7h3.5c5 0 4 10 9 10H20M4 17h3.5c1.5 0 2.5-.8 3.3-2M13.2 9c.8-1.2 1.8-2 3.3-2H20M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
note:'<path d="M9 17.5V6l10-2v11.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="2.7"/><circle cx="16.5" cy="15.5" r="2.7"/>',
clock:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
flame:'<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 .3 1.2 1 1.8 1.8 2C10.5 8 11 5.5 12 3z"/>',
globe:'<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3.5c3 3 3 14 0 17M12 3.5c-3 3-3 14 0 17" fill="none" stroke="currentColor" stroke-width="1.8"/>',
trend:'<path d="M4 16l5-5 4 4 7-8M15 7h5v5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'};
const ic=(n,s=22,on)=>`<svg viewBox="0 0 24 24" width="${s}" height="${s}" ${n=='heart'&&!on?'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"':'fill="currentColor"'}>${IC[n]}</svg>`;
let bzn=0;const bz=d=>{bzn+=d;$('#lb').classList.toggle('on',bzn>0)};
const SM={recent:['Last Played','clock','#ffb347,#ff7a18'],most:['Most Played','flame','#ff6b6b,#e0245e'],'chart:in':['Top 100 India','trend','#ff9933,#e8590c'],'chart:gl':['Top 100 Global','globe','#00c6ff,#7b2ff7'],liked:['Liked Songs','heart','#ff6b8b,#ff2d55'],dl:['Downloaded','dl','#40c8ff,#0a84ff']};
const CH={'chart:in':'Top 100 Songs India','chart:gl':'Top 100 Songs Global'},TN={home:'Listen Now',search:'Search',lib:'Library'};
let cd={},ldg={};
const nm=a=>a.replace(/ - Topic$/,'');
API.p.chart=async(b,q)=>{const r=await F(`${b}/search?q=${encodeURIComponent(q)}&filter=music_playlists`),u=r.items.find(x=>x.url?.includes('list='));if(!u)throw 0;const p=await F(`${b}/playlists/${u.url.split('list=')[1]}`,12000);return p.relatedStreams.filter(x=>x.url?.includes('v=')).slice(0,100).map(x=>({id:x.url.split('v=')[1],title:x.title,artist:nm(x.uploaderName||'')}))};
API.i.chart=async(b,q)=>{const r=await F(`${b}/api/v1/search?q=${encodeURIComponent(q)}&type=playlist`),u=r.find(x=>x.playlistId);if(!u)throw 0;const p=await F(`${b}/api/v1/playlists/${u.playlistId}`,12000);return p.videos.slice(0,100).map(x=>({id:x.videoId,title:x.title,artist:nm(x.author||'')}))};
async function loadChart(k){if(ldg[k])return;ldg[k]=1;try{const c=J('c_'+k,null);if(c){cd[k]=c.t;if(sub==k)render()}
 if(!c||Date.now()-c.at>432e5){try{const t=await via('chart',CH[k]);L['c_'+k]=JSON.stringify({at:Date.now(),t});cd[k]=t}catch{if(!c)throw 0}}}catch{cd[k]=[];toast("Couldn't load chart. Pull down to retry.")}ldg[k]=0;if(sub==k)render()}
const mostL=()=>Object.values(lib.plays).sort((a,b)=>b.n-a.n).slice(0,50).map(x=>x.t);
const tile=(i,c,s=48)=>`<div class="ph" style="width:${s}px;height:${s}px;background:linear-gradient(135deg,${c})">${ic(i,Math.round(s*.46))}</div>`;
const row=(t,i)=>`<div class="r" data-i="${i}"><img loading="lazy" src="${img(t.id)}" alt=""><div><b>${esc(t.title)}</b><small>${dl.has(t.id)?ic('dl',11)+' ':''}${esc(t.artist)}</small></div><button data-a="m">${ic('more',22)}</button></div>`;
const card=(t,i)=>`<div class="cd" data-i="${i}"><img loading="lazy" src="${img(t.id)}" alt=""><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div>`;
const scard=k=>`<div class="cd" data-a="go" data-s="${k}">${tile(SM[k][1],SM[k][2],150)}<b>${SM[k][0]}</b><small>${k.startsWith('chart')?'YouTube Music chart':k=='most'?'Your top tracks':'Your history'}</small></div>`;
const cat=(s,i,c,n,x)=>`<div class="r" data-a="go" data-s="${s}">${tile(i,c)}<div><b>${n}</b><small>${x}</small></div></div>`;
const add=(a,f=row)=>{const s=cur.length;cur=cur.concat(a);return a.map((t,k)=>f(t,s+k)).join('')};
const sk=n=>'<div class="r"><div class="ph sk"></div><div><b class="sk l1"></b><small class="sk l2"></small></div></div>'.repeat(n);
async function render(nav){const m=$('#main'),y=m.scrollTop,d=await tx('readonly',s=>s.getAll())||[];dl=new Set(d.map(x=>x.id));d.forEach(x=>{if(x.th&&!th[x.id])th[x.id]=URL.createObjectURL(x.th)});
 const D=d.map(x=>x.t);cur=[];let t=TN[tab],list=null,pl=null,o='',ld=0;
 if(sub){if(sub=='set')t='Settings';else if(SM[sub]){t=SM[sub][0];if(sub.startsWith('chart')){list=cd[sub]||null;if(!list){ld=1;loadChart(sub)}}else list={recent:lib.recent,most:mostL(),liked:lib.liked,dl:D}[sub]}else{pl=lib.pl.find(x=>'pl:'+x.id==sub);if(pl){t=pl.n;list=pl.t}else sub=null}}
 if(!sub&&tab=='home')o='<h2>Charts & Mixes</h2><div class="hs">'+['chart:in','chart:gl','most','recent'].map(scard).join('')+'</div>'+(lib.recent.length?'<h2>Recently Played</h2><div class="hs">'+add(lib.recent.slice(0,12),card)+'</div>':'')+(lib.liked.length?'<h2>Liked Songs</h2>'+add(lib.liked.slice(0,6)):'');
 if(!sub&&tab=='search')o=`<input id="sb" type="search" placeholder="Songs, artists" enterkeyhint="search" value="${esc(sv)}">`+(res.length?add(res):'<p class="empty">Find any song from YouTube.</p>');
 if(!sub&&tab=='lib')o=cat('liked','heart',SM.liked[2],'Liked Songs',lib.liked.length+' songs')+cat('recent','clock',SM.recent[2],'Last Played',lib.recent.length+' songs')+cat('most','flame',SM.most[2],'Most Played',mostL().length+' songs')+cat('chart:in','trend',SM['chart:in'][2],'Top 100 India','YouTube Music chart')+cat('chart:gl','globe',SM['chart:gl'][2],'Top 100 Global','YouTube Music chart')+cat('dl','dl',SM.dl[2],'Downloaded',D.length+' songs · offline')+'<h2>Your Playlists</h2>'+lib.pl.map(p=>cat('pl:'+p.id,'note','#b57bff,#5b2bd9',esc(p.n),p.t.length+' songs')).join('')+`<button class="pill" data-a="new">${ic('note',16)} Create Playlist</button>`;
 if(ld||list)o=`<div class="acts"><button data-a="play">${ic('play',16)} Play</button><button data-a="shuf">${ic('shuf',16)} Shuffle</button><button data-a="dall">${ic('dl',16)} Save</button>${pl?'<button data-a="del">Delete</button>':''}</div>`+(ld?sk(9):list.length?add(list):'<p class="empty">Nothing here yet.<br>Pull down to refresh.</p>');
 else if(sub&&sub!='set'&&list!==null)o='<p class="empty">Nothing here yet.</p>';
 if(sub=='set')o=(S.ok?'':'<p><b>Welcome to Basa.</b> If you have your own Piped or Invidious URL, paste it below. Otherwise just tap Save.</p>')+`<small>Your instance URL(s), comma-separated (optional)</small><textarea id="in" placeholder="https://pipedapi.example.com">${esc(S.inst)}</textarea><p><label><input type="checkbox" id="svc" ${S.sv?'checked':''}> Data saver (lowest-bitrate audio)</label></p><button class="pill" data-a="save">Save</button><button class="pill" data-a="test">Test connection</button>`;
 m.innerHTML=`<div class="pg ${nav||''}"><div class="hd">${sub?`<button class="bk2" data-a="back">${ic('back',20)}<span>${TN[tab]}</span></button>`:''}<h1>${esc(t)}</h1>${tab=='lib'&&!sub?`<button data-a="gear">${ic('gear',24)}</button>`:''}</div>${o}</div>`;
 m.scrollTop=nav?0:y;
 const sb=$('#sb');if(sb)sb.onkeydown=async e=>{if(e.key!='Enter')return;sv=sb.value.trim();sb.blur();if(!sv)return;m.querySelector('.pg').insertAdjacentHTML('beforeend',sk(7));
  try{res=await via('search',sv)}catch{res=[];toast('Search failed. Instances may be down.')}render()}}
$('#main').onclick=async e=>{const b=e.target.closest('[data-a]'),r=e.target.closest('[data-i]');
 if(b){const a=b.dataset.a;
  if(a=='m')return menu(cur[+r.dataset.i]);if(a=='go'){sub=b.dataset.s;return render('push')}if(a=='back'){sub=null;return render('pop')}if(a=='gear'){sub='set';return render('push')}
  if(a=='play'||a=='shuf'){q=[...cur];if(a=='shuf')q.sort(()=>Math.random()-.5);if(q.length)play(0);return}
  if(a=='dall')return dlAll(cur);
  if(a=='del'){if(confirm('Delete this playlist?')){lib.pl=lib.pl.filter(x=>'pl:'+x.id!=sub);sub=null;save();render('pop')}return}
  if(a=='new'){const n=prompt('Playlist name');if(n)newPl(n);return render()}
  if(a=='save'){S.inst=$('#in').value.trim();S.sv=$('#svc').checked?1:0;S.ok=1;I=null;save();toast('Saved');sub=null;return render('pop')}
  if(a=='test'){S.inst=$('#in').value.trim();I=null;toast('Testing…');try{await via('search','test');toast('Connected ✓')}catch{toast('No instance reachable')}return}}
 if(r){q=[...cur];play(+r.dataset.i)}};
const tabs=document.querySelectorAll('#tabs button'),hl=()=>tabs.forEach(x=>x.classList.toggle('on',x.dataset.t==tab));
tabs.forEach(b=>b.onclick=()=>{tab=b.dataset.t;sub=null;hl();render('fade')});
// pull to refresh
async function refresh(){Object.keys(L).filter(k=>k.startsWith('c_')).forEach(k=>L.removeItem(k));cd={};ldg={};I=null;await new Promise(r=>setTimeout(r,800));await render()}
let ty=-1,pd=0;const pt=$('#ptr'),mn=$('#main');
mn.addEventListener('touchstart',e=>{ty=mn.scrollTop<=0?e.touches[0].clientY:-1},{passive:true});
mn.addEventListener('touchmove',e=>{if(ty<0)return;pd=Math.max(0,Math.min(80,(e.touches[0].clientY-ty)*.45));pt.style.transform=`translate(-50%,${pd-34}px) rotate(${pd*5}deg)`;pt.style.opacity=Math.min(1,pd/50)},{passive:true});
mn.addEventListener('touchend',async()=>{if(ty<0)return;const go=pd>=55;pd=0;ty=-1;if(go){pt.style.transform='translate(-50%,12px)';pt.style.opacity=1;await refresh()}pt.style.transform='';pt.style.opacity=''},{passive:true});
A.onplaying=A.oncanplay=()=>{bf=0;sync()};A.onwaiting=()=>{bf=1;sync()};
$('#mn').innerHTML=ic('next',26);$('#pv').innerHTML=ic('prev',32);$('#nx').innerHTML=ic('next',32);$('#mo').innerHTML=ic('more',26);$('#cl').innerHTML=ic('down',24);sync();
if(!S.ok){tab='lib';sub='set';hl()}
render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
