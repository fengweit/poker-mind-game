import { createDeck, shuffle, bestOfSeven, compareHands, calculatePotOdds, estimateEquity, preflopStrength } from './core.js';
import {
  actorForStreet,
  applyBetAction,
  canRaise,
  createBettingState,
  formatStackDelta,
  postBlinds,
  settlePot as settleBettingPot,
  splitPot as splitBettingPot,
  toCall as bettingToCall
} from './betting.js';

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const ui = {
  stage: $('tableStage'), table: $('table'), aiStack: $('aiStack'), playerStack: $('playerStack'), pot: $('pot'), street: $('street'),
  playerCards: $('playerCards'), aiCards: $('aiCards'), community: $('community'), playerDealer: $('playerDealer'), aiDealer: $('aiDealer'),
  whisper: $('whisper'), aiRead: $('aiRead'), hand: $('playerHand'), equity: $('equity'), equityDial: $('equityDial'), potOdds: $('potOdds'),
  confidence: $('confidence'), recommendation: $('recommendation'), reason: $('recommendReason'), aggressionBar: $('aggressionBar'),
  tendencyText: $('tendencyText'), decision: $('decisionLabel'), toCall: $('toCallLabel'), checkText: $('checkText'), checkSub: $('checkSub'),
  raiseText: $('raiseText'), raiseSub: $('raiseSub'), raiseSlider: $('raiseSlider'), raiseAmount: $('raiseAmount'), result: $('resultOverlay'),
  resultTitle: $('resultTitle'), resultSummary: $('resultSummary'), reviewGrid: $('reviewGrid'), mindNote: $('mindNote'), inspector: $('inspector')
};

const state = {
  stacks: { player: 1000, ai: 1000 }, bets: { player: 0, ai: 0 }, pot: 0, deck: [], player: [], ai: [], board: [],
  dealer: 'player', handDealer: 'player', street: 0, currentBet: 0, actor: null, acted: new Set(), raiseLocked: [],
  lastFullRaise: 20, roundComplete: false, handOver: false, paid: false, winner: null, started: false,
  sound: false, motion: !reducedMotion.matches,
  stats: { hands: 0, playerFolds: 0, playerRaises: 0, aiRaises: 0, aiCalls: 0, aiFolds: 0 },
  log: [], initialStacks: null, lastEquity: 0
};
const streetNames = ['PRE-FLOP', 'FLOP', 'TURN', 'RIVER'];
const rankText = { 14:'A',13:'K',12:'Q',11:'J',10:'10',9:'9',8:'8',7:'7',6:'6',5:'5',4:'4',3:'3',2:'2' };
const suitText = { s:'♠',h:'♥',d:'♦',c:'♣' };
const wait = ms => new Promise(resolve => setTimeout(resolve, state.motion ? ms : 10));

function cardEl(card, hidden = false, delay = 0) {
  const div = document.createElement('div');
  div.className = hidden ? 'card back' : `card ${card.suit === 'h' || card.suit === 'd' ? 'red-suit' : ''}`;
  div.style.animationDelay = `${delay}ms`;
  if (!hidden) div.innerHTML = `<div class="corner">${rankText[card.rank]}<br>${suitText[card.suit]}</div><div class="suit-center">${suitText[card.suit]}</div>`;
  return div;
}
function renderCards(container, cards, hidden = false) {
  container.replaceChildren(...cards.map((card, i) => cardEl(card, hidden, i * 90)));
}
function chips(n) { return Math.max(0, Math.round(n)).toLocaleString(); }

