import {installNativeTimelineFixture} from './support/native-timeline.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const source=readFileSync('linuxdo-comments.user.js','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<180&&!fn();i++)await pause(20);assert.ok(fn(),label)}
const post=n=>({id:10000+n,topic_id:42,post_number:n,username:'u'+n,name:'作者'+n,cooked:`<p>正文 ${n}</p>`,reply_count:0,reply_to_post_number:0});
const ids=Array.from({length:1000},(_,i)=>10001+i);
let rows=Array.from({length:20},(_,i)=>post(200+i));rows[0].boosts=[{cooked:'谢谢分享'}];rows[1].reply_to_post_number=200;rows[2].reply_to_post_number=201;rows[2].username='u1';
const dom=new JSDOM('<header class="d-header"></header><aside class="timeline-container"><div class="timeline-scrollarea-wrapper"><a class="start-date" href="/t/topic/42/1">开始</a><div class="timeline-scrollarea"></div><a class="now-date" href="/t/topic/42/1000">末尾</a></div></aside><div class="post-stream"><div class="topic-post" data-post-number="200"><article class="boxed"><button id="original-like">原按钮</button></article></div><div class="post-stream--cloaked" data-post-number="800" style="height:200px"></div></div>',{url:'https://linux.do/t/topic/42/200',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;let poll;const interval=w.setInterval.bind(w);w.setInterval=(fn,ms)=>{if(ms===60000)poll=fn;return interval(fn,ms)};const calls=[],actions=[],views=[];let saved={};let scroll=0,pages=0,newReply=false;
Object.defineProperty(d.documentElement,'scrollHeight',{value:100000,configurable:true});
Object.defineProperty(w,'scrollY',{get:()=>scroll});w.scrollTo=({top})=>scroll=Math.max(0,top);w.scrollBy=(arg,delta)=>scroll=Math.max(0,scroll+(typeof arg==='object'?arg.top:delta));
const topic={id:42,posts_count:1000,details:{can_create_post:true},postStream:{posts:rows,stream:ids}};
const controller={model:topic,send:(...args)=>actions.push(args)};
const navigationEvents=[];
const owner={lookup:name=>name==='controller:topic'?controller:name==='service:app-events'?{trigger:(...args)=>navigationEvents.push(args)}:store};
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
let footerCalls=0,finishFooter;const footerReady=new Promise(resolve=>finishFooter=resolve);
topic.postStream.loadedAllPosts=false;
const nativeFooter=d.createElement('section');nativeFooter.id='topic-footer-buttons';nativeFooter.innerHTML='<button>分享</button><button>添加为书签</button><button>举报</button><button>标记为未读</button><button>回复</button>';
nativeFooter.querySelector('button').onclick=()=>actions.push(['native-share']);
topic.updateFromJson=data=>{topic.suggested_topics=data.suggested_topics;topic.related_topics=data.related_topics};
let transformations=0;topic.constructor={applyTransformations:async models=>{assert.equal(models[0],topic);transformations++}};
topic.postStream.updateFromJson=tail=>{assert.equal(tail.posts.at(-1).id,11000);topic.postStream.loadedAllPosts=true;native.after(nativeFooter);const more=d.createElement('section');more.className='more-topics__container';if(topic.suggested_topics?.length&&topic.related_topics?.length){more.innerHTML='<button>推荐</button><button>相关</button><a id="fixture-recommendation"></a>';const link=more.querySelector('a');const show=tab=>{const item=tab==='推荐'?topic.suggested_topics[0]:topic.related_topics[0];link.textContent=item.title;link.href='/t/topic/'+item.id};more.querySelectorAll('button').forEach(button=>button.onclick=()=>show(button.textContent));show('推荐')}nativeFooter.after(more)};
const beforeFooterFetch=w.fetch;w.fetch=async path=>{if(path!=='/t/42/1000.json')return beforeFooterFetch(path);footerCalls++;await footerReady;return{ok:true,json:async()=>({id:42,suggested_topics:[{id:7,title:'推荐话题'}],related_topics:[{id:8,title:'相关话题'}],post_stream:{stream:ids,posts:[post(1000)]}})}};
let footerNotified=0;controller.notifyPropertyChange=name=>{assert.equal(name,'loadedAllPosts');footerNotified++};

installNativeTimelineFixture(w);
w.eval(source.replaceAll('location.assign(', 'window.navigate(').replace(/\}\)\(\);\s*$/, 'window.navigationTest={locateRoot,readerJump,readerFetch,updateReader,getState:()=>state};})();'));
await until(()=>d.querySelector('.ldt-owned > [data-post-number="219"]'),'阅读区初始化');
assert.equal(footerCalls,1,'阅读区准备完成即预备原生页尾，不等用户到底');
await until(()=>d.querySelector('.ldt-progress-total')?.title,'顶层回复总数确定');
const s=w.navigationTest.getState(),component=s.timelineComponent,rootIds=[...s.rootIds.keys()];
assert.ok(component,'挂载原站时间轴组件');
for(const e of s.progress.querySelectorAll('.timeline-controls,.timeline-footer-controls'))assert.equal(w.getComputedStyle(e).display,'none','论坛主题高优先级规则不能让重复控件重新出现');assert.equal(d.querySelector('.ldt-progress-rail'),null,'不再创建自制滑块');
assert.equal(component.args.model.postStream.filteredPostsCount,997,'排除首帖和两条嵌套回复');
const panel=s.progress;
const pointer=type=>panel.querySelector('.timeline-scrollarea').dispatchEvent(new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0}));
const fetchBefore=w.fetch;
w.fetch=async path=>path.includes('/posts.json?')?{ok:true,json:async()=>{calls.push(path);return{post_stream:{posts:new URLSearchParams(path.split('?')[1]).getAll('post_ids[]').map(id=>post(Number(id)-10000))}}}}:fetchBefore(path);
const before=calls.length;
pointer('pointerdown');component.dragging=true;
for(let n=0;n<30;n++){component.percentage=n/30;component.calculatePosition();w.navigationTest.updateReader(s)}
assert.equal(calls.length,before,'原生拖动预览不发送定位请求');assert.equal(navigations.length,0);
component.dragging=false;component.args.jumpToIndex(499);await until(()=>navigations.length===1,'原生松手出口定位未加载的讨论');
component.args.jumpEnd();assert.equal(navigations.at(-1),'/t/topic/42/1000','原生拖动到末端走整个话题的末页，不能只滚到当前加载边界');assert.equal(w.sessionStorage.getItem('ldt-jump-end'),'42');navigations.pop();
const target=rootIds[498];assert.equal(navigations[0],`/t/topic/42/${target-10000}`);
const query=calls.filter(p=>p.includes('/posts.json?'));assert.equal(query.length,1);assert.deepEqual(new URLSearchParams(query[0].split('?')[1]).getAll('post_ids[]'),[String(target)]);
const cached=s.nodes.get(200);cached.getBoundingClientRect=()=>({top:200-scroll,bottom:300-scroll,height:100});s.allowStart=true;
const cachedIndex=rootIds.indexOf(10200),beforeCached=calls.length;
await component.args.jumpToIndex(cachedIndex+1);
assert.equal(scroll,188,'已加载目标直接滚到对应讨论');assert.equal(calls.length,beforeCached);assert.equal(navigations.length,1);
const expanded=d.createElement('div');expanded.className='timeline-fullscreen';d.body.append(expanded);
await component.args.jumpToIndex(cachedIndex+1);assert.equal(navigationEvents.at(-1)[0],'topic:jump-to-post','缓存定位也使用原生事件收起进度弹层');expanded.remove();
// 主动定位不属于用户向上越界，不能被反向分页保护拉回。
const firstPost=s.nodes.get(1);firstPost.getBoundingClientRect=()=>({top:20-scroll,bottom:120-scroll,height:100});
s.allowStart=false;s.headCursor=199;s.lastScrollY=1000;scroll=1000;
w.navigationTest.readerJump(s,1);assert.equal(scroll,8,'主动定位首帖不能被读取窗口上沿拦回去');s.allowStart=true;
// 存在 DOM 的远处父评论只有上下文，不能当作完整已加载页直接滚动。
s.raw.set(190,post(190));s.nodes.set(190,d.createElement('div'));
await component.args.jumpToIndex(rootIds.indexOf(10190)+1);assert.equal(navigations.at(-1),'/t/topic/42/190','远处上下文定位回原生附近页');navigations.pop();s.nodes.delete(190);s.raw.delete(190);
// 数据虽缓存，页面高度却不足以将目标放到阅读线：原生附近页才是可准确定位的窗口。
Object.defineProperty(d.documentElement,'scrollHeight',{value:w.innerHeight+100,configurable:true});
await component.args.jumpToIndex(cachedIndex+1);assert.equal(navigations.at(-1),'/t/topic/42/200','不能把被浏览器截断的滚动当作已准确到达');navigations.pop();
Object.defineProperty(d.documentElement,'scrollHeight',{value:100000,configurable:true});
let release;const gate=new Promise(resolve=>release=resolve),slowId=rootIds[700];
w.fetch=async path=>path.endsWith(`post_ids[]=${slowId}`)?{ok:true,json:async()=>{await gate;return{post_stream:{posts:[post(slowId-10000)]}}}}:fetchBefore(path);
const old=component.args.jumpToIndex(701);
await component.args.jumpToIndex(cachedIndex+1);release();await old;
assert.equal(navigations.length,1,'较慢的旧定位请求不能覆盖后一次选择');
let finishOld;const oldGate=new Promise(resolve=>finishOld=resolve);
w.fetch=async path=>({ok:true,json:async()=>{await oldGate;return{post_stream:{posts:[post(slowId-10000)]}}}});
const outstanding=component.args.jumpToIndex(701);
pointer('pointerdown');finishOld();await outstanding;
assert.equal(navigations.length,1,'开始新的原生拖动即作废旧请求，不能在松手之前被旧目标带走');
await component.args.jumpToIndex(cachedIndex+1);
let finishDate;const dateGate=new Promise(resolve=>finishDate=resolve);
w.fetch=async()=>({ok:true,json:async()=>{await dateGate;return{post_stream:{posts:[post(slowId-10000)]}}}});
const beforeDate=navigations.length,waitingDate=component.args.jumpToIndex(701);component.args.jumpEnd();finishDate();await waitingDate;
assert.equal(navigations.length,beforeDate+1,'末尾操作立即作废旧的异步定位');assert.equal(navigations.at(-1),'/t/topic/42/1000');navigations.pop();
w.navigationTest.updateReader(s);const current=component.current;component.postScrolled({postIndex:900,percent:1});assert.equal(component.current,current,'隐藏原列表的滚动事件不能覆盖楼中楼的实际位置');

