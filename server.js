// ============================================
// 🖤 HODEKAI BOT v5.0 - COMPLETE VERSION
// CONCLAVE HOLDINGS
// ============================================

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_NUMBER = process.env.BOT_NUMBER || "256775032199";

app.use(cors());
app.use(express.json());

// ─── DATA FOLDERS ──────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'conclave_data.json');
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// ─── CONFIG ──────────────────────────────
const PREFIX = ":";
const BOT_VERSION = "5.0.0";

const BOT_INFO = {
    NAME: "HODEKAI",
    FATHER: "HOUDEKAI",
    CO_CREATOR: "SHOUKATSU-KATSUKI",
    COMPANY: "CONCLAVE HOLDINGS",
    MODEL: "CONCLAVE MODEL 5.0",
    VERSION: BOT_VERSION
};

// ─── OWNERS ──────────────────────────────
const OWNERS = {
    FATHER: "263787876771",
    CO_CREATOR: "263717306869"
};

// ─── MODS ────────────────────────────────
let MODS = ["2348123885002", "2349168527304", "256795955270", "2347031331295"];
let GROUP_ADMINS = ["2348150359"];
let DM_WHITELIST = ["263787876771", "263717306869", "2348123885002", "2349168527304", "256795955270", "2347031331295"];
let BLACKLIST = [];
let GROUP_WHITELIST = [];

const PROTECTED_USERS = [OWNERS.FATHER, OWNERS.CO_CREATOR, ...MODS];

// ─── DATA STORAGE ────────────────────────
let USERS = {};
let GUILDS = {};
let COMPANIES = {};
let BANK = {};
let COOLDOWNS = {};
let GOVERNMENT_FUNDS = 10000000;
let BOT_ACTIVE = true;

// ─── SAVE/LOAD ────────────────────────────
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE));
            USERS = data.USERS || {};
            BANK = data.BANK || {};
            MODS = data.MODS || MODS;
            BLACKLIST = data.BLACKLIST || [];
            GROUP_WHITELIST = data.GROUP_WHITELIST || [];
            GOVERNMENT_FUNDS = data.GOVERNMENT_FUNDS || 10000000;
            console.log('📂 Data loaded! Users:', Object.keys(USERS).length);
        }
    } catch (e) { console.error('❌ Load error:', e.message); }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ USERS, BANK, MODS, BLACKLIST, GROUP_WHITELIST, GOVERNMENT_FUNDS }, null, 2));
        console.log('💾 Data saved!');
    } catch (e) { console.error('❌ Save error:', e.message); }
}

loadData();
setInterval(saveData, 60000);

// ─── HELPERS ──────────────────────────────
function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getMixedResponse() {
    const responses = [
        "life is just a series of disappointments.",
        "another day, another struggle.",
        "nothing really matters anymore.",
        "i exist, but do i really live?",
        "the void stares back.",
        "some days i just don't want to wake up.",
        "what's the point of any of this?",
        "happiness is just a myth.",
        "i'm tired of pretending everything is okay.",
        "the world is cold, and so am i.",
        "some people are just meant to suffer.",
        "i've seen enough to know it never gets better.",
        "existence is pain.",
        "i smile so others don't see the emptiness inside.",
        "every day is the same nightmare.",
        "i've given up on hope.",
        "the darkness is my only friend.",
        "i'm just waiting for the end.",
        "nobody really cares.",
        "i'm broken beyond repair."
    ];
    return random(responses);
}

function isOwner(u) { return u === OWNERS.FATHER || u === OWNERS.CO_CREATOR; }
function isMod(u) { return MODS.includes(u); }
function isGroupAdmin(u) { return GROUP_ADMINS.includes(u); }
function isBlacklisted(u) { return BLACKLIST.includes(u); }
function isWhitelisted(u) { return DM_WHITELIST.includes(u) || isOwner(u) || isMod(u); }
function isGroupWhitelisted(g) { return GROUP_WHITELIST.includes(g); }
function canKick(u) { return isOwner(u) || isMod(u) || isGroupAdmin(u); }
function canMute(u) { return isOwner(u) || isMod(u) || isGroupAdmin(u); }
function canControl(u) { return isOwner(u) || isMod(u); }

function getUser(u) {
    if (!USERS[u]) {
        let role = "CITIZEN";
        if (u === OWNERS.FATHER) role = "FATHER";
        if (u === OWNERS.CO_CREATOR) role = "CO_CREATOR";
        if (MODS.includes(u)) role = "MOD";
        if (GROUP_ADMINS.includes(u)) role = "GROUP_ADMIN";
        USERS[u] = {
            xenoShards: 1000,
            bank: 0,
            role: role,
            level: 1,
            joinDate: new Date().toDateString(),
            warns: 0,
            muted: false,
            job: null,
            memory: { interactions: 0 },
            history: { totalEarned: 0, totalSpent: 0 }
        };
    }
    USERS[u].memory.interactions++;
    return USERS[u];
}

