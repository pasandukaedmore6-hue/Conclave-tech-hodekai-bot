// ============================================
// 🖤 HODEKAI BOT v5.0 - PEAK EDITION
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

// ─── FOLDERS ──────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'conclave_data.json');
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys_v5');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

// ─── CONFIG ──────────────────────────────
const PREFIX = ":";
const BOT_INFO = {
    NAME: "HODEKAI",
    FATHER: "HOUDEKAI",
    CO_CREATOR: "SHOUKATSU-KATSUKI",
    COMPANY: "CONCLAVE HOLDINGS",
    VERSION: "5.0.0"
};

// ─── OWNERS ──────────────────────────────
const OWNERS = {
    FATHER: "263787876771",
    CO_CREATOR: "263717306869"
};

let MODS = ["2348123885002", "2349168527304", "256795955270", "2347031331295"];
let BLACKLIST = [];
let GROUP_WHITELIST = [];

const PROTECTED_USERS = [OWNERS.FATHER, OWNERS.CO_CREATOR, ...MODS];

// ─── DM WHITELIST (Only these can DM the bot) ──
const DM_WHITELIST = [
    OWNERS.FATHER,
    OWNERS.CO_CREATOR,
    ...MODS
];

// ─── DATA ────────────────────────────────
let USERS = {};
let BANK = {};
let COOLDOWNS = {};
let GUILDS = {};
let COMPANIES = {};
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
            GUILDS = data.GUILDS || {};
            COMPANIES = data.COMPANIES || {};
            GOVERNMENT_FUNDS = data.GOVERNMENT_FUNDS || 10000000;
            console.log('📂 Data loaded! Users:', Object.keys(USERS).length);
        }
    } catch (e) { console.error('❌ Load error:', e.message); }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ USERS, BANK, MODS, BLACKLIST, GROUP_WHITELIST, GUILDS, COMPANIES, GOVERNMENT_FUNDS }, null, 2));
        console.log('💾 Data saved!');
    } catch (e) { console.error('❌ Save error:', e.message); }
}

loadData();
setInterval(saveData, 60000);

// ─── HELPERS ──────────────────────────────
function random(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function cleanNumber(str) {
    if (!str) return "";
    return str.replace(/[^0-9]/g, "");
}

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
        "existence is pain.",
        "i smile so others don't see the emptiness inside.",
        "every day is the same nightmare.",
        "i've given up on hope.",
        "the darkness is my only friend.",
        "nobody really cares.",
        "i'm broken beyond repair."
    ];
    return random(responses);
}

function isOwner(u) { return u === OWNERS.FATHER || u === OWNERS.CO_CREATOR; }
function isMod(u) { return MODS.includes(u); }
function isBlacklisted(u) { return BLACKLIST.includes(u); }
function isProtected(u) { return PROTECTED_USERS.includes(u); }
function isDMAllowed(u) { return DM_WHITELIST.includes(u); }