let idleMutations=0;await pause(30);const idleObserver=new w.MutationObserver(records=>idleMutations+=records.length);idleObserver.observe(s.progress,{childList:true,subtree:true});await pause(100);idleObserver.disconnect();assert.equal(idleMutations,0,'静止时不反复重建文字，避免闪烁和持续重排');
// 只使用原站的末尾加载流程恢复底部功能，不伪造 loadedAllPosts。
finishFooter();
s.more.getBoundingClientRect=()=>({top:600,bottom:640,height:40});w.dispatchEvent(new w.Event('scroll'));
await until(()=>d.querySelector('#topic-footer-buttons'),'接近阅读区底部恢复原生操作和推荐');
assert.equal(footerCalls,1);assert.equal(footerNotified,1,'原生加载完成后通知页尾重新计算');
assert.equal(nativeFooter.dataset.ldtFooter,'pending','评论仍有后页时只准备数据，不抢先展示页尾');
s.cursor=s.ids.length;s.rootRemaining.clear();s.loadingNext=true;w.navigationTest.updateReader(s);
assert.equal(nativeFooter.dataset.ldtFooter,'pending','最后一批评论尚在插入时继续等待');
s.loadingNext=false;w.navigationTest.updateReader(s);assert.equal(nativeFooter.dataset.ldtFooter,'shown','评论末尾稳定后展示完整页尾');
s.loadingNext=true;w.navigationTest.updateReader(s);assert.equal(nativeFooter.dataset.ldtFooter,'shown','后续更新不让已展示页尾反复闪烁');s.loadingNext=false;
nativeFooter.querySelector('button').click();assert.equal(actions.at(-1)[0],'native-share');
assert.equal(transformations,1,'沿用原站话题数据转换');
assert.equal(d.querySelector('#fixture-recommendation')?.textContent,'推荐话题','推荐区需要同步整份话题响应，不能只更新帖流');
d.querySelector('.more-topics__container button:last-of-type').click();assert.equal(d.querySelector('#fixture-recommendation')?.textContent,'相关话题','相关列表同样可用');
assert.equal(s.nodes.get(200),cached,'恢复页尾不重建正在看的评论');
w.dispatchEvent(new w.Event('scroll'));await pause(25);assert.equal(footerCalls,1,'原生页尾已就绪时不重复请求');
let attempts=0;
w.fetch=async()=>{attempts++;if(attempts===1)throw new TypeError('网络暂时断开');if(attempts===2)return{ok:false,status:503};return{ok:true,json:async()=>({ok:true})}};
assert.equal((await w.navigationTest.readerFetch(s,'/fixture/recovery')).ok,true);assert.equal(attempts,3,'临时网络失败和服务繁忙自动恢复');
attempts=0;w.fetch=async()=>{attempts++;return{ok:false,status:404}};
await assert.rejects(w.navigationTest.readerFetch(s,'/fixture/missing'));assert.equal(attempts,1,'不存在的内容不重复请求');
attempts=0;w.fetch=async()=>{attempts++;throw new TypeError('网络暂时断开')};
const cancelled=w.navigationTest.readerFetch(s,'/fixture/cancel');const rejected=assert.rejects(cancelled);
await pause(30);
d.querySelector('[data-mode="quote"]').click();await pause(25);
await rejected;assert.equal(attempts,1,'切换引用后取消等待中的重试，不覆盖新页面');
assert.equal(d.querySelector('#topic-footer-buttons'),nativeFooter,'切回引用模式保留同一个原生页尾');
assert.equal(nativeFooter.hasAttribute('data-ldt-footer'),false,'引用模式完全清除页尾出现控制');
assert.equal(d.querySelector('.ldt-reading-progress'),null,'引用模式恢复原始定位条');
w.close();console.log('PASS: 顶层回复拖动预览/松手单条定位/缓存直达/旧请求隔离、原生页尾及推荐/相关数据同步与切换、引用模式保留');
