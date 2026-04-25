/**

Lion Telegram Mini App — Node.js Backend (FIXED) */


const express = require('express'); const crypto  = require('crypto'); const cors    = require('cors'); const path    = require('path');

const app     = express(); const PORT    = process.env.PORT || 3000; const BOT_TOKEN = process.env.BOT_TOKEN || '8760146355:AAHWhPb1QMO7K40-TUpdFz3ejy78M1NxeqM';

const users = new Map(); const referrals = new Map();

const INITIAL_BALANCE = 1000; const LION_USD = 0.0003;

const TASKS = [ { id:'ref5',   label:'Invite 5 Friends',    reward:1200,  req:5   }, { id:'ref10',  label:'Invite 10 Friends',   reward:2200,  req:10  }, { id:'ref25',  label:'Invite 25 Friends',   reward:4000,  req:25  }, { id:'ref50',  label:'Invite 50 Friends',   reward:25000, req:50  }, { id:'ref100', label:'Invite 100 Friends',  reward:60000, req:100 }, ];

app.use(cors()); app.use(express.json()); app.use(express.static(path.join(__dirname, 'public')));

function verifyTelegramData(initData) { if (!initData || BOT_TOKEN === '8760146355:AAHWhPb1QMO7K40-TUpdFz3ejy78M1NxeqM') return true;

const params = new URLSearchParams(initData); const hash   = params.get('hash'); params.delete('hash');

const dataCheckString = Array.from(params.entries()) .sort(([a], [b]) => a.localeCompare(b)) .map(([k, v]) => ${k}=${v}) .join('\n');

const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest(); const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

return computedHash === hash; }

function parseUser(initData) { try { const params = new URLSearchParams(initData); return JSON.parse(params.get('user') || '{}'); } catch { return {}; } }

function auth(req, res, next) { const initData = req.headers['x-telegram-init-data'] || ''; if (!verifyTelegramData(initData)) { return res.status(401).json({ error: 'Unauthorized' }); } const tgUser = parseUser(initData); req.uid   = String(tgUser.id || req.headers['x-dev-uid'] || 'dev-user'); req.tgUser = tgUser; next(); }

function getOrCreateUser(uid, tgUser = {}) { if (!users.has(uid)) { users.set(uid, { uid, name: tgUser.first_name || 'Anonymous', username: tgUser.username || '', balance: INITIAL_BALANCE, energy: 500, energyMax: 500, tapRate: 1, completedTasks: [], createdAt: Date.now(), lastSeen: Date.now(), lastEnergySave: Date.now(), }); referrals.set(uid, new Set()); } return users.get(uid); }

function regenerateEnergy(user) { const now = Date.now(); const secondsElapsed = (now - user.lastEnergySave) / 1000; user.energy = Math.min(user.energyMax, user.energy + Math.floor(secondsElapsed)); user.lastEnergySave = now; }

app.get('/api/user', auth, (req, res) => { const user = getOrCreateUser(req.uid, req.tgUser); regenerateEnergy(user); user.lastSeen = Date.now();

const friendCount = referrals.get(req.uid)?.size || 0; res.json({ uid: user.uid, name: user.name, balance: user.balance, energy: user.energy, energyMax: user.energyMax, tapRate: user.tapRate, completedTasks: user.completedTasks, friends: friendCount, usdValue: (user.balance * LION_USD).toFixed(4), tasks: TASKS, }); });

app.post('/api/referral', auth, (req, res) => { const { referrerId } = req.body; const uid = req.uid;

if (!referrerId || referrerId === uid) { return res.json({ ok: false, error: 'Invalid referrer' }); }

const refSet = referrals.get(referrerId); if (!refSet) return res.json({ ok: false, error: 'Referrer not found' });

if (refSet.has(uid)) { return res.json({ ok: false, error: 'Already referred' }); }

refSet.add(uid);

const newUser = getOrCreateUser(uid, req.tgUser); newUser.balance += 100;

const referrer = users.get(referrerId); if (referrer) referrer.balance += 50;

res.json({ ok: true, friendCount: refSet.size }); });

app.get('/api/referral-link', auth, (req, res) => { const uid = req.uid;

// ✅ FIXED LINE (was using wrong variable userId) const link = https://t.me/Lion839bot?start=${uid};

const friendCount = referrals.get(uid)?.size || 0; res.json({ link, friendCount }); });

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => { console.log(Server running on port ${PORT}); });