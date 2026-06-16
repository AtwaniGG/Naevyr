import { chromium } from "playwright";
const today=Math.floor(Date.now()/86400000);
const save={day:today,gold:9999,driftSeason:2,quests:[],tutorialDone:true,ownsMount:true,cosmetics:{name:"T",avatar:"",dye:"gold",eye:"drift",aura:"",pet:""},skills:{woodcutting:{xp:9000,level:18},mining:{xp:9000,level:18},fishing:{xp:6000,level:14},combat:{xp:40000,level:24}},inventory:{wood:10,stone:10,fish:5},kills:10};
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
const tp=(x,y)=>p.evaluate(([x,y])=>window.__demo.tp(x,y),[x,y]);
const zoom=z=>p.evaluate(z=>window.__demo.zoom(z),z);
await zoom(1.3);
// meadow: butterflies/birds/deer should gather over a couple seconds
await tp(50,38); await p.waitForTimeout(3500);
await p.screenshot({path:"/tmp/biome2-shots/cc-meadow.png"}); console.log("meadow");
// marsh: frogs/dragonflies/fireflies
await tp(24,58); await p.waitForTimeout(3500);
await p.screenshot({path:"/tmp/biome2-shots/cc-marsh.png"}); console.log("marsh");
await b.close();
