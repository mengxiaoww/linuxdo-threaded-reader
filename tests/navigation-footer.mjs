import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const source=readFileSync('linuxdo-comments.user.js','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<180&&!fn();i++)await pause(20);assert.ok(fn(),label)}
const post=n=>({id:10000+n,topic_id:42,post_number:n,username:'u'+n,name:'作者'+n,cooked:`<p>正文 ${n}</p>`,reply_count:0,reply_to_post_number:0});
const ids=Array.from({length:1000},(_,i)=>10001+i);
let rows=Array.from({length:20},(_,i)=>post(200+i));rows[0].boosts=[{cooked:'谢谢分享'}];rows[1].reply_to_post_number=200;rows[2].reply_to_post_number=201;rows[2].username='u1';
const dom=new JSDOM('<header class="d-header"></header><aside class="timeline-container"><a class="start-date" href="/t/topic/42/1">开始</a><div class="timeline-scrollarea"></div><a class="now-date" href="/t/topic/42/1000">末尾</a></aside><div class="post-stream"><div class="topic-post" data-post-number="200"><article class="boxed"><button id="original-like">原按钮</button></article></div><div class="post-stream--cloaked" data-post-number="800" style="height:200px"></div></div>',{url:'https://linux.do/t/topic/42/200',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;let poll;const interval=w.setInterval.bind(w);w.setInterval=(fn,ms)=>{if(ms===60000)poll=fn;return interval(fn,ms)};const calls=[],actions=[],views=[];let saved={};let scroll=0,pages=0,newReply=false;
Object.defineProperty(w,'scrollY',{get:()=>scroll});w.scrollTo=({top})=>scroll=Math.max(0,top);w.scrollBy=(arg,delta)=>scroll=Math.max(0,scroll+(typeof arg==='object'?arg.top:delta));
const topic={id:42,posts_count:1000,details:{can_create_post:true},postStream:{posts:rows,stream:ids}};
const controller={model:topic,send:(...args)=>actions.push(args)};
const owner={lookup:name=>name==='controller:topic'?controller:store};
const store={createRecord:(type,data)=>{const record={...data,set(k,v){this[k]=v}}; for(const key of Object.keys(data)) delete data[key]; return record}};
const Base={extend:()=>({create:props=>({appendTo(container){const entry=props.renderGlimmer._registrations[0],args=entry.component.args,p=args.post;views.push(args);const root=d.createElement('div');root.className='topic-post';root.dataset.postNumber=p.post_number;root.innerHTML=`<article class="boxed"><div class="row"><div class="topic-avatar"><img class="avatar"></div><div class="topic-body"><div class="topic-meta-data"><span class="names"><span class="first">${p.name}</span></span></div><div class="cooked">${p.cooked}</div><div class="post-menu-area"><button class="like">赞</button><button class="reply">回复</button><div class="discourse-boosts__post-menu">${(p.boosts||[]).map(b=>`<button class="discourse-boosts__bubble">${b.cooked}</button>`).join('')}</div></div></div></div></article>`;root.querySelector('.reply').onclick=args.replyToPost;root.querySelector('.like').onclick=()=>actions.push(['native-like',p]);root.querySelector('.discourse-boosts__bubble')?.addEventListener('click',e=>e.currentTarget.setAttribute('aria-expanded','true'));entry.element.append(root);this.root=root},destroy(){this.root?.remove()}})})};
w.require=name=>({
 'discourse/lib/get-owner':{getOwnerWithFallback:()=>owner},'@ember/application':{getOwner:()=>owner,setOwner:()=>{}},'@ember/component':{default:Base,getComponentTemplate:()=>({})},'@ember/runloop':{run:fn=>fn()},'discourse/components/render-glimmer-container':{default:{}},'discourse/components/post':{default:{}},'ember-curry-component':{default:(component,args)=>({component,args})}
}[name]);
w.Discourse={lookup:()=>controller};w.GM_getValue=(k,v)=>saved[k]??v;w.GM_setValue=(k,v)=>saved[k]=v;w.GM_registerMenuCommand=()=>{};w.GM_addStyle=css=>{const el=d.createElement('style');el.textContent=css;d.head.append(el)};
w.fetch=async path=>{calls.push(path);return{ok:true,json:async()=>{
 if(path.includes('filter_top_level_replies=true'))return{post_stream:{stream:ids.filter(id=>![10201,10202].includes(id)),posts:[post(200)]}};
 if(path==='/t/42/200.json')return{posts_count:1000,highest_post_number:1000,details:{created_by:{username:'u1'}},post_stream:{stream:ids,posts:rows}};
 if(path==='/posts/by_number/42/1')return post(1);
 if(path==='/t/42.json')return{posts_count:newReply?1001:1000,highest_post_number:newReply?1001:1000,post_stream:{stream:newReply?[...ids,11001]:ids,posts:rows}};
 if(path==='/t/42/1001.json'){const p=post(1001);p.reply_to_post_number=201;return{post_stream:{posts:[p]}}}
 if(path.includes('/posts.json?')){const base=220+20*pages++;return{post_stream:{posts:Array.from({length:20},(_,i)=>post(base+i))}}}
 throw Error(path);
}}};
const native=d.querySelector('.post-stream'),navigations=[];w.navigate=path=>navigations.push(path);
w.eval(source.replaceAll('location.assign(', 'window.navigate(').replace(/\}\)\(\);\s*$/, 'window.navigationTest={locateRoot,getState:()=>state};})();'));
await until(()=>d.querySelector('.ldt-owned > [data-post-number="219"]'),'阅读区初始化');
await until(()=>d.querySelector('.ldt-progress-total')?.title,'顶层回复总数确定');
const s=w.navigationTest.getState(),rail=d.querySelector('.ldt-progress-rail'),rootIds=[...s.rootIds.keys()];
assert.equal(rail.getAttribute('role'),'slider');assert.equal(Number(rail.getAttribute('aria-valuemax')),997,'排除首帖和两条嵌套回复');
rail.getBoundingClientRect=()=>({top:100,bottom:300,height:200});let capture=false;
rail.setPointerCapture=()=>capture=true;rail.hasPointerCapture=()=>capture;rail.releasePointerCapture=()=>capture=false;
const pointer=(type,y)=>{const event=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientY:y});Object.defineProperty(event,'pointerId',{value:1});rail.dispatchEvent(event)};
const fetchBefore=w.fetch;
w.fetch=async path=>path.includes('/posts.json?')?{ok:true,json:async()=>{calls.push(path);return{post_stream:{posts:new URLSearchParams(path.split('?')[1]).getAll('post_ids[]').map(id=>post(Number(id)-10000))}}}}:fetchBefore(path);
const before=calls.length;
pointer('pointerdown',150);for(let n=0;n<30;n++)pointer('pointermove',120+n*5);assert.equal(calls.length,before,'拖动预览不发送网络请求');assert.equal(navigations.length,0);
pointer('pointerup',200);await until(()=>navigations.length===1,'松手后定位未加载的讨论');
const target=rootIds[Math.floor(.5*rootIds.length)];
assert.equal(navigations[0],`/t/topic/42/${target-10000}`,'按全话题顶层回复的真实楼号定位');
const query=calls.filter(p=>p.includes('/posts.json?'));assert.equal(query.length,1);assert.deepEqual(new URLSearchParams(query[0].split('?')[1]).getAll('post_ids[]'),[String(target)],'仅请求目标单条，不扫描中间历史');
const cached=s.nodes.get(200);cached.getBoundingClientRect=()=>({top:200-scroll,bottom:300-scroll,height:100});s.allowStart=true;
const cachedIndex=rootIds.indexOf(10200),beforeCached=calls.length;
await w.navigationTest.locateRoot(s,(cachedIndex+.5)/rootIds.length);
assert.equal(scroll,188,'已加载目标直接滚到对应讨论');assert.equal(calls.length,beforeCached);assert.equal(navigations.length,1);
let release;const gate=new Promise(resolve=>release=resolve),slowId=rootIds[700];
w.fetch=async path=>path.endsWith(`post_ids[]=${slowId}`)?{ok:true,json:async()=>{await gate;return{post_stream:{posts:[post(slowId-10000)]}}}}:fetchBefore(path);
const old=w.navigationTest.locateRoot(s,700.5/rootIds.length);
await w.navigationTest.locateRoot(s,(cachedIndex+.5)/rootIds.length);release();await old;
assert.equal(navigations.length,1,'较慢的旧定位请求不能覆盖后一次选择');
let idleMutations=0;await pause(30);const idleObserver=new w.MutationObserver(records=>idleMutations+=records.length);idleObserver.observe(s.progress,{childList:true,subtree:true});await pause(100);idleObserver.disconnect();assert.equal(idleMutations,0,'静止时不反复重建文字，避免闪烁和持续重排');
// 只使用原站的末尾加载流程恢复底部功能，不伪造 loadedAllPosts。
let footerCalls=0;topic.postStream.loadedAllPosts=false;
const nativeFooter=d.createElement('section');nativeFooter.id='topic-footer-buttons';nativeFooter.innerHTML='<button>分享</button><button>添加为书签</button><button>举报</button><button>标记为未读</button><button>回复</button><div id="suggested-topics">推荐</div>';
nativeFooter.querySelector('button').onclick=()=>actions.push(['native-share']);
topic.postStream.refresh=async opts=>{footerCalls++;assert.equal(opts.nearPost,1000);assert.equal(opts.refreshInPlace,true);assert.equal(opts.forceLoad,undefined,'不清空原生帖流，避免重新挂载和跳动');topic.postStream.loadedAllPosts=true;native.after(nativeFooter)};
s.more.getBoundingClientRect=()=>({top:600,bottom:640,height:40});w.dispatchEvent(new w.Event('scroll'));
await until(()=>d.querySelector('#topic-footer-buttons'),'接近阅读区底部恢复原生操作和推荐');
assert.equal(footerCalls,1);nativeFooter.querySelector('button').click();assert.equal(actions.at(-1)[0],'native-share');
assert.equal(s.nodes.get(200),cached,'恢复页尾不重建正在看的评论');
w.dispatchEvent(new w.Event('scroll'));await pause(25);assert.equal(footerCalls,1,'原生页尾已就绪时不重复请求');
d.querySelector('[data-mode="quote"]').click();await pause(25);
assert.equal(d.querySelector('#topic-footer-buttons'),nativeFooter,'切回引用模式保留同一个原生页尾');
assert.equal(d.querySelector('.ldt-reading-progress'),null,'引用模式恢复原始定位条');
w.close();console.log('PASS: 顶层回复拖动预览/松手单条定位/缓存直达/旧请求隔离、原生页尾恢复与引用模式保留');
