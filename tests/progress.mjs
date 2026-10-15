import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const source = readFileSync('linuxdo-comments.user.js', 'utf8');
const dom = new JSDOM('', { url: 'https://linux.do/', runScripts: 'outside-only', pretendToBeVisual: true });
const w = dom.window;
w.GM_getValue = (_, v) => v; w.GM_setValue = w.GM_registerMenuCommand = w.GM_addStyle = () => {};
w.eval(source.replace(/\}\)\(\);\s*$/, 'window.progressTest = { threadProgress, threadSections, renderProgress };})();'));
const { threadProgress } = w.progressTest;
const node = (top, bottom) => ({ getBoundingClientRect: () => ({ top, bottom, height: bottom - top }) });
// 四条顶层回复，第一串有很多长回复。按页面高度读到一半时，不能误报已读一半回复。
const s = { reader: {}, rootIds: new Map([[20, 0], [30, 1], [40, 2], [50, 3]]), raw: new Map(), nodes: new Map() };
for (const [number, id, top, bottom] of [[1, 10, 0, 100], [2, 20, 100, 700], [3, 30, 700, 800], [4, 40, 800, 900], [5, 50, 900, 1000]]) {
 s.raw.set(number, { id, post_number: number }); s.nodes.set(number, node(top, bottom));
}
for (let n = 6; n <= 100; n++) { s.raw.set(n, { id: 100+n, post_number: n, reply_to_post_number: 2 }); s.nodes.set(n, node(150+n, 151+n)); }
const rect = { top: 0, bottom: 1000, height: 1000 };
assert.equal(threadProgress(s, rect, 0), 0, '首帖不计入顶层回复');
assert.ok(Math.abs(threadProgress(s, rect, .4) - .125) < 1e-8, '第一串读一半为 1/8，子回复不增加分母');
assert.equal(threadProgress(s, rect, .7), .25, '到第二条顶层回复为 25%');
assert.equal(threadProgress(s, rect, .6995), .25, '滚动取整相差半像素时仍定位到目标回复');
assert.equal(threadProgress(s, rect, .8), .5, '到第三条顶层回复为 50%');
assert.equal(threadProgress(s, rect, 1), 1, '完整末尾为 100%');
const small = { ...s, nodes: new Map([...s.nodes].filter(([n]) => n !== 5)), raw: new Map([...s.raw].filter(([n]) => n !== 5)) };
assert.equal(threadProgress(small, { top: 0, bottom: 900, height: 900 }, 1), .75, '只加载前三条，到加载边界仍是 75%，不假报 100%');
const missing = { ...s, rootIds: undefined };
assert.equal(threadProgress(missing, rect, .5), null, '总数尚未确认时不编造进度');
const short = { total: 7, posts: new Map([[1,{number:1,parent:0}],[2,{number:2,parent:0}],[3,{number:3,parent:2}],[4,{number:4,parent:3}],[5,{number:5,parent:0}],[6,{number:6,parent:5}],[7,{number:7,parent:0}]]), stream: w.document.createElement('div') };
for (const [n, top, bottom] of [[1,0,100],[2,100,700],[3,200,300],[4,300,400],[5,700,900],[6,800,850],[7,900,1000]]) { const el=w.document.createElement('div');el.dataset.postNumber=n;el.getBoundingClientRect=()=>({top,bottom,height:bottom-top});short.stream.append(el); }
assert.ok(Math.abs(threadProgress(short, rect, .4) - 1/6) < 1e-8, '短帖同样只统计顶层回复，排除首帖和嵌套回复');
assert.equal(threadProgress(short, rect, 1), 1);
const deep = { ...s, nodes: new Map([[1,node(0,100)],[4,node(100,500)],[5,node(500,1000)]]), raw: new Map([...s.raw].filter(([n])=>[1,4,5].includes(n))) };
assert.equal(threadProgress(deep, rect, .1), .5, '深链接从第三条开始，按全话题的回复序号定位');
assert.equal(threadProgress(deep, rect, 0), .5, '深链接窗口的上沿保持第三条的位置，不被缓存首帖误记为零');
assert.equal(threadProgress({...deep,allowStart:true}, rect, 0),0,'明确点顶部日期才回到开头零进度');
s.rootIds.set(60,4);
assert.equal(threadProgress(s, rect, 1), .8, '新增顶层回复会增加总数，新增楼内回复不会');
const precise={reader:{},rootIds:new Map(Array.from({length:23},(_,i)=>[i,i])),raw:new Map(),progress:w.document.createElement('div')};
precise.progress.innerHTML='<span class="ldt-progress-caption"></span><button class="ldt-progress-rail"></button><span class="ldt-progress-percent"></span><span class="ldt-progress-total"></span>';
for(let i=0;i<23;i++){w.progressTest.renderProgress(precise,i/23);assert.equal(precise.progress.querySelector('.ldt-progress-percent').textContent,`${i+1} / 23`,'浮点边界不显示成上一条');}
w.close(); console.log('PASS: 顶层回复等权进度、嵌套回复、首帖排除、短帖、未加载部分、深链接、总数未知、末尾 100%');
