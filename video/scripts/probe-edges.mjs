import { chromium } from "playwright";
const today=Math.floor(Date.now()/86400000);
const mk = (gold, owns) => ({day:today,gold,driftSeason:2,quests:[],tutorialDone:true,ownsMount:owns,cosmetics:{name:"Tester",avatar:"",dye:"gold",eye:"drift",aura:"",pet:""},skills:{woodcutting:{xp:9000,level:18},mining:{xp:9000,level:18},fishing:{xp:6000,level:14},combat:{xp:40000,level:24}},inventory:{wood:10,stone:10,fish:5},kills:10});
async function enter(page, save){
  await page.addInitScript(s=>localStorage.setItem("driftlands-save-v1",JSON.stringify(s)),save);
  await page.goto("http://localhost:3000/play?demo=1&hud=1",{waitUntil:"domcontentloaded"});
  await page.getByRole("button",{name:"Enter the Realm"}).click({timeout:90000});
  await page.getByRole("button",{name:"Wander offline"}).click({timeout:30000});
  try{await page.locator("input.drift-well").fill("Tester",{timeout:6000});}catch{}
  await page.getByText("Step into the Drift").click({timeout:30000});
  await page.waitForFunction(()=>"__demo" in window,null,{timeout:45000});
  await page.waitForTimeout(2500);
}
const b=await chromium.launch();
// PROBE 1: auto-dismount when entering an interior
{
  const ctx=await b.newContext({viewport:{width:1100,height:850},deviceScaleFactor:1});
  const p=await ctx.newPage(); p.on("pageerror",e=>console.log("PE1:",e.message));
  await enter(p, mk(9999,true));
  await p.evaluate(()=>window.__demo.tp(44,52)); await p.waitForTimeout(300);
  await p.evaluate(()=>window.__demo.mount(true)); await p.waitForTimeout(400);
  console.log("P1 mounted before interior:", await p.evaluate(()=>window.__demo.mounted()), "(want true)");
  await p.evaluate(()=>window.__demo.enter("vault")); await p.waitForTimeout(700);
  console.log("P1 mounted inside interior:", await p.evaluate(()=>window.__demo.mounted()), "(want false)");
  await ctx.close();
}
// PROBE 2: broke refusal at the keeper (gold 100 < 3000)
{
  const ctx=await b.newContext({viewport:{width:1100,height:850},deviceScaleFactor:1});
  const p=await ctx.newPage(); p.on("pageerror",e=>console.log("PE2:",e.message));
  await enter(p, mk(100,false));
  await p.evaluate(()=>window.__demo.tp(44,52)); await p.waitForTimeout(300);
  const s=await p.evaluate(()=>window.__demo.toScreen(45,50));
  await p.mouse.click(s.x,s.y); await p.waitForTimeout(1500);
  await p.getByText(/Buy a steed/).click({timeout:8000});
  await p.waitForTimeout(800);
  console.log("P2 gold after broke-buy:", await p.evaluate(()=>window.__demo.gold()), "(want 100)");
  console.log("P2 ownsMount after broke-buy:", await p.evaluate(()=>window.__demo.ownsMount()), "(want false)");
  const txt=await p.evaluate(()=>document.body.innerText);
  console.log("P2 keeper refusal shown:", /Come back with coin|aren't cheap/i.test(txt));
  await ctx.close();
}
await b.close(); console.log("DONE");
