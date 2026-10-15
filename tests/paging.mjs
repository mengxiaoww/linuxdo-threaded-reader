import {installNativeTimelineFixture} from './support/native-timeline.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const tail=process.env.TAIL_END==='1', jump=process.env.TAIL_JUMP==='1', fast=process.env.FAST_UP==='1';
let releasePrevious;const previousGate=new Promise(resolve=>releasePrevious=resolve);
const source=readFileSync('linuxdo-comments.user.js','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<180&&!fn();i++)await pause(20);assert.ok(fn(),label)}
const post=n=>({id:10000+n,topic_id:42,post_number:n,username:'u'+n,name:'作者'+n,cooked:`<p>正文 ${n}</p>`,reply_count:0,reply_to_post_number:0});
const ids=Array.from({length:23},(_,i)=>10001+i);
const all=Array.from({length:23},(_,i)=>post(i+1));for(const [n,parent] of [[9,8],[11,4],[12,11],[13,12],[15,12],[17,13],[18,17],[21,20]])all[n-1].reply_to_post_number=parent;let rows=all.slice(3);
const dom=new JSDOM('<header class="d-header"></header><aside class="timeline-container"><div class="timeline-scrollarea-wrapper"><a class="start-date" href="/t/topic/42/1">开始</a><div class="timeline-scrollarea"></div><a class="now-date" href="/t/topic/42/1000">末尾</a></div></aside><div class="post-stream"><div class="topic-post" data-post-number="200"><article class="boxed"><button id="original-like">原按钮</button></article></div><div class="post-stream--cloaked" data-post-number="800" style="height:200px"></div></div>',{url:`https://linux.do/t/topic/42/${tail?23:4}`,runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;let poll;const interval=w.setInterval.bind(w);w.setInterval=(fn,ms)=>{if(ms===60000)poll=fn;return interval(fn,ms)};const calls=[],actions=[],views=[];let saved={};let scroll=0,pages=0,newReply=false;
Object.defineProperty(w,'scrollY',{get:()=>scroll});w.scrollTo=({top})=>scroll=Math.max(0,top);w.scrollBy=(arg,delta)=>scroll=Math.max(0,scroll+(typeof arg==='object'?arg.top:delta));
const topic={id:42,posts_count:23,details:{can_create_post:true},postStream:{posts:rows,stream:ids}};
const controller={model:topic,send:(...args)=>actions.push(args)};
const owner={lookup:name=>name==='controller:topic'?controller:store};
const store={createRecord:(type,data)=>{const record={...data,set(k,v){this[k]=v}}; for(const key of Object.keys(data)) delete data[key]; return record}};
const Base={extend:()=>({create:props=>({appendTo(container){const entry=props.renderGlimmer._registrations[0],args=entry.component.args,p=args.post;views.push(args);const root=d.createElement('div');root.className='topic-post';root.dataset.postNumber=p.post_number;root.innerHTML=`<article class="boxed"><div class="row"><div class="topic-avatar"><img class="avatar"></div><div class="topic-body"><div class="topic-meta-data"><span class="names"><span class="first">${p.name}</span></span></div><div class="cooked">${p.cooked}</div><div class="post-menu-area"><button class="like">赞</button><button class="reply">回复</button><div class="discourse-boosts__post-menu">${(p.boosts||[]).map(b=>`<button class="discourse-boosts__bubble">${b.cooked}</button>`).join('')}</div></div></div></div></article>`;root.querySelector('.reply').onclick=args.replyToPost;root.querySelector('.like').onclick=()=>actions.push(['native-like',p]);root.querySelector('.discourse-boosts__bubble')?.addEventListener('click',e=>e.currentTarget.setAttribute('aria-expanded','true'));entry.element.append(root);this.root=root},destroy(){this.root?.remove()}})})};
w.require=name=>({
 'discourse/lib/get-owner':{getOwnerWithFallback:()=>owner},'@ember/application':{getOwner:()=>owner,setOwner:()=>{}},'@ember/component':{default:Base,getComponentTemplate:()=>({})},'@ember/runloop':{run:fn=>fn()},'discourse/components/render-glimmer-container':{default:{}},'discourse/components/post':{default:{}},'ember-curry-component':{default:(component,args)=>({component,args})}
}[name]);
w.Discourse={lookup:()=>controller};w.GM_getValue=(k,v)=>saved[k]??v;w.GM_setValue=(k,v)=>saved[k]=v;w.GM_registerMenuCommand=()=>{};w.GM_addStyle=css=>{const el=d.createElement('style');el.textContent=css;d.head.append(el)};
w.fetch=async path=>{calls.push(path);return{ok:true,json:async()=>{
 if(path.includes('filter_top_level_replies=true'))return{post_stream:{stream:all.filter(p=>!p.reply_to_post_number).map(p=>p.id),posts:[all[0],all[1],all[3]]}};
 if(path==='/posts/by_number/42/1')return all[0];
 if(path.includes('/posts.json?')){if(fast)await previousGate;const requested=new URLSearchParams(path.split('?')[1]).getAll('post_ids[]').map(Number);return{post_stream:{posts:all.filter(p=>requested.includes(p.id))}}}
 throw Error(path);
}}};
const native=d.querySelector('.post-stream');if(jump)w.sessionStorage.setItem('ldt-jump-end','42');installNativeTimelineFixture(w);
w.eval(source);
if(tail||jump){
 await until(()=>d.querySelector('.ldt-progress-total')?.title,'取得全话题顶层回复总数');
 assert.equal(d.querySelector('.ldt-owned >[data-post-number="2"]'),null,'直接跳末尾不补拉旧正文');
 const footer=d.querySelector('.ldt-reader-more');footer.getBoundingClientRect=()=>({top:600,bottom:640,height:40});
 d.querySelector('.ldt-reader-window').getBoundingClientRect=()=>({top:-1000,bottom:600,height:1600});
 w.dispatchEvent(new w.Event('scroll'));await pause(650);
 assert.equal(calls.filter(p=>p.includes('/posts.json?')).length,0,'直接跳末尾不启动历史回复补齐');
 assert.equal(d.querySelector('.ldt-native-timeline .timeline-replies').textContent,'14 / 14');
 assert.equal(d.querySelector('.ldt-progress-total').textContent,'已加载12 条');
 assert.equal(d.querySelector('.ldt-progress-total').title,'已加载 12 / 共 14 条顶层回复','实际加载数量保留，不伪造满载');
 assert.equal(footer.textContent,'已到帖末');
 if(fast){
  const anchor=d.querySelector('.ldt-owned >[data-post-number="4"]');
  anchor.getBoundingClientRect=()=>{const top=2000+(d.querySelector('.ldt-owned >[data-post-number="2"]')?200:0)-scroll;return{top,bottom:top+100,height:100}};
  d.querySelector('.ldt-reader-window').getBoundingClientRect=()=>({top:-scroll,bottom:4000-scroll,height:4000});
  scroll=3000;
  for(let i=0;i<20;i++){const wheel=new w.WheelEvent('wheel',{deltaY:-100000,cancelable:true,bubbles:true});anchor.dispatchEvent(wheel);assert.equal(wheel.defaultPrevented,true,'高速滚轮越界前先停在已加载窗口上沿');}
  assert.equal(scroll,1988,'等待上一页期间不滚进缓存首帖');
  assert.equal(calls.filter(p=>p.includes('/posts.json?')).length,1,'连续快速滚轮只发一个前页请求');
  releasePrevious();await until(()=>d.querySelector('.ldt-owned >[data-post-number="3"]'),'前页返回');
  assert.equal(anchor.getBoundingClientRect().top,12,'插入前页后原评论保持屏幕位置');
  assert.equal(scroll,2188,'只补偿新插入高度，不跳到顶部');
 }else{
 const anchor=d.querySelector('.ldt-owned >[data-post-number="4"]');anchor.getBoundingClientRect=()=>({top:100,bottom:200,height:100});
 d.querySelector('.ldt-reader-window').getBoundingClientRect=()=>({top:-600,bottom:1000,height:1600});
 scroll=500;w.dispatchEvent(new w.Event('scroll'));await pause(25);scroll=400;w.dispatchEvent(new w.Event('scroll'));
 await until(()=>d.querySelector('.ldt-owned >[data-post-number="3"]'),'跳末尾后向上阅读仍自动加载前一批');
 assert.equal(d.querySelector('.ldt-owned >[data-post-number="4"]'),anchor);
 assert.notEqual(d.querySelector('.ldt-native-timeline .timeline-replies').textContent,'14 / 14','上滑后进度正常回退');
 assert.equal(d.querySelector('.ldt-progress-total').title,'已加载 14 / 共 14 条顶层回复');
 const paging=calls.filter(p=>p.includes('/posts.json?'));assert.equal(paging.length,1);assert.ok(new URLSearchParams(paging[0].split('?')[1]).getAll('post_ids[]').length<=20,'向上只加载前一批，不扫描全部历史');
 assert.equal(d.querySelector('.ldt-unread'),null,'反向载入的历史回复不标为新回复');

 }
 w.close();console.log('PASS: 直接跳末尾立即定位到最后一条顶层回复，不扫描历史；上滑后进度回退并自动加载前一批，保留节点和真实数量');
}else{
await until(()=>d.querySelector('.ldt-owned >[data-post-number="2"]'),'统计返回的历史正文直接复用');
assert.equal(d.querySelector('.ldt-progress-total').title,'已加载 13 / 共 14 条顶层回复','从第 4 层进入时识别第 2、3 层缺失，不能伪造满载');
const anchor=d.querySelector('.ldt-owned >[data-post-number="4"]');
const footer=d.querySelector('.ldt-reader-more');footer.getBoundingClientRect=()=>({top:600,bottom:640,height:40});w.dispatchEvent(new w.Event('scroll'));
await until(()=>d.querySelector('.ldt-owned >[data-post-number="3"]'),'到尾部自动补齐缺失顶层回复');
assert.equal(d.querySelector('.ldt-progress-total').title,'已加载 14 / 共 14 条顶层回复');
assert.equal(d.querySelectorAll('.ldt-owned >[data-post-number]').length,23);
assert.equal(d.querySelector('.ldt-owned >[data-post-number="4"]'),anchor,'补齐前段时保留当前评论节点');
assert.equal(d.querySelector('.ldt-unread'),null,'旧的漏载回复不冒充新回复');
assert.equal(calls.filter(p=>p.includes('/posts.json?')).length,1);
assert.ok(calls.some(p=>p.endsWith('posts.json?post_ids[]=10003')),'只请求缺失顶层回复，不扫描中间整段帖子');
assert.equal(footer.textContent,'已到帖末');
w.close();console.log('PASS: 从第 4 层进入，复用统计正文并按需补齐前段缺失回复，12/14 最终成为实际 14/14；不重建节点、不误报新回复');

}
