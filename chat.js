import {
deleteField, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
onSnapshot, runTransaction, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
/* =========================================================
Helpers
========================================================= */
const $ = (id) => document.getElementById(id);
/* the newest styles are also injected from here, so they still apply even if an older chat.css is cached on the phone */
(() => { if (document.getElementById('v13css')) return; const s = document.createElement('style'); s.id = 'v13css'; s.textContent = `
/* =========================================================
v11 — header title · Chat tile · starry chats · reply arrow
========================================================= */
html body .top-nav { justify-content: space-between; }
html body .nav-brand { font-size: 1.3rem; white-space: nowrap; cursor: default; }
html body .nav-brand:active { transform: none; }
/* Chat tile: "Welcome to chat" <-> red shining "New message" */
#bnChatT.swap { animation: bnSwap .5s cubic-bezier(.2,.9,.3,1); }
@keyframes bnSwap { from { opacity: 0; transform: translateY(8px); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
#bnChatT.bn-new { font-weight: 700; color: transparent; -webkit-text-fill-color: transparent; -webkit-background-clip: text; background-clip: text;
background-image: linear-gradient(100deg, #ff2d46 0%, #ff2d46 36%, #ffd3d9 50%, #ff2d46 64%, #ff2d46 100%); background-size: 260% 100%;
filter: drop-shadow(0 0 6px rgba(255,45,70,.7)); animation: bnRedShine 2.2s linear infinite; }
#bnChatT.bn-new.swap { animation: bnSwap .5s cubic-bezier(.2,.9,.3,1), bnRedShine 2.2s linear infinite; }
@keyframes bnRedShine { from { background-position: 130% 0; } to { background-position: -130% 0; } }
html body .bn-tile.has-new { border-color: rgba(255,45,70,.4); box-shadow: 0 0 0 1px rgba(255,45,70,.25), 0 0 24px rgba(255,45,70,.16); }
/* starry gold background — same sparkles as the Our Space welcome */
.cbg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
background: radial-gradient(120% 90% at 50% 28%, #3a2418 0%, #150c08 58%, #0b0504 100%); }
.cbg i { position: absolute; left: var(--x); bottom: -6%; font-style: normal; font-size: var(--s); color: #e9bf8f; text-shadow: 0 0 10px rgba(233,191,143,.9);
opacity: 0; animation: cbgRise var(--t) linear var(--dl) infinite; will-change: transform, opacity; }
@keyframes cbgRise { 0% { transform: translate(0,0) rotate(0); opacity: 0; } 12% { opacity: .85; } 85% { opacity: .6; } 100% { transform: translate(var(--sw), -112vh) rotate(180deg); opacity: 0; } }
.chat-app:not(.active) .cbg i, .fp:not(.active) .cbg i { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .cbg i { animation-duration: 20s; } }
.chat-pane > .cp-head, .chat-pane > .cp-msgs, .chat-pane > .cp-empty, .chat-pane > .cp-reply, .chat-pane > .cp-comp { position: relative; z-index: 1; }
.chat-pane > .cp-head, .chat-pane > .cp-comp { background: rgba(16,11,9,.74); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-color: rgba(227,192,141,.18); box-shadow: none; }
.chat-pane > .cp-msgs { background: transparent; }
.fp > .fp-top, .fp > .fp-list { position: relative; z-index: 1; }
/* message text that matches the golden background */
html body .chat-app .me .bub { color: #2b190b; text-shadow: none; background: linear-gradient(135deg, #f3d9ae 0%, #e0b377 55%, #c9965a 100%); box-shadow: 0 6px 18px rgba(201,150,90,.32), inset 0 1px 0 rgba(255,255,255,.45); }
html body .chat-app .them .bub { color: #f7ecdc; background: rgba(42,30,24,.78); border: 1px solid rgba(227,192,141,.24); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
html body .chat-app .bub.lock { color: #d8c3a2; }
/* =========================================================
v12 — menu above messages · call button + call screen · dock stays on its pages
========================================================= */
.chat-pane > .cp-head { z-index: 6; }
html body .cp-menu { z-index: 8; background: #1a1410; border: 1px solid rgba(227,192,141,.38); box-shadow: 0 22px 48px rgba(0,0,0,.65); -webkit-backdrop-filter: none; backdrop-filter: none; }
html body .cp-menu::before { background: #1a1410; border-left-color: rgba(227,192,141,.38); border-top-color: rgba(227,192,141,.38); }
html body .chat-app .cp-head .cp-btn.cp-call { color: #e9cd9f; }
html body .cp-btn.cp-call svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
html body .dock { width: auto; min-width: 232px; padding: 0 12px; gap: 8px; justify-content: space-around; }
body.dock-up .dock { z-index: 620; }
html body .fp-list { padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px)); }
.pp-body { padding-bottom: calc(130px + env(safe-area-inset-bottom, 0px)) !important; }
#callUI { position: fixed; inset: 0; z-index: 900; display: none; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; color: #f4e9dc;
padding: calc(env(safe-area-inset-top, 0px) + 64px) 24px calc(env(safe-area-inset-bottom, 0px) + 52px); font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
background: radial-gradient(110% 80% at 50% 18%, #43291a 0%, #170d08 58%, #080403 100%); }
#callUI.active { display: flex; animation: callIn .4s ease both; }
@keyframes callIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }
#callUI .call-lbl { font-family: 'Cinzel', Georgia, serif; font-size: .72rem; letter-spacing: .4em; text-indent: .4em; text-transform: uppercase; color: #cdb48f; }
#callUI .call-mid { display: grid; justify-items: center; gap: 14px; }
#callUI .call-av { position: relative; width: 132px; height: 132px; border-radius: 50%; padding: 4px; background: conic-gradient(from 0deg, #b98558, #fff1cf, #e3c08d, #b98558); box-shadow: 0 0 46px rgba(227,192,141,.4); }
#callUI.ringing .call-av { animation: callPulse 1.8s ease-in-out infinite; }
@keyframes callPulse { 0%, 100% { box-shadow: 0 0 30px rgba(227,192,141,.3); } 50% { box-shadow: 0 0 70px rgba(227,192,141,.7); } }
#callUI .call-av .pfp { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: grid; place-items: center; font-size: 3rem; background: #2a1c14; color: #e9cd9f; border: 3px solid #120b08; }
#callUI h2 { margin: 6px 0 0; font-family: 'Bodoni Moda', Georgia, serif; font-weight: 600; font-size: 1.9rem; color: #fff1d6; }
#callUI .call-state { margin: 0; font-size: .95rem; letter-spacing: .06em; color: #cdb48f; }
#callUI .call-acts { display: flex; gap: 30px; align-items: center; justify-content: center; }
#callUI .call-btn { width: 70px; height: 70px; border-radius: 50%; border: 0; padding: 0; display: grid; place-items: center; cursor: pointer; color: #fff; -webkit-tap-highlight-color: transparent; }
#callUI .call-btn svg { width: 28px; height: 28px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
#callUI .call-btn.end { background: #e5484d; box-shadow: 0 8px 26px rgba(229,72,77,.45); } #callUI .call-btn.end svg { transform: rotate(135deg); }
#callUI .call-btn.ok { background: #2fbf71; box-shadow: 0 8px 26px rgba(47,191,113,.45); }
#callUI .call-btn.mute { background: rgba(255,255,255,.1); border: 1px solid rgba(227,192,141,.35); color: #e9cd9f; }
#callUI .call-btn.mute.on { background: #e3c08d; color: #1b120c; }
#callUI .call-btn:active { transform: scale(.92); }
html body .chat-app .mt { color: #bfa98b; }
html body .chat-app .mt .rd { color: #d3b98c; font-weight: 600; letter-spacing: .03em; }
html body .chat-app .mt .rd.seen { color: #ffe3a6; text-shadow: 0 0 8px rgba(255,214,140,.75); }
html body .chat-app .day-sep { color: #e9cd9f; background: rgba(22,15,11,.7); border: 1px solid rgba(227,192,141,.22); }
html body .chat-app .cp-who i { color: #bfa98b; }
/* reply arrow + quoted reply */
.msg .rp { position: absolute; top: calc(50% - 22px); width: 28px; height: 28px; padding: 0; display: grid; place-items: center; border-radius: 50%; cursor: pointer;
border: 1px solid rgba(227,192,141,.3); background: rgba(22,15,11,.72); color: #e9cd9f; opacity: .78; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); transition: transform .15s ease, opacity .15s ease; }
.msg .rp svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.msg.me .rp { left: -35px; } .msg.them .rp { right: -35px; }
.msg .rp:active { transform: scale(.88); opacity: 1; background: rgba(227,192,141,.35); }
.cp-msgs.selecting .rp { display: none; }
.rq { max-width: 100%; margin-bottom: 4px; padding: 6px 11px; border-radius: 12px; border-left: 3px solid #e3c08d; background: rgba(227,192,141,.12); cursor: pointer; display: flex; flex-direction: column; gap: 1px; }
.rq b { font-size: .68rem; color: #e9cd9f; font-weight: 700; }
.rq span { font-size: .76rem; color: #e8d9c3; max-width: 62vw; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.msg.flash .bub { animation: msgFlash 1.6s ease; }
@keyframes msgFlash { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,222,150,0); } 25%, 60% { box-shadow: 0 0 0 4px rgba(255,222,150,.7), 0 0 26px rgba(255,214,140,.6); } }
.cp-reply { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: rgba(16,11,9,.82); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border-top: 1px solid rgba(227,192,141,.18); }
.cp-reply.hidden { display: none; }
.cr-bar { align-self: stretch; width: 3px; border-radius: 3px; background: #e3c08d; flex: none; }
.cr-t { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.cr-t b { font-size: .72rem; color: #e9cd9f; }
.cr-t span { font-size: .8rem; color: #d8c8b2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-reply button { width: 32px; height: 32px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(227,192,141,.3); background: transparent; color: #e9cd9f; cursor: pointer; }
.chat-pane.selecting .cp-reply { display: none; }
/* =========================================================
v13 — premium chat · long-press bar · badges · post page · friends menu
========================================================= */
/* chat header */
.chat-pane > .cp-head { background: linear-gradient(180deg, rgba(36,25,18,.95), rgba(16,11,9,.88)); border-bottom: 1px solid rgba(227,192,141,.26); box-shadow: 0 12px 30px rgba(0,0,0,.4); transition: opacity .28s ease; }
html body .chat-app .cp-who .pfp-sm { border: 2px solid #e3c08d; box-shadow: 0 0 0 3px rgba(227,192,141,.14), 0 0 18px rgba(227,192,141,.3); }
html body .chat-app .cp-who b { font-family: 'Bodoni Moda', Georgia, serif; font-weight: 600; font-size: 1.08rem; letter-spacing: .01em; color: #fff1d6; }
html body .chat-app .cp-btn { border-radius: 50%; border: 1px solid rgba(227,192,141,.3); background: linear-gradient(145deg, rgba(227,192,141,.16), rgba(227,192,141,.03)); color: #e9cd9f; transition: transform .15s ease, background .2s ease; }
html body .chat-app .cp-btn:active { transform: scale(.9); }
/* the friends drawer sits above the header, and the header fades while it is open (phones) */
.chat-scrim { z-index: 7; }
.chat-side { z-index: 8; }
@media (max-width: 819px) { .chat-main.side-open .chat-pane > .cp-head { opacity: 0; pointer-events: none; } }
/* messages */
html body .chat-app .cp-msgs { padding: 18px 14px 10px; gap: 5px; }
html body .chat-app .msg { max-width: 82%; margin-bottom: 5px; }
html body .chat-app .bub { padding: 10px 15px; border-radius: 22px; font-size: .97rem; line-height: 1.5; letter-spacing: .005em; }
html body .chat-app .bub.media { padding: 4px; }
html body .chat-app .me .bub { border-bottom-right-radius: 7px; }
html body .chat-app .them .bub { border-bottom-left-radius: 7px; background: linear-gradient(160deg, rgba(54,40,31,.9), rgba(30,21,16,.9)); box-shadow: 0 6px 16px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,236,200,.06); }
html body .chat-app .mt { display: flex; align-items: center; gap: 5px; font-size: .64rem; letter-spacing: .04em; }
.msg .mt .st { color: #ffd978; font-size: .8rem; text-shadow: 0 0 8px rgba(255,214,120,.75); }
.msg .mt .ed { font-style: normal; opacity: .75; }
html body .chat-app .day-sep { font-family: 'Cinzel', Georgia, serif; font-size: .62rem; letter-spacing: .22em; text-transform: uppercase; padding: 5px 16px; }
.cp-msgs .msg { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
/* composer */
.chat-pane > .cp-comp { background: linear-gradient(0deg, rgba(20,14,10,.95), rgba(16,11,9,.8)); border-top: 1px solid rgba(227,192,141,.24); }
html body .chat-app .cp-input { background: rgba(10,7,5,.74); color: #f4e9dc; border: 1px solid rgba(227,192,141,.34); border-radius: 24px; box-shadow: inset 0 1px 6px rgba(0,0,0,.35); }
html body .chat-app .cp-input:focus { border-color: #e3c08d; box-shadow: 0 0 0 3px rgba(227,192,141,.14), 0 0 22px rgba(227,192,141,.18); }
html body .chat-app .cp-input::placeholder { color: #8f8174; }
html body .chat-app .cp-circle { border: 1px solid rgba(227,192,141,.3); background: linear-gradient(145deg, rgba(227,192,141,.16), rgba(227,192,141,.03)); color: #e9cd9f; }
html body .chat-app .cp-circle.go { border: 0; color: #1b120c; background: linear-gradient(135deg, #f6e1b4, #c89556); box-shadow: 0 6px 18px rgba(227,192,141,.42); }
/* long-press selection bar (fades in over the profile header, fades out on back / swipe-back) */
.cp-selbar .sel-act.off { display: none; }
html body .cp-selbar .sel-count { flex: none; font-family: 'Bodoni Moda', Georgia, serif; font-size: 1.2rem; font-weight: 600; color: #fff1d6; }
.cp-selbar .sel-sp { flex: 1; }
html body .cp-selbar #selStar.on { color: #1b120c; border-color: transparent; background: linear-gradient(135deg, #f6e1b4, #c89556); }
.cp-selbar #selStar.on svg { fill: currentColor; }
html body .cp-selbar #selDel { color: #ff9aa2; border-color: rgba(255,120,130,.42); }
.msg.picked .sel-ck { background: linear-gradient(135deg, #f6e1b4, #c89556) !important; border-color: transparent !important; }
.msg.picked .sel-ck::after { color: #1b120c !important; }
html body .chat-app .msg.picked .bub { box-shadow: 0 0 0 3px #e3c08d, 0 0 26px rgba(227,192,141,.45); }
/* post a memory page */
.pp-compose { display: grid; gap: 18px; }
.pp-who { text-align: center; font-size: .8rem; letter-spacing: .05em; color: #a8978a; }
.pp-who strong { color: #e9cd9f; font-weight: 600; }
.pp-oval { position: relative; width: 100%; padding: 2px; border-radius: 28px; overflow: hidden; box-shadow: 0 0 30px rgba(227,192,141,.22); }
.pp-oval::before { content: ''; position: absolute; left: 50%; top: 50%; width: 260%; aspect-ratio: 1; transform: translate(-50%, -50%) rotate(0); border-radius: 50%;
background: conic-gradient(from 0deg, transparent 0 55%, #b98558 68%, #fff4d2 80%, #e3c08d 88%, transparent 100%); animation: ppSpin 3.6s linear infinite; }
@keyframes ppSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }
.pp-in { position: relative; border-radius: 26px; background: #17110d; padding: 6px; }
html body .pp-in textarea { display: block; width: 100%; min-height: 190px; padding: 16px 18px; resize: none; border: 0; outline: 0; box-shadow: none; background: transparent; color: #f4e9dc; font: 400 1.02rem/1.55 'Outfit', 'Plus Jakarta Sans', sans-serif; }
html body .pp-in textarea::placeholder { color: #8f8174; }
html body .pp-in textarea:focus { border: 0; box-shadow: none; }
.pp-tools { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin: 0; }
html body .pp-tools .mood-trigger-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 999px; background: linear-gradient(145deg, rgba(227,192,141,.16), rgba(227,192,141,.03)); border: 1px solid rgba(227,192,141,.4); color: #f1dcb8; font: 600 .86rem 'Outfit', sans-serif; letter-spacing: .02em; }
.pp-tools .mood-trigger-btn span { font-size: 1.25rem; }
.pp-tools .mood-trigger-btn b { font-weight: 600; }
.pp-compose .photo-preview { margin: 0 auto; }
@media (prefers-reduced-motion: reduce) { .pp-oval::before { animation: none; } }
/* badge picker */
html body .mood-picker-overlay { background: rgba(6,4,3,.64); z-index: 700; }
html body .mood-picker-popup { z-index: 701; width: min(94%, 440px); max-width: none; max-height: 72vh; padding: 22px 14px 26px; border-radius: 28px; background: linear-gradient(180deg, #261a12, #120c08); border: 1px solid rgba(227,192,141,.36); box-shadow: 0 -10px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(255,236,200,.05) inset; }
html body .mood-popup-header { font-family: 'Cinzel', Georgia, serif; font-size: .88rem; letter-spacing: .3em; text-indent: .3em; text-transform: uppercase; color: #e3c08d; margin-bottom: 18px; }
html body .mood-options { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 4px; }
html body .mood-btn { width: auto; height: auto; padding: 2px 0; border: 0; background: none; border-radius: 0; flex-direction: column; gap: 7px; box-shadow: none; transform: none; color: #d8c8b2; font: 600 .64rem 'Outfit', sans-serif; letter-spacing: .03em; }
.mood-btn .bd-ring { position: relative; width: 58px; height: 58px; display: grid; place-items: center; font-size: 1.7rem; border-radius: 50%; background: radial-gradient(circle at 30% 25%, #3d2c20, #1a110b); border: 2px solid rgba(227,192,141,.5); box-shadow: 0 6px 16px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,236,200,.18); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.mood-btn .bd-ring::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 1px dashed rgba(227,192,141,.3); }
.mood-btn .bd-name { max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
html body .mood-btn.active { background: none; transform: none; box-shadow: none; }
.mood-btn.active .bd-ring { border-color: #ffe3a6; background: radial-gradient(circle at 30% 25%, #6d4b2f, #2a1b10); box-shadow: 0 0 22px rgba(255,214,140,.55); transform: scale(1.08); }
.mood-btn.active .bd-name { color: #ffe3a6; }
.memory-reveal-badge { margin: -4px 0 10px; font: 600 .68rem 'Cinzel', Georgia, serif; letter-spacing: .26em; text-indent: .26em; text-transform: uppercase; color: #cdb48f; text-align: center; }
.mn-mood small.mn-badge { display: block; width: max-content; margin-top: 4px; padding: 2px 8px; border-radius: 999px; font: 700 .55rem 'Outfit', sans-serif; letter-spacing: .1em; text-transform: uppercase; color: var(--ink); background: rgba(255,255,255,.42); border: 1px solid rgba(0,0,0,.08); }
/* friends page: 3-dots menu + remove mode */
.fp > .fp-top { z-index: 3; }
.fp-top [hidden] { display: none !important; }
.fp-link { background: none; border: 0; padding: 8px 6px; font: 600 .86rem 'Outfit', sans-serif; letter-spacing: .04em; color: #e3c08d; cursor: pointer; }
.fp-menu { right: 16px; }
.fr-row .fr-ck { display: none; position: absolute; right: 16px; top: 50%; width: 26px; height: 26px; margin-top: -13px; z-index: 12; border-radius: 50%; border: 2px solid rgba(255,236,200,.85); background: rgba(10,7,5,.55); }
.fr-row.pickable .fr-ck { display: block; }
.fr-row.picked { border-color: #e8c48f; box-shadow: 0 0 0 2px rgba(232,196,143,.75), 0 8px 18px rgba(0,0,0,.4); }
.fr-row.picked .fr-ck { background: linear-gradient(135deg, #f6e1b4, #c89556); border-color: transparent; }
.fr-row.picked .fr-ck::after { content: ''; position: absolute; left: 8px; top: 3px; width: 6px; height: 12px; border: solid #1b120c; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg); }
.fp-rmbar { position: absolute; left: 50%; bottom: calc(env(safe-area-inset-bottom, 0px) + 100px); z-index: 5; display: flex; align-items: center; gap: 14px; padding: 8px 8px 8px 20px; border-radius: 999px; background: rgba(24,18,15,.97); border: 1px solid rgba(227,192,141,.4); box-shadow: 0 16px 36px rgba(0,0,0,.55);
opacity: 0; visibility: hidden; transform: translate(-50%, 16px); transition: opacity .25s ease, transform .3s cubic-bezier(.2,.9,.25,1), visibility 0s linear .3s; }
.fp-rmbar.on { opacity: 1; visibility: visible; transform: translate(-50%, 0); transition-delay: 0s; }
.fp-rmbar span { font-size: .84rem; color: #d8c8b2; white-space: nowrap; }
.fp-rmbar button { padding: 11px 20px; border: 0; border-radius: 999px; font: 700 .84rem 'Outfit', sans-serif; color: #fff; background: linear-gradient(135deg, #e5484d, #b02a34); cursor: pointer; }
.fp-rmbar button:disabled { opacity: .4; }
`; document.head.appendChild(s); })();
(() => { if (document.getElementById('v14css')) return; const s = document.createElement('style'); s.id = 'v14css'; s.textContent = `
/* =========================================================
v14 — back arrows · premium menus · premium calls · voice player · attach menu · memories timeline
========================================================= */
/* ---------- back arrow (replaces every close "x" that goes back) ---------- */
svg.back-ic { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; display: block; }
.fp-x svg, .mn-x svg, .ow-x svg, .td-x svg { width: 21px; height: 21px; fill: none; stroke: currentColor; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; }
html body .td-x { font-size: 0; }
html body .close-drawer, html body .close-sheet-btn { order: -1; width: 40px; height: 40px; flex: none; display: grid; place-items: center; padding: 0; border-radius: 50%; color: #e9cd9f; background: linear-gradient(145deg, rgba(227,192,141,.16), rgba(227,192,141,.03)); border: 1px solid rgba(227,192,141,.3); cursor: pointer; }
html body .drawer-header, html body .story-sheet-header { gap: 12px; justify-content: flex-start; }
html body .drawer-header h3 { flex: 1; }
html body .story-sheet-header h2 { flex: 1; }
html body .ow-x { right: auto; left: 16px; }
/* ---------- premium side menu (sections) ---------- */
html body .menu-drawer { background: linear-gradient(180deg, #1a130f, #0f0a08); border-left: 1px solid rgba(227,192,141,.28); box-shadow: -18px 0 50px rgba(0,0,0,.55); }
html body .dr-group { position: relative; overflow: hidden; border-radius: 22px; background: linear-gradient(160deg, rgba(255,255,255,.07), rgba(255,255,255,.02)); border: 1px solid rgba(227,192,141,.22); }
html body .dr-group.open { border-color: rgba(227,192,141,.55); box-shadow: 0 0 0 1px rgba(227,192,141,.12) inset, 0 10px 26px rgba(0,0,0,.4), 0 0 26px rgba(227,192,141,.14); }
html body .dr-group::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 40%; pointer-events: none; background: linear-gradient(100deg, transparent, rgba(255,236,200,.1), transparent); transform: translateX(-160%) skewX(-18deg); animation: mcSheen 7s ease-in-out infinite; }
html body .dr-ic, html body .di-icon { border-radius: 13px; color: #e9cd9f; background: linear-gradient(145deg, rgba(227,192,141,.26), rgba(227,192,141,.05)); border: 1px solid rgba(227,192,141,.38); box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 4px 12px rgba(0,0,0,.35); }
html body .dr-ic svg, html body .di-icon svg { width: 18px; height: 18px; fill: none; stroke: #f0d3a2; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 4px rgba(227,192,141,.55)); }
html body .dr-sub .drawer-items li, html body .dr-item { background: rgba(255,255,255,.045); border: 1px solid rgba(227,192,141,.2); border-radius: 16px; color: #f4e9dc; font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; font-weight: 600; letter-spacing: .01em; transition: transform .15s ease, background .2s ease, border-color .2s ease; }
html body .dr-sub .drawer-items li:active, html body .dr-item:active { transform: scale(.98); background: rgba(227,192,141,.12); border-color: rgba(227,192,141,.5); }
html body .dr-item.danger { color: #ffb3bb; border-color: rgba(229,72,77,.45); background: rgba(229,72,77,.08); }
html body .dr-item.danger .di-icon { background: rgba(229,72,77,.16); border-color: rgba(229,72,77,.45); }
html body .dr-item.danger .di-icon svg { stroke: #ff9aa6; filter: drop-shadow(0 0 4px rgba(229,72,77,.5)); }
html body .dr-sub .chevron { color: #e3c08d; opacity: .85; }
/* ---------- premium 3-dots menus ---------- */
html body .cs-menu, html body .cp-menu { min-width: 238px; padding: 8px; border-radius: 22px; overflow: hidden; background: linear-gradient(165deg, #261a12, #110b08); border: 1px solid rgba(227,192,141,.45); box-shadow: 0 0 0 1px rgba(255,236,200,.05) inset, 0 24px 54px rgba(0,0,0,.72), 0 0 34px rgba(227,192,141,.16); }
html body .cp-menu::before { background: #261a12; border-left-color: rgba(227,192,141,.45); border-top-color: rgba(227,192,141,.45); }
html body .cs-menu.open::after, html body .cp-menu.open::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 45%; pointer-events: none; background: linear-gradient(100deg, transparent, rgba(255,236,200,.14), transparent); animation: mnMenuSheen 1.4s ease .15s both; }
@keyframes mnMenuSheen { from { transform: translateX(-130%) skewX(-18deg); } to { transform: translateX(330%) skewX(-18deg); } }
html body .cs-menu button, html body .cp-menu button { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; padding: 9px 12px 9px 9px; margin: 0 0 4px; border-radius: 16px; border: 1px solid transparent; background: transparent; color: #f4e9dc; text-align: left; font: 600 .9rem 'Outfit', 'Plus Jakarta Sans', sans-serif; letter-spacing: .02em; transition: background .18s ease, border-color .18s ease, transform .15s ease; }
html body .cs-menu button:last-child, html body .cp-menu button:last-child { margin-bottom: 0; }
html body .cs-menu button:active, html body .cp-menu button:active { transform: scale(.98); background: rgba(227,192,141,.12); border-color: rgba(227,192,141,.35); }
html body .cp-menu button::after { display: none; }
html body .cs-menu .mi, html body .cp-menu .mi { flex: none; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 12px; color: #f0d3a2; background: linear-gradient(145deg, rgba(227,192,141,.26), rgba(227,192,141,.05)); border: 1px solid rgba(227,192,141,.38); box-shadow: inset 0 1px 0 rgba(255,255,255,.14); }
html body .cs-menu .mi svg, html body .cp-menu .mi svg { width: 18px; height: 18px; filter: drop-shadow(0 0 4px rgba(227,192,141,.5)); }
html body .cs-menu .ml, html body .cp-menu .ml { flex: 1; min-width: 0; }
html body .cs-menu button.danger, html body .cp-menu button.danger { color: #ffb3bb; background: rgba(229,72,77,.07); border-color: rgba(229,72,77,.3); }
html body .cs-menu button.danger .mi, html body .cp-menu button.danger .mi { color: #ff9aa6; background: rgba(229,72,77,.16); border-color: rgba(229,72,77,.45); }
html body .cs-menu button.danger .mi svg, html body .cp-menu button.danger .mi svg { filter: drop-shadow(0 0 4px rgba(229,72,77,.5)); }
/* the 3-dots button itself */
html body .chat-app #cpMore, html body .fp #frMore { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; color: #f0d3a2; border: 1px solid rgba(227,192,141,.35); background: linear-gradient(145deg, rgba(227,192,141,.2), rgba(227,192,141,.04)); box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 4px 14px rgba(0,0,0,.35); }
html body .chat-app #cpMore svg, html body .fp #frMore svg { filter: drop-shadow(0 0 5px rgba(227,192,141,.6)); }
html body .chat-app #cpMore:active, html body .fp #frMore:active { transform: scale(.92); }
html body .cs-burger { border: 1px solid rgba(227,192,141,.35); background: linear-gradient(145deg, rgba(227,192,141,.2), rgba(227,192,141,.04)); box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 4px 14px rgba(0,0,0,.35); }
html body .cs-burger span { background: #f0d3a2; box-shadow: 0 0 6px rgba(227,192,141,.6); }
/* ---------- no reply arrow beside messages (reply = long-press, then pick Reply) ---------- */
html body .msg .rp { display: none !important; }
/* ---------- attach button + menu ---------- */
html body #cpFileBtn.open { background: linear-gradient(135deg, #f6e1b4, #c89556); color: #1b120c; border-color: transparent; transform: rotate(-18deg); box-shadow: 0 6px 18px rgba(227,192,141,.4); }
#cpFileBtn { transition: transform .25s cubic-bezier(.2,1.2,.4,1), background .2s ease; }
.att-menu { position: absolute; left: 10px; bottom: calc(100% + 10px); z-index: 9; display: none; flex-direction: column; gap: 4px; min-width: 214px; padding: 8px; border-radius: 22px; overflow: hidden; background: linear-gradient(165deg, #261a12, #110b08); border: 1px solid rgba(227,192,141,.45); box-shadow: 0 0 0 1px rgba(255,236,200,.05) inset, 0 24px 54px rgba(0,0,0,.72), 0 0 34px rgba(227,192,141,.16); }
.att-menu.open { display: flex; animation: attIn .22s cubic-bezier(.2,.9,.3,1); transform-origin: 20px 100%; }
@keyframes attIn { from { opacity: 0; transform: translateY(10px) scale(.94); } }
.att-menu button { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px 12px 8px 8px; border-radius: 16px; border: 1px solid transparent; background: transparent; color: #f4e9dc; text-align: left; font: 600 .92rem 'Outfit', 'Plus Jakarta Sans', sans-serif; cursor: pointer; }
.att-menu button:active { background: rgba(227,192,141,.12); border-color: rgba(227,192,141,.35); transform: scale(.98); }
.att-menu .mi { flex: none; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 13px; color: #f0d3a2; background: linear-gradient(145deg, rgba(227,192,141,.26), rgba(227,192,141,.05)); border: 1px solid rgba(227,192,141,.38); }
.att-menu .mi svg { width: 19px; height: 19px; filter: drop-shadow(0 0 4px rgba(227,192,141,.5)); }
.att-menu .ml small { display: block; margin-top: 1px; font-size: .68rem; font-weight: 500; letter-spacing: .02em; color: #a8978a; }
.up-prog { position: absolute; left: 12px; right: 12px; bottom: calc(100% + 8px); z-index: 8; display: none; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 16px; background: rgba(24,18,15,.96); border: 1px solid rgba(227,192,141,.4); box-shadow: 0 12px 28px rgba(0,0,0,.5); font: 600 .78rem 'Outfit', sans-serif; color: #e9cd9f; }
.up-prog.on { display: flex; }
.up-prog b { flex: none; min-width: 38px; text-align: right; }
.up-prog span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.up-prog i { position: absolute; left: 14px; right: 14px; bottom: 5px; height: 3px; border-radius: 3px; background: rgba(227,192,141,.15); overflow: hidden; }
.up-prog i::after { content: ''; display: block; height: 100%; width: var(--p, 0%); border-radius: 3px; background: linear-gradient(90deg, #b98558, #ffe3a6); transition: width .25s ease; }
/* ---------- file card ---------- */
.bub.fl { display: flex; align-items: center; gap: 12px; min-width: 210px; max-width: 290px; padding: 10px 14px 10px 10px; cursor: pointer; white-space: normal; }
.fl-ic { flex: none; width: 44px; height: 48px; display: grid; place-items: center; border-radius: 12px; font: 800 .66rem 'Outfit', sans-serif; letter-spacing: .06em; color: #1b120c; background: linear-gradient(135deg, #f6e1b4, #c89556); box-shadow: 0 4px 12px rgba(227,192,141,.3); }
.fl-tx { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.fl-tx b { font-size: .9rem; font-weight: 700; word-break: break-all; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.fl-tx small { font-size: .7rem; opacity: .75; }
/* ---------- voice message player (long-press works, no download button) ---------- */
.bub.vm { display: flex; align-items: center; gap: 10px; width: min(66vw, 268px); padding: 8px 14px 8px 8px; white-space: normal; }
.vm-btn { flex: none; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%; display: grid; place-items: center; cursor: pointer; color: #1b120c; background: linear-gradient(135deg, #f6e1b4, #c89556); box-shadow: 0 4px 12px rgba(0,0,0,.3); -webkit-tap-highlight-color: transparent; }
.vm-btn svg { width: 17px; height: 17px; fill: currentColor; }
.vm-btn .pa { display: none; }
.vm.playing .vm-btn .pl { display: none; } .vm.playing .vm-btn .pa { display: block; }
.vm-track { flex: 1; min-width: 0; height: 34px; display: flex; align-items: center; cursor: pointer; }
.vm-bars { width: 100%; height: 26px; display: flex; align-items: center; justify-content: space-between; gap: 2px; pointer-events: none; }
.vm-bars i { flex: 1; min-width: 2px; max-width: 5px; border-radius: 3px; background: currentColor; opacity: .32; transition: opacity .12s linear; }
.vm-bars i.on { opacity: 1; }
.vm-t { flex: none; min-width: 34px; text-align: right; font: 600 .72rem 'Outfit', sans-serif; font-variant-numeric: tabular-nums; opacity: .85; }
html body .chat-app .me .bub.vm .vm-btn { color: #f6e1b4; background: #2b190b; }
html body .chat-app .them .bub.vm { color: #e9cd9f; }
/* ---------- premium call screen ---------- */
html body #callUI { padding: calc(env(safe-area-inset-top, 0px) + 54px) 24px calc(env(safe-area-inset-bottom, 0px) + 52px); justify-content: space-between; overflow: hidden; background: radial-gradient(120% 70% at 50% 28%, #3b2517 0%, #170d08 58%, #080403 100%); }
html body #callUI .cl-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
html body #callUI .cl-bg i { position: absolute; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(227,192,141,.16), transparent 70%); animation: mnFloat 16s ease-in-out infinite; }
html body #callUI .cl-bg i:nth-child(1) { left: -80px; top: 14%; } html body #callUI .cl-bg i:nth-child(2) { right: -90px; top: 52%; animation-delay: -6s; } html body #callUI .cl-bg i:nth-child(3) { left: 24%; bottom: -110px; animation-delay: -10s; }
html body #callUI .cl-top { position: relative; z-index: 2; display: grid; gap: 8px; justify-items: center; }
html body #callUI .cl-top h2 { margin: 0; max-width: 86vw; font-family: 'Bodoni Moda', Georgia, serif; font-weight: 600; font-size: 2rem; line-height: 1.15; color: #fff1d6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-shadow: 0 0 24px rgba(227,192,141,.35); }
html body #callUI .call-state { margin: 0; font: 600 .78rem 'Cinzel', Georgia, serif; letter-spacing: .34em; text-indent: .34em; text-transform: uppercase; color: #cdb48f; }
html body #callUI.ringing .call-state { animation: clBlink 1.6s ease-in-out infinite; }
@keyframes clBlink { 50% { opacity: .45; } }
html body #callUI .cl-mid { position: relative; z-index: 2; flex: 1; display: grid; place-items: center; }
html body #callUI .cl-av { position: relative; width: 156px; height: 156px; border-radius: 50%; display: grid; place-items: center; padding: 4px; background: conic-gradient(from 0deg, #b98558, #fff1cf, #e3c08d, #b98558); box-shadow: 0 0 56px rgba(227,192,141,.42); }
html body #callUI .cl-av span { width: 100%; height: 100%; border-radius: 50%; display: grid; place-items: center; background: radial-gradient(circle at 32% 26%, #4a3220, #1d120b 72%); color: #f3d9a8; font: 600 4.4rem/1 'Bodoni Moda', Georgia, serif; border: 3px solid #120b08; text-shadow: 0 0 22px rgba(227,192,141,.6); }
html body #callUI .cl-av::before, html body #callUI .cl-av::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid rgba(227,192,141,.5); opacity: 0; pointer-events: none; }
html body #callUI.ringing .cl-av::before { animation: clRing 2.4s ease-out infinite; }
html body #callUI.ringing .cl-av::after { animation: clRing 2.4s ease-out 1.2s infinite; }
@keyframes clRing { from { transform: scale(1); opacity: .7; } to { transform: scale(1.85); opacity: 0; } }
html body #callUI:not(.ringing) .cl-av { animation: clBreath 3.2s ease-in-out infinite; }
@keyframes clBreath { 50% { box-shadow: 0 0 78px rgba(227,192,141,.55); } }
html body #callUI .cl-acts { position: relative; z-index: 2; display: flex; align-items: flex-start; justify-content: center; gap: 30px; min-height: 100px; }
html body #callUI .cb { width: 78px; display: grid; justify-items: center; gap: 8px; }
html body #callUI .cb small { font: 600 .7rem 'Outfit', sans-serif; letter-spacing: .08em; color: #cdb48f; }
html body #callUI .call-sp { width: 78px; }
html body #callUI .call-btn { width: 72px; height: 72px; border-radius: 50%; border: 0; padding: 0; display: grid; place-items: center; cursor: pointer; color: #fff; -webkit-tap-highlight-color: transparent; transition: transform .15s ease, background .2s ease; }
html body #callUI .call-btn svg { width: 29px; height: 29px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
html body #callUI .call-btn.end { background: linear-gradient(145deg, #ff5a60, #d7343b); box-shadow: 0 10px 30px rgba(229,72,77,.5); }
html body #callUI .call-btn.end svg { transform: rotate(135deg); }
html body #callUI .call-btn.ok { background: linear-gradient(145deg, #3fd988, #1f9f58); box-shadow: 0 10px 30px rgba(47,191,113,.5); animation: clOk 1.6s ease-in-out infinite; }
@keyframes clOk { 50% { transform: scale(1.07); } }
html body #callUI .call-btn.spk, html body #callUI .call-btn.mute { background: rgba(255,255,255,.08); border: 1px solid rgba(227,192,141,.4); color: #f0d3a2; }
html body #callUI .call-btn.spk.on, html body #callUI .call-btn.mute.on { background: linear-gradient(135deg, #f6e1b4, #c89556); color: #1b120c; border-color: transparent; box-shadow: 0 8px 24px rgba(227,192,141,.4); }
html body #callUI .call-btn:active { transform: scale(.92); }
/* ---------- Our Memories: premium timeline ---------- */
html body .mn-top { padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 8px; gap: 12px; }
html body .mn-x { flex: none; border: 1px solid rgba(227,192,141,.3); background: linear-gradient(145deg, rgba(227,192,141,.16), rgba(227,192,141,.03)); }
html body .mn-title { flex: 1; text-align: center; font-family: 'Cinzel', 'Bodoni Moda', Georgia, serif; font-size: 1rem; letter-spacing: .24em; text-transform: uppercase; }
html body .mn-count { flex: none; width: auto; min-width: 42px; height: 34px; padding: 0 13px; display: grid; place-items: center; border-radius: 999px; text-align: center; font: 700 .8rem 'Outfit', sans-serif; letter-spacing: .04em; color: #e9cd9f; background: rgba(227,192,141,.12); border: 1px solid rgba(227,192,141,.35); }
.mn-scroll { position: relative; z-index: 2; flex: 1; min-height: 0; overflow-y: auto; padding: 4px 16px calc(env(safe-area-inset-bottom, 0px) + 44px); overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
.mn-hero { max-width: 560px; margin: 4px auto 10px; padding: 12px 20px 6px; text-align: center; }
.mn-hero-k { font: 600 .66rem 'Cinzel', Georgia, serif; letter-spacing: .34em; text-indent: .34em; text-transform: uppercase; color: #cdb48f; }
.mn-hero-n { margin-top: 2px; font-family: 'Great Vibes', 'Bodoni Moda', Georgia, cursive; font-size: 3.8rem; line-height: 1.12; padding-bottom: .06em; color: transparent; background: linear-gradient(100deg, #b98558, #fff1cf 45%, #e3c08d 60%, #b98558 100%); background-size: 220% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: mcText 6s linear infinite; }
@keyframes mcText { to { background-position: -220% 0; } }
.mn-hero-s { font-size: .8rem; letter-spacing: .04em; color: #a8978a; }
.mn-list { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
.mn-day { display: flex; align-items: center; gap: 12px; margin: 12px 4px 0; }
.mn-day span { flex: none; max-width: 80%; font: 600 .68rem 'Cinzel', Georgia, serif; letter-spacing: .2em; text-transform: uppercase; color: #e3c08d; }
.mn-day i { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(227,192,141,.45), transparent); }
.mn-none { margin: 54px auto 0; display: grid; gap: 6px; justify-items: center; text-align: center; color: #b9a894; }
.mn-none span { font-size: 2.4rem; filter: drop-shadow(0 0 14px rgba(227,192,141,.6)); }
.mn-none b { font-family: 'Bodoni Moda', Georgia, serif; font-size: 1.2rem; font-weight: 600; color: #e9cd9f; }
.mn-none i { font-style: normal; font-size: .84rem; }
.mc { position: relative; overflow: hidden; padding: 14px 14px 12px; border-radius: 22px; background: linear-gradient(160deg, rgba(255,255,255,.075), rgba(255,255,255,.025)); border: 1px solid rgba(227,192,141,.2); box-shadow: 0 10px 26px rgba(0,0,0,.35); content-visibility: auto; contain-intrinsic-size: auto 150px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.mn-list.fresh .mc { animation: mcIn .55s cubic-bezier(.2,.9,.25,1) both; animation-delay: calc(var(--i, 0) * 60ms); }
@keyframes mcIn { from { opacity: 0; transform: translateY(18px) scale(.98); } }
.mc.pinned { border-color: rgba(227,192,141,.55); box-shadow: 0 0 0 1px rgba(227,192,141,.14) inset, 0 0 26px rgba(227,192,141,.2), 0 10px 26px rgba(0,0,0,.4); }
.mc-shine { position: absolute; top: 0; bottom: 0; left: 0; width: 45%; pointer-events: none; background: linear-gradient(100deg, transparent, rgba(255,236,200,.15), transparent); transform: translateX(-160%) skewX(-18deg); }
.mc.lit .mc-shine { animation: mcSheen 6.5s ease-in-out infinite; animation-delay: calc(var(--i, 0) * .7s); }
.mn:not(.active) .mc-shine, .mn:not(.active) .mn-hero-n { animation-play-state: paused; }
@keyframes mcSheen { 0%, 62% { transform: translateX(-160%) skewX(-18deg); } 100% { transform: translateX(380%) skewX(-18deg); } }
.mc-top { position: relative; display: flex; align-items: center; gap: 12px; }
.mc-mood { flex: none; width: 46px; height: 46px; display: grid; place-items: center; font-size: 1.5rem; border-radius: 50%; background: radial-gradient(circle at 30% 25%, #3d2c20, #1a110b); border: 2px solid rgba(227,192,141,.5); box-shadow: 0 0 16px rgba(227,192,141,.25); }
.mc-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mc-by { font: 700 .95rem 'Outfit', sans-serif; color: #f4e9dc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mc-time { font-size: .7rem; letter-spacing: .04em; color: #a8978a; }
.mc-pin svg { width: 18px; height: 18px; fill: #e3c08d; stroke: #e3c08d; stroke-width: 1.6; stroke-linejoin: round; filter: drop-shadow(0 0 6px rgba(227,192,141,.7)); }
.mc-photo { position: relative; margin-top: 12px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(227,192,141,.2); }
.mc-photo img { width: 100%; max-height: 280px; object-fit: cover; display: block; pointer-events: none; }
.mc-text { position: relative; margin: 12px 2px 0; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.24rem; line-height: 1.4; color: #f4e9dc; white-space: pre-wrap; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.mc.open .mc-text { display: block; -webkit-line-clamp: unset; }
.mc-text:empty { display: none; }
.mc-foot { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
.mc-badge { padding: 4px 11px; border-radius: 999px; font: 700 .62rem 'Outfit', sans-serif; letter-spacing: .12em; text-transform: uppercase; color: #e9cd9f; background: rgba(227,192,141,.12); border: 1px solid rgba(227,192,141,.32); }
.mc-acts { margin-left: auto; display: flex; gap: 8px; }
.mc-acts button { width: 34px; height: 34px; padding: 0; display: grid; place-items: center; border-radius: 50%; cursor: pointer; color: #e9cd9f; background: rgba(255,255,255,.05); border: 1px solid rgba(227,192,141,.3); }
.mc-acts button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.mc-acts button.on { color: #1b120c; background: linear-gradient(135deg, #f6e1b4, #c89556); border-color: transparent; }
.mc-acts button.on svg { fill: currentColor; }
.mc-acts button.del { color: #ff9aa6; border-color: rgba(229,72,77,.4); }
.mc-acts button:active { transform: scale(.9); }
.mc.flash { animation: mcFlash 1.7s ease; }
@keyframes mcFlash { 0%, 100% { box-shadow: 0 10px 26px rgba(0,0,0,.35); } 30% { box-shadow: 0 0 0 2px #e3c08d, 0 0 34px rgba(227,192,141,.6); } }
@media (prefers-reduced-motion: reduce) { .mc-shine, .dr-group::after, .mn-hero-n, #callUI .cl-av::before, #callUI .cl-av::after { animation: none !important; } }
`; document.head.appendChild(s); })();
const O = () => window.OS;
const D = () => O().db;
const toast = (m, t) => O()?.toast(m, t);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); const LSg = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const LSs = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const enc = new TextEncoder(), dec = new TextDecoder();
const INLINE = 700000;// max base64 chars kept inside one Firestore doc
const CHUNK = 600000;// raw bytes per encrypted piece (about 800 KB once encoded, safely under Firestore's 1 MB document limit)
const safeImg = (s) => (typeof s === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) ? s : '';
const chatId = (a, b) => [a, b].sort().join('_');
const BANNERS = [['volt', 'Golden Thunder'], ['aurora', 'Night Aurora'], ['storm', 'White Thunder'], ['tide', 'Ocean Bubbles'], ['cosmos', 'Cosmic Drift']];
const BOLT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>';
const bolts = () => [['0s', 19], ['-2s', 15], ['-4s', 15]].map(([l, s]) => `<em class="ob" style="--d:6s;--dl:${l};--s:${s}px"><u>${BOLT}</u></em>`).join('');
const rocks = (a) => a.map(([s, d, l, dir, sh]) => `<em class="ob" style="--d:${d}s;--dl:${l}s;--dir:${dir};--s:${s}px"><u class="rk ${sh}"></u></em>`).join('');
const bubbles = [[8, 8, 6, -1, 4], [19, 13, 8, -4, -6], [31, 7, 5.5, -2, 5], [44, 11, 7.5, -6, -5], [57, 15, 9, -3, 6], [68, 8, 6.5, -5, -4], [79, 12, 8, -1.5, 5], [90, 9, 6, -4.5, -5], [50, 6, 5, -.5, 3]]
.map(([x, s, d, l, dx]) => `<em class="bb" style="left:${x}%;--s:${s}px;--d:${d}s;--dl:${l}s;--x:${dx}px"></em>`).join('');
const BX = '<b class="rg"></b><b class="cv"></b>';
const BNFX = {
volt: BX + '<b class="fx"></b><b class="glo"></b><b class="fl"></b><b class="pth">' + bolts() + '</b><b class="shn"></b>',
storm: BX + '<b class="fx"></b><b class="glo"></b><b class="fl"></b><b class="pth">' + bolts() + '</b><b class="shn"></b>',
aurora: BX + '<b class="fx"><b class="st"></b><em class="au a1"></em><em class="au a2"></em><em class="au a3"></em></b><b class="glo"></b><b class="shn"></b>',
tide: BX + '<b class="fx"><em class="wv"></em>' + bubbles + '</b><b class="glo"></b><b class="pth"><em class="ob" style="--d:7s;--s:12px"><u class="dr"></u></em><em class="ob" style="--d:7s;--dl:-3.5s;--s:10px"><u class="dr"></u></em></b><b class="shn"></b>',
cosmos: BX + '<b class="fx"><b class="st"></b><b class="st s2"></b></b><b class="glo"></b><b class="pth">' +
rocks([[9, 11, 0, 'normal', 'r1'], [6, 8, -3, 'reverse', 'r2'], [11, 14, -6, 'normal', 'r3'], [7, 9.5, -8, 'reverse', 'r1']]) +
'</b><b class="pth p2">' + rocks([[5, 7, -1, 'normal', 'r2'], [8, 12, -5, 'reverse', 'r3'], [6, 10, -9, 'normal', 'r1']]) + '</b><b class="shn"></b>'
};
const bannerEl = (p, cls) => {
if (p?.bannerId && BNFX[p.bannerId]) return `<span class="${cls} bn bnx bn-${p.bannerId}">${BNFX[p.bannerId]}</span>`;
const s = safeImg(p?.banner);
return s ? `<img class="${cls}" src="${s}" alt="">` : `<span class="${cls} bn bnx bn-cosmos">${BNFX.cosmos}</span>`; };
const wide = () => matchMedia('(min-width:820px)').matches; const svg = (d, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const mi = (ic, label) => `<span class="mi">${ic}</span><span class="ml">${label}</span>`;
const IC = { add: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M19 8v6M16 11h6"/>'),
img: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>'),
mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>'),
send: svg('<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>'),
panel: svg('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>'),
dots: svg('<circle cx="12" cy="5" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="2" fill="currentColor" stroke="none"/>'),
back: (s = 22) => svg('<path d="M15 5l-7 7 7 7"/>', s).replace('<svg ', '<svg class="back-ic" '),
userMinus: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 11h6"/>'),
user: svg('<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c.9-3.7 3.8-5.7 7.5-5.7s6.6 2 7.5 5.7"/>'),
key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>'),
clear: svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 12h6"/>'),
clip: svg('<path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.9-8.9a3.7 3.7 0 0 1 5.2 5.2l-8.9 8.9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2"/>'),
video: svg('<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10.5l5-3v9l-5-3"/>'),
file: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>'),
trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
star: svg('<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8 6.8 19.5l1-5.8L3.6 9.6l5.8-.8z"/>'),
pen: svg('<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>'),
reply: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v3"/>'),
close: (s = 22) => svg('<path d="M6 6l12 12M18 6L6 18"/>', s)
};
/* =========================================================
Crypto (end-to-end): ECDH P-256 -> HKDF -> AES-GCM
Private key lives only on the device (IndexedDB, non-extractable)
and, wrapped by the user's passphrase, in chatPrivate/{uid}. ========================================================= */
const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); const EC = { name: 'ECDH', namedCurve: 'P-256' };
const idbOpen = () => new Promise((res, rej) => { const r = indexedDB.open('ourspace-chat', 1); r.onupgradeneeded = () => r.result.createObjectStore('keys'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); const kvGet = async (k) => { const db = await idbOpen(); return new Promise((res, rej) => { const q = db.transaction('keys').objectStore('keys').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
const kvSet = async (k, v) => { const db = await idbOpen(); return new Promise((res,rej) => { const t = db.transaction('keys', 'readwrite'); t.objectStore('keys').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); };
async function genKeys() {
const kp = await crypto.subtle.generateKey(EC, true, ['deriveBits']);
return { pub: await crypto.subtle.exportKey('jwk', kp.publicKey), priv: await crypto.subtle.exportKey('jwk', kp.privateKey) };
}
const importPriv = (jwk) => crypto.subtle.importKey('jwk', jwk, EC, false, ['deriveBits']);
async function pwKey(pass, salt) {
const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 400000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function wrapPriv(jwk, pass) {
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await pwKey(pass, salt), enc.encode(JSON.stringify(jwk)));
return { salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
async function unwrapPriv(w, pass) {
const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(w.iv) }, await pwKey(pass, unb64(w.salt)), unb64(w.ct));
return JSON.parse(dec.decode(pt)); }
const keyCache = new Map();
async function sharedKey(uid) {
const p = state.profiles.get(uid);
if (!p?.pubKey || !state.priv) throw new Error('no key');
const ck = uid + p.pubKey;
if (keyCache.has(ck)) return keyCache.get(ck);
const pub = await crypto.subtle.importKey('jwk', JSON.parse(p.pubKey), EC, false, []);
const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: pub }, state.priv, 256);
const hk = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: enc.encode('ourspace-chat-v1') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); keyCache.set(ck, key);
return key;
}
async function encBytes(key, buf) {
const iv = crypto.getRandomValues(new Uint8Array(12));
return { iv: b64(iv), ct: b64(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buf)) };
}
const decBytes = (key, iv, ct) => crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
const encJSON = (key, obj) => encBytes(key, enc.encode(JSON.stringify(obj)));
const decJSON = async (key, iv, ct) => JSON.parse(dec.decode(await decBytes(key, iv, ct))); async function safetyNumber(a, b) {
const [x, y] = [a, b].sort(); const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(x + y)));
const groups = [];
for (let i = 0; i < 6; i++) groups.push(String(((h[i * 3] << 16) | (h[i * 3 + 1] << 8) | h[i * 3 + 2]) % 100000).padStart(5, '0'));
return groups.join(' ');
}
/* =========================================================
State
========================================================= */
const state = {
uid: null, profile: null, private: null, priv: null, nick: {}, bootP: null, bootErr: false,
reqFrom: [], reqTo: [], friends: [], incoming: [], outgoing: [],
profiles: new Map(), watch: new Map(), chats: new Map(), active: null, msgDocs: [], unsubs: [], unsubMsgs: null, listening: false, warned: false,
celebrated: new Set(), search: '', sig: '',
presence: new Map(), gotTo: false, chatsReady: false,
sel: new Set(), typeUntil: new Map(), typeStamp: new Map()
};
let hbTimer = null, presenceBound = false;
let typeLast = 0, typeOff = null; // typing indicator (sender side)
const plain = new Map(); // decrypted message payloads by id
const media = new Map(); // blob URLs by message id
const pct = new Map(); // ciphertext each cached payload was decrypted from (so edited messages refresh)
const local = { key: '', hide: new Set(), star: new Set() };
function loadLocal(uid) {
local.key = state.uid + ':' + chatId(state.uid, uid);
const get = (p) => { try { return new Set(JSON.parse(LSg(p + local.key) || '[]')); } catch { return new Set(); } };
local.hide = get('osHide:'); local.star = get('osStar:');
}
function saveLocal() { if (!local.key) return; LSs('osHide:' + local.key, JSON.stringify([...local.hide])); LSs('osStar:' + local.key, JSON.stringify([...local.star])); }
/* =========================================================
DOM
========================================================= */ const confetti = Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
document.body.insertAdjacentHTML('beforeend', `
<div id="chatApp" class="chat-app" aria-hidden="true">
<div id="chatGate" class="chat-gate hidden"></div> <div id="chatMain" class="chat-main hidden">
<div id="chatScrim" class="chat-scrim"></div>
<aside id="chatSide" class="chat-side">
<div class="cs-head">
<h2 class="cs-title">Friends</h2>
<button id="csAdd" class="cs-icon" aria-label="Add friend">${IC.add}</button>
<button id="csBurger" class="cs-burger" aria-label="Friends menu"><span></span><span></span><span></span><i id="csBurgerDot" class="bdot hidden"></i></button>
<div id="csMenu" class="cs-menu">
<button id="csRemove" class="danger">${mi(IC.userMinus, 'Remove friends')}</button>
<button id="csProfile">${mi(IC.user, 'My profile')}</button>
<button id="csForgot">${mi(IC.key, 'Forgot / new username')}</button>
</div>
</div>
<div id="csMe" class="cs-me"></div>
<input id="csSearch" class="cs-search" type="search" placeholder="Search friends">
<div id="csScroll" class="cs-scroll"></div>
</aside>
<section class="chat-pane">
<header class="cp-head">
<button id="cpToggle" class="cp-btn" aria-label="Friends">${IC.panel}</button>
<button id="cpWho" class="cp-who"></button>
<button id="cpCall" class="cp-btn cp-call" aria-label="Voice call"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg></button>
<button id="cpMore" class="cp-btn" aria-label="More options">${IC.dots}</button>
<div id="cpMenu" class="cs-menu cp-menu">
<button id="cpmRemove" class="danger">${mi(IC.userMinus, 'Remove friend')}</button>
<button id="cpmEmpty" class="danger">${mi(IC.clear, 'Empty msgs')}</button>
<button id="cpmClose">${mi(IC.back(18), 'Close chat')}</button>
</div>
<div id="cpSelBar" class="cp-selbar">
<button id="selCancel" class="cp-btn" aria-label="Cancel selection">${IC.close(20)}</button>
<b id="selCount" class="sel-count">1</b>
<span class="sel-sp"></span>
<button id="selStar" class="cp-btn sel-act" aria-label="Star">${IC.star}</button>
<button id="selDel" class="cp-btn sel-act" aria-label="Delete">${IC.trash}</button>
<button id="selEdit" class="cp-btn sel-act" aria-label="Edit message">${IC.pen}</button>
<button id="selReply" class="cp-btn sel-act" aria-label="Reply">${IC.reply}</button>
</div>
</header>
<div id="cpEmpty" class="cp-empty"><div><span id="cpEmptyTxt">Add a friend<br>to start chatting</span><small id="cpNote">🔒 Messages are end-to-end encrypted</small></div></div>
<div id="cpMsgs" class="cp-msgs hidden"></div>
<div id="cpReply" class="cp-reply hidden"></div>
<footer id="cpComp" class="cp-comp">
<button id="cpFileBtn" class="cp-circle" aria-label="Attach">${IC.clip}</button>
<div id="attMenu" class="att-menu">
<button type="button" data-att="photo">${mi(IC.img, 'Photos<small>Send pictures</small>')}</button>
<button type="button" data-att="video">${mi(IC.video, 'Videos<small>Any size</small>')}</button>
<button type="button" data-att="file">${mi(IC.file, 'Files<small>Documents, videos &amp; more</small>')}</button>
</div>
<div id="upProg" class="up-prog"><span id="upTxt"></span><b id="upPct"></b><i></i></div>
<input id="cpPhoto" type="file" accept="image/*" multiple hidden>
<input id="cpVideo" type="file" accept="video/*" multiple hidden>
<input id="cpFile" type="file" multiple hidden>
<textarea id="cpInput" class="cp-input" rows="1" placeholder="Type a message"></textarea> <div class="cp-rec"><span class="rec-dot"></span><span id="cpRecTime" class="rec-time">0:00</span>
<button id="cpRecCancel" class="cp-circle" style="width:36px;height:36px" aria-label="Cancel">${IC.close(18)}</button></div>
<button id="cpMic" class="cp-circle" aria-label="Voice message">${IC.mic}</button>
<button id="cpSend" class="cp-circle go hide" aria-label="Send">${IC.send}</button>
</footer>
</section> </div>
<div id="chatSheet" class="chat-sheet"><div class="sheet-card"><div class="sheet-grip"></div><div id="sheetBody"></div></div></div>
<div id="chatLight" class="chat-light"><img alt=""></div>
</div>
<div id="chatCongrats" class="chat-congrats">
<div class="cc-confetti">${confetti}</div>
<div class="cc-card"> <div id="ccPfp" class="cc-pfp"></div>
<h2>Congrats! 🎉</h2>
<p id="ccText"></p>
<small id="ccSub" class="cc-sub"></small>
<button id="ccChat" class="gate-btn">Say hi 💬</button>
<button id="ccClose" class="gate-link">Later</button>
</div>
</div>`);
const app = $('chatApp'), gate = $('chatGate'), main = $('chatMain'), side = $('chatSide'), scrim = $('chatScrim');
const sheet = $('chatSheet'), sheetBody = $('sheetBody'), light = $('chatLight'), congrats = $('chatCongrats');
const comp = $('cpComp'), input = $('cpInput');
/* sheets / layers */
function openSheet(title, html) { sheetBody.innerHTML = `<h3 class="sheet-title">${esc(title)}</h3>` + html; sheet.classList.add('active'); sheet.querySelector('.sheet-card').scrollTop = 0; }
const closeSheet = () => sheet.classList.remove('active');
sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
const closeLight = () => light.classList.remove('active');
light.onclick = closeLight;
const closeCongrats = () => congrats.classList.remove('active');
$('ccClose').onclick = closeCongrats;
const openSide = () => { if (wide()) $('chatMain').classList.remove('collapsed'); else { side.classList.add('active'); scrim.classList.add('active'); main.classList.add('side-open'); } };
const hideSideMobile = () => { side.classList.remove('active'); scrim.classList.remove('active'); main.classList.remove('side-open'); };
scrim.onclick = hideSideMobile; function closeChat() {
exitSelect(); stopTyping(); $('cpMenu')?.classList.remove('open');
stopRec(false); if (state.active) closeConversation();
closeSheet(); closeLight(); hideSideMobile();
app.classList.remove('active');
document.documentElement.style.overflow = '';
}
const reg = (el, fn, test) => window.OSBack?.add(el, fn, test);
const pane = main.querySelector('.chat-pane');
const convBack = () => { closeConversation(); if (!wide()) openSide(); };
/* order = back-button structure: chat > conversation > friends drawer (over a conversation) > sheet / viewer */
reg(app, closeChat);
reg(pane, convBack);
reg(side, hideSideMobile, () => side.classList.contains('active') && !!state.active);
reg(sheet, closeSheet); reg(light, closeLight); reg(congrats, closeCongrats);
reg($('cpSelBar'), () => exitSelect(), () => state.selecting);
/* swipe: left closes the friends panel, right opens it */
let tx0 = 0, ty0 = 0, tblock = false;
app.addEventListener('touchstart', (e) => {
const t = e.touches[0]; tx0 = t.clientX; ty0 = t.clientY;
tblock = !!e.target.closest('audio,video,input,textarea,.vm,.att-menu,.chat-sheet,.chat-light');
}, { passive: true });
app.addEventListener('touchend', (e) => {
if (wide() || tblock || sheet.classList.contains('active')) return;
const t = e.changedTouches[0], dx = t.clientX - tx0, dy = t.clientY - ty0; if (Math.abs(dx)< 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return; const open = side.classList.contains('active');
if (open && dx < 0) hideSideMobile();
else if (!open && dx > 0 && !main.classList.contains('hidden')) openSide();
}, { passive: true });
/* keyboard-aware sizing (so the composer never hides behind the keyboard) */
let fitRaf = 0;
const fit = () => { if (fitRaf) return; fitRaf = requestAnimationFrame(() => { fitRaf = 0;
const v = window.visualViewport; if (!v || !app.classList.contains('active')) return;
app.style.height = v.height + 'px'; app.style.top = v.offsetTop + 'px';
if (document.activeElement === input) { const b = $('cpMsgs'); b.scrollTop = b.scrollHeight; } }); };
window.visualViewport?.addEventListener('resize', fit);
window.visualViewport?.addEventListener('scroll', fit);
/* =========================================================
Boot / auth
========================================================= */
onAuthStateChanged(O().auth, (u) => {
if (!u) { teardown(); return; }
if (state.uid === u.uid) return;
teardown(); state.uid = u.uid; state.bootP = boot();
});
function teardown() {
state.unsubs.forEach((f) => f()); state.watch.forEach((f) => f()); state.unsubMsgs?.(); Object.assign(state, { uid: null, profile: null, private: null, priv: null, nick: {}, bootErr: false, reqFrom: [], reqTo: [], friends: [], incoming: [], outgoing: [], unsubs: [], unsubMsgs: null, listening: false, warned: false, selecting: false, active: null, msgDocs: [], sig: '', gotTo: false, chatsReady: false });
clearInterval(hbTimer); hbTimer = null;
state.profiles.clear(); state.presence.clear(); state.typeUntil.clear(); state.typeStamp.clear(); state.sel.clear(); state.watch.clear(); state.chats.clear(); state.celebrated.clear(); keyCache.clear();
closeChat(); closeCongrats(); updateBadges(); }
async function boot() {
const me = state.uid;
try {
const [p, pv] = await Promise.all([getDoc(doc(D(), 'chatUsers', me)), getDoc(doc(D(), 'chatPrivate', me))]);
state.profile = p.exists() ? p.data() : null;
state.private = pv.exists() ? pv.data() : null;
state.nick = state.private?.nicknames || {};
state.priv = (await kvGet('priv:' + me)) || null;
if (state.profile) startListeners();
} catch (e) { console.error(e); state.bootErr = true; }
updateBadges();
}
/* chat opens only from the "Chat" tile on the home screen */
async function openChat() {
if (!state.uid) { toast('Please log in first', 'error'); return; }
await state.bootP;
app.classList.add('active'); document.documentElement.style.overflow = 'hidden';
fit(); route();
}
function route() {
gate.classList.add('hidden'); main.classList.add('hidden');
if (state.bootErr) return showGate('error');
if (!state.profile) return showGate('create');
if (!state.priv) return showGate('unlock'); main.classList.remove('hidden');
renderAll();
if (!state.active) openSide();
}
/* =========================================================
Gate screens
========================================================= */
function showGate(v) {
gate.classList.remove('hidden');
const back = '<button id="cgBack" class="gate-link">Back to memories</button>'; if (v === 'error') {
gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">⚠️</div><h2>Chat isn’t ready</h2>
<p>Couldn’t reach the chat database. Publish the chat Firestore rules (firestore.rules.txt), then try again.</p>${back}</div>`;
} else if (v === 'create') {
gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">💬</div><h2>Create your chat identity</h2>
<p>Choose a username your friends can find you by. Everything you send is end-to-end encrypted.</p>
<input id="cgUser" placeholder="Username (3–20: letters, numbers, _ .)" autocapitalize="none" autocomplete="off" maxlength="20">
<input id="cgPass" type="password" placeholder="Recovery passphrase (8+ characters)" autocomplete="new-password">
<input id="cgPass2" type="password" placeholder="Repeat passphrase" autocomplete="new-password">
<p class="gate-note">The passphrase restores your chats on a new phone. Nobodycan recover it for you.</p>
<button id="cgGo" class="gate-btn">Create &amp; continue ✨</button>${back}</div>`;
$('cgGo').onclick = createIdentity;
} else { gate.innerHTML = `<div class="gate-card"><div class="gate-emoji">🔐</div><h2>Unlock your chats</h2>
<p>This device doesn’t have your chat key yet. Enter your recovery passphrase.</p>
<input id="cuPass" type="password" placeholder="Recovery passphrase" autocomplete="current-password">
<button id="cuGo" class="gate-btn">Unlock</button> <button id="cuForgot" class="gate-link">Forgot passphrase? Reset keys</button>${back}</div>`;
$('cuGo').onclick = unlock; $('cuForgot').onclick = forgotPass;
}
$('cgBack').onclick = closeChat;
}
async function createIdentity() {
const name = $('cgUser').value.trim(), p1 = $('cgPass').value, p2 = $('cgPass2').value, lower = name.toLowerCase();
if (!/^[a-z0-9_.]{3,20}$/i.test(name)) return toast('Username: 3–20 letters, numbers, _ or .', 'error');
if (p1.length < 8) return toast('Passphrase needs 8+ characters', 'error');
if (p1 !== p2) return toast('Passphrases don’t match', 'error');
const btn = $('cgGo'); btn.disabled = true; btn.textContent = 'Creating…';
try {
const me = state.uid, keys = await genKeys(), wrapped = await wrapPriv(keys.priv, p1);
await runTransaction(D(), async (tx) => {
const ref = doc(D(), 'usernames', lower);
if ((await tx.get(ref)).exists()) throw new Error('taken');
tx.set(ref, { uid: me });
tx.set(doc(D(), 'chatUsers', me), { username: name, usernameLower: lower, pubKey: JSON.stringify(keys.pub), bio: '', pfp: '', banner: '', createdAt: serverTimestamp() });
tx.set(doc(D(), 'chatPrivate', me), { keyBackup: wrapped, nicknames: {} });
}); state.priv = await importPriv(keys.priv);
await kvSet('priv:' + me, state.priv); state.profile = { username: name, usernameLower: lower, pubKey: JSON.stringify(keys.pub), bio: '', pfp: '', banner: '' };
state.private = { keyBackup: wrapped, nicknames: {} };
startListeners(); route(); toast('Chat identity created 🔐', 'success');
} catch (e) {
btn.disabled = false; btn.textContent = 'Create & continue ✨';
toast(e.message === 'taken' ? 'That username is taken' : 'Couldn’t create — check Firestore rules', 'error');
}
}
async function unlock() {
try {
const jwk = await unwrapPriv(state.private.keyBackup, $('cuPass').value);
state.priv = await importPriv(jwk); await kvSet('priv:' + state.uid, state.priv);
keyCache.clear(); route(); toast('Unlocked 🔓', 'success');
} catch { toast('Wrong passphrase', 'error'); }
}
async function forgotPass() {
if (!confirm('Resetting creates new keys. Old messages will become unreadable. Continue?')) return;
const p = prompt('Choose a new recovery passphrase (8+ characters)');
if (!p || p.length < 8) return toast('Passphrase needs 8+ characters', 'error');
try {
const keys = await genKeys(), wrapped = await wrapPriv(keys.priv, p);
await updateDoc(doc(D(), 'chatUsers', state.uid), { pubKey: JSON.stringify(keys.pub) });
await setDoc(doc(D(), 'chatPrivate', state.uid), { keyBackup: wrapped }, { merge: true });
state.priv = await importPriv(keys.priv); await kvSet('priv:' + state.uid, state.priv);
state.profile.pubKey = JSON.stringify(keys.pub); keyCache.clear(); route(); toast('Keys reset', 'success');
} catch { toast('Reset failed', 'error'); }
}
/* =========================================================
Listeners: profiles, requests, chats
========================================================= */
function startListeners() {
if (state.listening) return; state.listening = true;
const me = state.uid;
const err = (e) => { console.error(e); if (!state.warned) { state.warned = true; toast('Chat permission error — check Firestore rules', 'error'); } };
watchProfile(me); startPresence();
const rq = collection(D(), 'chatRequests');
state.unsubs.push(onSnapshot(query(rq, where('from', '==', me)), (s) => { state.reqFrom = s.docs.map((d) => ({ id: d.id, ...d.data() })); recompute(); }, err));
state.unsubs.push(onSnapshot(query(rq, where('to', '==', me)), (s) => {
const next = s.docs.map((d) => ({ id: d.id, ...d.data() }));
if (state.gotTo) next.filter((r) => r.status === 'pending' && !state.reqTo.some((o) => o.id === r.id)).forEach(notifyReq);
state.gotTo = true; state.reqTo = next; recompute();
}, err));
state.unsubs.push(onSnapshot(query(collection(D(), 'chats'), where('members', 'array-contains', me)), (s) => {
s.docChanges().forEach((ch) => { if (ch.type === 'removed' || !state.chatsReady || ch.doc.metadata.hasPendingWrites) return;
const c = ch.doc.data(), prev = state.chats.get(ch.doc.id);
if (c.lastFrom && c.lastFrom !== me && c.lastAt && prev?.lastAt?.seconds !== c.lastAt.seconds) notifyMsg(ch.doc.id, c); });
state.chats = new Map(s.docs.map((d) => [d.id, d.data()])); state.chatsReady = true; renderAll(); if (state.active) queuePaint();
}, err));
}
function watchProfile(uid) {
if (state.watch.has(uid)) return;
state.watch.set('p:' + uid, onSnapshot(doc(D(), 'chatPresence', uid), (s) => {
const pd = s.exists() ? s.data({ serverTimestamps: 'estimate' }) : null; state.presence.set(uid, pd); trackTyping(uid, pd); if (uid !== state.uid) renderAll();
}, () => {}));
state.watch.set(uid, onSnapshot(doc(D(), 'chatUsers', uid), (s) => {
const d = s.exists() ? s.data() : null;
state.profiles.set(uid, d);
if (uid === state.uid && d) state.profile = d;
if (uid === state.active) state.sig = '';
renderAll(); if (uid === state.active) queuePaint();
}));
}
async function getProfile(uid) {
if (state.profiles.get(uid)) return state.profiles.get(uid);
try { const s = await getDoc(doc(D(), 'chatUsers', uid)); return s.exists() ? s.data() : null; } catch { return null; }
}
function recompute() {
const me = state.uid;
const all = [...state.reqFrom, ...state.reqTo];
state.friends = all.filter((r) => r.status === 'accepted').map((r) => ({ uid: r.from === me ? r.to : r.from, req: r })); state.incoming = state.reqTo.filter((r) => r.status === 'pending');
state.outgoing = state.reqFrom.filter((r) => r.status === 'pending');
[...state.friends.map((f) => f.uid), ...state.incoming.map((r) => r.from), ...state.outgoing.map((r) => r.to)].forEach(watchProfile);
if (state.active && !state.friends.some((f) => f.uid === state.active)) closeConversation();
checkCongrats(); renderAll();
}
function checkCongrats() {
const me = state.uid;
state.friends.forEach(({ uid, req }) => {
const flag = req.from === me ? 'seenFrom' : 'seenTo';
if (req[flag] || state.celebrated.has(req.id)) return;
state.celebrated.add(req.id); updateDoc(doc(D(), 'chatRequests', req.id), { [flag]: true }).catch(() => {});
celebrate(uid, req.to === me); // true = I accepted, false = they accepted mine
});
}
/* ---------- presence (online / last seen) ---------- */
function startPresence() {
if (hbTimer) return;
const beat = (on) => { if (state.uid) setDoc(doc(D(), 'chatPresence', state.uid), { online: on, lastSeen: serverTimestamp(), ...(on ? {} : { typing: false, typingTo: null }) }, { merge: true }).catch(() => {}); };
beat(!document.hidden); hbTimer = setInterval(() => { if (!document.hidden) beat(true); if (app.classList.contains('active') && state.profile) renderAll(); }, 30000);
if (!presenceBound) {
presenceBound = true;
document.addEventListener('visibilitychange', () => beat(!document.hidden));
addEventListener('pagehide', () => beat(false));
}
}
/* ---------- typing indicator ---------- */
function trackTyping(uid, d) {
if (d && d.typing === true && d.typingTo === state.uid) {
const t = d.typingAt, st = t ? t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6) : 0;
if (st !== state.typeStamp.get(uid)) { state.typeStamp.set(uid, st); state.typeUntil.set(uid, Date.now() + 6000); setTimeout(() => { if (state.profile) renderAll(); }, 6200); }
} else { state.typeUntil.delete(uid); state.typeStamp.delete(uid); }
}
function setTyping(on) {
if (!state.uid) return;
setDoc(doc(D(), 'chatPresence', state.uid), on ? { typing: true, typingTo: state.active, typingAt: serverTimestamp() } : { typing: false, typingTo: null }, { merge: true }).catch(() => {});
}
function typingPing() {
if (!state.active) return;
const now = Date.now();
if (now - typeLast > 2500) { typeLast = now; setTyping(true); }
clearTimeout(typeOff); typeOff = setTimeout(stopTyping, 3000);
}
function stopTyping() {
clearTimeout(typeOff); typeOff = null;
if (typeLast) { typeLast = 0; setTyping(false); }
}
function presence(uid) { const p = state.presence.get(uid);
if ((state.typeUntil.get(uid) || 0) > Date.now()) return { on: true, typing: true, txt: 'typing…' };
if (!p?.lastSeen) return { on: false, txt: 'Offline' };
const ms = p.lastSeen.seconds * 1000;
if (p.online && Date.now() - ms < 100000) return { on: true, txt: 'Online' };
const d = new Date(ms), day = dayLabel(d), t = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
return { on: false, txt: `Last seen ${day === 'Today' ? 'today' : day === 'Yesterday' ? 'yesterday' : day} at ${t}` };
}
/* ---------- notifications ---------- */
async function notifyReq(r) {
const p = await getProfile(r.from);
window.OSNotify?.push({ icon: '💌', title: 'New friend request', body: `@${p?.username || 'someone'} wants to be friends`, key: 'rq:' + r.id, onTap: () => openChat() });
}
async function notifyMsg(cid, c) {
const uid = (c.members || []).find((m) => m !== state.uid); if (!uid) return;
if (app.classList.contains('active') && state.active === uid && !document.hidden) return;
let body = 'New message';
try {
const m = (await getDocs(query(collection(D(), 'chats', cid, 'messages'), orderBy('at', 'desc'), limit(1)))).docs[0]?.data();
if (m) { const p = await decJSON(await sharedKey(uid), m.iv, m.ct); body = p.k === 't' ? p.x.slice(0, 90) : p.k === 'img' ? '📷 Photo' : p.k === 'vid' ? '🎞️ Video' : '🎤 Voice message'; }
} catch {}
window.OSNotify?.push({ icon: '💬', title: displayName(uid), body, key: 'chat:' + cid, onTap: async () => { await openChat(); openConversation(uid); } });
}
async function celebrate(uid, iAccepted) {
const p = await getProfile(uid), nm = p?.username || 'your friend';
$('ccPfp').innerHTML = av(p, nm);
$('ccText').innerHTML = iAccepted ? `You accepted <b>@${esc(nm)}</b>’s friend request` : `<b>@${esc(nm)}</b> has accepted your friend request`;
$('ccSub').textContent = iAccepted ? 'You two are friends now 💞' : 'Your friendship is official 💞';
$('ccChat').onclick = async () => { closeCongrats(); await openChat(); openConversation(uid); };
congrats.classList.remove('active'); void congrats.offsetWidth; // replay the animation every time
congrats.classList.add('active');
}
/* =========================================================
Rendering: sidebar
========================================================= */
const av = (p, name) => { const s = safeImg(p?.pfp); return s ? `<img class="pfp" src="${s}" alt="">` : `<span class="pfp">${esc((name || '?').trim()[0]?.toUpperCase() || '?')}</span>`; };
const displayName = (uid) => state.nick[uid] || state.profiles.get(uid)?.username || 'Friend';
function unreadFor(uid) { const c = state.chats.get(chatId(state.uid, uid));
if (!c || !c.lastAt || c.lastFrom === state.uid) return false;
let seen = {}; try { seen = JSON.parse(LSg('chatSeen') || '{}'); } catch {}
return c.lastAt.seconds * 1000 > (seen[chatId(state.uid, uid)] || 0);
}
function markSeen(cid) {
let seen = {}; try { seen = JSON.parse(LSg('chatSeen') || '{}'); } catch {}
const last = state.msgDocs[state.msgDocs.length - 1];
seen[cid] = Math.max(last?.at ? last.at.seconds * 1000 : 0, Date.now());
LSs('chatSeen', JSON.stringify(seen)); updateBadges();
}
function updateBadges() {
const unread = state.friends.some((f) => unreadFor(f.uid));
$('chatBadgeDot')?.classList.toggle('hidden', !(state.incoming.length || unread));
$('csBurgerDot')?.classList.toggle('hidden', !state.incoming.length);
} function friendRow(uid, pick) {
const p = state.profiles.get(uid) || {}, nm = displayName(uid), b = safeImg(p.banner), un = p.username ? '@' + p.username : '';
const pr = presence(uid);
return `<button class="fr-row${state.active === uid ? ' sel' : ''}${pick ? ' pickable' : ''}${pick === 2 ? ' picked' : ''}" data-open="${uid}">
${bannerEl(p, 'fr-banner')}
<span class="fr-sheen"></span><span class="fr-scrim"></span>
<span class="pfp-wrap"><span class="pfp-ring">${av(p, nm)}</span><i class="pdot ${pr.on ? 'on' : 'off'}"></i></span>
<span class="fr-text"><b>${esc(nm)}</b>${state.nick[uid] && un ? `<i>${esc(un)}</i>` : ''}<i class="pres${pr.on ? ' on' : ''}${pr.typing ? ' typing' : ''}">${esc(pr.txt)}</i></span>
${unreadFor(uid) ? '<span class="fr-dot"></span>' : ''}${pick ? '<span class="fr-ck"></span>' : ''}</button>`; }
/* ---------- smooth lists: only rows that really changed are touched, so nothing flickers or restarts ---------- */
const rowIO = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('off', !e.isIntersecting)), { rootMargin: '60px' }) : null;
function setList(box, items, watch) {
const old = new Map();
for (const el of [...box.children]) { if (el.__k == null) el.remove(); else old.set(el.__k, el); }
let ref = box.firstElementChild;
for (const it of items) {
const el = old.get(it.k);
if (el && el.__h === it.html) { old.delete(it.k); if (el === ref) ref = ref.nextElementSibling; else box.insertBefore(el, ref); continue; }
const t = document.createElement('template'); t.innerHTML = it.html; const ne = t.content.firstElementChild; if (!ne) continue;
ne.__k = it.k; ne.__h = it.html;
if (el) { old.delete(it.k); if (el === ref) ref = ref.nextElementSibling; el.remove(); }
box.insertBefore(ne, ref); if (watch && rowIO) rowIO.observe(ne);
}
old.forEach((el) => el.remove());
}
const cnt = (n) => `<div class="cs-label">${n}</div>`;
function renderSide() {
const p = state.profile; if (!p) return; $('csMe').innerHTML = `<span class="pfp-ring sm">${av(p, p.username)}</span><span><b>@${esc(p.username)}</b><i>Tap to edit your profile</i></span>`;
const q = state.search.trim().toLowerCase(), items = [];
if (state.incoming.length) {
items.push({ k: 'l:rq', html: cnt('Friend requests') });
state.incoming.forEach((r) => {
const pr = state.profiles.get(r.from) || {};
items.push({ k: 'rq:' + r.id, html: `<div class="rq-row"><span class="pfp-sm">${av(pr, pr.username)}</span><span class="rq-name"><b>@${esc(pr.username || '…')}</b><i>wants to be friends</i></span>
<button class="rq-ok" data-acc="${r.id}" aria-label="Accept">✓</button><button class="rq-no" data-dec="${r.id}" aria-label="Decline">×</button></div>` });
});
}
if (state.outgoing.length) {
items.push({ k: 'l:out', html: cnt('Sent requests') });
state.outgoing.forEach((r) => {
const pr = state.profiles.get(r.to) || {};
items.push({ k: 'ro:' + r.id, html: `<div class="rq-out"><span>Waiting for @${esc(pr.username || '…')}</span><button data-cancel="${r.id}">Cancel</button></div>` });
});
}
const list = state.friends
.filter((f) => !q || displayName(f.uid).toLowerCase().includes(q) || (state.profiles.get(f.uid)?.username || '').includes(q))
.sort((a, b) => ((state.chats.get(chatId(state.uid, b.uid))?.lastAt?.seconds || 0) - (state.chats.get(chatId(state.uid, a.uid))?.lastAt?.seconds || 0)) || displayName(a.uid).localeCompare(displayName(b.uid)));
items.push({ k: 'l:fr', html: cnt('Friends · ' + state.friends.length) });
if (list.length) list.forEach((f) => items.push({ k: 'fr:' + f.uid, html: friendRow(f.uid) }));
else items.push({ k: 'empty', html: `<div class="cs-empty">${state.friends.length ? 'No friends match.' : 'No friends yet.<br>Tap the 👤+ button to add one by username.'}</div>` });
setList($('csScroll'), items, true);
}
function renderHeader() {
const uid = state.active, who = $('cpWho'), has = state.friends.length > 0;
$('cpNote')?.classList.toggle('gone', has);
const em = $('cpEmptyTxt'); if (em) em.innerHTML = has ? 'Select a friend<br>to start chatting' : 'Add a friend<br>to start chatting';
if (!uid) { who.innerHTML = `<span style="min-width:0"><b class="cp-title">Chats</b>${has ? '<i>🔒 End-to-end encrypted</i>' : ''}</span>`; return; }
const p = state.profiles.get(uid) || {}, nm = displayName(uid); const pr = presence(uid);
who.innerHTML = `<span class="pfp-wrap sm"><span class="pfp-sm">${av(p, nm)}</span><i class="pdot ${pr.on ? 'on' : 'off'}"></i></span><span style="min-width:0"><b>${esc(nm)}</b><i class="pres${pr.on ? ' on' : ''}${pr.typing ? ' typing' : ''}">${esc(pr.txt)}</i><i>🔒 End-to-end encrypted</i></span>`;
}
let raRaf = 0;
function renderAll() { if (raRaf) return; raRaf = requestAnimationFrame(() => { raRaf = 0; if (!state.profile) { updateBadges(); return; } renderSide(); renderHeader(); updateBadges(); renderFriendsPage(); }); }
$('csScroll').addEventListener('click', async (e) => {
const t = e.target.closest('[data-open],[data-acc],[data-dec],[data-cancel]'); if (!t) return;
if (t.dataset.open) return openConversation(t.dataset.open); try {
if (t.dataset.acc) await updateDoc(doc(D(), 'chatRequests', t.dataset.acc), { status: 'accepted', seenFrom: false, seenTo: false });
else await deleteDoc(doc(D(), 'chatRequests', t.dataset.dec || t.dataset.cancel));
} catch { toast('Something went wrong', 'error'); }
});
$('csSearch').addEventListener('input', (e) => { state.search = e.target.value; renderSide(); });
$('csMe').onclick = () => openMeSheet();
$('csAdd').onclick = () => openAddSheet();
$('csBurger').onclick = (e) => { e.stopPropagation(); $('csMenu').classList.toggle('open'); };
document.addEventListener('click', (e) => { if (!e.target.closest('#csMenu')) $('csMenu').classList.remove('open'); });
$('csRemove').onclick = () => { $('csMenu').classList.remove('open'); openRemoveSheet(); }; $('csProfile').onclick = () => { $('csMenu').classList.remove('open'); openMeSheet(); };
$('csForgot').onclick = () => { $('csMenu').classList.remove('open'); openUsernameSheet(); };
$('cpToggle').onclick = () => { if (wide()) main.classList.toggle('collapsed'); else if (side.classList.contains('active')) hideSideMobile(); else openSide(); };
$('cpWho').onclick = () => { if (state.active) openFriendSheet(state.active); };
/* =========================================================
Conversation
========================================================= */
function closeConversation() {
exitSelect(); stopTyping(); state.reply = null; state.edit = null; renderReply();
state.unsubMsgs?.(); state.unsubMsgs = null; state.active = null; state.msgDocs = []; state.sig = ''; pane.classList.remove('active');
$('cpMsgs').classList.add('hidden'); $('cpEmpty').classList.remove('hidden'); renderHeader();
}
async function openConversation(uid) {
await state.bootP;
if (!state.priv) return route();
state.unsubMsgs?.();
state.active = uid; loadLocal(uid); state.edit = null; state.msgDocs = []; state.sig = ''; state.first = true; state.reply = null; renderReply();
pane.classList.add('active');
hideSideMobile();
$('cpEmpty').classList.add('hidden'); $('cpMsgs').classList.remove('hidden'); comp.classList.remove('hidden');
$('cpMsgs').innerHTML = '';
renderAll();
const cid = chatId(state.uid, uid);
if (!state.chats.has(cid)) { // brand-new chat: create it first. Existing chats open straight away (no waiting on the server)
try {
const c = await getDoc(doc(D(), 'chats', cid));
if (!c.exists()) await setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort() });
} catch { toast('Couldn’t open this chat', 'error'); return; }
}
if (state.active !== uid) return;
state.lim = 40; state.more = false; state.anchor = null; state.stick = false;
subMsgs(uid, cid);
}
function subMsgs(uid, cid) {
state.unsubMsgs?.();
state.unsubMsgs = onSnapshot(query(collection(D(), 'chats', cid, 'messages'), orderBy('at', 'desc'), limit(state.lim)), { includeMetadataChanges: true }, (s) => {
if (state.active !== uid) return;
s.docChanges().forEach((ch) => { if (ch.type === 'removed') { const u = media.get(ch.doc.id); if (u) { URL.revokeObjectURL(u); media.delete(ch.doc.id); } plain.delete(ch.doc.id); } });
state.msgDocs = s.docs.map((d) => ({ id: d.id, pending: d.metadata.hasPendingWrites, ...d.data({ serverTimestamps: 'estimate' }) })).reverse();
if (state.sel.size) { const live = new Set(state.msgDocs.map((m) => m.id)); [...state.sel].forEach((id) => { if (!live.has(id)) state.sel.delete(id); }); if (state.selecting && !state.sel.size) exitSelect(); else updateSelUI(); }
paint(); if (!s.metadata.hasPendingWrites) markSeen(cid);
}, () => toast('Couldn’t load messages', 'error'));
}
const dayLabel = (d) => {
const diff = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 864e5);
return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}; const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB';
/* ---------- starry gold background (same sparkles as the Our Space welcome) ---------- */
function dust(el, n) {
if (!el) return;
const g = ['✦', '·', '✧'], few = matchMedia('(prefers-reduced-motion: reduce)').matches;
el.innerHTML = Array.from({ length: few ? 8 : n }, () => `<i style="--x:${(Math.random() * 100).toFixed(1)}%;--s:${(8 + Math.random() * 14).toFixed(0)}px;--t:${(7 + Math.random() * 8).toFixed(1)}s;--dl:${(-Math.random() * 12).toFixed(1)}s;--sw:${((Math.random() - .5) * 60).toFixed(0)}px">${g[(Math.random() * 3) | 0]}</i>`).join('');
}
/* ---------- reply to a message (the ↩ arrow beside every message) ---------- */
const REPLY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v3"/></svg>';
const replyLabel = (r) => r.k === 'img' ? '📷 Photo' : r.k === 'vid' ? '🎥 Video' : r.k === 'aud' ? '🎧 Voice message' : r.k === 'file' ? '📄 File' : (r.x || 'Message');
const replyWho = (r) => r.f === state.uid ? 'You' : displayName(r.f);
function renderReply() {
const box = $('cpReply'); if (!box) return;
const r = state.reply, e = state.edit;
box.classList.toggle('hidden', !r && !e);
box.innerHTML = e ? `<span class="cr-bar"></span><span class="cr-t"><b>✏️ Editing message</b><span>${esc(e.text)}</span></span><button type="button" id="crX" aria-label="Cancel edit">${IC.close(18)}</button>`
: r ? `<span class="cr-bar"></span><span class="cr-t"><b>Replying to ${esc(replyWho(r))}</b><span>${esc(replyLabel(r))}</span></span><button type="button" id="crX" aria-label="Cancel reply">${IC.close(18)}</button>` : '';
$('crX')?.addEventListener('click', () => { if (state.edit) cancelEdit(); else { state.reply = null; renderReply(); } });
}
function startEdit(id, text) {
state.edit = { id, text: String(text || '').slice(0, 90) }; state.reply = null; renderReply();
input.value = text; autoGrow(); updateComp(); input.focus();
}
function cancelEdit() { state.edit = null; input.value = ''; autoGrow(); updateComp(); renderReply(); }
async function doEdit() {
const ed = state.edit, uid = state.active, x = input.value.trim(); if (!ed || !uid) return;
if (!x) return toast('A message can’t be empty', 'info');
const old = plain.get(ed.id);
if (!old || old.k !== 't' || x === old.x) { cancelEdit(); return; }
state.edit = null; input.value = ''; autoGrow(); updateComp(); stopTyping(); renderReply();
try {
const key = await sharedKey(uid), cid = chatId(state.uid, uid), payload = { ...old, x };
const { iv, ct } = await encJSON(key, payload);
await updateDoc(doc(D(), 'chats', cid, 'messages', ed.id), { iv, ct, edited: true });
plain.set(ed.id, payload); pct.set(ed.id, ct); toast('Message edited ✏️', 'success');
} catch (e) { console.error(e); toast('Couldn’t edit — publish the updated Firestore rules', 'error'); }
}
function startReply(id) {
const m = (state.msgDocs || []).find((x) => x.id === id), p = plain.get(id);
if (!m || !p || p.k === 'err') { toast('Can’t reply to this message', 'info'); return; }
state.reply = { id, f: m.from, k: p.k, x: p.k === 't' ? String(p.x || '').slice(0, 90) : '' };
renderReply(); input.focus();
}
function jumpToMsg(id) {
const el = $('cpMsgs').querySelector('[data-mid="' + String(id).replace(/"/g, '') + '"]');
if (!el) { toast('That message is further up than what’s loaded', 'info'); return; }
el.scrollIntoView({ block: 'center', behavior: 'smooth' });
el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
setTimeout(() => el.classList.remove('flash'), 1700);
}
const tsOf = (t) => (t && t.seconds != null) ? t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6) : 0;
function msgHTML(m, p, url, mine, t, theirRead) {
const time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
let inner;
if (p.k === 'err') inner = '<div class="bub lock">🔒 Can’t decrypt this message on this device</div>';
else if (p.k === 't') inner = `<div class="bub">${esc(p.x)}</div>`;
else if (url) {
inner = p.k === 'img' ? `<div class="bub media"><img class="m-img" data-view src="${url}" alt="" decoding="async"></div>`
: p.k === 'vid' ? `<div class="bub media"><video controls playsinline preload="metadata" src="${url}"></video></div>`
: p.k === 'file' ? `<div class="bub fl" data-fdl="${m.id}"><span class="fl-ic">${esc(fileExt(p.nm))}</span><span class="fl-tx"><b>${esc(p.nm || 'File')}</b><small>${fmtSize(p.sz)} · Tap to save</small></span></div>`
: `<div class="bub vm" data-vm="${m.id}" data-dur="${Number(p.dur) || 0}"><button type="button" class="vm-btn" data-vplay aria-label="Play voice message"><svg class="pl" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg><svg class="pa" viewBox="0 0 24 24"><path d="M7 5h3.6v14H7zM13.400 5H17v14h-3.600z"/></svg></button><div class="vm-track" data-vseek><div class="vm-bars">${vmBars(m.id)}</div></div><span class="vm-t">${fmtDur(p.dur)}</span></div>`;
} else {
inner = `<div class="bub media"><button class="m-load" data-load="${m.id}">${p.k === 'vid' ? '▶ Video' : p.k === 'aud' ? '🎧 Voice message' : p.k === 'file' ? '📄 ' + esc(p.nm || 'File') : '🖼️ Photo'} · ${fmtSize(p.sz)}<br>${m.d ? 'Opening…' : 'Tap to load'}</button></div>`;
}
const rq = p.r && p.r.id ? `<div class="rq" data-rq="${esc(p.r.id)}"><b>${esc(replyWho(p.r))}</b><span>${esc(replyLabel(p.r))}</span></div>` : '';
const rp = '';
const stars = local.star.has(m.id) ? '<b class="st">★</b>' : '', edt = m.edited ? '<i class="ed">edited</i>' : '';
const at = tsOf(m.at), seen = !!(theirRead && at && theirRead >= at);
const tick = !mine ? '' : m.pending ? '<em class="rd pend">🕓 Sending…</em>' : seen ? '<em class="rd seen">✓✓ Seen</em>' : '<em class="rd">✓ Delivered</em>';
return `<div class="msg ${mine ? 'me' : 'them'}${state.sel.has(m.id) ? ' picked' : ''}" data-mid="${m.id}"><span class="sel-ck"></span>${rq}${inner}<span class="mt">${stars}${edt}${time}${tick}</span>${rp}</div>`;
}
const fileExt = (n) => { const m = /\.([A-Za-z0-9]{1,5})$/.exec(String(n || '')); return m ? m[1].toUpperCase() : 'FILE'; };
const fmtDur = (x) => { x = Math.max(0, Math.round(Number(x) || 0)); return Math.floor(x / 60) + ':' + String(x % 60).padStart(2, '0'); };
const vmBars = (id) => { let h = 7; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0; let o = ''; for (let i = 0; i < 30; i++) { h = (h * 1664525 + 1013904223) >>> 0; o += `<i style="height:${26 + ((h >>> 8) % 70)}%"></i>`; } return o; };
/* ---------- voice message player: one shared audio, so playback never stops when the chat repaints ---------- */
const vp = { a: new Audio(), id: null, raf: 0 }; vp.a.preload = 'auto';
function vmSync() {
const box = $('cpMsgs'); if (!box) return;
if (vp.id && !box.querySelector('.vm[data-vm="' + vp.id + '"]')) { vp.a.pause(); vp.id = null; }
box.querySelectorAll('.vm').forEach((el) => {
const on = el.dataset.vm === vp.id, known = on && isFinite(vp.a.duration) && vp.a.duration > 0 ? vp.a.duration : (+el.dataset.dur || 0);
const bars = el.querySelectorAll('.vm-bars i'), lit = on && known ? Math.round(Math.min(1, vp.a.currentTime / known) * bars.length) : 0;
bars.forEach((b, i) => b.classList.toggle('on', i < lit));
el.classList.toggle('playing', on && !vp.a.paused);
el.querySelector('.vm-t').textContent = on && (!vp.a.paused || vp.a.currentTime > .2) ? fmtDur(vp.a.currentTime) : fmtDur(known);
});
}
const vmLoop = () => { vmSync(); vp.raf = vp.a.paused ? 0 : requestAnimationFrame(vmLoop); };
['play', 'playing'].forEach((n) => vp.a.addEventListener(n, () => { if (!vp.raf) vp.raf = requestAnimationFrame(vmLoop); }));
['pause', 'seeked', 'loadedmetadata'].forEach((n) => vp.a.addEventListener(n, vmSync));
vp.a.addEventListener('ended', () => { vp.a.currentTime = 0; vmSync(); });
function vmStart(el) {
const id = el.dataset.vm, url = media.get(id); if (!url) return false;
if (vp.id !== id) { vp.a.pause(); vp.id = id; vp.a.src = url; vp.a.currentTime = 0; }
return true;
}
function vmToggle(el) {
if (!vmStart(el)) return;
if (vp.a.paused) vp.a.play().catch(() => toast('Couldn’t play this voice message', 'error')); else vp.a.pause();
vmSync();
}
function vmSeek(el, ev) {
if (!vmStart(el)) return;
const r = el.querySelector('.vm-track').getBoundingClientRect(), f = Math.min(1, Math.max(0, (ev.clientX - r.left) / Math.max(1, r.width)));
const d = isFinite(vp.a.duration) && vp.a.duration > 0 ? vp.a.duration : (+el.dataset.dur || 0); if (!d) return;
try { vp.a.currentTime = f * d; } catch {}
if (vp.a.paused) vp.a.play().catch(() => {}); vmSync();
}
/* ---------- progress pill for big uploads / downloads ---------- */
let upT = 0;
function upProg(txt, f) {
const el = $('upProg'); if (!el) return; clearTimeout(upT);
if (txt == null) { el.classList.remove('on'); return; }
el.classList.add('on'); $('upTxt').textContent = txt; $('upPct').textContent = f == null ? '' : Math.round(f * 100) + '%'; el.style.setProperty('--p', (f == null ? 0 : f * 100) + '%');
if (f != null && f >= 1) upT = setTimeout(() => el.classList.remove('on'), 900);
}
let paintTok = 0, pq = 0, hyd = 0; const badMedia = new Set();
const queuePaint = () => { if (!pq) pq = requestAnimationFrame(() => { pq = 0; paint(); }); };
async function paint() {
const uid = state.active; if (!uid) return;
const tok = ++paintTok, box = $('cpMsgs'), docs = state.msgDocs.filter((m) => !local.hide.has(m.id));
let key = null; try { key = await sharedKey(uid); } catch {}
if (tok !== paintTok || uid !== state.active) return;
const bodies = new Map();
await Promise.all(docs.map(async (m) => {
let p = plain.get(m.id); if (p && pct.get(m.id) !== m.ct) p = null;
if (!p) {
if (!key) p = { k: 'err' };
else { try { p = await decJSON(key, m.iv, m.ct); plain.set(m.id, p); pct.set(m.id, m.ct); } catch { p = { k: 'err' }; } }
}
bodies.set(m.id, p);
}));
if (tok !== paintTok || uid !== state.active) return;
const chat = state.chats.get(chatId(state.uid, uid)) || {}, theirRead = tsOf(chat.reads && chat.reads[uid]);
const items = []; let last = '';
for (const m of docs) {
const t = m.at ? new Date(m.at.seconds * 1000) : new Date(), day = dayLabel(t);
if (day !== last) { items.push({ k: 'd:' + day, html: `<div class="day-sep">${day}</div>` }); last = day; }
items.push({ k: m.id, html: msgHTML(m, bodies.get(m.id), media.get(m.id), m.from === state.uid, t, theirRead) });
}
const near = state.first || state.stick || box.scrollHeight - box.scrollTop - box.clientHeight < 160;
const a = state.anchor && docs.length > state.anchor.n ? state.anchor : null;
if (a) { state.anchor = null; state.more = false; }
setList(box, items);
if (a) box.scrollTop = a.t + (box.scrollHeight - a.h);
else if (near) { box.scrollTop = box.scrollHeight; box.__pin = true; }
state.first = false; state.stick = false;
vmSync();
hydrateMedia(docs, key, uid);
}
/* photos / videos / voice are decrypted one by one in the background, newest first, so text is never kept waiting */
async function hydrateMedia(docs, key, uid) {
if (!key) return; const me = ++hyd;
for (const m of [...docs].reverse()) {
if (me !== hyd || uid !== state.active) return;
if (media.has(m.id) || !m.d || badMedia.has(m.id)) continue;
const p = plain.get(m.id); if (!p || !p.k || p.k === 't' || p.k === 'err') continue;
try {
const url = URL.createObjectURL(new Blob([await decBytes(key, p.miv, m.d)], { type: p.mime }));
if (media.has(m.id)) URL.revokeObjectURL(url); else { media.set(m.id, url); queuePaint(); }
} catch { badMedia.add(m.id); }
await new Promise((r) => setTimeout(r, 0));
}
}
/* keep the view glued to the bottom while photos finish loading; load older messages when you reach the top */
(function () {
const box = $('cpMsgs'); let raf = 0;
const grow = () => { if (box.__pin) box.scrollTop = box.scrollHeight; };
box.addEventListener('load', grow, true); box.addEventListener('loadedmetadata', grow, true);
box.addEventListener('scroll', () => {
if (raf) return;
raf = requestAnimationFrame(() => {
raf = 0; box.__pin = box.scrollHeight - box.scrollTop - box.clientHeight < 160;
if (box.scrollTop < 60 && state.active && !state.more && state.msgDocs.length >= state.lim) {
state.more = true; state.lim += 40; state.anchor = { h: box.scrollHeight, t: box.scrollTop, n: state.msgDocs.length };
subMsgs(state.active, chatId(state.uid, state.active));
}
});
}, { passive: true });
})();
const loadingMedia = new Set();
async function loadChunked(id) {
const p = plain.get(id); if (!p?.mid || loadingMedia.has(id)) return;
loadingMedia.add(id);
const cid = chatId(state.uid, state.active), parts = new Array(p.n); let done = 0;
upProg('Downloading…', 0);
try {
const key = await sharedKey(state.active);
for (let i = 0; i < p.n; i += 4) {
await Promise.all([...Array(Math.min(4, p.n - i))].map(async (_, j) => {
const dd = (await getDoc(doc(D(), 'chats', cid, 'blobs', `${p.mid}_${i + j}`))).data();
parts[i + j] = p.v === 2 ? await decBytes(key, dd.iv, dd.d) : dd.d;
upProg('Downloading…', ++done / p.n);
}));
}
const blob = p.v === 2 ? new Blob(parts, { type: p.mime }) : new Blob([await decBytes(key, p.miv, parts.join(''))], { type: p.mime });
media.set(id, URL.createObjectURL(blob));
queuePaint(); upProg('Ready', 1);
} catch (e) { console.error(e); upProg(null); toast('Download failed', 'error'); }
loadingMedia.delete(id);
}
function saveFile(id) {
const url = media.get(id), p = plain.get(id); if (!url) return;
const a = document.createElement('a'); a.href = url; a.download = p?.nm || 'file'; document.body.appendChild(a); a.click(); a.remove();
}
$('cpMsgs').addEventListener('click', (e) => {
if (state.selecting) { const mm = e.target.closest('.msg'); if (mm) toggleSel(mm.dataset.mid); return; } const vb = e.target.closest('.vm'); if (vb) { if (e.target.closest('[data-vseek]')) vmSeek(vb, e); else vmToggle(vb); return; }
const fd = e.target.closest('[data-fdl]'); if (fd) { saveFile(fd.dataset.fdl); return; }
const rqb = e.target.closest('[data-rq]'); if (rqb) { jumpToMsg(rqb.dataset.rq); return; }
const v = e.target.closest('[data-view]'), l = e.target.closest('[data-load]'); if (v) { light.querySelector('img').src = v.src; light.classList.add('active'); }
else if (l) loadChunked(l.dataset.load);
});
/* =========================================================
Sending
========================================================= */
async function sendPayload(payload, extra) {
const uid = state.active; if (!uid) return;
if (state.reply) { payload = { ...payload, r: state.reply }; state.reply = null; renderReply(); }
state.stick = true;
const key = await sharedKey(uid), cid = chatId(state.uid, uid), { iv, ct } = await encJSON(key, payload);
// the message is queued locally at once (shows as "Sending…"); the chat summary goes out in parallel instead of blocking it
const sent = addDoc(collection(D(), 'chats', cid, 'messages'), { from: state.uid, at: serverTimestamp(), iv, ct, ...(extra || {}) });
setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort(), lastAt: serverTimestamp(), lastFrom: state.uid }, { merge: true }).catch(() => {});
await sent;
} function needFriend() {
if (state.active) return false;
toast('Add a friend to start chatting 💬', 'info');
if (!state.friends.length) openAddSheet(); else openSide();
return true;
} function sendText() {
if (state.edit) { doEdit(); return; }
const x = input.value.trim(); if (!x) return;
if (needFriend()) return;
input.value = ''; autoGrow(); updateComp(); stopTyping();
sendPayload({ k: 't', x }).catch(() => toast('Couldn’t send', 'error'));
}
async function sendMedia(blob, k, extra) {
const uid = state.active; if (!uid) return;
const label = k === 'vid' ? 'video' : k === 'img' ? 'photo' : k === 'aud' ? 'voice message' : 'file';
try {
const key = await sharedKey(uid), cid = chatId(state.uid, uid);
const meta = { k, mime: blob.type || 'application/octet-stream', sz: blob.size, ...(extra || {}) };
if (blob.size <= 500000) {
const e = await encBytes(key, await blob.arrayBuffer());
if (e.ct.length <= INLINE) { await sendPayload({ ...meta, miv: e.iv }, { d: e.ct }); return; }
}
const mid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8), n = Math.ceil(blob.size / CHUNK);
await setDoc(doc(D(), 'chats', cid), { members: [state.uid, uid].sort() }, { merge: true });
let done = 0; upProg('Sending ' + label + '…', 0);
for (let i = 0; i < n; i += 3) {
await Promise.all([...Array(Math.min(3, n - i))].map(async (_, j) => {
const at = (i + j) * CHUNK, e = await encBytes(key, await blob.slice(at, at + CHUNK).arrayBuffer());
await setDoc(doc(D(), 'chats', cid, 'blobs', `${mid}_${i + j}`), { d: e.ct, iv: e.iv, from: state.uid });
upProg('Sending ' + label + '…', ++done / n);
}));
}
await sendPayload({ ...meta, mid, n, v: 2 }, { mid, n });
} catch (err) { console.error(err); upProg(null); toast('Couldn’t send ' + label, 'error'); }
}
const shrinkImg = (file, max, q) => new Promise((res, rej) => {
const img = new Image(), u = URL.createObjectURL(file); img.onload = () => {
const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
c.toBlob((b) => (b ? res(b) : rej()), 'image/jpeg', q);
}; img.onerror = () => { URL.revokeObjectURL(u); rej(); }; img.src = u;
});
async function prepImage(file) { for (const [m, q] of [[1280, .72], [1024, .6], [800, .5], [640, .45]]) { const b = await shrinkImg(file, m, q); if (b.size <= 480000) return b; }
throw new Error('big');
}
const cropImg = (file, w, h, q) => new Promise((res, rej) => {
const img = new Image(), u = URL.createObjectURL(file);
img.onload = () => {
const c = document.createElement('canvas'); c.width = w; c.height = h;
const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
c.getContext('2d').drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh); URL.revokeObjectURL(u);
res(c.toDataURL('image/jpeg', q));
};
img.onerror = () => { URL.revokeObjectURL(u); rej(); }; img.src = u;
});
const attMenu = $('attMenu'), closeAtt = () => { attMenu.classList.remove('open'); $('cpFileBtn').classList.remove('open'); };
$('cpFileBtn').onclick = (e) => { e.stopPropagation(); if (needFriend()) return; const o = attMenu.classList.toggle('open'); $('cpFileBtn').classList.toggle('open', o); };
document.addEventListener('click', (e) => { if (!e.target.closest('#attMenu') && !e.target.closest('#cpFileBtn')) closeAtt(); });
attMenu.addEventListener('click', (e) => {
const b = e.target.closest('[data-att]'); if (!b) return; closeAtt();
$(b.dataset.att === 'photo' ? 'cpPhoto' : b.dataset.att === 'video' ? 'cpVideo' : 'cpFile').click();
});
async function sendPicked(files, mode) {
for (const f of files) {
if (mode === 'photo') {
if (!f.type.startsWith('image/')) { toast('Photos only here — use Files for other things', 'error'); continue; }
try { upProg('Sending photo…', null); await sendMedia(await prepImage(f), 'img'); upProg(null); } catch { upProg(null); toast('Couldn’t read that photo', 'error'); }
} else if (f.type.startsWith('video/')) {
await sendMedia(f, 'vid');
} else if (mode === 'video') {
toast('That isn’t a video — use Files', 'error');
} else {
await sendMedia(f, 'file', { nm: String(f.name || 'file').slice(0, 120) });
}
}
}
[['cpPhoto', 'photo'], ['cpVideo', 'video'], ['cpFile', 'file']].forEach(([id, mode]) => {
$(id).onchange = (e) => { const fs = [...e.target.files]; e.target.value = ''; if (fs.length) sendPicked(fs, mode); };
});
/* composer behaviour */
let agRaf = 0;
function autoGrow() { if (agRaf) return; agRaf = requestAnimationFrame(() => { agRaf = 0; input.style.height = '46px'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; }); }
function updateComp() {
const has = input.value.trim().length > 0 || !!rec;
$('cpSend').classList.toggle('hide', !has); $('cpMic').classList.toggle('hide', has && !rec ? true : false); }
let ucLast = null;
input.addEventListener('input', () => { autoGrow(); const has = input.value.trim().length > 0; if (has !== ucLast) { ucLast = has; updateComp(); } if (has) typingPing(); else stopTyping(); });
input.addEventListener('blur', () => stopTyping());
input.addEventListener('focus', () => setTimeout(() => { fit(); $('cpMsgs').scrollTop = $('cpMsgs').scrollHeight; }, 300));
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && matchMedia('(pointer:fine)').matches) { e.preventDefault(); sendText(); } });
$('cpSend').onclick = () => { if (rec) stopRec(true); else sendText(); };
/* voice messages */
let rec = null, recTimer = null;
const stopRec = (send) => { if (!rec) return; rec.send = send; if (rec.mr.state !== 'inactive') rec.mr.stop(); };
async function startRec() {
if (rec) return;
if (needFriend()) return; if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) return toast('Voice messages aren’t supported here', 'error');
try {
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mt = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find((t) => MediaRecorder.isTypeSupported(t));
const mr = new MediaRecorder(stream, { ...(mt ? { mimeType: mt } : {}), audioBitsPerSecond: 32000 });
const chunks = [];
mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
rec = { mr, stream, chunks, t0: Date.now(), send: false, mt: mr.mimeType };
mr.onstop = () => {
const r = rec; rec = null; clearInterval(recTimer);
stream.getTracks().forEach((t) => t.stop()); comp.classList.remove('recording'); updateComp();
if (r && r.send && r.chunks.length) sendMedia(new Blob(r.chunks, { type: r.mt || 'audio/webm' }), 'aud', { dur: Math.max(1, Math.round((Date.now() - r.t0) / 1000)) });
};
mr.start(); comp.classList.add('recording'); $('cpRecTime').textContent = '0:00'; updateComp();
recTimer = setInterval(() => {
if (!rec) return; const s = Math.floor((Date.now() - rec.t0) / 1000);
$('cpRecTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
if (s >= 90) stopRec(true);
}, 250);
} catch { toast('Microphone permission needed', 'error'); }
}
$('cpMic').onclick = startRec; $('cpRecCancel').onclick = () => stopRec(false);
/* =========================================================
Sheets: add friend, remove friends, profiles, username
========================================================= */
function openAddSheet() {
openSheet('Add a friend', `<p class="sh-note">Enter your friend’s chat username.</p>
<div class="sh-row"><input id="afName" type="text" placeholder="@username" autocapitalize="none" autocomplete="off"><button id="afFind" class="gate-btn sm">Find</button></div>
<div id="afRes"></div>`);
$('afFind').onclick = async () => {
const name = $('afName').value.trim().replace(/^@/, '').toLowerCase(), box = $('afRes'); if (!/^[a-z0-9_.]{3,20}$/.test(name)) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Enter a valid username.</p>'; return; }
box.innerHTML = '<p class="sh-note" style="margin-top:12px">Searching…</p>';
try {
const u = await getDoc(doc(D(), 'usernames', name));
if (!u.exists()) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">No one found with that username.</p>'; return; }
const uid = u.data().uid;
if (uid === state.uid) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">That’s you 🙂</p>'; return; }
const p = await getProfile(uid); if (!p) { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Profile not available.</p>'; return; }
box.innerHTML = `<div class="rq-row" style="margin-top:14px"><span class="pfp-sm">${av(p, p.username)}</span><span class="rq-name"><b>@${esc(p.username)}</b><i>${esc(p.bio || 'Chat user')}</i></span></div>
<button id="afSend" class="sh-btn primary">Send friend request</button>`;
$('afSend').onclick = async () => {
if (state.friends.some((f) => f.uid === uid)) return toast('Already friends', 'info');
if (state.outgoing.some((r) => r.to === uid)) return toast('Request already sent', 'info');
if (state.incoming.some((r) => r.from === uid)) return toast('They already sent you one — accept it in your list', 'info');
try {
await setDoc(doc(D(), 'chatRequests', state.uid + '_' + uid), { from: state.uid, to: uid, status: 'pending', seenFrom: false, seenTo: false, createdAt: serverTimestamp() });
toast('Request sent 💌', 'success'); closeSheet();
} catch { toast('Couldn’t send request', 'error'); }
};
} catch { box.innerHTML = '<p class="sh-note" style="margin-top:12px">Search failed. Check your connection / rules.</p>'; } };
}
function openRemoveSheet() {
if (!state.friends.length) return toast('No friends to remove', 'info');
openSheet('Remove friends', `<p class="sh-note">Select the friends you want to remove.</p>
${state.friends.map((f) => { const p = state.profiles.get(f.uid) || {}, nm = displayName(f.uid);
return `<label class="rm-row"><input type="checkbox" value="${f.uid}"><span class="pfp-sm">${av(p, nm)}</span><span class="nm">${esc(nm)}<br><i>@${esc(p.username || '')}</i></span></label>`; }).join('')}
<button id="rmGo" class="sh-btn danger" disabled>Remove selected</button>`);
const boxes = [...sheetBody.querySelectorAll('input[type=checkbox]')], go = $('rmGo');
boxes.forEach((b) => b.onchange = () => { const n = boxes.filter((x) => x.checked).length; go.disabled = !n; go.textContent = n ? `Remove selected (${n})` : 'Remove selected'; });
go.onclick = async () => { const ids = boxes.filter((b) => b.checked).map((b) => b.value);
if (!ids.length || !confirm(`Remove ${ids.length} friend${ids.length > 1 ? 's' : ''}?`)) return;
try { await Promise.all(ids.map((u) => deleteDoc(doc(D(), 'chatRequests', state.friends.find((f) => f.uid === u).req.id)))); toast('Removed', 'success'); closeSheet(); }
catch { toast('Couldn’t remove', 'error'); }
};
}
function openFriendSheet(uid) {
const p = state.profiles.get(uid) || {}, nm = displayName(uid), b = safeImg(p.banner);
openSheet('Profile', `<div class="pv-banner">${bannerEl(p, 'pv-bn')}<span class="fr-sheen"></span></div>
<div class="pv-pfpwrap"><span class="pfp-ring lg">${av(p, nm)}</span></div>
<h3 class="pv-name">${esc(nm)}</h3><div class="pv-user">@${esc(p.username || '')}</div>
${(() => { const q = presence(uid); return `<div class="pv-user pres${q.on ? ' on' : ''}">● ${esc(q.txt)}</div>`; })()}
${p.bio ? `<p class="pv-bio">${esc(p.bio)}</p>` : ''}
<label class="sh-lab">Nickname</label>
<div class="sh-row"><input id="fpNick" type="text" maxlength="24" placeholder="Add a nickname" value="${esc(state.nick[uid] || '')}"><button id="fpSave" class="gate-btn sm">Save</button></div>
<button id="fpCode" class="sh-btn">🔐 Verify encryption</button><div id="fpBox" class="code-box hidden"></div>
<button id="fpRemove" class="sh-btn danger">Remove friend</button>`);
$('fpSave').onclick = async () => {
const v = $('fpNick').value.trim().slice(0, 24); state.nick[uid] = v;
try { await setDoc(doc(D(), 'chatPrivate', state.uid), { nicknames: { [uid]: v } }, { merge: true }); renderAll(); toast('Nickname saved', 'success'); closeSheet(); }
catch { toast('Couldn’t save', 'error'); }
}; $('fpCode').onclick = async () => {
const box = $('fpBox'); box.classList.remove('hidden');
box.innerHTML = `${await safetyNumber(state.profile.pubKey, p.pubKey || '')}<small>If this number matches on both phones, nobody is intercepting your chat.</small>`; };
$('fpRemove').onclick = async () => {
const f = state.friends.find((x) => x.uid === uid);
if (f && confirm(`Remove ${nm}?`)) { try { await deleteDoc(doc(D(), 'chatRequests', f.req.id)); closeSheet(); toast('Removed', 'success'); } catch { toast('Couldn’t remove', 'error'); } }
};
}