function updateStacks() { ui.playerStack.textContent = chips(state.stacks.player); ui.aiStack.textContent = chips(state.stacks.ai); ui.pot.textContent = chips(state.pot); }
function say(text) { ui.whisper.textContent = text; }
function tone(freq = 220, duration = .08, type = 'sine', volume = .035) {
  if (!state.sound) return;
  const ctx = tone.ctx || (tone.ctx = new AudioContext());
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime); gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration); osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
}
function other(who) { return who === 'player' ? 'ai' : 'player'; }
function bettingSnapshot() {
  return createBettingState({
    stacks: state.stacks, bets: state.bets, pot: state.pot, currentBet: state.currentBet,
    actor: state.actor, dealer: state.handDealer, lastFullRaise: state.lastFullRaise,
    acted: [...state.acted], raiseLocked: state.raiseLocked, roundComplete: state.roundComplete,
    handOver: state.handOver, winner: state.winner, paid: state.paid
  });
}
function syncBetting(next, committed = 0) {
  state.stacks = { ...next.stacks }; state.bets = { ...next.bets }; state.pot = next.pot;
  state.currentBet = next.currentBet; state.actor = next.actor; state.lastFullRaise = next.lastFullRaise;
  state.acted = new Set(next.acted); state.raiseLocked = [...next.raiseLocked]; state.roundComplete = next.roundComplete;
  state.handOver = next.handOver; state.winner = next.winner; state.paid = next.paid;
  updateStacks(); if (committed > 0) tone(110 + committed, .08, 'triangle');
}
function takeBetAction(who, action) {
  const before = state.stacks[who];
  const next = applyBetAction(bettingSnapshot(), who, action);
  syncBetting(next, before - next.stacks[who]);
  return next;
}
function toCall(who) { return bettingToCall(bettingSnapshot(), who); }

function setControls(enabled) {
  const call = toCall('player');
  document.querySelectorAll('.action').forEach(b => b.disabled = !enabled);
  const check = document.querySelector('[data-action="check"]');
  ui.checkText.textContent = call ? `CALL ${chips(Math.min(call, state.stacks.player))}` : 'CHECK';
  ui.checkSub.textContent = call ? 'Match the pressure' : 'Keep pressure neutral';
  check.disabled = !enabled;
  const minTo = Math.min(state.bets.player + state.stacks.player, state.currentBet + state.lastFullRaise);
  const maxTo = state.bets.player + state.stacks.player;
  ui.raiseSlider.min = minTo; ui.raiseSlider.max = Math.max(minTo, maxTo); ui.raiseSlider.step = 10;
  ui.raiseSlider.value = Math.min(maxTo, Math.max(minTo, Number(ui.raiseSlider.value)));
  ui.raiseAmount.textContent = chips(ui.raiseSlider.value);
  ui.raiseText.textContent = state.currentBet ? 'RAISE' : 'BET';
  ui.raiseSub.textContent = `Make it ${chips(ui.raiseSlider.value)}`;
  document.querySelector('[data-action="raise"]').disabled = !enabled || !canRaise(bettingSnapshot(), 'player');
  document.querySelector('[data-action="fold"]').disabled = !enabled || call === 0;
  ui.decision.textContent = enabled ? 'YOUR DECISION' : (state.handOver ? 'HAND COMPLETE' : 'VESPER IS THINKING');
  ui.toCall.textContent = call ? `${chips(call)} to call · ${chips(state.pot)} in pot` : 'Check or apply pressure';
}

function strength(who) {
  const hole = state[who];
  if (state.board.length < 3) return preflopStrength(hole);
  return estimateEquity(hole, state.board, [], 180).equity;
}
function aiProfile() {
  const s = state.stats;
  const observed = Math.max(1, s.hands);
  const playerAggression = s.playerRaises / observed;
  const foldRate = s.playerFolds / observed;
  return { playerAggression, foldRate, exploitBluff: foldRate > .38, trap: playerAggression > .65 };
}
function aiDecision() {
  const call = toCall('ai'), potOdds = calculatePotOdds(call, state.pot) / 100, handStrength = strength('ai');
  const profile = aiProfile();
  const noise = Math.random() * .16 - .08;
  const adjusted = handStrength + noise;
  if (call > 0 && adjusted < potOdds - .08 && Math.random() > .12) return { type:'fold' };
  const aggression = adjusted + (profile.exploitBluff ? .12 : 0) - (profile.trap ? .07 : 0);
  if (canRaise(bettingSnapshot(), 'ai') && state.stacks.ai > call + 20 && (aggression > .67 || (profile.exploitBluff && Math.random() < .25))) {
    const target = Math.min(state.bets.ai + state.stacks.ai, Math.max(state.currentBet + state.lastFullRaise, state.currentBet + Math.max(20, Math.round(state.pot * .55 / 10) * 10)));
    return { type:'raise', target };
  }
  return { type: call ? 'call' : 'check' };
}

