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
Object.defineProperty(w,'scrollY',{get:()=>scroll});w.scrollTo=({top})=>scroll=Math.max(0,top);w.scrollBy=(arg,delta)=>scroll=Math.max(0,scroll+(typeof arg==='object'?arg.top:delta));
const topic={id:42,posts_count:1000,details:{can_create_post:true},postStream:{posts:rows,stream:ids}};
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
let savedOptions, created, outcome='success', nativeJumps=0;
const composer={model:{action:'reply',topic},async save(force,options={}){
 assert.equal(this,composer,'保留原生 save 的 this');savedOptions=options;
 if(outcome==='failed')throw Error('server rejected');
 if(outcome==='enqueued')return{responseJson:{action:'enqueued'}};
 if(this.model.action!=='reply')return{responseJson:{action:'edit_post'}};
 created={...post(outcome==='other-topic'?1002:outcome==='mobile'?1003:1001),cooked:outcome==='mobile'?null:'<p>刚刚发布的回复</p>',reply_to_post_number:201,set(k,v){this[k]=v}};
 if(outcome==='other-topic')created.topic_id=99;
 appEvents.trigger('post:created',created);
 if(options.jump!==false){nativeJumps++;scroll=999999}
 return{target:created,responseJson:{action:'create_post',post:created}};
}};
const native=d.querySelector('.post-stream');
installNativeTimelineFixture(w);
w.eval(source.replace(/\}\)\(\);\s*$/, 'window.replyTest={readerAdd,getState:()=>state};})();'));
await until(()=>d.querySelector('.ldt-owned > [data-post-number="219"]'),'原生阅读区初始化');
const s=w.replyTest.getState(), p200=s.nodes.get(200);s.allowStart=true;
let inserted=false;
p200.getBoundingClientRect=()=>({top:1100-scroll+(inserted?400:0),bottom:1400-scroll+(inserted?400:0),height:300});
s.reader.getBoundingClientRect=()=>({top:-scroll,bottom:20000-scroll,height:20000});
if(process.env.ANCHOR_ONLY!=='1'){
 scroll=1000;
 const options={caller:'native',jump:true};
 const result=await composer.save(false,options);
 assert.equal(savedOptions.jump,false,'楼中楼提交关闭原生隐藏列表定位');
 assert.equal(options.jump,true,'不改写调用方传入的选项');
 assert.equal(result.target,created,'返回原生结果');
 await until(()=>s.nodes.has(1001),'回复成功立即插入，不等待 60 秒轮询');
 assert.equal(s.nodes.get(1001).querySelector('.cooked').textContent,'刚刚发布的回复');
 assert.equal(s.nodes.get(1001).dataset.ldtDepth,'2','回复的回复保留正确层级');
 assert.equal(views.find(v=>v.post.post_number===1001).post,created,'复用刚提交的原生模型');
 assert.ok(s.read.has(1001)&&!s.pending.has(1001),'自己的回复不冒出新回复提醒');
 assert.equal(s.nodes.get(200),p200,'不重建正在看的节点');
 assert.equal(nativeJumps,0,'不定位隐藏原生列表');
 assert.equal(scroll,1000,'新回复无需展开父层时保持当前位置');
 appEvents.trigger('post:created',created);await pause(30);
 assert.equal(d.querySelectorAll('.ldt-owned > [data-post-number="1001"]').length,1,'重复成功通知不重复挂载');
 outcome='failed';await assert.rejects(composer.save(false),/server rejected/);
 assert.equal(s.nodes.size,22,'提交失败不插入乐观假回复');
 outcome='enqueued';await composer.save(false);assert.equal(s.nodes.size,22,'待审核不假装已经发布');
 const fetchBeforeMobile=w.fetch;
 w.fetch=async path=>path==='/posts/by_number/42/1003'?{ok:true,json:async()=>({...post(1003),reply_to_post_number:201})}:fetchBeforeMobile(path);
 outcome='mobile';await composer.save(false);await until(()=>s.nodes.has(1003),'手机成功事件缺正文时立即取回单条回复，不等轮询');
 assert.equal(s.nodes.get(1003).dataset.ldtDepth,'2');
 composer.model.action='edit';outcome='success';await composer.save(false,{caller:'edit'});assert.equal(savedOptions.jump,undefined,'编辑操作保持原行为');
 composer.model={action:'reply',topic:{id:99}};outcome='other-topic';await composer.save(false,{jump:true});assert.equal(savedOptions.jump,true,'其他话题不受拦截');assert.ok(!s.nodes.has(1002),'不混入其他话题的回复');
 composer.model={action:'reply',topic};
}
// 请求父评论期间继续滚动：只能补偿插入高度，不得恢复请求前的旧位置。
let releaseParent, requested=false;const gate=new Promise(resolve=>releaseParent=resolve);const previousFetch=w.fetch;
w.fetch=async path=>path==='/posts/by_number/42/190'?(requested=true,{ok:true,json:async()=>{await gate;return post(190)}}):previousFetch(path);
scroll=1000;const raw={...post(999),reply_to_post_number:190};
const adding=w.replyTest.readerAdd(s,[raw],true);await until(()=>requested,'补取缺失父评论请求');
scroll=1100;const continuedTop=p200.getBoundingClientRect().top;
const append=s.stream.append.bind(s.stream);s.stream.append=(...nodes)=>{append(...nodes);if(nodes.some(n=>n.dataset?.postNumber==='190'))inserted=true};
releaseParent();await adding;
assert.equal(p200.getBoundingClientRect().top,continuedTop,'按请求完成时的阅读位置补偿，不把用户拉回请求前的位置');
assert.equal(scroll,1500,'只补偿新增内容的 400px');
d.querySelector('[data-mode="quote"]').click();await pause(30);
assert.equal(listeners.get('post:created')?.size||0,0,'退出楼中楼解除成功事件监听');
outcome='success';await composer.save(false,{jump:true});assert.equal(savedOptions.jump,true,'引用模式保留原生提交定位');
w.close();console.log('PASS: 回复提交即时同步、隐藏列表不抢滚动、重复/失败/审核/跨话题隔离、模式清理、异步父评论锚点');
