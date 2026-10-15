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
const native=d.querySelector('.post-stream'),before=native.innerHTML,originalButton=d.querySelector('#original-like');
d.addEventListener('click',event=>{if(event.target.closest?.('.timeline-container .start-date, .timeline-container .now-date')){event.preventDefault();event.stopImmediatePropagation();scroll=999}},true);
const navigations=[];w.navigate=path=>navigations.push(path);
w.eval(source.replaceAll('location.assign(', 'window.navigate('));assert.equal(native.classList.contains('ldt-native-hidden'),false,'初始化期间先保留原页面，避免空白闪烁');await until(()=>d.querySelector('.ldt-owned > [data-post-number="219"]'),'完整原生帖子挂载');
assert.equal(native.innerHTML,before,'原列表节点与占位不改写');
assert.ok(!calls.includes('/t/42/200.json'),'历史返回已有原生帖子模型时直接复用，避免重新请求后才恢复样式');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="1"] .cooked').textContent,'正文 1','首帖保留');
assert.ok(views.every(args=>args.showReadIndicator===false),'不让原站未读点覆盖时间');
assert.equal(d.querySelector('.ldt-unread'),null,'首次加载不把每条旧评论都标成新回复');
assert.ok(views.every(args=>args.post.topic===topic),'原生组件使用真实话题上下文');
const p200=d.querySelector('.ldt-owned > [data-post-number="200"]');
w.dispatchEvent(new w.PopStateEvent('popstate'));w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:true}));await pause(40);assert.equal(d.querySelector('.ldt-owned >[data-post-number="200"]'),p200,'历史恢复保留现有评论节点，不反复销毁重建');
assert.equal(p200.querySelector('a[href$="/200"]'),null,'没有额外原楼入口');
assert.equal(p200.querySelector('.ldt-direct-replies'),null,'没有自造加载回复按钮');
p200.querySelector('.reply').click();assert.equal(actions.at(-1)[0],'replyToPost');assert.equal(actions.at(-1)[1].post_number,200);
p200.querySelector('.like').click();assert.equal(actions.at(-1)[0],'native-like');
p200.querySelector('.discourse-boosts__bubble').click();assert.equal(p200.querySelector('.discourse-boosts__bubble').getAttribute('aria-expanded'),'true','原生 Boost 交互保持');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="201"]').dataset.ldtDepth,'1');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="202"]').dataset.ldtDepth,'2','回复的回复递进');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="202"] .ldt-owner-label').textContent,'OP');
assert.ok(views.every(a=>/^ldt-post-\d+$/.test(a.elementId)),'创建模型不可破坏楼号和元素 ID');
assert.equal(d.querySelector('.ldt-reader-check'),null,'不出现检查新回复按钮');
assert.ok(d.querySelector('.ldt-owned > [data-post-number="201"] .ldt-relation').textContent.includes('作者200'));
const footer=d.querySelector('.ldt-reader-more');footer.getBoundingClientRect=()=>({top:pages<2?600:10000,bottom:pages<2?640:10040,height:40});w.dispatchEvent(new w.Event('scroll'));
await until(()=>d.querySelector('.ldt-owned > [data-post-number="259"]'),'完整帖流连续自动分页，无漏页');assert.equal(pages,2);
assert.ok(calls.some(c=>c.includes('filter_top_level_replies')),'单独读取主楼统计列表，不用于评论分页');
assert.equal(d.querySelector('.ldt-reader-window').scrollTop,0);assert.equal(w.getComputedStyle(d.querySelector('.ldt-reader-window')).overflowY,'visible');
const nested=d.querySelector('.ldt-owned > [data-post-number="201"]');nested.getBoundingClientRect=()=>({top:100,bottom:200,height:100});d.querySelector('.ldt-reader-window').getBoundingClientRect=()=>({top:0,bottom:3000,height:3000});w.dispatchEvent(new w.Event('scroll'));await until(()=>saved['topic-reading:42']?.read.includes(201),'楼中楼停留计为已读');
assert.equal(d.querySelector('.ldt-progress-total').title,'已加载 58 / 共 997 条顶层回复','顶层回复计数排除首帖和楼中楼回复');
const op=d.querySelector('.ldt-owned > [data-post-number="1"]');op.getBoundingClientRect=()=>({top:210,bottom:310,height:100});w.dispatchEvent(new w.Event('scroll'));await until(()=>saved['topic-reading:42']?.read.includes(1),'首帖同样计为已读');
newReply=true;poll();await until(()=>d.querySelector('.ldt-owned > [data-post-number="1001"]'),'后台检测并显示新回复');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="1001"]').dataset.ldtDepth,'2');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="1001"] .names .ldt-unread').textContent,'新回复','新回复标签放在名字旁边');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="200"]'),p200,'分页和后台更新不替换旧评论，避免闪烁与事件丢失');
assert.ok(new Set(views.map(a=>a.elementId)).size===views.length,'每层原生 ID 唯一');
for (const node of d.querySelectorAll('.ldt-owned > [data-post-number]')) {
 const number=Number(node.dataset.postNumber);
 const top=number===1?-1116:number===200?-1016:1784+(number-203)*2;
 node.getBoundingClientRect=()=>({top,bottom:top+2,height:2});
}
d.querySelector('.ldt-reader-window').getBoundingClientRect=()=>({top:-1116,bottom:1884,height:3000});
w.dispatchEvent(new w.Event('scroll'));await pause(25);
assert.equal(d.querySelector('.ldt-progress-rail').getAttribute('aria-valuenow'),'199','定位条按当前顶层回复的全话题序号显示，楼内回复不增加序号');
assert.equal(d.querySelector('.ldt-progress-total').textContent,'已加载58 条');
assert.equal(d.querySelector('.ldt-progress-total > span:last-child').textContent,'58 条','数量整体排版，不拆散换行');
const requestsBeforeTop=calls.length;scroll=1000;d.querySelector('.start-date').click();assert.equal(scroll,0,'已有首帖时点击顶部日期直接回到开头，不刷新页面');assert.equal(calls.length,requestsBeforeTop,'回开头不重新抓取帖子');assert.equal(d.querySelector('.ldt-owned > [data-post-number="200"]'),p200,'回开头保留评论节点');assert.equal(w.getComputedStyle(d.querySelector('.ldt-progress-total')).cursor,'default','统计文本使用箭头光标');
const endDate=d.querySelector('.now-date');endDate.href='/t/topic/42/259';endDate.click();assert.equal(scroll,10040-w.innerHeight,'已加载末帖时底部日期滚到整个评论区的底端，不受末帖在楼中楼中的位置影响');assert.equal(calls.length,requestsBeforeTop,'定位已加载末帖不重新抓取帖子');assert.equal(d.querySelector('.ldt-owned > [data-post-number="200"]'),p200);
endDate.href='/t/topic/42/1000';endDate.click();assert.equal(navigations.at(-1),endDate.href,'末帖未缓存时允许导航获取，原站点击监听不能抢先处理');
d.querySelector('[data-mode="quote"]').click();assert.equal(d.querySelector('.ldt-independent'),null);assert.equal(d.querySelector('#original-like'),originalButton,'退出时恢复原流节点和事件');assert.equal(native.classList.contains('ldt-native-hidden'),false);
scroll=0;d.querySelector('.start-date').click();assert.equal(scroll,999,'引用模式仍交给原站日期处理');
w.close();console.log('PASS: 原生组件/话题上下文与回复事件、Boost 原生交互、首帖、完整帖流自动分页、楼中楼关系、已读计数、单滚动、退出恢复；无原楼及加载状态按钮');