async function actAI() {
  if (state.handOver || state.actor !== 'ai') return;
  setControls(false); ui.aiRead.textContent = 'READING THE LINE'; await wait(550 + Math.random() * 450);
  const move = aiDecision();
  if (move.type === 'fold') { takeBetAction('ai', { type: 'fold' }); state.stats.aiFolds++; state.log.push('Vesper folded'); say('Vesper releases the hand. Pressure changed the outcome.'); award('player', 'VESPER FOLDS'); return; }
  if (move.type === 'raise') {
    takeBetAction('ai', move); state.stats.aiRaises++;
    state.log.push(`Vesper raised to ${state.currentBet}`); say(`Vesper raises to ${chips(state.currentBet)}. Is it strength—or a story?`); shake();
  } else {
    const call = toCall('ai'); takeBetAction('ai', { type: call ? 'call' : 'check' }); state.stats.aiCalls += call > 0 ? 1 : 0;
    state.log.push(call ? `Vesper called ${call}` : 'Vesper checked'); say(call ? 'Vesper calls. Their range narrows.' : 'Vesper checks. Information, or misdirection?');
  }
  ui.aiRead.textContent = profileLabel();
  await continueRound('ai');
}

async function playerAction(type) {
  if (state.handOver || state.actor !== 'player') return;
  setControls(false);
  if (type === 'fold') { takeBetAction('player', { type: 'fold' }); state.stats.playerFolds++; state.log.push('You folded'); award('ai', 'YOU FOLD'); return; }
  if (type === 'check') {
    const call = toCall('player'); takeBetAction('player', { type: call ? 'call' : 'check' });
    state.log.push(call ? `You called ${call}` : 'You checked'); say(call ? 'You pay for the next piece of information.' : 'You keep the pot controlled.');
  } else if (type === 'raise') {
    const target = Number(ui.raiseSlider.value); takeBetAction('player', { type: 'raise', target });
    state.stats.playerRaises++; state.log.push(`You raised to ${state.currentBet}`); say('You apply pressure. Vesper must reveal a preference.'); shake();
  }
  await continueRound('player');
}

async function continueRound(lastActor) {
  updateInspector();
  if (state.handOver) return;
  if ((state.stacks.player === 0 || state.stacks.ai === 0) && state.roundComplete) { await runout(); return; }
  if (state.roundComplete) { await advanceStreet(); return; }
  state.actor = other(lastActor);
  if (state.actor === 'ai') await actAI(); else setControls(true);
}

async function advanceStreet(runoutOnly = false) {
  if (state.street === 3) { showdown(); return; }
  state.street++; state.bets = { player:0, ai:0 }; state.currentBet = 0; state.acted = new Set(); state.raiseLocked = [];
  state.lastFullRaise = 20; state.roundComplete = false;
  const count = state.street === 1 ? 3 : 1;
  for (let i = 0; i < count; i++) { state.board.push(state.deck.pop()); renderCards(ui.community, state.board); tone(320 + i * 40, .1); await wait(180); }
  ui.street.textContent = streetNames[state.street]; say(streetInsight()); updateInspector();
  if (runoutOnly) return;
  state.actor = actorForStreet(state.handDealer, state.street);
  if (state.actor === 'ai') await actAI(); else setControls(true);
}
async function runout() { setControls(false); while (state.street < 3) await advanceStreet(true); showdown(); }

