// 组件边界夹具：浏览器验收另使用论坛真正的时间轴组件。
export function installNativeTimelineFixture(w) {
 const load=w.require;
 const aside=w.document.querySelector('.timeline-container');if(aside){const topic=w.document.createElement('div');topic.className='topic-timeline';topic.append(...aside.childNodes);aside.append(topic)}
 const theme=w.document.createElement('style');theme.textContent='.timeline-container .topic-timeline .timeline-controls,.timeline-container .topic-timeline .timeline-footer-controls{display:flex}';w.document.head.append(theme);
 class Timeline {
  constructor(args){this.args=args;this.percentage=0;this.dragging=false;this.calculatePosition()}
  calculatePosition(){this.total=this.args.model.postStream.filteredPostsCount;this.current=Math.min(this.total,Math.floor(this.total*this.percentage)+1);if(this.root){const label=this.root.querySelector('.timeline-replies'),text=`${this.current} / ${this.total}`;if(label.textContent!==text)label.textContent=text}}
  postScrolled(event){this.percentage=event.percent;this.calculatePosition()}
  mount(root){this.root=root;root.innerHTML='<div class="timeline-controls"><button>附加顶部控件</button></div><div class="timeline-scrollarea-wrapper"><div class="timeline-scrollarea"><div class="timeline-scroller"><div class="timeline-replies"></div></div></div></div><div class="timeline-footer-controls"><button>附加底部控件</button></div>';this.calculatePosition()}
 }
 const nativeScrolled=Timeline.prototype.postScrolled;
 Object.defineProperty(Timeline.prototype,'postScrolled',{configurable:true,get(){const bound=nativeScrolled.bind(this);Object.defineProperty(this,'postScrolled',{value:bound,configurable:true});return bound}});
 const ember=load('@ember/component'),base=ember.default;
 w.require=name=>{
  if(name==='discourse/components/topic-timeline/container')return{default:Timeline};
  if(name==='@ember/component')return{...ember,setComponentTemplate:(_,component)=>component,default:{...base,extend(props){const original=base.extend(props);return{create(properties){const entry=properties.renderGlimmer._registrations[0];if(!entry.component.args.model)return original.create(properties);return{appendTo(){this.root=w.document.createElement('div');entry.element.append(this.root);this.instance=new entry.component.component(entry.component.args);this.instance.mount(this.root)},destroy(){this.root?.remove()}}}}}}};
  return load(name);
 };
}
