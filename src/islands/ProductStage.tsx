import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { filmChapters, filmReducer, filmSnapshot, initialFilm, sample, type FilmSeat } from "../../shared/demo/film";
import { FilmScene, FilmModal } from "./FilmScenes";
import type { StageController, StagePose } from "./stage/createStage";
import "../styles/film.css";
import { brand } from "../../shared/brand";

function PlayIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>; }

export default function ProductStage({ variant = "home" }: { variant?: "home" | "focus" }) {
  const [state,dispatch] = useReducer(filmReducer,undefined,initialFilm);
  const [reduced,setReduced] = useState(false);
  const [active,setActive] = useState(true);
  const [engine,setEngine] = useState("html");
  const [hydrated,setHydrated] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<StageController|null>(null);
  const previousRects = useRef(new Map<string,DOMRect>());
  const animations = useRef<Animation[]>([]);
  const record = filmSnapshot(state);
  const chapter = filmChapters[state.chapter]!;
  const pose: StagePose = { chapter: state.chapter as StagePose["chapter"], connected:state.chapter>0,decision:record.awarded?"approved":"pending",blocked:state.missing,seat:state.seat,scenario:"inspection" };
  const poseRef = useRef(pose); poseRef.current=pose;

  useEffect(()=>{
    setHydrated(true);
    const media=matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion=()=>{setReduced(media.matches);if(media.matches)dispatch({type:"pause"});};
    updateMotion();media.addEventListener("change",updateMotion);
    let intersecting=true;
    const update=()=>setActive(intersecting&&!document.hidden);
    const observer=new IntersectionObserver(([entry])=>{intersecting=Boolean(entry?.isIntersecting);update();},{threshold:0.05});
    if(stage.current)observer.observe(stage.current);
    document.addEventListener("visibilitychange",update);
    return ()=>{media.removeEventListener("change",updateMotion);observer.disconnect();document.removeEventListener("visibilitychange",update);};
  },[]);

  useEffect(()=>{
    if(!hydrated||reduced||!canvas.current)return;
    const nav=navigator as Navigator & {connection?:{saveData?:boolean};deviceMemory?:number};
    if(nav.connection?.saveData||(nav.deviceMemory&&nav.deviceMemory<=2))return;
    const node=canvas.current;let disposed=false;let instance:StageController|null=null;
    const timer=window.setTimeout(()=>{
      void import("./stage/createStage").then(mod=>mod.mountStage(node,{intro:false,reduced:false,onReady:()=>{if(!disposed)setEngine("webgl");},onLost:()=>{if(!disposed)setEngine("html");}})).then(next=>{if(disposed){next.dispose();return;}instance=next;controller.current=next;next.setPose(poseRef.current);next.setPaused(document.hidden);}).catch(()=>{if(!disposed)setEngine("html");});
    },250);
    return ()=>{disposed=true;clearTimeout(timer);instance?.dispose();controller.current=null;setEngine("html");};
  },[hydrated,reduced]);
  useEffect(()=>{controller.current?.setPose(poseRef.current);},[state.chapter,state.seat,state.missing,record.awarded,engine]);
  useEffect(()=>{controller.current?.setPaused(!active);},[active,engine]);

  useEffect(()=>{
    if(!state.playing||!active||reduced)return;
    let last=performance.now();
    const timer=window.setInterval(()=>{const now=performance.now();dispatch({type:"tick",ms:Math.min(now-last,500)});last=now;},100);
    return ()=>clearInterval(timer);
  },[state.playing,active,reduced]);

  // Shared source content moves between real, readable HTML surfaces.
  useLayoutEffect(()=>{
    const target=state.chapter===4 ? stage.current?.querySelector(".report-document") : state.chapter===3&&record.fieldAttached ? stage.current?.querySelector(".field-office") : stage.current;
    const nodes=target?.querySelectorAll<HTMLElement>("[data-flow]");
    animations.current.forEach(a=>a.cancel());animations.current=[];
    const measured=new Map<string,DOMRect>();
    if(nodes)for(const node of nodes){
      const key=node.dataset.flow!;const raw=node.getBoundingClientRect();const frame=stage.current!.getBoundingClientRect();
      const next=new DOMRect(raw.x-frame.x,raw.y-frame.y,raw.width,raw.height);
      if(!next.width||measured.has(key))continue;
      const prior=previousRects.current.get(key);
      if(prior&&!reduced&&(Math.abs(prior.x-next.x)>3||Math.abs(prior.y-next.y)>3)){
        animations.current.push(node.animate([
          {transform:`translate(${prior.x-next.x}px, ${prior.y-next.y}px) scale(${Math.min(1.2,prior.width/next.width)})`,background:brand.highlight,boxShadow:`0 0 0 6px ${brand.highlight}`,position:"relative",zIndex:10},
          {transform:"translate(0,0) scale(1)",background:"transparent",boxShadow:"0 0 0 0 transparent",position:"relative",zIndex:10},
        ],{duration:1100,delay:measured.size*100,easing:"cubic-bezier(.2,.8,.2,1)",fill:"backwards"}));
      }
      measured.set(key,next);
    }
    previousRects.current=measured;
  },[state.chapter,state.seat,reduced,record.fieldAttached,record.reportReady]);
  useEffect(()=>()=>animations.current.forEach(a=>a.cancel()),[]);

  function watch(){
    dispatch({type:"replay"});
    dispatch({type:"seat",seat:"office"});
    if(!reduced)dispatch({type:"play"});
    stage.current?.scrollIntoView({block:"start",behavior:reduced?"auto":"smooth"});
  }
  const total=filmChapters.reduce((sum,c)=>sum+c.duration,0);
  const progress=(filmChapters.slice(0,state.chapter).reduce((sum,c)=>sum+c.duration,0)+state.elapsed)/total*100;
  return <section className={`product-film ${variant==="focus"?"film-focus":""}`} aria-labelledby="film-title" data-hydrated={hydrated} data-reduced={reduced}>
    <div className="film-hero"><div><p className="film-eyebrow"><span/> CPL COMMAND CENTER <span className="early-access">EARLY ACCESS</span></p><h1 id="film-title">Your business.<br/><span>Under command.</span></h1></div><div className="film-intro"><p>From scattered requests<br/>to organized work.</p><span>One connected workflow for your office,<br className="desktop-break"/> field team, and customer.</span><div className="hero-actions"><button onClick={watch}><PlayIcon/>Watch the workflow</button><a href={variant==="home"?"#contact":"/contact/"}>Request a demo <span>↗</span></a></div><small>In development. Explore a fictional job below.</small></div></div>
    <div className="film-deck" id="see-it-work" ref={stage} data-chapter={state.chapter} data-seat={state.seat} data-engine={engine} data-playing={state.playing&&active}>
      <canvas className="film-canvas" ref={canvas} aria-hidden="true"/>
      <div className="film-deck-top"><span className="preview-label"><span/> Interactive product preview · Sample data</span><span className="story-ref">STORY / {sample.id}</span></div>
      <div className="film-scene-heading"><div><span className="film-chapter-number">0{state.chapter+1}<small>/06</small></span><h2>{chapter.title}</h2></div><div className="film-seats" role="group" aria-label="Perspective">{(["office","field","customer"] as FilmSeat[]).map(seat=><button key={seat} aria-pressed={state.seat===seat} onClick={()=>dispatch({type:"seat",seat})}>{seat[0]!.toUpperCase()+seat.slice(1)}</button>)}</div></div>
      <div className="film-stage-content" data-awarded={record.awarded} data-attached={record.fieldAttached} data-reviewed={record.reportReady}><FilmScene state={state} dispatch={dispatch}/></div>
      <div className="film-caption"><p>{chapter.caption}</p>{state.chapter===0&&<button className="film-text-action" onClick={()=>dispatch({type:"chapter",chapter:1})}>Bring it together <span>→</span></button>}{state.chapter===1&&!state.missing&&<button className="film-text-action" onClick={()=>dispatch({type:"exception"})}>Try a missing detail ↗</button>}{state.missing&&<button className="film-text-action" onClick={()=>dispatch({type:"resolve"})}>Supply the access note ✓</button>}</div>
      <div className="film-transport" onKeyDown={e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();dispatch({type:"chapter",chapter:state.chapter+(e.key==="ArrowRight"?1:-1)});}}}><progress className="film-progress" aria-label="Story progress" max={100} value={progress}/><div className="playback-buttons"><button className="play-control" aria-label={reduced?"Next chapter":state.playing?"Pause":"Play"} onClick={()=>dispatch(reduced?{type:"chapter",chapter:state.chapter===5?0:state.chapter+1}:state.playing?{type:"pause"}:{type:"play"})}>{state.playing?"Ⅱ":<PlayIcon/>}<span>{reduced?"Next":state.playing?"Pause":"Play"}</span></button><button className="replay-control" onClick={()=>dispatch({type:"replay"})} aria-label="Replay from start">↺</button><span className="duration">54 SEC</span></div><select className="film-chapter-select" aria-label="Jump to chapter" value={state.chapter} onChange={e=>dispatch({type:"chapter",chapter:Number(e.target.value)})}>{filmChapters.map((item,index)=><option key={item.id} value={index} disabled={state.missing&&index>1}>{String(index+1).padStart(2,"0")} / {item.label}</option>)}</select><nav className="film-chapters" aria-label="Story chapters">{filmChapters.map((item,index)=><button key={item.id} aria-current={state.chapter===index?"step":undefined} disabled={state.missing&&index>1} onClick={()=>dispatch({type:"chapter",chapter:index})}><span>0{index+1}</span>{item.label}</button>)}</nav></div>
      <p className="sr-only" role="status" aria-live="polite">{chapter.label}. {record.status}. {record.next}.</p>
    </div><div className="film-underbar"><span>ONE REQUEST <i/> ONE CONTINUOUS STORY</span><span>{reduced?"Reduced motion: explore still chapters at your pace.":"Explore any chapter. Every interaction pauses playback."}</span><a href="/demo/">{variant==="home"?"Open the full walkthrough ↗":"Sample workflow · no account needed"}</a></div><FilmModal state={state} dispatch={dispatch}/>
  </section>;
}