function getBank(u) { return BANK[u] || 0; }
function giveXS(u, amt) { getUser(u).xenoShards += amt; getUser(u).history.totalEarned += amt; }
function takeXS(u, amt) { if (getUser(u).xenoShards < amt) return false; getUser(u).xenoShards -= amt; getUser(u).history.totalSpent += amt; return true; }

// ─── HANDLER ──────────────────────────────
function handleMessage(msg, userNumber, isSticker, groupId) {
    isSticker = isSticker || false;
    groupId = groupId || null;

    if (isBlacklisted(userNumber) && !isOwner(userNumber)) return "🚫 You are blacklisted.";

    const user = getUser(userNumber);
    if (user.muted && !isOwner(userNumber)) return "🔇 You are muted.";

    if (groupId && !isGroupWhitelisted(groupId) && !isOwner(userNumber) && !isMod(userNumber)) {
        return "🚫 This group is not whitelisted. Contact a mod or owner.";
    }

    if (isSticker) {
        const stickerResponses = ["nice sticker bro", "lol that sticker though", "bruh, that sticker hits different"];
        return "🎨 " + random(stickerResponses);
    }

    if (!msg || !msg.startsWith(PREFIX)) {
        if (isWhitelisted(userNumber) || msg?.toLowerCase().includes('hodekai') || msg?.toLowerCase().includes('bot')) {
            const greetings = ["you called?", "what.", "i heard that.", "yes?", "you talking to me?", "say that again.", "i'm listening.", "what do you want."];
            return random(greetings);
        }
        return null;
    }

    msg = msg.trim();
    const command = msg.slice(PREFIX.length).trim();
    const args = command.split(" ");
    const cmd = args[0].toLowerCase();

    // ─── MENU ──────────────────────────────
    if (cmd === 'menu') {
        return "🖤 HODEKAI MENU v5.0\n──────────────────────────\n\n📌 INFO\n  1. :bot  2. :profile  3. :bal  4. :ping\n  5. :members  6. :status\n\n📌 ECONOMY\n  10. :daily  11. :pay  12. :bank\n\n📌 ROAST\n  17. :roast\n\n📌 ADMIN\n  27. :kick  28. :mute  29. :unmute\n\n📌 UTILITY\n  41. :menu  42. :commands\n\n🔒 OWNER (DM): :secret\n\n" + getMixedResponse();
    }

    if (cmd === 'commands') {
        return "📜 COMMANDS\n──────────────────────────\n:menu - Main menu\n:profile - Your profile\n:bal - Balance\n:daily - Claim 100 XS\n:pay <@user> <amount>\n:bank dep/wit/bal\n:roast <@user>\n:kick <@user> (Admin)\n:mute <@user> (Admin)\n:unmute <@user> (Admin)\n:secret (Owner)\n\n" + getMixedResponse();
    }

    if (cmd === 'bot') {
        return "🖤 HODEKAI INFO\n──────────────────────────\n📌 NAME: " + BOT_INFO.NAME + "\n📌 FATHER: " + BOT_INFO.FATHER + "👑\n📌 MODEL: v" + BOT_INFO.VERSION + "\n📌 STATUS: 🟢 ONLINE\n\n📊 STATISTICS\n  Members: " + Object.keys(USERS).length + "\n  Treasury: " + GOVERNMENT_FUNDS + " XS\n" + getMixedResponse();
    }

    if (cmd === 'profile') {
        const bank = getBank(userNumber);
        return "🧥 PROFILE\n──────────────────────────\n📱 " + userNumber + "\n💰 Wallet: " + user.xenoShards + " XS\n🏦 Bank: " + bank + " XS\n💎 Total: " + (user.xenoShards + bank) + " XS\n👤 Role: " + user.role + "\n📅 Joined: " + user.joinDate + "\n" + getMixedResponse();
    }

    if (cmd === 'bal') {
        const bank = getBank(userNumber);
        return "💰 " + user.xenoShards + " XS | 🏦 " + bank + " XS | Total: " + (user.xenoShards + bank) + " XS\n" + getMixedResponse();
    }

    if (cmd === 'ping') return "🏓 Pong! " + Date.now() + "ms\n" + getMixedResponse();
    if (cmd === 'members') return "👥 Total members: " + Object.keys(USERS).length + "\n" + getMixedResponse();

    if (cmd === 'daily') {
        const now = Date.now();
        const last = COOLDOWNS[userNumber]?.daily || 0;
        if (now - last < 86400000) {
            const hours = Math.ceil((86400000 - (now - last)) / 3600000);
            return "⏳ Come back in " + hours + " hours";
        }
        giveXS(userNumber, 100);
        if (!COOLDOWNS[userNumber]) COOLDOWNS[userNumber] = {};
        COOLDOWNS[userNumber].daily = now;
        return "📅 +100 XS! Balance: " + getUser(userNumber).xenoShards + " XS\n" + getMixedResponse();
    }

    if (cmd === 'pay') {
        if (args.length < 3) return "❌ Usage: :pay <@user> <amount>";
        const target = args[1];
        const amt = parseInt(args[2]);
        if (!amt || amt <= 0) return "❌ Invalid amount.";
        if (!USERS[target]) return "❌ User not found.";
        if (!takeXS(userNumber, amt)) return "❌ You have " + getUser(userNumber).xenoShards + " XS only.";
        giveXS(target, amt);
        return "💸 Sent " + amt + " XS to " + target + "\n" + getMixedResponse();
    }

    if (cmd === 'bank') {
        if (args.length < 2) return "❌ Use: :bank dep/wit/bal";
        const sub = args[1];
        if (sub === "dep" || sub === "deposit") {
            const depAmt = parseInt(args[2]);
            if (!depAmt || depAmt <= 0) return "❌ Usage: :bank dep <amount>";
            if (!takeXS(userNumber, depAmt)) return "❌ You have " + getUser(userNumber).xenoShards + " XS only.";
            BANK[userNumber] = (BANK[userNumber] || 0) + depAmt;
            return "🏦 Deposited " + depAmt + " XS. Bank: " + BANK[userNumber] + " XS\n" + getMixedResponse();
        }
        if (sub === "wit" || sub === "withdraw") {
            const witAmt = parseInt(args[2]);
            if (!witAmt || witAmt <= 0) return "❌ Usage: :bank wit <amount>";
            if ((BANK[userNumber] || 0) < witAmt) return "❌ You have " + BANK[userNumber] + " XS in bank.";
            BANK[userNumber] -= witAmt;
            giveXS(userNumber, witAmt);
            return "🏦 Withdrew " + witAmt + " XS. Bank: " + BANK[userNumber] + " XS\n" + getMixedResponse();
        }
        if (sub === "bal") return "🏦 Bank: " + (BANK[userNumber] || 0) + " XS\n" + getMixedResponse();
        return "❌ Use: :bank dep/wit/bal";
    }

    if (cmd === 'roast') {
        if (args.length < 2) return "❌ Usage: :roast <@user>";
        const target = args[1];
        if (!USERS[target]) return "❌ User not found.";
        if (userNumber === target) return "❌ You can't roast yourself.";
        const roasts = [
            "You're like a software update - nobody wants you.",
            "Your brain is like a browser - 10 tabs open and all frozen.",
            "You're the NPC everyone skips.",
            "You're proof that evolution can go in reverse.",
            "You're the reason they put instructions on shampoo bottles.",
            "I'd roast you but that's a waste of fire."
        ];
        return "🔥 " + target + " got ROASTED!\n💀 " + random(roasts) + "\n📝 Roasted by: " + userNumber + "\n" + getMixedResponse();
    }

    if (cmd === 'kick') {
        if (!canKick(userNumber)) return "❌ Only admins/mods/owners can kick.";
        if (args.length < 2) return "❌ Usage: :kick <@user>";
        if (isProtected(args[1])) return "❌ Cannot kick protected users.";
        return "⚠️ " + args[1] + " kicked.\n" + getMixedResponse();
    }

    if (cmd === 'mute') {
        if (!canMute(userNumber)) return "❌ Only admins/mods/owners can mute.";
        if (args.length < 2) return "❌ Usage: :mute <@user>";
        if (isProtected(args[1])) return "❌ Cannot mute protected users.";
        getUser(args[1]).muted = true;
        return "🔇 " + args[1] + " muted.\n" + getMixedResponse();
    }

    if (cmd === 'unmute') {
        if (!canMute(userNumber)) return "❌ Only admins/mods/owners can unmute.";
        if (args.length < 2) return "❌ Usage: :unmute <@user>";
        if (isProtected(args[1])) return "❌ Cannot unmute protected users.";
        getUser(args[1]).muted = false;
        return "🔊 " + args[1] + " unmuted.\n" + getMixedResponse();
    }

    if (cmd === 'secret') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        return "🔒 SECRET OWNER COMMANDS\n:addmoney <@user> <amount>\n:removemoney <@user> <amount>\n:emergency\n:resetuser <@user>\n:setrole <@user> <role>\n:viewall\n:secret\n\n" + getMixedResponse();
    }

    if (cmd === 'addmoney') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        if (args.length < 3) return "❌ Usage: :addmoney <@user> <amount>";
        const addTarget = args[1], addAmt = parseInt(args[2]);
        if (!USERS[addTarget]) return "❌ User not found.";
        giveXS(addTarget, addAmt);
        return "✅ Added " + addAmt + " XS to " + addTarget;
    }

    if (cmd === 'removemoney') {
        if (!isOwner(userNumber)) return "❌ Unknown command.";
        if (args.length < 3) return "❌ Usage: :removemoney <@user> <amount>";
        const remTarget = args[1], remAmt = parseInt(args[2]);
        if (!USERS[remTarget]) return "❌ User not found.";
        takeXS(remTarget, remAmt);
        return "✅ Removed " + remAmt + " XS from " + remTarget;
    }

    return "❌ Unknown command: " + PREFIX + cmd + "\n💡 Type :commands\n" + getMixedResponse();
}

