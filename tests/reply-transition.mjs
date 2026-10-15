import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const source=readFileSync('linuxdo-comments.user.js','utf8');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label){for(let i=0;i<180&&!fn();i++)await pause(20);assert.ok(fn(),label)}
const post=n=>({id:10000+n,topic_id:42,post_number:n,username:'u'+n,name:'作者'+n,cooked:`<p>正文 ${n}</p>`,reply_count:0,reply_to_post_number:0});
const ids=Array.from({length:20},(_,i)=>10001+i);
let rows=Array.from({length:20},(_,i)=>post(1+i));rows[0].boosts=[{cooked:'谢谢分享'}];rows[1].reply_to_post_number=200;rows[2].reply_to_post_number=201;rows[2].username='u1';
const dom=new JSDOM('<header class="d-header"></header><aside class="timeline-container"><a class="start-date" href="/t/topic/42/1">开始</a><div class="timeline-scrollarea"></div><a class="now-date" href="/t/topic/42/1000">末尾</a></aside><div class="post-stream"><div class="topic-post" data-post-number="200"><article class="boxed"><button id="original-like">原按钮</button></article></div><div class="post-stream--cloaked" data-post-number="800" style="height:200px"></div></div>',{url:'https://linux.do/t/topic/42/200',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;let poll;const interval=w.setInterval.bind(w);w.setInterval=(fn,ms)=>{if(ms===60000)poll=fn;return interval(fn,ms)};const calls=[],actions=[],views=[];let saved={};let scroll=0,pages=0,newReply=false;
Object.defineProperty(w,'scrollY',{get:()=>scroll});w.scrollTo=({top})=>scroll=Math.max(0,top);w.scrollBy=(arg,delta)=>scroll=Math.max(0,scroll+(typeof arg==='object'?arg.top:delta));
const topic={id:42,posts_count:20,details:{can_create_post:true},postStream:{posts:rows,stream:ids}};
const controller={model:topic,send:(...args)=>actions.push(args)};
const owner={lookup:name=>({'controller:topic':controller,'service:store':store,'service:composer':composer,'service:app-events':appEvents})[name]};
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
const listeners=new Map();
const appEvents={
 on(name,callback){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(callback)},
 off(name,callback){listeners.get(name)?.delete(callback)},
 trigger(name,...args){for(const callback of [...(listeners.get(name)||[])])callback(...args)},
};
let savedOptions,nativeJumps=0;
const composer={model:{action:'reply',topic},async save(force,options={}){
 savedOptions=options;
 const created={...post(21),reply_to_post_number:2,set(k,v){this[k]=v}};
 rows.push(created);ids.push(created.id);topic.posts_count=21;topic.highest_post_number=21;
 native.insertAdjacentHTML('beforeend','<div class="topic-post" data-post-number="21"><article class="boxed"><div class="cooked">正文 21</div></article></div>');
 appEvents.trigger('post:created',created);
 if(options.jump!==false){nativeJumps++;scroll=999999}
 return{target:created};
}};
const native=d.querySelector('.post-stream');
native.innerHTML=rows.map(p=>`<div class="topic-post" data-post-number="${p.post_number}"><article class="boxed"><div class="cooked">${p.cooked}</div></article></div>`).join('');
const rect=w.HTMLElement.prototype.getBoundingClientRect;
w.HTMLElement.prototype.getBoundingClientRect=function(){return this.dataset.postNumber==='2'?{top:1100-scroll,bottom:1400-scroll,height:300}:rect.call(this)};
scroll=1000;
w.eval(source);
await until(()=>native.classList.contains('ldt-thread'),'20 帖原生楼中楼初始化');
assert.equal(d.querySelector('.ldt-independent'),null,'短帖先使用原流');
await composer.save(false);
await until(()=>d.querySelector('.ldt-owned > [data-post-number="21"]'),'第 21 帖转换阅读区后立即出现');
assert.equal(savedOptions.jump,false,'跨分页阈值的回复也不定位隐藏流');
assert.equal(nativeJumps,0);
assert.equal(scroll,1000,'转换阅读区保留正在看的评论位置');
assert.equal(d.querySelector('.ldt-owned > [data-post-number="21"]').dataset.ldtDepth,'1');
assert.equal(listeners.get('post:created').size,1,'只保留新阅读区的一份事件监听');
d.querySelector('[data-mode="quote"]').click();await pause(25);
assert.equal(listeners.get('post:created').size,0,'引用模式完全解除接管');
w.close();console.log('PASS: 回复触发 20→21 帖转换，立即显示、保持位置、单次监听及引用模式清理');