function showdown() {
  state.handOver = true; setControls(false); ui.table.classList.add('slow'); renderCards(ui.aiCards, state.ai, false); tone(85,.5,'sawtooth',.025);
  const p = bestOfSeven([...state.player, ...state.board]), a = bestOfSeven([...state.ai, ...state.board]), result = compareHands(p, a);
  if (result > 0) award('player', `${p.name.toUpperCase()} WINS`, { p, a });
  else if (result < 0) award('ai', `VESPER'S ${a.name.toUpperCase()} WINS`, { p, a });
  else splitPot(p, a);
}
function splitPot(p, a) {
  syncBetting(splitBettingPot(bettingSnapshot()));
  showReview('SPLIT POT', `Both players show ${p.name}. Identical value; different private stories.`, p, a, 'A tie can feel like a near-miss. Notice that feeling—outcomes are noisy, decision quality is the durable signal.');
}
function award(winner, title, hands = null) {
  if (state.paid) return;
  const amount = state.pot; syncBetting(settleBettingPot(bettingSnapshot(), winner)); setControls(false);
  const summary = winner === 'player' ? `You collect ${chips(amount)} virtual chips.` : `Vesper collects ${chips(amount)} virtual chips.`;
  const p = hands?.p || (state.board.length >= 3 ? bestOfSeven([...state.player, ...state.board]) : null);
  const a = hands?.a || (state.board.length >= 3 ? bestOfSeven([...state.ai, ...state.board]) : null);
  const note = winner === 'player'
    ? 'A win delivers intermittent reward. Do not confuse a favorable outcome with a perfect decision—review the price you paid.'
    : 'Loss aversion makes this pot feel larger after it leaves your stack. The next hand is independent; do not chase virtual losses.';
  setTimeout(() => showReview(title, summary, p, a, note), state.motion ? 650 : 10);
}
function showReview(title, summary, p, a, note) {
  ui.resultTitle.textContent = title; ui.resultSummary.textContent = summary;
  const delta = state.stacks.player - state.initialStacks.player;
  ui.reviewGrid.innerHTML = `<div><span>YOUR BEST</span><strong>${p?.name || 'Folded'}</strong></div><div><span>VESPER HELD</span><strong>${a?.name || 'Unrevealed'}</strong></div><div><span>STACK CHANGE</span><strong>${formatStackDelta(delta)}</strong></div>`;
  ui.mindNote.textContent = note; ui.result.classList.remove('hidden');
}

function streetInsight() {
  return [
    '',
    'The flop transforms possibility into a range of plausible stories.',
    'One card changes the price. Near-misses are information, not promises.',
    'No more cards are coming. Decide with what you know—and what you infer.'
  ][state.street];
}
function profileLabel() {
  const rate = state.stats.hands ? state.stats.aiRaises / state.stats.hands : 0;
  return rate > .65 ? 'PRESSURE HEAVY' : rate < .25 ? 'PATIENT / POLAR' : 'BALANCED';
}
function updateInspector() {
  if (!state.player.length) return;
  const call = toCall('player'); let equity, confidence;
  if (state.board.length < 3) { equity = preflopStrength(state.player); confidence = 'LOW'; }
  else { const samples = state.board.length === 5 ? 700 : 420; equity = estimateEquity(state.player, state.board, [], samples).equity; confidence = state.board.length === 5 ? 'HIGH' : 'MEDIUM'; }
  state.lastEquity = equity; const odds = calculatePotOdds(call, state.pot); const edge = equity * 100 - odds;
  ui.equity.textContent = `${Math.round(equity * 100)}%`; ui.equityDial.style.setProperty('--equity', `${equity * 360}deg`);
  ui.potOdds.textContent = `${odds.toFixed(1)}%`; ui.confidence.textContent = confidence;
  let rec = 'CHECK', reason = 'No price to continue; preserve optionality.';
  if (call && edge < -7) { rec = 'FOLD'; reason = `Estimated equity trails the ${odds.toFixed(1)}% break-even price.`; }
  else if (call) { rec = 'CALL'; reason = `Estimated equity clears the ${odds.toFixed(1)}% price, within model uncertainty.`; }
  else if (equity > .64) { rec = 'BET FOR VALUE'; reason = 'Your range advantage can charge weaker holdings.'; }
  else if (equity < .34 && aiProfile().foldRate > .35) { rec = 'BLUFF SELECTIVELY'; reason = 'Vesper has released enough hands for pressure to matter.'; }
  ui.recommendation.textContent = rec; ui.reason.textContent = reason;
  const aggr = Math.min(1, .3 + state.stats.aiRaises / Math.max(1, state.stats.hands) * .55);
  ui.aggressionBar.style.width = `${aggr * 100}%`; ui.tendencyText.textContent = `${profileLabel()} · ${state.stats.hands} hand sample`;
  ui.hand.textContent = state.board.length >= 3 ? bestOfSeven([...state.player, ...state.board]).name.toUpperCase() : 'HIDDEN POTENTIAL';
}
function shake() { if (!state.motion) return; ui.table.classList.remove('shake'); void ui.table.offsetWidth; ui.table.classList.add('shake'); }
function syncMotionControl() {
  const button = $('motionBtn');
  if (reducedMotion.matches) state.motion = false;
  button.disabled = reducedMotion.matches;
  button.textContent = `MOTION: ${state.motion ? 'ON' : 'OFF'}`;
}