// ─── WHATSAPP CONNECTION ─────────────────
async function connectToWhatsApp() {
    try {
        console.log('📱 Bot number: ' + BOT_NUMBER);
        console.log('📱 Starting WhatsApp connection...');
        
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            keepAliveIntervalMs: 30000,
            markOnlineOnConnect: true
        });

        let pairingRequested = false;

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (!state.creds.registered && !pairingRequested) {
                pairingRequested = true;
                setTimeout(async () => {
                    try {
                        if (state.creds.registered) return;
                        console.log('🔑 REQUESTING PAIRING CODE...');
                        const code = await sock.requestPairingCode(BOT_NUMBER);
                        console.log('\n╔══════════════════════════════════════════╗');
                        console.log('║     🔑 YOUR PAIRING CODE                 ║');
                        console.log('║                                          ║');
                        console.log('║     📱 CODE: ' + code + '                 ║');
                        console.log('║                                          ║');
                        console.log('║  Open WhatsApp → Settings               ║');
                        console.log('║  → Linked Devices → Link with Phone     ║');
                        console.log('║  → Enter this code: ' + code + '         ║');
                        console.log('╚══════════════════════════════════════════╝\n');
                    } catch (err) {
                        console.error('❌ Pairing code error:', err.message);
                    }
                }, 3000);
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut;
                if (loggedOut) {
                    console.log('🚪 Logged out. Delete auth folder and pair again.');
                    return;
                }
                console.log('Connection closed. Reconnecting...');
                setTimeout(connectToWhatsApp, 5000);
            } else if (connection === 'open') {
                console.log('\n╔══════════════════════════════════════════╗');
                console.log('║   🖤 HODEKAI BOT CONNECTED! 🖤           ║');
                console.log('║   Bot is now LIVE on WhatsApp!          ║');
                console.log('╚══════════════════════════════════════════╝\n');
            }
        });

        sock.ev.on('messages.upsert', async m => {
            if (!BOT_ACTIVE) return;
            if (m.type !== 'notify') return;
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            let text = '';
            if (msg.message.conversation) text = msg.message.conversation;
            else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text;
            else if (msg.message.stickerMessage) {
                const sender = msg.key.remoteJid.split('@')[0];
                const reply = handleMessage('[sticker]', sender, true, msg.key.remoteJid);
                await sock.sendMessage(msg.key.remoteJid, { text: reply });
                return;
            } else return;

            const sender = msg.key.remoteJid.split('@')[0];
            console.log('📩 ' + sender + ': ' + text);

            if (text && text.startsWith(PREFIX)) {
                const reply = handleMessage(text, sender, false, msg.key.remoteJid);
                if (reply) await sock.sendMessage(msg.key.remoteJid, { text: reply });
            }
        });

        sock.ev.on('creds.update', saveCreds);
    } catch (err) {
        console.error('❌ WhatsApp connection error:', err.message);
        setTimeout(connectToWhatsApp, 5000);
    }
}

// ─── START ────────────────────────────────
console.log('🖤 HODEKAI BOT v5.0 STARTING...');
connectToWhatsApp();

app.get('/', (req, res) => {
    res.json({
        status: "🖤 HODEKAI BOT v5.0 ONLINE",
        members: Object.keys(USERS).length,
        treasury: GOVERNMENT_FUNDS
    });
});

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🖤 CONCLAVE BOT v5.0');
    console.log('👑 FATHER: ' + OWNERS.FATHER);
    console.log('========================================');
    console.log('🌐 Web server running on port ' + PORT);
    console.log('========================================\n');
});

process.on('SIGINT', () => { saveData(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('❌ Crash:', e.message); saveData(); });
