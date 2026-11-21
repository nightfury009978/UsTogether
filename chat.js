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

/* ---------- banners: premium effects for the three photos ---------- */
.bn2 { position: absolute; inset: 0; display: block; overflow: hidden; border-radius: inherit; isolation: isolate; background: #05070d; }
.bn2 img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; transform: scale(1.06); animation: b2Drift 16s ease-in-out infinite alternate; }
@keyframes b2Drift { from { transform: scale(1.06) translate3d(-1.2%, 0, 0); } to { transform: scale(1.12) translate3d(1.2%, -1%, 0); } }
.bn2 b2-gl, .bn2 b2-fx, .bn2 b2-sh, .bn2 b2-ed { position: absolute; display: block; pointer-events: none; }
.bn2 b2-gl { inset: 0; z-index: 1; background: radial-gradient(90% 120% at 50% 110%, var(--b2g), transparent 65%); mix-blend-mode: screen; animation: b2Breath 4.5s ease-in-out infinite; }
@keyframes b2Breath { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
.bn2 b2-fx { inset: 0; z-index: 2; mix-blend-mode: screen; }
.bn2 b2-sh { z-index: 3; top: -20%; bottom: -20%; left: 0; width: 38%; background: linear-gradient(100deg, transparent, var(--b2s), transparent); transform: translateX(-180%) skewX(-18deg); animation: b2Shine 6.5s ease-in-out infinite; }
@keyframes b2Shine { 0%, 55% { transform: translateX(-180%) skewX(-18deg); } 100% { transform: translateX(420%) skewX(-18deg); } }
.bn2 b2-ed { inset: 0; z-index: 4; border-radius: inherit; box-shadow: inset 0 0 0 1.5px var(--b2c), inset 0 0 24px var(--b2g); animation: b2Edge 3.4s ease-in-out infinite; }
@keyframes b2Edge { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
/* 1 · Midnight Smoke — silver shimmer + drifting dust */
.bt-silver { --b2c: rgba(236,242,255,.85); --b2g: rgba(215,225,255,.34); --b2s: rgba(255,255,255,.42); --b2o: rgba(225,235,255,.4); }
.bt-silver b2-fx { background-image: radial-gradient(1.6px 1.6px at 14% 78%, #fff, transparent), radial-gradient(1.2px 1.2px at 36% 38%, #fff, transparent), radial-gradient(1.8px 1.8px at 58% 66%, #fff, transparent), radial-gradient(1.2px 1.2px at 77% 28%, #fff, transparent), radial-gradient(1.5px 1.5px at 92% 82%, #fff, transparent); background-size: 190px 120px; animation: b2Up 9s linear infinite, b2Tw 3s ease-in-out infinite; }
@keyframes b2Up { to { background-position: 0 -120px; } }
@keyframes b2Tw { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
/* 2 · Starlit Dream — indigo glow + twinkling constellation stars */
.bt-indigo { --b2c: rgba(130,178,255,.9); --b2g: rgba(80,125,255,.42); --b2s: rgba(170,205,255,.4); }
.bt-indigo b2-fx { background-image: radial-gradient(1.5px 1.5px at 10% 20%, #cfe0ff, transparent), radial-gradient(1.2px 1.2px at 30% 72%, #fff, transparent), radial-gradient(2px 2px at 52% 30%, #bcd3ff, transparent), radial-gradient(1.2px 1.2px at 70% 80%, #fff, transparent), radial-gradient(1.6px 1.6px at 88% 24%, #d8e6ff, transparent); background-size: 170px 110px; animation: b2Tw 2.6s ease-in-out infinite; }
.bt-indigo b2-gl { background: radial-gradient(80% 110% at 22% 40%, rgba(90,130,255,.35), transparent 62%), radial-gradient(90% 120% at 50% 110%, var(--b2g), transparent 65%); }
/* 3 · Neon Wolf — cyan neon pulse + scan line */
.bt-cyan { --b2c: #38e8ff; --b2g: rgba(0,215,255,.5); --b2s: rgba(110,245,255,.5); }
.bt-cyan b2-fx { background: linear-gradient(90deg, transparent 0, rgba(70,240,255,.34) 50%, transparent 100%); width: 28%; left: 0; transform: translateX(-120%); animation: b2Scan 4.2s ease-in-out infinite; }
@keyframes b2Scan { 0% { transform: translateX(-120%); } 100% { transform: translateX(450%); } }
.bt-cyan b2-ed { animation: b2Neon 2.8s linear infinite; }
@keyframes b2Neon { 0%, 100% { opacity: 1; } 46% { opacity: .95; } 48% { opacity: .5; } 50% { opacity: 1; } 78% { opacity: .75; } }
/* glow around the banner boxes themselves */
.fr-row.bt-silver { box-shadow: 0 0 0 1px rgba(236,242,255,.4), 0 8px 24px rgba(200,215,255,.2); }
.fr-row.bt-indigo { box-shadow: 0 0 0 1px rgba(130,178,255,.5), 0 8px 26px rgba(70,115,255,.3); }
.fr-row.bt-cyan { box-shadow: 0 0 0 1px rgba(56,232,255,.55), 0 8px 28px rgba(0,210,255,.32); }
.pv-banner.bt-silver { box-shadow: 0 0 22px rgba(200,215,255,.25); } .pv-banner.bt-indigo { box-shadow: 0 0 24px rgba(80,125,255,.35); } .pv-banner.bt-cyan { box-shadow: 0 0 26px rgba(0,215,255,.4); }
.bn-pick { border-radius: 16px; overflow: hidden; }
.bn-pick i { z-index: 6; text-shadow: 0 1px 6px rgba(0,0,0,.9); }
.fr-row.off .bn2 *, .fr-row.off .bn2, .fp:not(.active) .bn2 *, .fp:not(.active) .bn2 img { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .bn2 *, .bn2 img { animation: none !important; } }
/* offline notice on the call screen */
html body #callUI.offline.offline .cl-av { filter: grayscale(.9) brightness(.7); animation: none; box-shadow: none; }
html body #callUI.offline.offline .call-state { color: #ff9aa6; }
html body #callUI .cb.off-note { width: min(88vw, 320px); gap: 14px; }
html body #callUI .cb.off-note p { margin: 0; text-align: center; font: 500 .92rem/1.5 'Outfit', sans-serif; color: #d8c8b2; } html body #callUI .cb.off-note p b { color: #fff1d6; }

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
/* ---------- cute + elegant typography for every chat screen ---------- */
html body .chat-app, html body .chat-app *, html body .att-menu, html body .att-menu * { font-family: 'Quicksand', 'Nunito', 'Trebuchet MS', system-ui, sans-serif !important; -webkit-font-smoothing: antialiased; }
html body .chat-app { font-weight: 600; letter-spacing: .005em; }
html body .chat-app .cp-msgs .bub:not(.vm):not(.fl):not(.media):not(.lock), html body .chat-app #cpInput, html body .chat-app #cpInput::placeholder { font-weight: 600; font-size: 1rem; line-height: 1.4; letter-spacing: .005em; font-style: normal; }
html body .chat-app #cpInput::placeholder { font-weight: 500; opacity: .65; }
html body .chat-app .bub.lock { font-size: .84rem; }
html body .chat-app .cs-menu .ml, html body .chat-app .cp-menu .ml, html body .att-menu .ml { font-size: .98rem; font-weight: 700; letter-spacing: .01em; }
html body .att-menu .ml small { font-size: .74rem; font-weight: 600; font-style: normal; }
html body .chat-app .sh-btn, html body .chat-app .gate-btn, html body .chat-app .sh-lab { font-size: .95rem; font-weight: 700; letter-spacing: .02em; }
html body .chat-app .sheet-card input, html body .chat-app .sheet-card textarea, html body .chat-app .sh-note, html body .chat-app .pv-bio { font-size: 1rem; font-weight: 600; }
html body .chat-app .fr-text i, html body .chat-app .rq-name i, html body .chat-app .cp-who i { font-size: .8rem; font-weight: 600; font-style: normal; letter-spacing: .01em; }
html body .chat-app .mt, html body .chat-app .mt * { font-size: .66rem; font-weight: 600; letter-spacing: .02em; }
html body .chat-app .vm-t { font-weight: 700; }
html body .chat-app .day-sep, html body .chat-app .cs-label { font-size: .68rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
html body .chat-app .bub b, html body .chat-app .bub strong { font-weight: 700; }
/* names and headings: a cute, flowing script */
html body .chat-app .cs-title, html body .chat-app .cp-title, html body .chat-app .sheet-title, html body .chat-app .gate-card h2, html body .chat-app .cp-empty > div > span, html body .chat-app .cs-me b, html body .chat-app .fr-text b, html body .chat-app .cp-who b, html body .chat-app .pv-name, html body .chat-app .cp-selbar .sel-count { font-family: 'Dancing Script', 'Quicksand', cursive !important; font-weight: 700; letter-spacing: .01em; line-height: 1.15; }
html body .chat-app .cs-title { font-size: 2.1rem; }
html body .chat-app .sheet-title, html body .chat-app .gate-card h2 { font-size: 1.7rem; }
html body .chat-app .cp-empty > div > span { font-size: 1.9rem; }
html body .chat-app .pv-name { font-size: 2rem; }
html body .chat-app .fr-text b { font-size: 1.5rem; }
html body .chat-app .cs-me b { font-size: 1.45rem; }
html body .chat-app .cp-who b { font-size: 1.5rem; }
html body .chat-app .cp-selbar .sel-count { font-size: 1.5rem; }
/* ---------- call: back button, mute slash ---------- */
html body #callUI .cl-back { position: absolute; z-index: 5; top: calc(env(safe-area-inset-top, 0px) + 14px); left: 14px; width: 44px; height: 44px; padding: 0; display: grid; place-items: center; border-radius: 50%; cursor: pointer; color: #f0d3a2; background: linear-gradient(145deg, rgba(227,192,141,.2), rgba(227,192,141,.04)); border: 1px solid rgba(227,192,141,.38); box-shadow: 0 4px 14px rgba(0,0,0,.35); -webkit-tap-highlight-color: transparent; }
html body #callUI .cl-back:active { transform: scale(.92); }
html body #callUI.incoming .cl-back, html body #callUI.offline .cl-back { display: none; }
html body #callUI .call-btn.mute { position: relative; }
html body #callUI .call-btn.mute.on::after { content: ''; position: absolute; left: 50%; top: 50%; width: 36px; height: 2.5px; border-radius: 2px; background: currentColor; transform: translate(-50%, -50%) rotate(-45deg); box-shadow: 0 0 0 1.5px rgba(27,18,12,.5); }
html body #callUI.swiping { transition: none; }
/* ---------- the "on call" banner (call keeps running while you chat) ---------- */
.call-pill { position: fixed; z-index: 850; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 8px); transform: translate(-50%, -140%); display: flex; align-items: center; gap: 10px; max-width: min(92vw, 380px); padding: 8px 18px 8px 8px; border-radius: 999px; cursor: pointer; color: #fff; opacity: 0; pointer-events: none; background: linear-gradient(135deg, #1f9f58, #3fd988); box-shadow: 0 10px 28px rgba(47,191,113,.45), inset 0 1px 0 rgba(255,255,255,.35); transition: transform .35s cubic-bezier(.2,.9,.3,1), opacity .25s ease, background .3s ease, box-shadow .3s ease; -webkit-tap-highlight-color: transparent; overflow: hidden; }
.call-pill.show { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
.call-pill::after { content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 40%; pointer-events: none; background: linear-gradient(100deg, transparent, rgba(255,255,255,.35), transparent); transform: translateX(-160%) skewX(-18deg); animation: mcSheen 4.5s ease-in-out infinite; }
.call-pill.muted { background: linear-gradient(135deg, #6b3f22, #b47a48); box-shadow: 0 10px 28px rgba(180,122,72,.45), inset 0 1px 0 rgba(255,255,255,.25); }
.call-pill .cpl-ic { flex: none; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,255,255,.2); animation: clOk 1.8s ease-in-out infinite; }
.call-pill.muted .cpl-ic { animation: none; }
.call-pill .cpl-ic svg { width: 17px; height: 17px; fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.call-pill b { font: 700 1rem 'Outfit', sans-serif; font-variant-numeric: tabular-nums; letter-spacing: .04em; }
.call-pill small { font: 600 .72rem 'Outfit', sans-serif; letter-spacing: .06em; opacity: .9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* ---------- home "Chat" tile while you are on a call ---------- */
html body .bn-tile.on-call { border-color: rgba(255,45,70,.65); box-shadow: 0 0 0 1px rgba(255,45,70,.4), 0 0 30px rgba(255,45,70,.3); animation: tileCall 1.8s ease-in-out infinite; }
@keyframes tileCall { 50% { box-shadow: 0 0 0 1px rgba(255,45,70,.6), 0 0 40px rgba(255,45,70,.5); } }
html body .bn-tile.on-call-mute { border-color: rgba(190,130,80,.7); box-shadow: 0 0 0 1px rgba(190,130,80,.4), 0 0 28px rgba(190,130,80,.3); animation: tileMute 2.2s ease-in-out infinite; }
@keyframes tileMute { 50% { box-shadow: 0 0 0 1px rgba(190,130,80,.6), 0 0 38px rgba(190,130,80,.5); } }
#bnChatT.bn-call-mute { background-image: linear-gradient(100deg, #a8683a 0%, #a8683a 36%, #f2d2b0 50%, #a8683a 64%, #a8683a 100%) !important; filter: drop-shadow(0 0 6px rgba(190,130,80,.7)) !important; }
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
/* ---------- banners: your three photos (they sit in the repository root) ---------- */
const BANNERS = [
['smoke', 'Midnight Smoke', '1795189305061~2.jpg', 'silver'],
['stars', 'Starlit Dream', '1795189305061~3.jpg', 'indigo'],
['wolf', 'Neon Wolf', '1795189305061~4.jpg', 'cyan']
];
const bannerOf = (p) => BANNERS.find((x) => x[0] === p?.bannerId) || BANNERS[[...String(p?.username || p?.pubKey || 'x')].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % BANNERS.length];
const bannerEl = (p, cls) => { const b = bannerOf(p); return `<span class="${cls} bn2 bt-${b[3]}"><img src="${b[2]}" alt="" draggable="false"><b2-gl></b2-gl><b2-fx></b2-fx><b2-sh></b2-sh><b2-ed></b2-ed></span>`; };
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
const callSt = { on: false, muted: false }; // read by the home tile; kept up to date by the call code
/* ---------- private profiles: bio, photo and banner are encrypted separately for each friend (and for you) ---------- */
const pubDoc = new Map(), privRaw = new Map(), privProf = new Map(), reqSeen = { f: false, t: false };
let privReady = false, pubSigs = null, pubBusy = false, pubAgain = false, pubForce = false;
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
{ /* pull a sheet down to close it (profile, settings …) */
const card = sheet.querySelector('.sheet-card'); let st = null;
card.addEventListener('touchstart', (e) => { st = e.touches.length === 1 && !e.target.closest('input,textarea,select') ? { y: e.touches[0].clientY, x: e.touches[0].clientX, dy: 0, on: false, t: Date.now() } : null; }, { passive: true });
card.addEventListener('touchmove', (e) => {
if (!st) return; const t = e.touches[0], dy = t.clientY - st.y, dx = t.clientX - st.x;
if (!st.on) { if (card.scrollTop <= 0 && dy > 8 && Math.abs(dx) < dy) { st.on = true; card.style.transition = 'none'; } else return; }
e.preventDefault(); st.dy = Math.max(0, dy); card.style.transform = 'translateY(' + st.dy + 'px)';
}, { passive: false });
const endDrag = () => { if (!st) return; const s = st; st = null; if (!s.on) return; card.style.transition = '';
if (s.dy > 100 || s.dy / Math.max(1, Date.now() - s.t) > .6) { card.style.transform = 'translateY(100%)'; closeSheet(); setTimeout(() => { card.style.transform = ''; }, 350); } else card.style.transform = ''; };
card.addEventListener('touchend', endDrag); card.addEventListener('touchcancel', endDrag);
}
const closeLight = () => light.classList.remove('active');
{ let ly = null; light.addEventListener('touchstart', (e) => { ly = e.touches.length === 1 ? e.touches[0].clientY : null; }, { passive: true });
light.addEventListener('touchend', (e) => { if (ly !== null && e.changedTouches[0].clientY - ly > 90) closeLight(); ly = null; }, { passive: true }); }
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
pubDoc.clear(); privRaw.clear(); privProf.clear(); pubSigs = null; privReady = false; reqSeen.f = reqSeen.t = false; state.profiles.clear(); state.presence.clear(); state.typeUntil.clear(); state.typeStamp.clear(); state.sel.clear(); state.watch.clear(); state.chats.clear(); state.celebrated.clear(); keyCache.clear();
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
tx.set(doc(D(), 'chatUsers', me), { username: name, usernameLower: lower, pubKey: JSON.stringify(keys.pub), createdAt: serverTimestamp() });
tx.set(doc(D(), 'chatPrivate', me), { keyBackup: wrapped, nicknames: {} });
}); state.priv = await importPriv(keys.priv);
await kvSet('priv:' + me, state.priv); state.profile = { username: name, usernameLower: lower, pubKey: JSON.stringify(keys.pub), bio: '', pfp: '', bannerId: '' };
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
state.unsubs.push(onSnapshot(query(rq, where('from', '==', me)), (s) => { state.reqFrom = s.docs.map((d) => ({ id: d.id, ...d.data() })); reqSeen.f = true; recompute(); }, err));
state.unsubs.push(onSnapshot(query(rq, where('to', '==', me)), (s) => {
const next = s.docs.map((d) => ({ id: d.id, ...d.data() }));
if (state.gotTo) next.filter((r) => r.status === 'pending' && !state.reqTo.some((o) => o.id === r.id)).forEach(notifyReq);
state.gotTo = true; reqSeen.t = true; state.reqTo = next; recompute();
}, err));
state.unsubs.push(onSnapshot(query(collection(D(), 'chats'), where('members', 'array-contains', me)), (s) => {
s.docChanges().forEach((ch) => { if (ch.type === 'removed' || !state.chatsReady || ch.doc.metadata.hasPendingWrites) return;
const c = ch.doc.data(), prev = state.chats.get(ch.doc.id);
if (c.lastFrom && c.lastFrom !== me && c.lastAt && prev?.lastAt?.seconds !== c.lastAt.seconds) notifyMsg(ch.doc.id, c); });
state.chats = new Map(s.docs.map((d) => [d.id, d.data()])); state.chatsReady = true; renderAll(); if (state.active) queuePaint();
}, err));
}
function mergeProfile(uid) {
const pub = pubDoc.get(uid);
if (!pub) { state.profiles.set(uid, null); return; }
const m = { ...pub, ...(privProf.get(uid) || {}) };
state.profiles.set(uid, m);
if (uid === state.uid) state.profile = m;
}
async function openPriv(uid) {
const raw = privRaw.get(uid); let pr = null;
if (raw) { try { pr = await decJSON(await sharedKey(uid), raw.iv, raw.ct); } catch { return; } } // key not ready yet: we try again when their profile arrives
privProf.set(uid, pr); mergeProfile(uid);
if (uid === state.uid && !privReady) { privReady = true; syncProfileCopies(); }
if (uid === state.active) state.sig = '';
renderAll(); if (uid === state.active) queuePaint();
}
function watchProfile(uid) {
if (state.watch.has(uid)) return;
state.watch.set('p:' + uid, onSnapshot(doc(D(), 'chatPresence', uid), (s) => {
const pd = s.exists() ? s.data({ serverTimestamps: 'estimate' }) : null; state.presence.set(uid, pd); trackTyping(uid, pd); if (uid !== state.uid) renderAll();
}, () => {}));
state.watch.set(uid, onSnapshot(doc(D(), 'chatUsers', uid), (s) => {
pubDoc.set(uid, s.exists() ? s.data() : null); mergeProfile(uid);
if (uid === state.active) state.sig = '';
renderAll(); if (uid === state.active) queuePaint();
if (privRaw.has(uid)) openPriv(uid);
syncProfileCopies();
}));
/* the encrypted copy that this friend made for me (for my own profile: the copy I made for myself) */
state.watch.set('pp:' + uid, onSnapshot(doc(D(), 'chatProfiles', uid + '_' + state.uid), (s) => {
if (s.exists()) { privRaw.set(uid, s.data()); openPriv(uid); }
else { privRaw.delete(uid); privProf.delete(uid); mergeProfile(uid); if (uid === state.uid && !privReady) { privReady = true; syncProfileCopies(); } renderAll(); }
}, () => {}));
}
const hashStr = (t) => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return h + ':' + t.length; };
async function syncProfileCopies(force) {
if (!state.profile || !state.priv || !privReady) return;
if (pubBusy) { pubAgain = true; if (force) pubForce = true; return; }
pubBusy = true;
try {
const me = state.uid;
if (!pubSigs) pubSigs = (await kvGet('pubsig:' + me)) || {};
const p = state.profile, data = { bio: p.bio || '', pfp: safeImg(p.pfp) || '', bannerId: p.bannerId || '' };
const sig = hashStr(JSON.stringify(data)), targets = [me, ...state.friends.map((f) => f.uid)];
let changed = false;
for (const t of targets) {
if (!force && pubSigs[t] === sig) continue;
let key; try { key = await sharedKey(t); } catch { continue; } // their profile isn't loaded yet: we try again when it is
const e = await encJSON(key, data);
await setDoc(doc(D(), 'chatProfiles', me + '_' + t), { owner: me, viewer: t, iv: e.iv, ct: e.ct, at: serverTimestamp() });
pubSigs[t] = sig; changed = true;
}
if (reqSeen.f && reqSeen.t) for (const t of Object.keys(pubSigs)) {
if (t === me || targets.includes(t)) continue;
try { await deleteDoc(doc(D(), 'chatProfiles', me + '_' + t)); } catch {}
delete pubSigs[t]; changed = true; // no longer friends: they lose access to my profile
}
if (changed) await kvSet('pubsig:' + me, pubSigs);
const old = pubDoc.get(me);
if (pubSigs[me] === sig && old && ['bio', 'pfp', 'banner', 'bannerId'].some((k) => old[k] !== undefined)) {
await updateDoc(doc(D(), 'chatUsers', me), { bio: deleteField(), pfp: deleteField(), banner: deleteField(), bannerId: deleteField() }); // the readable copies are no longer needed
}
} catch (e) { console.error(e); if (force) toast('Couldn’t save your profile', 'error'); }
pubBusy = false;
if (pubAgain) { pubAgain = false; const f = pubForce; pubForce = false; syncProfileCopies(f); }
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
checkCongrats(); renderAll(); syncProfileCopies();
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
return `<button class="fr-row bt-${bannerOf(p)[3]}${state.active === uid ? ' sel' : ''}${pick ? ' pickable' : ''}${pick === 2 ? ' picked' : ''}" data-open="${uid}">
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
input.addEventListener('input', () => { autoGrow(); updateComp(); if (input.value.trim().length > 0) typingPing(); else stopTyping(); });
['keyup', 'change', 'paste', 'compositionend', 'focus'].forEach((ev) => input.addEventListener(ev, () => setTimeout(updateComp, 0)));
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
openSheet('Profile', `<div class="pv-banner bt-${bannerOf(p)[3]}">${bannerEl(p, 'pv-bn')}<span class="fr-sheen"></span></div>
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
function openMeSheet() {
if (!state.profile) return;
const me = state.uid;
openSheet('My profile', `<div class="pv-banner" id="mpBanner"></div>
<div class="pv-pfpwrap"><span class="pfp-ring lg" id="mpPfp"></span></div>
<button id="mpPfpBtn" class="sh-btn">📷 Change profile photo</button>
<input id="mpPfpF" type="file" accept="image/*" hidden>
<label class="sh-lab">Select banner</label>
<div class="bn-box"><div class="bn-grid" id="mpGrid"></div></div>
<label class="sh-lab">Bio</label><textarea id="mpBio" maxlength="120" placeholder="Say something about you">${esc(state.profile.bio || '')}</textarea>
<label class="sh-lab">Username</label><div class="sh-note" style="margin:0">@${esc(state.profile.username)} · <a id="mpForgot" style="color:var(--accent-dark);font-weight:700">Forgot it / create a new one</a></div>
<button id="mpSave" class="sh-btn primary">Save profile</button>`);
const draw = () => {
const q = state.profile;
$('mpBanner').className = 'pv-banner bt-' + bannerOf(q)[3]; $('mpBanner').innerHTML = bannerEl(q, 'pv-bn') + '<span class="fr-sheen"></span>';
$('mpPfp').innerHTML = av(q, q.username);
const cur = bannerOf(q)[0]; $('mpGrid').innerHTML = BANNERS.map(([id, n]) => `<button class="bn-pick bt-${bannerOf({ bannerId: id })[3]}${cur === id ? ' sel' : ''}" data-bn="${id}">${bannerEl({ bannerId: id }, 'pv-bn')}<i>${n}</i></button>`).join('');
};
draw();
const apply = (patch) => { state.profile = { ...state.profile, ...patch }; state.profiles.set(me, state.profile); draw(); renderAll(); };
const notReady = () => { if (privReady) return false; toast('Loading your profile… try again in a moment', 'info'); return true; };
$('mpGrid').onclick = (e) => { const b = e.target.closest('[data-bn]'); if (!b || notReady()) return;
apply({ bannerId: b.dataset.bn }); syncProfileCopies(true); toast('Banner applied ✨', 'success');
};
$('mpPfpBtn').onclick = () => $('mpPfpF').click();
$('mpPfpF').onchange = async (e) => {
const f = e.target.files[0]; e.target.value = ''; if (!f || notReady()) return;
let data; try { data = await cropImg(f, 256, 256, .82); } catch { return toast('Couldn’t read that image', 'error'); }
apply({ pfp: data }); syncProfileCopies(true); toast('Profile photo updated ✨', 'success');
};
$('mpForgot').onclick = openUsernameSheet;
$('mpSave').onclick = () => {
if (notReady()) return;
apply({ bio: $('mpBio').value.trim().slice(0, 120) }); syncProfileCopies(true); toast('Profile saved ✨', 'success'); closeSheet();
};
}
function openUsernameSheet() {
const p = state.profile; if (!p) return;
openSheet('Your username', `<p class="sh-note">Your current chat username is <b>@${esc(p.username)}</b>. Forgot it or want a different one? Create a new username below — your friends stay connected.</p>
<input id="unNew" type="text" placeholder="New username" autocapitalize="none" autocomplete="off" maxlength="20">
<button id="unGo" class="sh-btn primary">Save new username</button>`);
$('unGo').onclick = async () => {
const name = $('unNew').value.trim(), lower = name.toLowerCase(), me = state.uid, old = p.usernameLower;
if (!/^[a-z0-9_.]{3,20}$/i.test(name)) return toast('Username: 3–20 letters, numbers, _ or .', 'error');
try {
await runTransaction(D(), async (tx) => {
if (lower === old) { tx.update(doc(D(), 'chatUsers', me), { username: name }); return; }
const ref = doc(D(), 'usernames', lower); if ((await tx.get(ref)).exists()) throw new Error('taken');
tx.set(ref, { uid: me }); if (old) tx.delete(doc(D(), 'usernames', old));
tx.update(doc(D(), 'chatUsers', me), { username: name, usernameLower: lower });
});
toast('Username updated', 'success'); closeSheet();
} catch (e) { toast(e.message === 'taken' ? 'That username is taken' : 'Couldn’t update username', 'error'); }
};
}
/* =========================================================
Delete messages / delete all chats (wipes Firestore docs too)
========================================================= */
const selMsgs = () => [...state.sel].map((id) => state.msgDocs.find((x) => x.id === id)).filter(Boolean);
function markPicked() { $('cpMsgs').querySelectorAll('.msg').forEach((el) => el.classList.toggle('picked', state.sel.has(el.dataset.mid))); }
function updateSelUI() {
const ms = selMsgs(), n = ms.length, one = n === 1 ? ms[0] : null, p = one ? plain.get(one.id) : null;
$('selCount').textContent = n || 1;
$('selEdit').classList.toggle('off', !(one && one.from === state.uid && p && p.k === 't'));
$('selReply').classList.toggle('off', !(one && p && p.k !== 'err'));
$('selStar').classList.toggle('on', n > 0 && ms.every((m) => local.star.has(m.id)));
}
/* only a long press on a message starts this (the top bar fades in); back / swipe-back / ✕ fades it out */
function enterSelect(id) {
if (!state.active || !id) return;
state.selecting = true; state.sel.clear(); state.sel.add(id);
pane.classList.add('selecting'); $('cpMsgs').classList.add('selecting'); $('cpSelBar').classList.add('on');
$('cpMenu')?.classList.remove('open'); stopTyping(); input.blur(); markPicked(); updateSelUI();
}
function exitSelect() {
if (!state.selecting && !state.sel.size) return;
state.selecting = false; state.sel.clear();
pane.classList.remove('selecting'); $('cpMsgs').classList.remove('selecting'); $('cpSelBar').classList.remove('on');
markPicked(); updateSelUI();
}
function toggleSel(id) {
if (!id) return;
if (state.sel.has(id)) state.sel.delete(id); else state.sel.add(id);
if (!state.sel.size) { exitSelect(); return; }
markPicked(); updateSelUI();
}
/* run deletes a few at a time (each delete is checked by the security rules) */
async function delRefs(refs) {
for (let i = 0; i < refs.length; i += 20) await Promise.all(refs.slice(i, i + 20).map((r) => deleteDoc(r)));
}
function forgetLocal(ids) {
ids.forEach((id) => { const u = media.get(id); if (u) { URL.revokeObjectURL(u); media.delete(id); } plain.delete(id); });
state.sig = '';
}
async function deleteForBoth(ids) {
const uid = state.active; if (!uid || !ids.length) return;
const cid = chatId(state.uid, uid);
try {
const refs = [];
ids.forEach((id) => {
const m = state.msgDocs.find((x) => x.id === id), p = plain.get(id), mid = m?.mid || p?.mid, n = m?.n || p?.n || 0;
for (let i = 0; mid && i < n; i++) refs.push(doc(D(), 'chats', cid, 'blobs', `${mid}_${i}`)); // big media chunks first
});
await delRefs(refs);
await delRefs(ids.map((id) => doc(D(), 'chats', cid, 'messages', id))); // then the messages themselves
ids.forEach((id) => { local.star.delete(id); local.hide.delete(id); }); saveLocal();
forgetLocal(ids); exitSelect(); toast('Deleted for both of you 🗑️', 'success');
} catch (e) { console.error(e); toast('Couldn’t delete — publish the updated Firestore rules', 'error'); }
}
function openDeleteSheet() {
const ids = [...state.sel]; if (!ids.length) return;
openSheet(ids.length > 1 ? `Delete ${ids.length} messages` : 'Delete message', `<p class="sh-note">Choose how you want to delete ${ids.length > 1 ? 'these messages' : 'this message'}.</p>
<button id="dmMe" class="sh-btn">Delete msg for me</button>
<button id="dmBoth" class="sh-btn danger">Delete msg for both</button>
<button id="dmNo" class="sh-btn">Cancel</button>`);
$('dmNo').onclick = closeSheet;
$('dmMe').onclick = () => { ids.forEach((id) => local.hide.add(id)); saveLocal(); closeSheet(); exitSelect(); forgetLocal(ids); paint(); toast('Deleted for you', 'success'); };
$('dmBoth').onclick = () => { closeSheet(); deleteForBoth(ids); };
}
/* wipe EVERYTHING in one conversation: messages (incl. inline photos/voice) + media chunks */
async function wipeChat(uid) {
const cid = chatId(state.uid, uid);
for (const [sub, size] of [['messages', 40], ['blobs', 8]]) {
for (;;) {
const s = await getDocs(query(collection(D(), 'chats', cid, sub), limit(size)));
if (s.empty) break;
await delRefs(s.docs.map((d) => d.ref));
}
}
try { await updateDoc(doc(D(), 'chats', cid), { lastAt: deleteField(), lastFrom: deleteField() }); } catch {}
}
/* 3-dots menu + selection bar wiring */
$('cpMore').onclick = (e) => { e.stopPropagation(); $('cpMenu').classList.toggle('open'); };
document.addEventListener('click', (e) => { if (!e.target.closest('#cpMenu') && !e.target.closest('#cpMore')) $('cpMenu').classList.remove('open'); });
$('cpmRemove').onclick = async () => {
$('cpMenu').classList.remove('open');
const uid = state.active, f = state.friends.find((x) => x.uid === uid); if (!uid || !f) return toast('Open a chat first', 'info');
if (!confirm(`Remove ${displayName(uid)} from your friends?`)) return;
try { await deleteDoc(doc(D(), 'chatRequests', f.req.id)); toast('Friend removed', 'success'); closeConversation(); if (!wide()) openSide(); }
catch { toast('Couldn’t remove this friend', 'error'); }
};
$('cpmEmpty').onclick = async () => {
$('cpMenu').classList.remove('open');
const uid = state.active; if (!uid) return toast('Open a chat first', 'info');
if (!confirm(`Delete ALL messages with ${displayName(uid)} for both of you? This can’t be undone.`)) return;
exitSelect(); toast('Emptying…', 'info');
try {
await wipeChat(uid);
media.forEach((u) => URL.revokeObjectURL(u)); media.clear(); plain.clear(); pct.clear(); local.hide.clear(); local.star.clear(); saveLocal(); state.sig = ''; paint();
toast('All messages deleted for both of you 🧹', 'success');
} catch (e) { console.error(e); toast('Couldn’t delete everything — publish the updated Firestore rules', 'error'); }
};
$('cpmClose').onclick = () => { $('cpMenu').classList.remove('open'); closeChat(); };
$('selCancel').onclick = () => exitSelect();
$('selStar').onclick = () => {
const ms = selMsgs(); if (!ms.length) return;
const all = ms.every((m) => local.star.has(m.id));
ms.forEach((m) => { if (all) local.star.delete(m.id); else local.star.add(m.id); });
saveLocal(); exitSelect(); paint(); toast(all ? 'Removed from starred' : 'Starred ⭐', 'success');
};
$('selDel').onclick = openDeleteSheet;
$('selEdit').onclick = () => {
const m = selMsgs()[0], p = m && plain.get(m.id);
if (!m || m.from !== state.uid || !p || p.k !== 't') return;
exitSelect(); startEdit(m.id, p.x);
};
$('selReply').onclick = () => { const m = selMsgs()[0]; if (!m) return; exitSelect(); startReply(m.id); };
/* long press on any message (text, photo, video, voice) = select it */
(function () {
const box = $('cpMsgs'); let t = 0, sx = 0, sy = 0, tgt = null, fired = false;
const clear = () => { clearTimeout(t); t = 0; tgt = null; };
box.addEventListener('pointerdown', (e) => {
if (e.button > 0 || state.selecting) return;
const m = e.target.closest('.msg'); if (!m || e.target.closest('.rp')) return;
tgt = m; sx = e.clientX; sy = e.clientY; fired = false;
t = setTimeout(() => { t = 0; if (!tgt) return; fired = true; navigator.vibrate?.(24); enterSelect(tgt.dataset.mid); }, 420);
});
box.addEventListener('pointermove', (e) => { if (t && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) clear(); });
['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => box.addEventListener(n, () => { if (t) clear(); if (fired) setTimeout(() => { fired = false; }, 450); }));
box.addEventListener('scroll', clear, { passive: true });
box.addEventListener('contextmenu', (e) => { if (e.target.closest('.msg')) e.preventDefault(); });
box.addEventListener('click', (e) => { if (fired) { fired = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true); // the tap that ends the long press must not toggle it again
})();
window.OSChat = { open: (uid) => openChat().then(() => uid && openConversation(uid)) };
/* =========================================================
v5 — typing cloud + Seen / Not seen (paste at the VERY END of chat.js)
========================================================= */
(function () {
const msgsBox = $('cpMsgs');
const tsMs = (t) => (t && t.seconds != null) ? t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6) : 0;
/* typing clouds: friend = bottom-left (near photos) · me = bottom-right (near mic) */
comp.insertAdjacentHTML('beforeend',
'<div id="tcL" class="tcloud l" aria-hidden="true"><i></i><i></i><i></i></div>' +
'<div id="tcR" class="tcloud r" aria-hidden="true"><i></i><i></i><i></i></div>');
const tcL = $('tcL'), tcR = $('tcR');
let lastKey = 0, marked = '';
input.addEventListener('input', () => { lastKey = input.value.trim() ? Date.now() : 0; });
input.addEventListener('blur', () => { lastKey = 0; });
const inView = (el) => {
const r = el.getBoundingClientRect(), b = msgsBox.getBoundingClientRect();
return r.bottom > b.top + 4 && r.top < b.bottom - 4;
};
function refresh() {
const open = app.classList.contains('active') && state.active && !msgsBox.classList.contains('hidden');
if (!open) { tcL.classList.remove('show'); tcR.classList.remove('show'); return; }
tcL.classList.toggle('show', (state.typeUntil.get(state.active) || 0) > Date.now());
const mine = lastKey && Date.now() - lastKey < 2600 && input.value.trim() && document.activeElement === input;
tcR.classList.toggle('show', !!mine);
const cid = chatId(state.uid, state.active), chat = state.chats.get(cid) || {};
const myRead = tsMs(chat.reads && chat.reads[state.uid]);
/* tell my friend I've seen their latest message — only when it is really on screen */
if (document.hidden) return;
let last = null;
for (let i = (state.msgDocs || []).length - 1; i >= 0; i--) {
if (state.msgDocs[i].from === state.active) { last = state.msgDocs[i]; break; }
}
if (!last) return;
const el = msgsBox.querySelector('[data-mid="' + last.id + '"]');
if (!el || !inView(el)) return;
const key = cid + ':' + last.id;
if (key === marked || tsMs(last.at) <= myRead) { marked = key; return; }
marked = key;
setDoc(doc(D(), 'chats', cid), { reads: { [state.uid]: serverTimestamp() } }, { merge: true })
.catch(() => { marked = ''; });
}
new MutationObserver(refresh).observe(msgsBox, { childList: true });
let rfRaf = 0; msgsBox.addEventListener('scroll', () => { if (!rfRaf) rfRaf = requestAnimationFrame(() => { rfRaf = 0; refresh(); }); }, { passive: true });
document.addEventListener('visibilitychange', refresh);
setInterval(refresh, 700);
})();
/* =========================================================
BENTO NOIR home tiles + bottom dock (v6)
Chat opens from the "Chat" tile. A red shining dot on that tile shows when something unread is waiting.
========================================================= */
(function () {
const root = document.querySelector('.app-container'), header = document.querySelector('.app-header');
if (!root || !header || document.getElementById('bento')) return;
const hb = document.querySelector('.glowing-badge'), sub = header.querySelector('.subtitle');
const tile = (id, lab, inner, cls = '') => `<button type="button" id="${id}" class="bn-tile ${cls}"><span class="bn-lab">${lab}</span>${inner}</button>`;
const el = document.createElement('section');
el.id = 'bento'; el.className = 'bento';
el.innerHTML =
'<div class="bn-head"><div><div class="bn-hi" id="bnHi">Welcome</div><div class="bn-title" id="bnTitle" role="button" tabindex="0" aria-label="Open Our Space">Our Space</div></div></div>' +
'<div class="bn-slot empty" id="bnSlot"></div>' +
'<div class="bn-tile bn-hero"><div class="bn-heroTop"></div><div class="bn-days" id="bnDaysBox"><span class="bn-num" id="bnDays">–</span><span class="bn-sm">days together</span></div><div class="bn-bar"><i id="bnBar"></i></div></div>' +
tile('bnMem', 'Memories', '<span class="bn-big" id="bnMemN">0</span><span class="bn-sm">moments shared</span>', 'bn-mem') +
tile('bnChat', 'Chat', '<span class="bn-mid" id="bnChatT">Welcome to chat</span><i id="bnChatDot" class="bn-dot hidden"></i>') + // CHAT-VISIBLE
tile('bnTodo', 'To-do', '<span class="bn-big" id="bnTodoN" style="font-size:1.7rem;margin-top:6px">0</span><span class="bn-sm">left today</span>') +
tile('bnStory', 'Story Book', '<span class="bn-mid" id="bnStoryT" style="font-family:var(--display);font-style:italic;font-size:1rem">Our chapters</span><span class="bn-sm" id="bnStoryS"></span>') +
tile('bnAnn', 'Next milestone', '<span class="bn-big" id="bnAnnN" style="font-size:1.7rem;margin-top:6px">–</span><span class="bn-sm" id="bnAnnS">days to go</span>');
header.after(el); header.style.display = 'none';
const rmCard = document.getElementById('mainPageReminder');
if (rmCard) { const slot = el.querySelector('#bnSlot'); slot.appendChild(rmCard); slot.classList.toggle('empty', rmCard.classList.contains('hidden')); } // pending reminders live between "Our Space" and "Our Sacred Diary"
const top = el.querySelector('.bn-heroTop');
if (hb) top.appendChild(hb);
if (sub) top.appendChild(sub);
const dock = document.createElement('nav');
dock.className = 'dock'; dock.setAttribute('aria-label', 'Main');
const svg = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
dock.innerHTML = `<button type="button" id="dkHome" class="on" aria-label="Home">${svg('M3 11l9-8 9 8M5 10v10h14V10')}<span class="dk-lab">Home</span></button><button type="button" id="dkFr" aria-label="Friend list"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3.3"/><path d="M2.8 20c.5-3.4 3.1-5.2 6.2-5.2s5.7 1.8 6.2 5.2"/><circle cx="17.2" cy="9.5" r="2.5"/><path d="M17 14.7c2.6.1 4.4 1.7 4.8 5"/></svg><span class="dk-lab">Friends</span></button><button type="button" id="dkPost" aria-label="Post a memory">${svg('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z')}<span class="dk-lab">Post</span></button>`;
document.body.appendChild(dock);
$('bnMem').onclick = () => O().openMemories?.();
$('bnTitle').onclick = () => O().openSpace?.();
$('bnTitle').onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); O().openSpace?.(); } };
$('bnTodo').onclick = () => O().openTodo?.();
$('bnStory').onclick = () => O().openStory?.();
$('bnChat').onclick = () => openChat();
$('dkHome').onclick = () => { closeFriends(); closePost(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
$('dkFr').onclick = () => openFriends();
$('bnDaysBox').onclick = () => document.getElementById('annivCard')?.click(); // set the anniversary only from "days together"
const set = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
function tick() {
const nm = ($('currentUserLabel')?.textContent || '').trim(), h = new Date().getHours();
set('bnHi', (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + (nm && nm !== 'Loading...' ? ', ' + nm : ''));
const d = parseInt(document.querySelector('#annivCard .anniv-num')?.textContent, 10);
if (Number.isFinite(d)) {
set('bnDays', d); $('bnBar').style.width = ((d % 365) / 365 * 100) + '%';
const next = 365 * (Math.floor(d / 365) + 1) - d, yr = Math.floor(d / 365) + 1;
set('bnAnnN', next); set('bnAnnS', 'days to year ' + yr);
} else { set('bnDays', '–'); set('bnAnnN', '–'); set('bnAnnS', 'set it from days together'); }
const mems = window.OS?.memories?.() || [];
set('bnMemN', mems.length);
set('bnTodoN', (window.OS?.todos?.() || []).filter((t) => !t.data.completed).length);
const chs = document.querySelectorAll('#storiesFeed .story-accordion-card');
set('bnStoryT', chs.length ? 'Chapter ' + chs.length : 'Our chapters');
set('bnStoryS', chs[0]?.querySelector('.story-accordion-title')?.textContent || '');
const un = state.friends.filter((f) => unreadFor(f.uid)).length, rq = state.incoming.length;
const ct = $('bnChatT'), ctxt = callSt.on ? (callSt.muted ? 'You are on call, the call is muted' : 'You are on call') : un ? 'New message' : rq ? rq + ' new request' + (rq > 1 ? 's' : '') : 'Welcome to chat';
if (ct && ct.textContent !== ctxt) { ct.textContent = ctxt; ct.classList.remove('swap'); void ct.offsetWidth; ct.classList.add('swap'); }
ct?.classList.toggle('bn-new', !!un || callSt.on); ct?.classList.toggle('bn-call-mute', callSt.on && callSt.muted); $('bnChat')?.classList.toggle('has-new', !!un && !callSt.on); $('bnChat')?.classList.toggle('on-call', callSt.on); $('bnChat')?.classList.toggle('on-call-mute', callSt.on && callSt.muted);
const dot = !!(un || rq) && !callSt.on;
$('bnChatDot').classList.toggle('hidden', !dot);
}
tick(); setInterval(tick, 1000);
})();
/* =========================================================
FRIEND LIST (beside the home button) — only accepted friends
========================================================= */
var frPage = null;
document.body.insertAdjacentHTML('beforeend', `<div id="frPage" class="fp" aria-hidden="true"><div class="fp-bg"></div>
<header class="fp-top"><button id="frClose" class="fp-x" type="button" aria-label="Back">${IC.back(20)}</button><div id="frTitle" class="fp-title">Friends</div><button id="frCancel" class="fp-link" type="button" hidden>Cancel</button><button id="frMore" class="fp-x" type="button" aria-label="More options">${IC.dots}</button>
<div id="frMenu" class="cs-menu cp-menu fp-menu"><button id="frRemove" class="danger">${mi(IC.userMinus, 'Remove friend')}</button></div></header>
<div id="frList" class="fp-list"></div>
<div id="frRmBar" class="fp-rmbar"><span id="frRmCount">Select friends</span><button id="frRmGo" type="button" disabled>Remove</button></div></div>`);
frPage = $('frPage');
/* friends page: 3-dots -> "Remove friend" -> tick the friends to remove */
let rmMode = false; const rmSel = new Set(); const rmBar = $('frRmBar');
function rmUI() { const n = rmSel.size; $('frRmCount').textContent = n ? `${n} selected` : 'Select friends'; $('frRmGo').disabled = !n; }
function enterRm() {
if (!state.friends.length) return toast('No friends to remove', 'info');
rmMode = true; rmSel.clear(); frPage.classList.add('rm'); rmBar.classList.add('on');
$('frMore').hidden = true; $('frCancel').hidden = false; $('frTitle').textContent = 'Select friends'; rmUI(); renderFriendsPage();
}
function exitRm() {
if (!rmMode) return;
rmMode = false; rmSel.clear(); frPage.classList.remove('rm'); rmBar.classList.remove('on');
$('frMore').hidden = false; $('frCancel').hidden = true; $('frTitle').textContent = 'Friends'; renderFriendsPage();
}
function toggleRm(uid) { if (rmSel.has(uid)) rmSel.delete(uid); else rmSel.add(uid); rmUI(); renderFriendsPage(); }
function renderFriendsPage() {
if (!frPage || !frPage.classList.contains('active')) return;
const list = $('frList'), fr = [...state.friends].sort((a, b) => displayName(a.uid).localeCompare(displayName(b.uid)));
const items = [];
if (state.incoming.length) {
items.push({ k: 'l:rq', html: cnt('Friend requests · ' + state.incoming.length) });
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
items.push({ k: 'l:fr', html: cnt('Friends · ' + fr.length) });
if (fr.length) fr.forEach(({ uid }) => items.push({ k: 'fr:' + uid, html: friendRow(uid, rmMode ? (rmSel.has(uid) ? 2 : 1) : 0) }));
else items.push({ k: 'empty', html: '<div class="fp-empty"><span>💫</span><b>No friends yet</b><i>Add a friend from Chat. When they accept, they show up here.</i></div>' });
setList(list, items, true);
}
function dockSet(id) { ['dkHome', 'dkFr', 'dkPost'].forEach((b) => $(b)?.classList.toggle('on', b === id)); document.body.classList.toggle('dock-up', id !== 'dkHome'); }
function openFriends() {
closePost();
frPage.classList.add('active'); dockSet('dkFr'); frPage.setAttribute('aria-hidden', 'false');
document.documentElement.style.overflow = 'hidden';
renderFriendsPage();
}
function closeFriends() {
exitRm(); $('frMenu')?.classList.remove('open');
if (frPage.classList.contains('active')) dockSet('dkHome');
frPage.classList.remove('active'); frPage.setAttribute('aria-hidden', 'true');
if (!app.classList.contains('active')) document.documentElement.style.overflow = '';
}
$('frClose').onclick = closeFriends;
$('frList').onclick = async (e) => {
const t = e.target.closest('[data-open],[data-acc],[data-dec],[data-cancel]'); if (!t) return;
if (t.dataset.open && rmMode) { toggleRm(t.dataset.open); return; }
if (t.dataset.open) { const uid = t.dataset.open; closeFriends(); await openChat(); openConversation(uid); return; }
try {
if (t.dataset.acc) await updateDoc(doc(D(), 'chatRequests', t.dataset.acc), { status: 'accepted', seenFrom: false, seenTo: false });
else await deleteDoc(doc(D(), 'chatRequests', t.dataset.dec || t.dataset.cancel));
} catch { toast('Something went wrong', 'error'); }
};
window.OSBack?.add(frPage, closeFriends);
$('frMore').onclick = (e) => { e.stopPropagation(); $('frMenu').classList.toggle('open'); };
$('frRemove').onclick = () => { $('frMenu').classList.remove('open'); enterRm(); };
$('frCancel').onclick = exitRm;
document.addEventListener('click', (e) => { if (!e.target.closest('#frMenu') && !e.target.closest('#frMore')) $('frMenu').classList.remove('open'); });
$('frRmGo').onclick = async () => {
const ids = [...rmSel].filter((u) => state.friends.some((f) => f.uid === u)); if (!ids.length) return;
if (!confirm(`Remove ${ids.length} friend${ids.length > 1 ? 's' : ''}?`)) return;
try { await Promise.all(ids.map((u) => deleteDoc(doc(D(), 'chatRequests', state.friends.find((f) => f.uid === u).req.id)))); toast('Removed', 'success'); exitRm(); }
catch { toast('Couldn’t remove', 'error'); }
};
window.OSBack?.add(rmBar, exitRm, () => rmMode);
/* ---------- Post a memory page (dock symbol beside Friends) ---------- */
const postPage = $('postPage');
function openPost() {
closeFriends();
postPage.classList.add('active'); dockSet('dkPost'); postPage.setAttribute('aria-hidden', 'false');
document.documentElement.style.overflow = 'hidden';
}
function closePost() {
if (postPage.classList.contains('active')) dockSet('dkHome');
postPage.classList.remove('active'); postPage.setAttribute('aria-hidden', 'true');
if (!app.classList.contains('active') && !frPage.classList.contains('active')) document.documentElement.style.overflow = '';
}
$('dkPost').onclick = openPost;
$('ppClose').onclick = closePost;
window.OSBack?.add(postPage, closePost);
// when a memory is shared, the pop-up animation plays and we return Home, where "moments shared" goes up
const rv = $('memoryRevealOverlay');
if (rv) new MutationObserver(() => { if (rv.classList.contains('posting') && postPage.classList.contains('active')) closePost(); }).observe(rv, { attributes: true, attributeFilter: ['class'] });
setInterval(renderFriendsPage, 15000); // keeps "online / last seen" fresh while it is open
/* =========================================================
VOICE CALLS — WebRTC audio, the two phones find each other through Firestore ("calls" collection)
========================================================= */
/* STUN only (no TURN relay). Google's STUN server just tells each phone its own public address — it never receives, hears or relays any audio.
   The call itself goes phone-to-phone and is encrypted end-to-end (DTLS-SRTP). The call set-up (offer, answer, network addresses) is also
   sealed with your private chat key before it touches Firestore. */
const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }], iceCandidatePoolSize: 2, bundlePolicy: 'max-bundle', rtcpMuxPolicy: 'require' };
const sealC = async (uid, obj) => { const { iv, ct } = await encJSON(await sharedKey(uid), obj); return { iv, ct }; };
const openC = async (uid, o) => decJSON(await sharedKey(uid), o.iv, o.ct);
const MIC_OPTS = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 48000 } };
const PH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>';
const MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.500v5h3.500l5 4v-13l-5 4z"/><path d="M16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11"/></svg>';
document.body.insertAdjacentHTML('beforeend', '<div id="callPill" class="call-pill" role="button" aria-label="Return to call"><span class="cpl-ic">' + PH + '</span><b id="cpillTime">00:00</b><small id="cpillSub"></small></div>');
document.body.insertAdjacentHTML('beforeend', '<div id="callUI" aria-hidden="true"><button id="callBack" class="cl-back" type="button" aria-label="Back">' + IC.back(22) + '</button><div class="cl-bg"><i></i><i></i><i></i></div><div class="cl-top"><h2 id="callName"></h2><p class="call-state" id="callState"></p></div><div class="cl-mid"><div class="cl-av" id="callAv"><span id="callInit"></span></div></div><div class="cl-acts" id="callActs"></div><audio id="callAudio" autoplay playsinline></audio></div>');
const call = { min: false, id: null, pc: null, stream: null, role: null, uid: null, unsubs: [], t0: 0, tick: 0, upd: null, ringTo: 0, dropTo: 0, weak: false, ring: null, muted: false, spk: true, accepting: false, queue: [], incoming: null };
const callDoc = (id) => doc(D(), 'calls', id);
/* keep the screen awake and the audio playing for the whole call */
let wake = null;
const wakeOn = async () => { try { wake = await navigator.wakeLock?.request('screen'); } catch {} };
const wakeOff = () => { try { wake?.release(); } catch {} wake = null; };
document.addEventListener('visibilitychange', () => { if (!document.hidden && (call.id || call.incoming)) { wakeOn(); $('callAudio').play?.().catch(() => {}); } });
/* clear, steady voice: Opus with forward error correction, no silence-skipping, 40 kbps mono */
const tuneSdp = (sdp) => { try { return sdp.replace(/a=fmtp:(\d+) ([^\r\n]*)/g, (m, pt, rest) => /minptime/.test(rest) ? `a=fmtp:${pt} ${rest.replace(/;?(maxaveragebitrate|useinbandfec|usedtx|stereo|cbr)=\d+/g, '')};useinbandfec=1;usedtx=0;stereo=0;cbr=0;maxaveragebitrate=40000` : m); } catch { return sdp; } };
const tuneSender = (pc) => pc.getSenders().forEach((sd) => {
if (sd.track?.kind !== 'audio' || !sd.getParameters) return;
try { const p = sd.getParameters(); if (!p.encodings || !p.encodings.length) p.encodings = [{}]; p.encodings[0].maxBitrate = 40000; p.encodings[0].priority = 'high'; p.encodings[0].networkPriority = 'high'; sd.setParameters(p).catch(() => {}); } catch {}
});
function applySpeaker() {
const a = $('callAudio'); a.volume = call.spk ? 1 : .45;
try { a.setSinkId?.(call.spk ? 'default' : 'communications')?.catch?.(() => {}); } catch {}
$('callSpk')?.classList.toggle('on', call.spk);
}
function ringStop() { if (call.ring) { clearInterval(call.ring.iv); try { call.ring.ctx.close(); } catch {} call.ring = null; } }
function ringStart(incoming) {
ringStop();
try {
const AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
const beep = () => {
const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
o.type = 'sine'; o.frequency.value = incoming ? 880 : 440;
g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .05); g.gain.linearRampToValueAtTime(0, t + .6);
o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + .65);
if (incoming) navigator.vibrate?.([300, 150, 300]);
};
beep(); call.ring = { ctx, iv: setInterval(beep, 2200) };
} catch {}
}
function callActs(mode) {
const b = (cls, id, label, svg, cap) => `<div class="cb"><button type="button" class="call-btn ${cls}" id="${id}" aria-label="${label}">${svg}</button><small>${cap}</small></div>`;
$('callActs').innerHTML = mode === 'off'
? `<div class="cb off-note"><p><b>${esc(displayName(call.uid))}</b> is offline right now.<br>You can call when they’re online.</p><button type="button" class="call-btn spk" id="callOffX" aria-label="Close">${IC.close(26)}</button><small>Close</small></div>`
: mode === 'in'
? b('end', 'callNo', 'Decline', PH, 'Decline') + b('ok', 'callYes', 'Answer', PH, 'Answer')
: b('spk' + (call.spk ? ' on' : ''), 'callSpk', 'Speaker', SPK, 'Speaker') + b('end', 'callEnd', 'End call', PH, 'End')
+ b('mute' + (call.muted ? ' on' : ''), 'callMute', call.muted ? 'Unmute' : 'Mute', MIC, 'Mute');
if ($('callOffX')) $('callOffX').onclick = closeOffline;
if ($('callNo')) $('callNo').onclick = declineCall;
if ($('callYes')) $('callYes').onclick = acceptCall;
if ($('callEnd')) $('callEnd').onclick = () => hangup('ended');
if ($('callSpk')) $('callSpk').onclick = () => { call.spk = !call.spk; applySpeaker(); };
if ($('callMute')) $('callMute').onclick = () => { call.muted = !call.muted; call.stream?.getAudioTracks().forEach((t) => { t.enabled = !call.muted; }); $('callMute').classList.toggle('on', call.muted); paintPill(); };
}
function showCall(uid, mode, text) {
const ui = $('callUI'); call.uid = uid;
const nm = displayName(uid) || 'Unknown';
ui.classList.add('active'); ui.classList.toggle('ringing', mode === 'in' || mode === 'dial'); if (mode !== 'off') ui.classList.remove('offline'); ui.classList.toggle('incoming', mode === 'in'); ui.setAttribute('aria-hidden', 'false');
$('callName').textContent = nm; $('callInit').textContent = (Array.from(nm.trim())[0] || '?').toUpperCase();
$('callState').textContent = text || '';
callActs(mode);
}
let offTo = 0;
function closeOffline() { clearTimeout(offTo); const ui = $('callUI'); if (ui.classList.contains('offline') && !call.id && !call.incoming) { ui.classList.remove('active', 'offline'); ui.setAttribute('aria-hidden', 'true'); } }
function showOffline(uid) {
const ui = $('callUI'); ui.classList.add('offline'); showCall(uid, 'off', 'Offline');
$('callName').textContent = displayName(uid); clearTimeout(offTo); offTo = setTimeout(closeOffline, 4500);
}
function makePc() {
const pc = new RTCPeerConnection(ICE); call.pc = pc; call.queue = [];
pc.ontrack = (e) => { const a = $('callAudio'); a.srcObject = e.streams[0]; applySpeaker(); a.play?.().catch(() => {}); };
pc.onconnectionstatechange = () => {
const st = pc.connectionState; clearTimeout(call.dropTo);
if (st === 'connected') { call.weak = false; call.upd?.(); }
else if (st === 'disconnected') { call.weak = true; $('callState').textContent = 'Reconnecting…'; call.dropTo = setTimeout(() => hangup('ended', 'Connection lost'), 20000); } // a short network blip heals by itself — we only hang up if it lasts
else if (st === 'failed') hangup('ended', 'Connection lost');
};
return pc;
}
const addCand = (c) => { const pc = call.pc; if (!pc) return; if (pc.remoteDescription) pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}); else call.queue.push(c); };
const flushCands = () => { const q = call.queue; call.queue = []; q.forEach(addCand); };
const fmtCall = () => { const s = Math.max(0, Math.floor((Date.now() - call.t0) / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, p = (n) => String(n).padStart(2, '0'); return h ? h + ':' + p(m) + ':' + p(x) : p(m) + ':' + p(x); };
/* keep the call alive while you read / write chats: the full screen shrinks to a banner (green, or brown when you are muted) */
function paintPill() {
callSt.on = !!call.id; callSt.muted = !!call.muted;
const pill = $('callPill'); if (!pill) return;
const here = app.classList.contains('active') || !!$('frPage')?.classList.contains('active');
const show = !!call.id && call.min && here;
pill.classList.toggle('show', show); pill.classList.toggle('muted', !!call.muted);
if (show) { $('cpillTime').textContent = call.weak ? 'Reconnecting…' : call.t0 ? fmtCall() : 'Connecting…'; $('cpillSub').textContent = call.muted ? 'Muted' : displayName(call.uid); }
}
const canMin = () => !!call.id && !$('callUI').classList.contains('offline') && !$('callUI').classList.contains('incoming');
function minimizeCall() { if (!canMin() || call.min) return; call.min = true; const ui = $('callUI'); ui.classList.remove('active'); ui.setAttribute('aria-hidden', 'true'); paintPill(); }
function restoreCall() { if (!call.id || !call.min) return; call.min = false; const ui = $('callUI'); ui.classList.add('active'); ui.setAttribute('aria-hidden', 'false'); paintPill(); }
$('callBack').onclick = minimizeCall; $('callPill').onclick = restoreCall;
window.OSBack?.add($('callUI'), minimizeCall, () => $('callUI').classList.contains('active') && canMin());
new MutationObserver(paintPill).observe(app, { attributes: true, attributeFilter: ['class'] });
{ let g = null; const ui = $('callUI');
ui.addEventListener('touchstart', (e) => { g = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
ui.addEventListener('touchmove', (e) => { if (!g) return; const t = e.touches[0], dx = t.clientX - g.x, dy = t.clientY - g.y; if ((dy > 110 && Math.abs(dx) < 70) || (g.x < 30 && dx > 90 && Math.abs(dy) < 60)) { g = null; minimizeCall(); } }, { passive: true });
ui.addEventListener('touchend', () => { g = null; }, { passive: true }); }
function goLive() {
if (call.t0) return;
ringStop(); clearTimeout(call.ringTo); call.t0 = Date.now();
$('callUI').classList.remove('ringing'); callActs('live');
call.upd = () => { if (!call.weak) $('callState').textContent = fmtCall(); paintPill(); };
call.upd(); call.tick = setInterval(call.upd, 1000);
$('callAudio').play?.().catch(() => {});
}
function endLocal(msg) {
if (!call.id && !call.stream && !call.pc && !call.incoming) return;
if (call.min && msg) { toast(msg, 'info'); msg = ''; }
ringStop(); clearTimeout(call.ringTo); clearTimeout(call.dropTo); clearInterval(call.tick); wakeOff();
call.unsubs.forEach((u) => { try { u(); } catch {} });
call.stream?.getTracks().forEach((t) => t.stop());
try { call.pc?.close(); } catch {}
const ui = $('callUI'); $('callAudio').srcObject = null;
if (msg) { $('callState').textContent = msg; ui.classList.remove('ringing'); $('callActs').innerHTML = ''; }
Object.assign(call, { min: false, id: null, pc: null, stream: null, role: null, unsubs: [], t0: 0, tick: 0, upd: null, ringTo: 0, dropTo: 0, weak: false, muted: false, spk: true, accepting: false, queue: [], incoming: null });
setTimeout(() => { if (!call.id && !call.incoming) { ui.classList.remove('active'); ui.setAttribute('aria-hidden', 'true'); } }, msg ? 1300 : 0);
paintPill();
}
async function hangup(status, msg) {
const id = call.id; endLocal(msg || (status === 'ended' ? 'Call ended' : ''));
if (id) { try { await updateDoc(callDoc(id), { status }); } catch {} }
}
async function startCall(uid) {
if (call.id || call.incoming) return toast('You’re already in a call', 'info');
if (!state.friends.some((f) => f.uid === uid)) return toast('You can only call friends', 'info');
if (!presence(uid).on) return showOffline(uid);
if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) return toast('Calling isn’t supported on this browser', 'error');
try { call.stream = await navigator.mediaDevices.getUserMedia(MIC_OPTS); }
catch { return toast('Please allow the microphone to make a call', 'error'); }
call.role = 'caller'; showCall(uid, 'dial', 'Connecting…'); ringStart(false); wakeOn();
const pc = makePc(); call.stream.getTracks().forEach((t) => pc.addTrack(t, call.stream));
const ref = doc(collection(D(), 'calls')); call.id = ref.id;
let ready = false; const buf = [];
const putC = async (c) => addDoc(collection(ref, 'callerCandidates'), await sealC(uid, c)).catch(() => {});
pc.onicecandidate = (e) => { if (!e.candidate) return; const c = e.candidate.toJSON(); if (ready) putC(c); else buf.push(c); };
try {
const offer = await pc.createOffer({ offerToReceiveAudio: true }); offer.sdp = tuneSdp(offer.sdp); await pc.setLocalDescription(offer); tuneSender(pc);
await setDoc(ref, { from: state.uid, to: uid, status: 'ringing', offer: await sealC(uid, { type: offer.type, sdp: offer.sdp }), createdAt: serverTimestamp() });
} catch { endLocal('Couldn’t start the call'); toast('Couldn’t start the call', 'error'); return; }
ready = true; buf.forEach((c) => putC(c));
call.unsubs.push(onSnapshot(ref, async (sn) => {
const d = sn.data(); if (!d || call.id !== ref.id) return;
if (d.answer && !pc.currentRemoteDescription) { try { await pc.setRemoteDescription(await openC(uid, d.answer)); flushCands(); } catch {} }
if (d.status === 'active' && !call.t0) { $('callState').textContent = 'Connecting…'; }
if (d.status === 'declined') endLocal('Call declined');
else if (d.status === 'ended' || d.status === 'missed') endLocal(call.t0 ? 'Call ended' : 'No answer');
}, () => {}));
call.unsubs.push(onSnapshot(collection(ref, 'calleeCandidates'), (sn) => { sn.docChanges().forEach(async (c) => { if (c.type === 'added') { try { addCand(await openC(uid, c.doc.data())); } catch {} } }); }, () => {}));
pc.addEventListener('connectionstatechange', () => { if (pc.connectionState === 'connected') goLive(); });
call.ringTo = setTimeout(() => { if (call.id === ref.id && !call.t0) hangup('missed', 'No answer'); }, 45000);
}
async function declineCall() {
const inc = call.incoming; if (!inc) return;
endLocal('');
try { await updateDoc(callDoc(inc.id), { status: 'declined' }); } catch {}
}
async function acceptCall() {
const inc = call.incoming; if (!inc || call.accepting) return;
call.accepting = true; ringStop(); $('callState').textContent = 'Connecting…'; $('callUI').classList.remove('incoming'); callActs('dial');
if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) { toast('Calling isn’t supported on this browser', 'error'); declineCall(); return; }
try { call.stream = await navigator.mediaDevices.getUserMedia(MIC_OPTS); }
catch { toast('Please allow the microphone to answer', 'error'); declineCall(); return; }
if (call.incoming !== inc) { call.stream?.getTracks().forEach((t) => t.stop()); return; }
wakeOn();
const ref = callDoc(inc.id); call.id = inc.id; call.role = 'callee';
const pc = makePc(); call.stream.getTracks().forEach((t) => pc.addTrack(t, call.stream));
pc.onicecandidate = async (e) => { if (e.candidate) { try { await addDoc(collection(ref, 'calleeCandidates'), await sealC(inc.uid, e.candidate.toJSON())); } catch {} } };
pc.addEventListener('connectionstatechange', () => { if (pc.connectionState === 'connected') goLive(); });
try {
await pc.setRemoteDescription(await openC(inc.uid, inc.offer)); flushCands();
const answer = await pc.createAnswer(); answer.sdp = tuneSdp(answer.sdp); await pc.setLocalDescription(answer); tuneSender(pc);
await updateDoc(ref, { answer: await sealC(inc.uid, { type: answer.type, sdp: answer.sdp }), status: 'active' });
} catch { endLocal('Couldn’t connect the call'); toast('Couldn’t connect the call', 'error'); return; }
call.unsubs.push(onSnapshot(collection(ref, 'callerCandidates'), (sn) => { sn.docChanges().forEach(async (c) => { if (c.type === 'added') { try { addCand(await openC(inc.uid, c.doc.data())); } catch {} } }); }, () => {}));
call.unsubs.push(onSnapshot(ref, (sn) => { const d = sn.data(); if (!d || call.id !== ref.id) return; if (d.status === 'ended' || d.status === 'missed') endLocal('Call ended'); }, () => {}));
}
/* incoming calls: listen for a "ringing" call addressed to me */
let callUnsub = null, callUid = null;
function stopCallListener() { try { callUnsub?.(); } catch {} callUnsub = null; callUid = null; }
function listenCalls(uid) {
stopCallListener(); callUid = uid;
try {
callUnsub = onSnapshot(query(collection(D(), 'calls'), where('to', '==', uid), where('status', '==', 'ringing')), (sn) => {
sn.docChanges().forEach((c) => {
if (c.type !== 'added') return;
const d = c.doc.data(), id = c.doc.id;
const t = d.createdAt?.toMillis ? d.createdAt.toMillis() : Date.now();
if (Date.now() - t > 60000) return; // an old call that nobody answered
if (call.id || call.incoming) { updateDoc(callDoc(id), { status: 'declined' }).catch(() => {}); return; }
call.incoming = { id, uid: d.from, offer: d.offer }; call.role = 'callee';
showCall(d.from, 'in', 'Incoming call'); ringStart(true); wakeOn();
call.unsubs.push(onSnapshot(callDoc(id), (s2) => { const x = s2.data(); if (!x || !call.incoming || call.incoming.id !== id) return; if (!call.t0 && (x.status === 'ended' || x.status === 'missed')) endLocal('Missed call'); }, () => {}));
call.ringTo = setTimeout(() => { if (call.incoming && call.incoming.id === id && !call.t0 && !call.accepting) { updateDoc(callDoc(id), { status: 'missed' }).catch(() => {}); endLocal('Missed call'); } }, 45000);
});
}, () => {});
} catch (e) { console.error(e); }
}
onAuthStateChanged(O().auth, (u) => { if (!u) { stopCallListener(); endLocal(''); return; } if (callUid !== u.uid) listenCalls(u.uid); });
$('cpCall').onclick = () => { if (!state.active) return toast('Open a chat first', 'info'); startCall(state.active); };
window.addEventListener('pagehide', (e) => { if (!e.persisted && call.id) { try { updateDoc(callDoc(call.id), { status: 'ended' }); } catch {} } });
