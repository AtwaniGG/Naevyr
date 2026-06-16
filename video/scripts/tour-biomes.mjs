import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT="/tmp/biome2-shots"; mkdirSync(OUT,{recursive:true});
const today=Math.floor(Date.now()/86400000);
const save={day:today,gold:9999,driftSeason:2,quests:[],tutorialDone:true,ownsMount:true,cosmetics:{name:"Tester",avatar:"",dye:"gold",eye:"drift",aura:"",pet:""},skills:{woodcutting:{xp:9000,level:18},mining:{xp:9000,level:18},fishing:{xp:6000,level:14},combat:{xp:40000,level:24}},inventory:{wood:10,stone:10,fish:5},kills:10};
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1500,height:950},deviceScaleFactor:1.5});
const p=await ctx.newPage(); p.on("pageerror",e=>console.log("PE:",e.message));
await p.addInitScript(s=>localStorage.setItem("driftlands-save-v1",JSON.stringify(s)),save);
await p.goto("http://localhost:3000/play?demo=1",{waitUntil:"domcontentloaded"});
await p.getByRole("button",{name:"Enter the Realm"}).click({timeout:90000});
await p.getByRole("button",{name:"Wander offline"}).click({timeout:30000});
try{await p.locator("input.drift-well").fill("Tester",{timeout:6000});}catch{}
await p.getByText("Step into the Drift").click({timeout:30000});
await p.waitForFunction(()=>"__demo" in window,null,{timeout:45000});
await p.waitForTimeout(2500);
const tp=(x,y)=>p.evaluate(([x,y])=>window.__demo.tp(x,y),[x,y]);
const zoom=z=>p.evaluate(z=>window.__demo.zoom(z),z);
const shot=async n=>{await p.waitForTimeout(1400);await p.screenshot({path:`${OUT}/${n}.png`});console.log("shot",n);};
await zoom(1.7);
const places=[["1-meadow-heartland",50,40],["2-palewater-NE",58,18],["3-ashenflats-NW",28,28],["4-hollowmere-SW",22,58],["5-bonefields-SE",62,54],["6-meadow2",40,30]];
for(const [n,x,y] of places){await tp(x,y);await shot(n);}
// a wide overview at low zoom near town to compare to the 'empty' shot
await zoom(0.9); await tp(40,40); await shot("0-overview");
await b.close(); console.log("DONE");
