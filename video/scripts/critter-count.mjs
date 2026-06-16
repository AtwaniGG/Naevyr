import { chromium } from "playwright";
const today=Math.floor(Date.now()/86400000);
const save={day:today,gold:9999,driftSeason:2,quests:[],tutorialDone:true,ownsMount:true,cosmetics:{name:"T",avatar:"",dye:"gold",eye:"drift",aura:"",pet:""},skills:{woodcutting:{xp:9000,level:18},mining:{xp:9000,level:18},fishing:{xp:6000,level:14},combat:{xp:40000,level:24}},inventory:{},kills:10};
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1200,height:850},deviceScaleFactor:2});
const p=await ctx.newPage(); p.on("pageerror",e=>console.log("PE:",e.message));
await p.addInitScript(s=>localStorage.setItem("driftlands-save-v1",JSON.stringify(s)),save);
await p.goto("http://localhost:3000/play?demo=1",{waitUntil:"domcontentloaded"});
await p.getByRole("button",{name:"Enter the Realm"}).click({timeout:90000});
await p.getByRole("button",{name:"Wander offline"}).click({timeout:30000});
try{await p.locator("input.drift-well").fill("T",{timeout:6000});}catch{}
await p.getByText("Step into the Drift").click({timeout:30000});
await p.waitForFunction(()=>"__demo" in window,null,{timeout:45000});
await p.waitForTimeout(2000);
await p.evaluate(()=>window.__demo.tp(50,38)); await p.waitForTimeout(3500);
const cr = await p.evaluate(()=>window.__demo.critters());
const counts={}; cr.forEach(c=>counts[c.k]=(counts[c.k]||0)+1);
console.log("meadow critters:", cr.length, JSON.stringify(counts));
// zoom onto the nearest critter
const pl = await p.evaluate(()=>window.__demo.player());
const near = cr.sort((a,b)=>Math.hypot(a.x-pl.x,a.y-pl.y)-Math.hypot(b.x-pl.x,b.y-pl.y))[0];
if(near){ await p.evaluate(([x,y])=>window.__demo.tp(x-2,y-2),[near.x,near.y]); await p.evaluate(()=>window.__demo.zoom(3.4)); await p.waitForTimeout(900); await p.screenshot({path:"/tmp/biome2-shots/cc-zoom.png"}); console.log("nearest",near.k,"at",near.x,near.y); }
await b.close();