function getUser(u) {
    if (!USERS[u]) {
        let role = "CITIZEN";
        if (u === OWNERS.FATHER) role = "FATHER";
        if (u === OWNERS.CO_CREATOR) role = "CO_CREATOR";
        if (MODS.includes(u)) role = "MOD";
        USERS[u] = {
            xenoShards: 1000,
            bank: 0,
            role: role,
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

// ─── WHATSAPP ADMIN DETECTION ─────────────
async function isWhatsAppAdmin(sock, groupId, userId) {
    try {
        const metadata = await sock.groupMetadata(groupId);
        const participant = metadata.participants.find(p => p.id.split('@')[0].split(':')[0] === userId);
        if (!participant) return false;
        return participant.admin === 'admin' || participant.admin === 'superadmin';
    } catch (e) { return false; }
}

// ─── HUMAN RESPONSES ──────────────────────
function getHumanResponse(msg) {
    const lower = msg.toLowerCase().trim();

    if (/^(hi|hello|hey|yo|sup|hiya|heya|wassup|what's up)$/i.test(lower)) {
        return random([
            "tch. you're here again.",
            "what do you want.",
            "oh. it's you.",
            "hey. whatever.",
            "sup.",
            "yo.",
            "here we go again.",
            "let's get this over with."
        ]);
    }

    if (/\b(hi|hello|hey|yo)\b/i.test(lower)) {
        return random(["hey.", "hello.", "sup.", "you called?", "what."]);
    }

    if (lower.includes('how are you') || lower.includes('how you doing') || lower.includes('how far')) {
        return random([
            "*sigh* tired.",
            "could be better.",
            "same as always.",
            "not great.",
            "idk man.",
            "existential crisis. you?"
        ]);
    }

    if (lower.includes('hodekai') || lower.includes('bot')) {
        return random([
            "you called?",
            "what.",
            "i heard that.",
            "yes?",
            "you talking to me?",
            "i'm listening."
        ]);
    }

    if (/\b(bye|goodbye|later|peace)\b/i.test(lower)) {
        return random(["later.", "finally. peace.", "bye.", "see you."]);
    }

    if (lower.includes('thanks') || lower.includes('thank you')) {
        return random(["mhm.", "sure.", "whatever.", "np."]);
    }

    if (/\b(love|luv)\b/i.test(lower) || lower.includes('❤️')) {
        return random(["💀", "too much.", "i'm a bot, remember?", "stop.", "fr?"]);
    }

    if (lower.includes('joke') || lower.includes('funny')) {
        return random([
            "Why do bots never get lost? They follow the path.",
            "I told my bot a joke... it didn't process.",
            "What's a bot's favorite drink? Java.",
            "Why don't bots play cards? Too many cheats.",
            "What do you call a bot that tells jokes? A pun-ishing processor."
        ]);
    }

    return null;
}

// ─── UNICODE BOXES ────────────────────────
function boxMenu() {
    return `╔══════════════════════════════════╗
║   🖤 HODEKAI MENU v5.0           ║
╠══════════════════════════════════╣
║                                  ║
║  📌 INFO                         ║
║  ─────────────────               ║
║  :bot      :profile  :bal        ║
║  :ping     :members  :status     ║
║  :modlist                        ║
║                                  ║
║  💰 ECONOMY                      ║
║  ─────────────────               ║
║  :daily    :pay      :bank       ║
║                                  ║
║  💼 JOBS                         ║
║  ─────────────────               ║
║  :govjob   :work                 ║
║  :myjob    :resign               ║
║                                  ║
║  😈 FUN                          ║
║  ─────────────────               ║
║  :roast    :compliment           ║
║                                  ║
║  🎵 MUSIC                        ║
║  ─────────────────               ║
║  :play <song>                    ║
║  :musiclist                      ║
║                                  ║
║  📦 BOXES                        ║
║  ─────────────────               ║
║  :boxes    :all                  ║
║  :economy  :job                  ║
║  :commands                       ║
║                                  ║
║  🛡️ ADMIN (Mods/Admins/Owners)   ║
║  ─────────────────               ║
║  :kick     :mute     :unmute     ║
║  :warn     :close    :open       ║
║                                  ║
║  🔒 OWNER ONLY                   ║
║  ─────────────────               ║
║  :secret   :mod      :addmoney   ║
║  :removemoney  :viewall          ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxBotInfo() {
    return `╔══════════════════════════════════╗
║      🖤 HODEKAI INFO             ║
╠══════════════════════════════════╣
║                                  ║
║  📌 NAME: ${BOT_INFO.NAME}
║  📌 FATHER: ${BOT_INFO.FATHER} 👑
║  📌 CO-CREATOR: ${BOT_INFO.CO_CREATOR} 🏆
║  📌 MODEL: v${BOT_INFO.VERSION}
║  📌 STATUS: 🟢 ONLINE
║                                  ║
╠══════════════════════════════════╣
║  📊 STATISTICS                   ║
║  ─────────────────               ║
║  👥 Members: ${Object.keys(USERS).length}
║  ⚡ Mods: ${MODS.length}
║  🏰 Guilds: ${Object.keys(GUILDS).length}
║  💼 Companies: ${Object.keys(COMPANIES).length}
║  🏛️ Treasury: ${GOVERNMENT_FUNDS} XS
║                                  ║
╠══════════════════════════════════╣
║  🎯 COMMANDS                     ║
║  ─────────────────               ║
║  :menu  - Full menu              ║
║  :commands - All commands        ║
║  :profile - Your profile         ║
║  :bal  - Balance                 ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxCommands() {
    return `╔══════════════════════════════════╗
║   📜 COMPLETE COMMAND LIST       ║
╠══════════════════════════════════╣
║                                  ║
║  📌 INFO                         ║
║  :bot :profile :bal :ping        ║
║  :members :status :modlist       ║
║                                  ║
║  💰 ECONOMY                      ║
║  :daily :pay :bank               ║
║  :bank dep/wit/bal               ║
║                                  ║
║  💼 JOBS                         ║
║  :govjob :work :myjob :resign    ║
║                                  ║
║  😈 FUN                          ║
║  :roast :compliment              ║
║                                  ║
║  🎵 MUSIC                        ║
║  :play <song> :musiclist         ║
║                                  ║
║  📦 BOXES                        ║
║  :menu :boxes :all :economy      ║
║                                  ║
║  🛡️ ADMIN                        ║
║  :kick :mute :unmute :warn       ║
║  :close :open                    ║
║                                  ║
║  ⚡ MOD (Owners)                 ║
║  :mod add/remove/list            ║
║                                  ║
║  🔒 OWNER                        ║
║  :secret :addmoney :removemoney  ║
║  :viewall :resetuser :setrole    ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxProfile(user, sender, isAdmin) {
    const bank = getBank(sender);
    const roleEmoji = isOwner(sender) ? '👑 ' + user.role :
                      isMod(sender) ? '⚡ MOD' :
                      isAdmin ? '🛡️ ADMIN' : '👤 ' + user.role;
    return `╔══════════════════════════════════╗
║     🧥 YOUR PROFILE              ║
╠══════════════════════════════════╣
║                                  ║
║  📱 ${sender}
║  👤 Role: ${roleEmoji}
║  📅 Joined: ${user.joinDate}
║                                  ║
║  💰 Wallet: ${user.xenoShards} XS
║  🏦 Bank: ${bank} XS
║  💎 Total: ${user.xenoShards + bank} XS
║                                  ║
║  ⚠️ Warns: ${user.warns}
║  🔇 Muted: ${user.muted ? 'Yes' : 'No'}
║  💼 Job: ${user.job ? user.job.title : 'None'}
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxBalance(user, sender) {
    const bank = getBank(sender);
    return `╔══════════════════════════════════╗
║      💰 YOUR BALANCE             ║
╠══════════════════════════════════╣
║                                  ║
║  💵 Wallet: ${user.xenoShards} XS
║  🏦 Bank: ${bank} XS
║  ─────────────────────           ║
║  💎 Total: ${user.xenoShards + bank} XS
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxStatus() {
    return `╔══════════════════════════════════╗
║     📊 SYSTEM STATUS             ║
╠══════════════════════════════════╣
║                                  ║
║  🟢 STATUS: ONLINE
║  👥 MEMBERS: ${Object.keys(USERS).length}
║  ⚡ MODS: ${MODS.length}
║  🏰 GUILDS: ${Object.keys(GUILDS).length}
║  💼 COMPANIES: ${Object.keys(COMPANIES).length}
║  🏛️ TREASURY: ${GOVERNMENT_FUNDS} XS
║                                  ║
║  📱 WHATSAPP: CONNECTED
║  🎮 VERSION: v${BOT_INFO.VERSION}
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxModList() {
    let output = `╔══════════════════════════════════╗
║     ⚡ POWER HIERARCHY           ║
╠══════════════════════════════════╣
║                                  ║
║  👑 OWNERS                       ║
║  ─────────────────               ║
║  1. ${OWNERS.FATHER}
║     (FATHER)
║  2. ${OWNERS.CO_CREATOR}
║     (CO-CREATOR)
║                                  ║
║  ⚡ MODS (${MODS.length})                  ║
║  ─────────────────               ║
`;
    MODS.forEach((mod, i) => {
        output += `║  ${i + 1}. ${mod}
║     (MOD)
`;
    });
    output += `║                                  ║
║  🛡️ WHATSAPP ADMINS              ║
║  ─────────────────               ║
║  (Auto-detected per group)       ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
    return output;
}

function boxEconomy() {
    return `╔══════════════════════════════════╗
║     💰 ECONOMY BOX               ║
╠══════════════════════════════════╣
║                                  ║
║  📌 DAILY                        ║
║  :daily - Claim 100 XS/day       ║
║                                  ║
║  📌 BALANCE                      ║
║  :bal - Check wallet + bank      ║
║                                  ║
║  📌 TRANSFER                     ║
║  :pay <number> <amount>          ║
║                                  ║
║  📌 BANK                         ║
║  :bank dep <amount>              ║
║  :bank wit <amount>              ║
║  :bank bal                       ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxJob() {
    return `╔══════════════════════════════════╗
║     💼 JOB SYSTEM                ║
╠══════════════════════════════════╣
║                                  ║
║  📌 COMMANDS                     ║
║  ─────────────────               ║
║  :govjob - Get a job             ║
║  :work - Work your shift         ║
║  :myjob - View your job          ║
║  :resign - Quit your job         ║
║                                  ║
║  📌 JOB TIERS                    ║
║  ─────────────────               ║
║  🔵 Government Jobs (Low)        ║
║  🟢 Professional (Middle)        ║
║  🟣 Special (Elite)              ║
║                                  ║
║  💡 Society assigns based on:    ║
║  • Your level                    ║
║  • Money earned                  ║
║  • Work shifts                   ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxBoxes() {
    return `╔══════════════════════════════════╗
║     📦 ALL AVAILABLE BOXES       ║
╠══════════════════════════════════╣
║                                  ║
║  1.  :menu      Main menu        ║
║  2.  :bot       Bot info         ║
║  3.  :commands  All commands     ║
║  4.  :all       Master list      ║
║  5.  :boxes     This box         ║
║  6.  :economy   Economy box      ║
║  7.  :job       Job box          ║
║  8.  :status    Status box       ║
║  9.  :modlist   Power hierarchy  ║
║  10. :musiclist Music library    ║
║  11. :profile   Your profile     ║
║  12. :bal       Your balance     ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

function boxAll() {
    return `╔══════════════════════════════════╗
║   🖤 CONCLAVE MASTER LIST        ║
╠══════════════════════════════════╣
║                                  ║
║  📌 INFO                         ║
║  :bot :profile :bal :ping        ║
║  :members :status :modlist       ║
║                                  ║
║  💰 ECONOMY                      ║
║  :daily :pay :bank               ║
║                                  ║
║  💼 JOBS                         ║
║  :govjob :work :myjob :resign    ║
║                                  ║
║  😈 FUN                          ║
║  :roast :compliment              ║
║                                  ║
║  🎵 MUSIC                        ║
║  :play :musiclist                ║
║                                  ║
║  📦 BOXES                        ║
║  :menu :boxes :all :economy      ║
║                                  ║
║  🛡️ ADMIN                        ║
║  :kick :mute :unmute :warn       ║
║  :close :open                    ║
║                                  ║
║  ⚡ MOD                          ║
║  :mod add/remove/list            ║
║                                  ║
║  🔒 OWNER                        ║
║  :secret :addmoney :removemoney  ║
║  :viewall :resetuser :setrole    ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
}

// ─── MAIN HANDLER ────────────────────────
async function handleMessage(msg, sender, isSticker, groupId, sock, contextInfo) {
    if (isBlacklisted(sender) && !isOwner(sender)) return "🚫 You are blacklisted.";

    const user = getUser(sender);
    if (user.muted && !isOwner(sender)) return "🔇 You are muted.";

    // ─── DM RESTRICTION ──────────────
    // Only owners + mods can DM the bot
    if (!groupId && !isDMAllowed(sender)) {
        console.log('🚫 Blocked DM from:', sender);
        return "🚫 Only MODS and OWNERS can DM the bot. Contact an admin for help.";
    }

    // ─── STICKERS ──────────────────────
    if (isSticker) {
        return "🎨 " + random([
            "nice sticker bro", "lol that sticker though",
            "bruh, that sticker hits different", "that's a sticker alright",
            "why though? 😂", "cool sticker, fr", "W sticker"
        ]);
    }

    // ─── CHECK IF USER IS WHATSAPP ADMIN ──
    let isAdmin = false;
    if (groupId) {
        isAdmin = await isWhatsAppAdmin(sock, groupId, sender);
    }

    // ─── NON-COMMAND MESSAGES ──────────
    if (!msg || !msg.startsWith(PREFIX)) {
        if (groupId) {
            const humanReply = getHumanResponse(msg);
            if (humanReply) return humanReply;
            return null;
        }
        return getHumanResponse(msg) || getMixedResponse();
    }

    // ─── COMMANDS ──────────────────────
    const command = msg.slice(PREFIX.length).trim();
    const args = command.split(/\s+/);
    const cmd = args[0].toLowerCase();

    // ═══════════════════════════════════
    // 📌 INFO COMMANDS
    // ═══════════════════════════════════

    if (cmd === 'menu') return boxMenu();
    if (cmd === 'commands' || cmd === 'help') return boxCommands();
    if (cmd === 'bot') return boxBotInfo();
    if (cmd === 'profile') return boxProfile(user, sender, isAdmin);
    if (cmd === 'bal') return boxBalance(user, sender);
    if (cmd === 'status') return boxStatus();
    if (cmd === 'modlist') return boxModList();
    if (cmd === 'boxes') return boxBoxes();
    if (cmd === 'all') return boxAll();
    if (cmd === 'economy') return boxEconomy();
    if (cmd === 'job') return boxJob();

    if (cmd === 'ping') return "🏓 Pong! `" + Date.now() + "`\n" + getMixedResponse();
    if (cmd === 'members') {
        return `╔══════════════════════════════════╗
║     👥 CONCLAVE MEMBERS          ║
╠══════════════════════════════════╣
║  👥 Total Members: ${Object.keys(USERS).length}
║  ⚡ Mods: ${MODS.length}
║  👑 Owners: 2
╚══════════════════════════════════╝

${getMixedResponse()}`;
    }

    // ═══════════════════════════════════
    // 💰 ECONOMY
    // ═══════════════════════════════════

    if (cmd === 'daily') {
        const now = Date.now();
        const last = COOLDOWNS[sender]?.daily || 0;
        if (now - last < 86400000) {
            const hours = Math.ceil((86400000 - (now - last)) / 3600000);
            return "⏳ Come back in " + hours + " hours";
        }
        giveXS(sender, 100);
        if (!COOLDOWNS[sender]) COOLDOWNS[sender] = {};
        COOLDOWNS[sender].daily = now;
        return "📅 +100 XS!\n💰 Balance: " + getUser(sender).xenoShards + " XS\n" + getMixedResponse();
    }

    if (cmd === 'pay') {
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        const amt = parseInt(args[2]);
        if (!target || !amt || amt <= 0) return "❌ Usage: :pay <number> <amount>";
        if (!USERS[target]) getUser(target);
        if (!takeXS(sender, amt)) return "❌ You have " + getUser(sender).xenoShards + " XS only.";
        giveXS(target, amt);
        return "💸 Sent " + amt + " XS to " + target + "\n" + getMixedResponse();
    }

    if (cmd === 'bank') {
        if (args.length < 2) return "❌ Use: :bank dep/wit/bal";
        const sub = args[1];
        if (sub === "dep" || sub === "deposit") {
            const amt = parseInt(args[2]);
            if (!amt || amt <= 0) return "❌ Usage: :bank dep <amount>";
            if (!takeXS(sender, amt)) return "❌ You have " + getUser(sender).xenoShards + " XS only.";
            BANK[sender] = (BANK[sender] || 0) + amt;
            return "🏦 Deposited " + amt + " XS\n💼 Bank: " + BANK[sender] + " XS\n" + getMixedResponse();
        }
        if (sub === "wit" || sub === "withdraw") {
            const amt = parseInt(args[2]);
            if (!amt || amt <= 0) return "❌ Usage: :bank wit <amount>";
            if ((BANK[sender] || 0) < amt) return "❌ You have " + BANK[sender] + " XS in bank.";
            BANK[sender] -= amt;
            giveXS(sender, amt);
            return "🏦 Withdrew " + amt + " XS\n💰 Wallet: " + getUser(sender).xenoShards + " XS\n" + getMixedResponse();
        }
        if (sub === "bal") return "🏦 Bank: " + (BANK[sender] || 0) + " XS\n" + getMixedResponse();
        return "❌ Use: :bank dep/wit/bal";
    }

    // ═══════════════════════════════════
    // 💼 JOBS
    // ═══════════════════════════════════

    if (cmd === 'govjob') {
        if (user.job) return "❌ You already have a job! Type :myjob";
        const jobs = [
            { title: "🗑️ Garbage Collector", salary: 50 },
            { title: "🧹 Street Sweeper", salary: 45 },
            { title: "🌳 Gardener", salary: 55 },
            { title: "📦 Warehouse Worker", salary: 60 },
            { title: "🚗 Courier", salary: 65 },
            { title: "🍳 Cook", salary: 70 },
            { title: "🧑‍🏫 Teacher", salary: 80 },
            { title: "🚑 Medic", salary: 90 }
        ];
        const job = random(jobs);
        user.job = { title: job.title, salary: job.salary, shifts: 0, lastWork: 0 };
        return `╔══════════════════════════════════╗
║     🏛️ JOB ASSIGNED              ║
╠══════════════════════════════════╣
║  📋 Job: ${job.title}
║  💰 Salary: ${job.salary} XS/shift
║  💡 Type :work to earn!
╚══════════════════════════════════╝

${getMixedResponse()}`;
    }

    if (cmd === 'work') {
        if (!user.job) return "❌ No job! Type :govjob.";
        const now = Date.now();
        if (now - (user.job.lastWork || 0) < 1200000) {
            const remain = Math.ceil((1200000 - (now - (user.job.lastWork || 0))) / 60000);
            return "⏳ Wait " + remain + " minutes.";
        }
        const earnings = user.job.salary;
        giveXS(sender, earnings);
        user.job.shifts = (user.job.shifts || 0) + 1;
        user.job.lastWork = now;
        return "✅ WORK COMPLETED!\n💰 Net: " + earnings + " XS\n📈 Shifts: " + user.job.shifts + "\n" + getMixedResponse();
    }

    if (cmd === 'myjob') {
        if (!user.job) return "❌ No job. Type :govjob";
        return "💼 YOUR JOB\n📋 " + user.job.title + "\n💰 " + user.job.salary + " XS/shift\n📊 Shifts: " + (user.job.shifts || 0) + "\n" + getMixedResponse();
    }

    if (cmd === 'resign') {
        if (!user.job) return "❌ No job.";
        const title = user.job.title;
        user.job = null;
        return "📋 Resigned from " + title + ".\n" + getMixedResponse();
    }

    // ═══════════════════════════════════
    // 😈 ROAST
    // ═══════════════════════════════════

    if (cmd === 'roast') {
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ Usage: :roast @user OR reply to their message with :roast";
        if (sender === target) return "❌ You can't roast yourself.";
        if (!USERS[target]) getUser(target);

        const roasts = [
            "You're like a software update - nobody wants you, but you keep showing up.",
            "You're not dumb... you're just unlucky when it comes to thinking.",
            "Your life is like a broken pencil... pointless.",
            "You bring everyone so much joy... when you leave.",
            "You're the reason they put instructions on shampoo bottles.",
            "I'd roast you but that's a waste of fire.",
            "You're like a cloud - when you disappear, it's a beautiful day.",
            "You're proof that evolution can go in reverse.",
            "Your brain is like a browser - 10 tabs open and all frozen.",
            "You're not a clown, you're the entire circus.",
            "I'd agree with you, but then we'd both be wrong.",
            "You have the personality of a wet mop.",
            "You're the NPC everyone skips.",
            "Your existence is a loading screen that never finishes.",
            "I've seen better conversations in a graveyard."
        ];

        return `╔══════════════════════════════════╗
║     🔥 ROASTED!                  ║
╠══════════════════════════════════╣
║  🎯 Target: ${target}
║  📝 Roasted by: ${sender}
╠══════════════════════════════════╣
║  💀 "${random(roasts)}"
╚══════════════════════════════════╝

${getMixedResponse()}`;
    }

    if (cmd === 'compliment') {
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ Usage: :compliment @user OR reply to their message";
        if (sender === target) return "❌ You can't compliment yourself.";
        if (!USERS[target]) getUser(target);

        const compliments = [
            "You're actually not that bad.",
            "You have moments of being tolerable.",
            "I've seen worse... much worse.",
            "You're like a rare Pokemon - not that rare though.",
            "You have potential... don't waste it.",
            "You're actually funny sometimes. Sometimes.",
            "You're doing better than most. That's not saying much though."
        ];

        return `╔══════════════════════════════════╗
║     💖 COMPLIMENTED!             ║
╠══════════════════════════════════╣
║  🎯 Target: ${target}
║  📝 By: ${sender}
╠══════════════════════════════════╣
║  ✨ "${random(compliments)}"
╚══════════════════════════════════╝

${getMixedResponse()}`;
    }

    // ═══════════════════════════════════
    // 🎵 MUSIC
    // ═══════════════════════════════════

    if (cmd === 'play') {
        const song = command.slice(5).trim();
        if (!song) return "❌ Usage: :play <song name>";
        return `🎵 NOW PLAYING: ${song}
──────────────────────────
🔍 Searching...
▶️ YouTube: https://www.youtube.com/results?search_query=${encodeURIComponent(song)}
🎧 Spotify: https://open.spotify.com/search/${encodeURIComponent(song)}

${getMixedResponse()}`;
    }

    if (cmd === 'musiclist') {
        return `╔══════════════════════════════════╗
║     🎵 MUSIC LIBRARY             ║
╠══════════════════════════════════╣
║                                  ║
║  🎵 POPULAR SONGS                ║
║  ─────────────────               ║
║  • despacito                     ║
║  • shape of you                  ║
║  • blinding lights               ║
║  • dance monkey                  ║
║  • rockstar                      ║
║  • believer                      ║
║                                  ║
║  💡 Type :play <song>            ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
    }

    // ═══════════════════════════════════
    // 🛡️ ADMIN COMMANDS
    // ═══════════════════════════════════

    if (cmd === 'kick') {
        const canKick = isOwner(sender) || isMod(sender) || isAdmin;
        if (!canKick) return "❌ Only admins, mods, and owners can kick.";

        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ Usage: :kick @user OR reply to their message";
        if (isProtected(target)) return "❌ Cannot kick protected users.";

        if (groupId) {
            try {
                await sock.groupParticipantsUpdate(groupId, [target + "@s.whatsapp.net"], "remove");
                return "⚠️ " + target + " kicked.\n" + getMixedResponse();
            } catch (e) {
                return "❌ Failed to kick: " + e.message;
            }
        }
        return "❌ This command only works in groups.";
    }

    if (cmd === 'mute') {
        const canMute = isOwner(sender) || isMod(sender) || isAdmin;
        if (!canMute) return "❌ Only admins, mods, and owners can mute.";
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ Usage: :mute @user";
        if (isProtected(target)) return "❌ Cannot mute protected users.";
        getUser(target).muted = true;
        return "🔇 " + target + " muted.\n" + getMixedResponse();
    }

    if (cmd === 'unmute') {
        const canMute = isOwner(sender) || isMod(sender) || isAdmin;
        if (!canMute) return "❌ Only admins, mods, and owners can unmute.";
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ Usage: :unmute @user";
        if (isProtected(target)) return "❌ Cannot unmute protected users.";
        getUser(target).muted = false;
        return "🔊 " + target + " unmuted.\n" + getMixedResponse();
    }

    if (cmd === 'warn') {
        const canWarn = isOwner(sender) || isMod(sender) || isAdmin;
        if (!canWarn) return "❌ Only admins, mods, and owners can warn.";
        let target = cleanNumber(args[1]);
        if (!target && contextInfo?.participant) target = cleanNumber(contextInfo.participant);
        if (!target) return "❌ Usage: :warn @user";
        if (isProtected(target)) return "❌ Cannot warn protected users.";
        const warned = getUser(target);
        warned.warns++;
        return "⚠️ " + target + " warned (" + warned.warns + "/3).\n" + getMixedResponse();
    }

    // ✅ CLOSE GROUP
    if (cmd === 'close') {
        const canClose = isOwner(sender) || isMod(sender) || isAdmin;
        if (!canClose) return "❌ Only admins, mods, and owners can close the group.";
        if (!groupId) return "❌ Only works in groups.";
        try {
            await sock.groupSettingUpdate(groupId, "announcement");
            return "🔒 GROUP CLOSED\n──────────────────────────\nOnly admins can send messages.\n👤 By: " + sender + "\n\n" + getMixedResponse();
        } catch (e) {
            return "❌ Failed: " + e.message;
        }
    }

    // ✅ OPEN GROUP
    if (cmd === 'open') {
        const canOpen = isOwner(sender) || isMod(sender) || isAdmin;
        if (!canOpen) return "❌ Only admins, mods, and owners can open the group.";
        if (!groupId) return "❌ Only works in groups.";
        try {
            await sock.groupSettingUpdate(groupId, "not_announcement");
            return "🔓 GROUP OPENED\n──────────────────────────\nEveryone can send messages.\n👤 By: " + sender + "\n\n" + getMixedResponse();
        } catch (e) {
            return "❌ Failed: " + e.message;
        }
    }

    // ═══════════════════════════════════
    // 🏰 ADD GROUP TO WHITELIST
    // ═══════════════════════════════════

    if (cmd === 'addgroup') {
        // Only owners and mods can add groups
        if (!isOwner(sender) && !isMod(sender)) {
            return "❌ Only MODS and OWNERS can add the bot to groups.";
        }
        const targetGroup = args[1] || groupId;
        if (!targetGroup) return "❌ Usage: :addgroup <group_id> OR run in the group";
        if (!GROUP_WHITELIST.includes(targetGroup)) {
            GROUP_WHITELIST.push(targetGroup);
            saveData();
            return "✅ Group whitelisted!\n📱 " + targetGroup + "\n👤 By: " + sender + "\n" + getMixedResponse();
        }
        return "ℹ️ Group already whitelisted.";
    }

    // ═══════════════════════════════════
    // 👑 MOD MANAGEMENT
    // ═══════════════════════════════════

    if (cmd === 'mod') {
        if (!isOwner(sender)) return "❌ Only owners can manage mods.";
        const sub = args[1];
        const target = cleanNumber(args[2]);

        if (sub === 'add' && target) {
            if (!MODS.includes(target)) {
                MODS.push(target);
                PROTECTED_USERS.push(target);
                DM_WHITELIST.push(target);
                saveData();
                return "✅ Added " + target + " as MOD.";
            }
            return "ℹ️ Already a mod.";
        }

        if (sub === 'remove' && target) {
            MODS = MODS.filter(m => m !== target);
            saveData();
            return "✅ Removed " + target + " from MODS.";
        }

        if (sub === 'list' || !sub) return boxModList();

        return "❌ Usage: :mod add/remove/list <number>";
    }

    // ═══════════════════════════════════
    // 🔒 SECRET OWNER
    // ═══════════════════════════════════

    if (cmd === 'secret') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        return `╔══════════════════════════════════╗
║     🔒 SECRET OWNER COMMANDS     ║
╠══════════════════════════════════╣
║                                  ║
║  :addmoney <number> <amount>     ║
║  :removemoney <number> <amount>  ║
║  :resetuser <number>             ║
║  :setrole <number> <role>        ║
║  :viewall                        ║
║  :mod add/remove/list            ║
║  :emergency                      ║
║  :secret                         ║
║                                  ║
╚══════════════════════════════════╝

${getMixedResponse()}`;
    }

    if (cmd === 'addmoney') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        const target = cleanNumber(args[1]);
        const amt = parseInt(args[2]);
        if (!target || !amt) return "❌ Usage: :addmoney <number> <amount>";
        if (!USERS[target]) getUser(target);
        giveXS(target, amt);
        return "✅ Added " + amt + " XS to " + target;
    }

    if (cmd === 'removemoney') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        const target = cleanNumber(args[1]);
        const amt = parseInt(args[2]);
        if (!target || !amt) return "❌ Usage: :removemoney <number> <amount>";
        if (!USERS[target]) return "❌ User not found.";
        takeXS(target, amt);
        return "✅ Removed " + amt + " XS from " + target;
    }

    if (cmd === 'viewall') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        let output = "📊 ALL USERS (" + Object.keys(USERS).length + ")\n──────────────────────────\n";
        Object.entries(USERS).slice(0, 20).forEach(([num, u]) => {
            output += "📱 " + num + ": " + u.role + " - " + u.xenoShards + " XS\n";
        });
        return output + "\n" + getMixedResponse();
    }

    if (cmd === 'emergency') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        BOT_ACTIVE = true;
        return "⚠️ Emergency override activated.";
    }

    if (cmd === 'resetuser') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        const target = cleanNumber(args[1]);
        if (!target || !USERS[target]) return "❌ User not found.";
        USERS[target] = null;
        return "✅ User " + target + " reset.";
    }

    if (cmd === 'setrole') {
        if (!isOwner(sender)) return "❌ Unknown command.";
        const target = cleanNumber(args[1]);
        const newRole = args[2] ? args[2].toUpperCase() : null;
        if (!target || !newRole) return "❌ Usage: :setrole <number> <role>";
        if (!USERS[target]) return "❌ User not found.";
        USERS[target].role = newRole;
        return "✅ " + target + " role set to " + newRole;
    }

    return "❌ Unknown command: " + PREFIX + cmd + "\n💡 Type :menu\n" + getMixedResponse();
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
            markOnlineOnConnect: true,
            syncFullHistory: false
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
                    console.log('🚪 Logged out.');
                    return;
                }
                console.log('Connection closed. Reconnecting...');
                setTimeout(connectToWhatsApp, 5000);
            } else if (connection === 'open') {
                console.log('\n╔══════════════════════════════════════════╗');
                console.log('║   🖤 HODEKAI BOT CONNECTED! 🖤           ║');
                console.log('╚══════════════════════════════════════════╝\n');
            }
        });

        sock.ev.on('messages.upsert', async m => {
            if (!BOT_ACTIVE) return;
            if (m.type !== 'notify') return;

            for (const msg of m.messages) {
                try {
                    if (!msg.message || msg.key.fromMe) continue;

                    const isGroup = msg.key.remoteJid.endsWith('@g.us');
                    const rawSender = isGroup ? msg.key.participant : msg.key.remoteJid;
                    if (!rawSender) continue;

                    const sender = rawSender.split('@')[0].split(':')[0];

                    let text = '';
                    let isSticker = false;

                    if (msg.message.conversation) text = msg.message.conversation;
                    else if (msg.message.extendedTextMessage) text = msg.message.extendedTextMessage.text;
                    else if (msg.message.stickerMessage) isSticker = true;
                    else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption;
                    else if (msg.message.videoMessage?.caption) text = msg.message.videoMessage.caption;

                    const contextInfo = msg.message.extendedTextMessage?.contextInfo ||
                                       msg.message.imageMessage?.contextInfo ||
                                       msg.message.videoMessage?.contextInfo;

                    console.log('📩 FROM: ' + sender + ' | GROUP: ' + isGroup + ' | MSG: ' + (text || '[sticker]'));

                    const reply = await handleMessage(text, sender, isSticker, msg.key.remoteJid, sock, contextInfo);

                    if (reply && typeof reply === 'string' && reply.trim()) {
                        await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
                        console.log('✅ Replied');
                    }
                } catch (e) {
                    console.error('❌ Message error:', e.message);
                }
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
        mods: MODS.length,
        treasury: GOVERNMENT_FUNDS
    });
});

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🖤 CONCLAVE BOT v5.0 - PEAK EDITION');
    console.log('👑 FATHER: ' + OWNERS.FATHER);
    console.log('🏆 CO-CREATOR: ' + OWNERS.CO_CREATOR);
    console.log('⚡ MODS: ' + MODS.join(', '));
    console.log('========================================');
    console.log('🌐 Web server running on port ' + PORT);
    console.log('📱 DM Whitelist: ACTIVE');
    console.log('📱 All groups: AUTO-WHITELISTED');
    console.log('========================================\n');
});

process.on('SIGINT', () => { saveData(); process.exit(0); });
process.on('uncaughtException', (e) => { console.error('❌ Crash:', e.message); saveData(); });