async function newHand() {
  ui.result.classList.add('hidden'); ui.table.classList.remove('slow');
  if (state.stacks.player < 20 || state.stacks.ai < 20) state.stacks = { player:1000, ai:1000 };
  state.stats.hands++; state.handDealer = state.dealer; state.deck = shuffle(createDeck()); state.board = []; state.street = 0;
  state.player = [state.deck.pop(), state.deck.pop()]; state.ai = [state.deck.pop(), state.deck.pop()]; state.log = [];
  state.initialStacks = {...state.stacks}; ui.community.replaceChildren(); ui.street.textContent = 'PRE-FLOP'; renderCards(ui.playerCards, state.player); renderCards(ui.aiCards, state.ai, true);
  ui.playerDealer.classList.toggle('visible', state.handDealer === 'player'); ui.aiDealer.classList.toggle('visible', state.handDealer === 'ai');
  const opened = postBlinds(createBettingState({ stacks: state.stacks, dealer: state.handDealer }));
  syncBetting(opened, 30); state.log.push(`${state.handDealer === 'player' ? 'You post' : 'Vesper posts'} small blind`);
  say('The cards are random. Your decisions are not.'); updateInspector();
  if (state.actor === 'ai') await actAI(); else setControls(true);
  state.dealer = other(state.dealer);
}

function setupAtmosphere() {
  const canvas = $('atmosphere'), ctx = canvas.getContext('2d'); let particles = [];
  const resize = () => { canvas.width = innerWidth * devicePixelRatio; canvas.height = innerHeight * devicePixelRatio; particles = Array.from({length:Math.min(90,innerWidth/12)},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*2+.3,v:Math.random()*.18+.04,o:Math.random()*.25})); };
  resize(); addEventListener('resize', resize);
  const draw = () => { ctx.clearRect(0,0,canvas.width,canvas.height); if (state.motion) for (const p of particles) { p.y -= p.v; if(p.y<0)p.y=canvas.height; ctx.fillStyle=`rgba(213,154,69,${p.o})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill(); } requestAnimationFrame(draw); }; draw();
}

document.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => playerAction(btn.dataset.action)));
ui.raiseSlider.addEventListener('input', () => { ui.raiseAmount.textContent = chips(ui.raiseSlider.value); ui.raiseSub.textContent = `Make it ${chips(ui.raiseSlider.value)}`; });
$('startBtn').addEventListener('click', () => { $('startOverlay').classList.add('hidden'); state.started = true; newHand(); });
$('nextHandBtn').addEventListener('click', newHand);
$('soundBtn').addEventListener('click', () => { state.sound = !state.sound; $('soundBtn').textContent = `SOUND: ${state.sound ? 'ON' : 'OFF'}`; tone(440,.1); });
$('motionBtn').addEventListener('click', () => { if (reducedMotion.matches) return; state.motion = !state.motion; syncMotionControl(); });
reducedMotion.addEventListener('change', syncMotionControl);
$('helpBtn').addEventListener('click', () => $('helpDialog').showModal()); $('closeHelp').addEventListener('click', () => $('helpDialog').close());
$('inspectorToggle').addEventListener('click', () => ui.inspector?.classList.toggle('open'));
document.addEventListener('keydown', e => { if (e.target.matches('input,button')) return; const key=e.key.toLowerCase(); if(key==='f')playerAction('fold');if(key==='c')playerAction('check');if(key==='r')playerAction('raise');if(key==='m')$('soundBtn').click(); });
syncMotionControl(); setupAtmosphere(); setControls(false);
