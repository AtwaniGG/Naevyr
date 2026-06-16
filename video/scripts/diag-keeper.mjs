import { chromium } from "playwright";
const today=Math.floor(Date.now()/86400000);
const save={day:today,gold:9999,driftSeason:2,quests:[],tutorialDone:true,ownsMount:false,cosmetics:{name:"Tester",avatar:"",dye:"gold",eye:"drift",aura:"",pet:""},skills:{woodcutting:{xp:9000,level:18},mining:{xp:9000,level:18},fishing:{xp:6000,level:14},combat:{xp:40000,level:24}},inventory:{wood:10,stone:10,fish:5},kills:10};
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1200,height:900},deviceScaleFactor:1});
const p=await ctx.newPage();
p.on("pageerror",e=>console.log("PAGEERROR:",e.message));
await p.addInitScript(s=>localStorage.setItem("driftlands-save-v1",JSON.stringify(s)),save);
await p.goto("http://localhost:3000/play?demo=1&hud=1",{waitUntil:"domcontentloaded"});
await p.getByRole("button",{name:"Enter the Realm"}).click({timeout:90000});
await p.getByRole("button",{name:"Wander offline"}).click({timeout:30000});
try{await p.locator("input.drift-well").fill("Tester",{timeout:6000});}catch{}
await p.getByText("Step into the Drift").click({timeout:30000});
await p.waitForFunction(()=>"__demo" in window,null,{timeout:45000});
await p.waitForTimeout(2500);
// tp near the stable, then click the stable cell
await p.evaluate(()=>window.__demo.tp(44,52));
await p.waitForTimeout(400);
const s=await p.evaluate(()=>window.__demo.toScreen(45,50));
console.log("stable screen:",s);
await p.mouse.click(s.x,s.y);
await p.waitForTimeout(1500);
const txt=await p.evaluate(()=>document.body.innerText);
console.log("HAS 'Hostler':", txt.includes("Hostler"), "| HAS 'Buy a steed':", txt.includes("Buy a steed"), "| HAS 'Stable':", txt.includes("Stable"));
console.log("BODY SNIPPET:", txt.replace(/\n+/g," ").slice(0,500));
await p.screenshot({path:"/tmp/conn-shots/diag-keeper.png"});
await b.close();
