const $=s=>document.querySelector(s),L=localStorage,A=$('#a'),P='\u25B6\uFE0E',Z='\u23F8\uFE0E';
const J=(k,d)=>{try{return JSON.parse(L[k])??d}catch{return d}};
let S=J('s',{inst:'',sv:0,ok:0}),lib=J('lib',{}),q=[],qi=-1,cur=[],tab='home',sub=null,res=[],sv='',dl=new Set(),th={},I=null,nu=null,ou=null,pre=0,sh=[];
lib.liked||=[];lib.recent||=[];lib.pl||=[];
const save=()=>{L.s=JSON.stringify(S);L.lib=JSON.stringify(lib)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const img=id=>th[id]||`https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const fmt=s=>isFinite(s)?Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0'):'0:00';
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='s';clearTimeout(t.h);t.h=setTimeout(()=>t.className='',2600)};
const db=new Promise((r,j)=>{const o=indexedDB.open('basa',1);o.onupgradeneeded=()=>o.result.createObjectStore('t',{keyPath:'id'});o.onsuccess=()=>r(o.result);o.onerror=j});
const tx=async(m,f)=>{const d=await db;return new Promise((r,j)=>{const t=d.transaction('t',m),s=f(t.objectStore('t'));t.oncomplete=()=>r(s.result);t.onerror=j})};
// ---- sources: only the audio stream is ever requested (Piped / Invidious)
const F=async(u,ms=7000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t)}};
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
function recent(t){lib.recent=[t,...lib.recent.filter(x=>x.id!=t.id)].slice(0,20);save()}
async function play(i,at){qi=i;const t=q[i];ui(t);try{const u=await src(t);setSrc(u);if(at)A.addEventListener('loadedmetadata',()=>A.currentTime=at,{once:true});await A.play();recent(t)}catch{toast('Could not play. Open Library → Settings')}}
const next=d=>{if(q.length)play((qi+d+q.length)%q.length)};
function ui(t){pre=0;$('#nt').textContent=t.title;$('#na').textContent=t.artist||'';$('#art').src=img(t.id);$('#np').style.setProperty('--art',`url(${img(t.id)})`);sync();
 if('mediaSession'in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist||'',artwork:[{src:img(t.id),sizes:'320x180',type:'image/jpeg'}]})}
function sync(){const p=A.paused?P:Z,t=q[qi];$('#mp').textContent=p;$('#pp').textContent=p;if(t)$('#lk').textContent=lib.liked.some(x=>x.id==t.id)?'\u2665\uFE0E':'\u2661\uFE0E'}
A.onplay=A.onpause=sync;
A.onended=()=>{if(!q.length)return;const n=(qi+1)%q.length,t=q[n];if(nu?.id==t.id){qi=n;ui(t);setSrc(nu.u);A.play();recent(t)}else next(1)};
A.onerror=()=>{if(qi>=0&&!ou&&!A.rt){A.rt=1;nu=null;play(qi,A.currentTime).finally(()=>setTimeout(()=>A.rt=0,4000))}};
A.ontimeupdate=()=>{$('#cu').textContent=fmt(A.currentTime);$('#du').textContent=fmt(A.duration);if(A.duration)$('#seek').value=A.currentTime/A.duration*100;
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
const row=(t,i)=>`<div class="r" data-i="${i}"><img loading="lazy" src="${img(t.id)}" alt=""><div><b>${esc(t.title)}</b><small>${dl.has(t.id)?'\u2B07\uFE0E ':''}${esc(t.artist)}</small></div><button data-a="m">\u22EF</button></div>`;
const card=(t,i)=>`<div class="cd" data-i="${i}"><img loading="lazy" src="${img(t.id)}" alt=""><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div>`;
const add=(a,f=row)=>{const s=cur.length;cur=cur.concat(a);return a.map((t,k)=>f(t,s+k)).join('')};
const cat=(s,ic,n,c)=>`<div class="r" data-a="go" data-s="${s}"><div class="ph">${ic}</div><div><b>${n}</b><small>${c}</small></div></div>`;
async function render(){cur=[];const m=$('#main'),d=await tx('readonly',s=>s.getAll())||[];dl=new Set(d.map(x=>x.id));d.forEach(x=>{if(x.th&&!th[x.id])th[x.id]=URL.createObjectURL(x.th)});const D=d.map(x=>x.t);
 let t={home:'Listen Now',search:'Search',lib:'Library'}[tab],list=null,pl=null,o='';
 if(tab=='lib'&&sub){if(sub=='liked'){t='Liked Songs';list=lib.liked}else if(sub=='dl'){t='Downloaded';list=D}else if(sub=='set')t='Settings';else{pl=lib.pl.find(x=>'pl:'+x.id==sub);if(pl){t=pl.n;list=pl.t}else sub=null}}
 if(tab=='home')o=lib.recent.length||lib.liked.length?(lib.recent.length?'<h2>Recently Played</h2><div class="hs">'+add(lib.recent,card)+'</div>':'')+(lib.liked.length?'<h2>Liked Songs</h2>'+add(lib.liked.slice(0,8)):''):'<p class="empty">Search for a song to get started.<br>Add Basa to your Home Screen for<br>background playback.</p>';
 if(tab=='search')o=`<input id="sb" type="search" placeholder="Songs, artists" enterkeyhint="search" value="${esc(sv)}">`+(res.length?add(res):'<p class="empty">Find any song from YouTube.</p>');
 if(tab=='lib'&&!sub)o=cat('liked','\u2665\uFE0E','Liked Songs',lib.liked.length+' songs')+cat('dl','\u2B07\uFE0E','Downloaded',D.length+' songs · available offline')+'<h2>Playlists</h2>'+lib.pl.map(p=>cat('pl:'+p.id,'\u266B',esc(p.n),p.t.length+' songs')).join('')+'<button class="pill" data-a="new">＋ New Playlist</button>';
 if(list)o=`<div class="acts"><button data-a="play">\u25B6\uFE0E Play</button><button data-a="shuf">Shuffle</button><button data-a="dall">\u2B07\uFE0E All</button>${pl?'<button data-a="del">Delete</button>':''}</div>`+(list.length?add(list):'<p class="empty">Nothing here yet.</p>');
 if(sub=='set')o=(S.ok?'':'<p><b>Welcome to Basa.</b> Basa finds songs through public YouTube front-ends, which are often down. If you have your own Piped or Invidious URL, paste it below. Otherwise just tap Save.</p>')+`<small>Your instance URL(s), comma-separated (optional)</small><textarea id="in" placeholder="https://piped-api.example.com">${esc(S.inst)}</textarea><p><label><input type="checkbox" id="svc" ${S.sv?'checked':''}> Data saver (lowest-bitrate audio, about 0.4 MB/min)</label></p><button class="pill" data-a="save">Save</button><button class="pill" data-a="test">Test connection</button>`;
 m.innerHTML=`<div class="hd">${sub?'<button class="bk2" data-a="back">\u2039 Library</button>':''}<h1>${esc(t)}</h1>${tab=='lib'&&!sub?'<button data-a="gear" style="font-size:24px">\u2699\uFE0E</button>':''}</div>`+o;
 const sb=$('#sb');if(sb)sb.onkeydown=async e=>{if(e.key!='Enter')return;sv=sb.value.trim();sb.blur();if(!sv)return;m.insertAdjacentHTML('beforeend','<p class="empty">Searching…</p>');
  try{res=await via('search',sv)}catch{res=[];toast('Search failed. Instances may be down.')}render()}}
$('#main').onclick=async e=>{const b=e.target.closest('[data-a]'),r=e.target.closest('[data-i]');
 if(b){const a=b.dataset.a;
  if(a=='m')return menu(cur[+r.dataset.i]);if(a=='go'){sub=b.dataset.s;return render()}if(a=='back'){sub=null;return render()}if(a=='gear'){sub='set';return render()}
  if(a=='play'||a=='shuf'){q=[...cur];if(a=='shuf')q.sort(()=>Math.random()-.5);if(q.length)play(0);return}
  if(a=='dall')return dlAll(cur);
  if(a=='del'){if(confirm('Delete this playlist?')){lib.pl=lib.pl.filter(x=>'pl:'+x.id!=sub);sub=null;save();render()}return}
  if(a=='new'){const n=prompt('Playlist name');if(n)newPl(n);return render()}
  if(a=='save'){S.inst=$('#in').value.trim();S.sv=$('#svc').checked?1:0;S.ok=1;I=null;save();toast('Saved');sub=null;return render()}
  if(a=='test'){S.inst=$('#in').value.trim();I=null;toast('Testing…');try{await via('search','test');toast('Connected ✓')}catch{toast('No instance reachable')}return}}
 if(r){q=[...cur];play(+r.dataset.i)}};
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x==b));tab=b.dataset.t;sub=null;render()});
if(!S.ok){tab='lib';sub='set';document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x.dataset.t=='lib'))}
render();if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
