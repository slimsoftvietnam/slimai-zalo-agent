import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, join } from "node:path";
import { dataRoot, loginClient } from "./runtime.mjs";

const base = pathToFileURL(join(dataRoot, "/"));
const folder = new URL("./zalo-replies/", base);
const queueUrl = new URL("messages.jsonl", folder);
const healthUrl = new URL("health.json", folder);
const lockUrl = new URL("listener.lock", base);
const cursorUrl = new URL("reported.json", folder);
const campaignPath = process.argv[3] ? resolve(process.argv[3]) : null;

function readJson(url, fallback) {
    try { return JSON.parse(readFileSync(url, "utf8").replace(/^\uFEFF/, "")); }
    catch (error) { if (error.code === "ENOENT") return fallback; throw error; }
}

function writeJson(url, value) {
    const temporary = new URL(url.href + ".tmp");
    writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
    renameSync(temporary, url);
}

function readQueue() {
    if (!existsSync(queueUrl)) return [];
    return readFileSync(queueUrl, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

export function normalizeReply(message, recipients) {
    if (message?.isSelf || message?.type !== 0 || !recipients.has(String(message.threadId))) return null;
    const data = message.data;
    if (!data?.msgId) return null;
    const text = typeof data.content === "string" ? data.content : data.content?.title || "";
    return {
        key: `${message.threadId}:${data.msgId}`,
        threadId: String(message.threadId),
        msgId: String(data.msgId),
        name: String(data.dName || "Khách hàng"),
        text: String(text).slice(0, 10000),
        type: String(data.msgType || (typeof data.content === "string" ? "text" : "attachment")),
        sentAt: data.ts ?? null,
        quote: data.quote ? {
            msgId: String(data.quote.globalMsgId || ""),
            text: String(data.quote.msg || "").slice(0, 2000)
        } : null,
        receivedAt: new Date().toISOString()
    };
}

function loadRecipients() {
    if (!campaignPath) throw Error('Dùng monitor listen <plan.json>');
    const plan = readJson(pathToFileURL(campaignPath));
    if (!/^\d+$/.test(plan.senderId || '') || !Array.isArray(plan.recipients)) throw Error('Plan thiếu senderId hoặc recipients.');
    const contacted = new Set(plan.recipients.filter(row => row.type === 0 && row.consent === true).map(row => String(row.id)));
    return { senderId: plan.senderId, contacted };
}

async function listen() {
    mkdirSync(folder, { recursive: true });
    if (existsSync(lockUrl)) {
        const previous = readJson(lockUrl);
        try { process.kill(previous.pid, 0); }
        catch (error) {
            if (error.code !== "ESRCH") throw error;
            unlinkSync(lockUrl);
        }
        if (existsSync(lockUrl)) throw Error("Bộ nhận tin đã có tiến trình hoạt động");
    }
    const lock = openSync(lockUrl, "wx");
    writeFileSync(lock, JSON.stringify({ pid: process.pid }));
    let api;
    let timer;
    let finishing = false;
    let recipients;
    let health = { pid: process.pid, status: "starting", startedAt: new Date().toISOString() };
    const update = changes => {
        health = { ...health, ...changes, updatedAt: new Date().toISOString() };
        writeJson(healthUrl, health);
    };
    const finish = (status, reason) => {
        if (finishing) return;
        finishing = true;
        clearInterval(timer);
        update({ status, reason });
        try { api?.listener.stop(); } catch {}
        closeSync(lock);
        unlinkSync(lockUrl);
        process.exit(status === "stopped" ? 0 : 1);
    };
    process.once("SIGINT", () => finish("stopped", "Người vận hành dừng"));
    process.once("SIGTERM", () => finish("stopped", "Tiến trình được dừng"));
    process.once("uncaughtException", error => finish("needs_attention", String(error.message).replace(/\+?\d{8,}/g, "[ẩn]")));
    process.once("unhandledRejection", error => finish("needs_attention", String(error?.message || error).replace(/\+?\d{8,}/g, "[ẩn]")));
    try {
        recipients = loadRecipients();
        const old = readQueue();
        const seen = new Set(old.map(row => row.key));
        let sequence = old.at(-1)?.sequence || 0;
        process.env.ZALO_JSON_MODE = "1";
        const client = await loginClient();
        api = client.api;
        if (client.ownId !== recipients.senderId) throw Error("Tài khoản nhận phản hồi không khớp chiến dịch");
        api.listener.on("message", message => {
            const reply = normalizeReply(message, recipients.contacted);
            if (!reply || seen.has(reply.key)) return;
            appendFileSync(queueUrl, JSON.stringify({ sequence: ++sequence, ...reply }) + "\n");
            seen.add(reply.key);
            update({ lastMessageAt: reply.receivedAt, received: sequence });
        });
        api.listener.on("connected", () => update({ status: "connected", connectedAt: new Date().toISOString(), reason: null }));
        api.listener.on("disconnected", code => update({ status: "reconnecting", closeCode: code }));
        api.listener.on("error", () => update({ lastErrorAt: new Date().toISOString() }));
        api.listener.on("closed", code => finish("needs_attention", `Kết nối nhận tin đã đóng, mã ${code}`));
        update({ watchedContacts: recipients.contacted.size, received: sequence });
        timer = setInterval(() => {
            recipients = loadRecipients();
            update({ watchedContacts: recipients.contacted.size });
        }, 30000);
        api.listener.start({ retryOnClose: true });
    } catch (error) {
        finish("needs_attention", String(error.message).replace(/\+?\d{8,}/g, "[ẩn]"));
    }
}

function check() {
    const health = readJson(healthUrl, { status: "not_started" });
    let processAlive = false;
    if (health.pid) {
        try { process.kill(health.pid, 0); processAlive = true; } catch {}
    }
    const cursor = readJson(cursorUrl, { sequence: 0 });
    const messages = readQueue().filter(row => row.sequence > cursor.sequence).slice(0, 20);
    console.log(JSON.stringify({ health: { ...health, processAlive },
        unreported: messages, nextCursor: messages.at(-1)?.sequence ?? cursor.sequence }));
}

function acknowledge(value) {
    const sequence = Number(value);
    const queue = readQueue();
    const previous = readJson(cursorUrl, { sequence: 0 });
    if (!Number.isSafeInteger(sequence) || sequence < previous.sequence || sequence > (queue.at(-1)?.sequence ?? 0)) {
        throw Error("Con trỏ phản hồi không hợp lệ");
    }
    mkdirSync(folder, { recursive: true });
    writeJson(cursorUrl, { sequence, reportedAt: new Date().toISOString() });
    console.log(JSON.stringify({ acknowledged: sequence }));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
    const command = process.argv[2];
    if (command === "listen" && process.argv.length === 4) await listen();
    else if (command === "check" && process.argv.length === 3) check();
    else if (command === "ack" && process.argv.length === 4) acknowledge(process.argv[3]);
    else throw Error("Dùng listen, check hoặc ack <sequence>");
}
