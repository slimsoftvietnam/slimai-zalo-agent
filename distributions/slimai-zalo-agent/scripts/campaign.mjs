import { appendFileSync, existsSync, mkdirSync, openSync, closeSync, unlinkSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { dataRoot, readJson, loginClient } from './runtime.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
export function validatePlan(plan) {
  if (typeof plan.senderId !== 'string' || !/^\d+$/.test(plan.senderId)) throw Error('Thiếu senderId dạng chuỗi số. Lấy từ --json status.');
  if (typeof plan.message !== 'string' || !plan.message.trim()) throw Error('Nội dung tin nhắn đang trống.');
  if (!Array.isArray(plan.recipients) || !plan.recipients.length) throw Error('Chưa có người nhận.');
  const seen = new Set();
  for (const row of plan.recipients) {
    if (typeof row.id !== 'string' || !/^\d+$/.test(row.id) || ![0, 1].includes(row.type)) throw Error('Mỗi người nhận cần id dạng chuỗi số và type 0 hoặc 1.');
    const key = `${row.type}:${row.id}`;
    if (seen.has(key)) throw Error('Danh sách có người nhận trùng.');
    seen.add(key);
    if (row.consent !== true) throw Error('Chỉ nhận dòng có consent=true sau khi xác định quyền liên hệ.');
    if (String(row.id) === plan.senderId) throw Error('Không đưa tài khoản gửi vào danh sách.');
  }
  if (plan.image && (!/^([a-zA-Z]:[\\/]|\/|\\\\)/.test(plan.image) || !existsSync(plan.image))) throw Error('Ảnh phải là đường dẫn tuyệt đối tới tệp tồn tại.');
  return plan;
}
const deadline = promise => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Hết thời gian chờ. Kết quả chưa rõ; kiểm tra hội thoại trước khi thử lại.')), 90000); })]).finally(() => clearTimeout(timer));
};
export async function sendOne(api, plan, row, record) {
  const text = await deadline(api.sendMessage(plan.message, row.id, row.type));
  if (!text?.message?.msgId) throw Error('Text thiếu mã tin. Kết quả chưa rõ; không gửi ảnh.');
  record({ status: 'text_accepted', msgId: String(text.message.msgId) });
  if (plan.image) {
    const image = await deadline(api.sendMessage({ msg: '', attachments: [plan.image] }, row.id, row.type));
    if (!image?.attachment?.length || image.attachment.some(item => !item?.msgId)) throw Error('Ảnh thiếu mã tin. Text đã được API nhận; cần kiểm tra hội thoại.');
    record({ status: 'image_accepted', msgIds: image.attachment.map(item => String(item.msgId)) });
  }
  record({ status: 'accepted' });
}
export async function dispatch(plan, { root = dataRoot, send = false, limit = 0, connect = loginClient } = {}) {
  validatePlan(plan);
  if (send && (!Number.isSafeInteger(limit) || limit < 1)) throw Error('Gửi thật cần --limit <số người> lớn hơn 0.');
  mkdirSync(root, { recursive: true });
  const journal = join(root, 'dispatch.jsonl');
  const previous = existsSync(journal) ? readFileSync(journal, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
  const attempted = new Set(previous.map(row => row.key));
  const optOuts = readJson(join(root, 'opt-outs.json'), []);
  if (!Array.isArray(optOuts) || optOuts.some(id => typeof id !== 'string')) throw Error('opt-outs.json phải là mảng UID dạng chuỗi.');
  const blocked = new Set(optOuts);
  const imageHash = plan.image ? digest(readFileSync(plan.image)) : '';
  const pending = plan.recipients.map(row => ({ row, key: digest(JSON.stringify([plan.senderId, row.type, row.id, plan.message, imageHash])) }))
    .filter(({ row, key }) => !attempted.has(key) && !(row.type === 0 && blocked.has(row.id)));
  if (!send) return { mode: 'preview', total: plan.recipients.length, pending: pending.length, skipped: plan.recipients.length - pending.length, sample: pending.slice(0, 3).map(({ row }) => ({ id: row.id, name: row.name, type: row.type })), message: plan.message, image: plan.image || null };
  const lockPath = join(root, 'dispatch.lock');
  const lock = openSync(lockPath, 'wx');
  let accepted = 0;
  let attempts = 0;
  try {
    // Re-read under the exclusive lock so simultaneous runs cannot reuse an old snapshot.
    const latest = existsSync(journal) ? readFileSync(journal, 'utf8').split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
    const already = new Set(latest.map(row => row.key));
    const { api, ownId } = await connect();
    if (ownId !== plan.senderId) throw Error('Tài khoản đang đăng nhập không khớp senderId.');
    for (const { row, key } of pending) {
      if (already.has(key)) continue;
      const liveOptOuts = readJson(join(root, 'opt-outs.json'), []);
      if (row.type === 0 && liveOptOuts.includes(row.id)) continue;
      if (attempts >= limit) break;
      const record = data => appendFileSync(journal, JSON.stringify({ at: new Date().toISOString(), key, senderId: ownId, id: row.id, type: row.type, ...data }) + '\n');
      record({ status: 'attempted' }); // Persist before the first network mutation.
      attempts++;
      try { await sendOne(api, plan, row, record); accepted++; }
      catch (error) {
        record({ status: 'needs_review', code: error.code ?? null, reason: String(error.message).replace(/\+?\d{8,}/g, '[ẩn]') });
        return { mode: 'stopped', accepted, attempts, reason: error.message, code: error.code ?? null, reviewRecipient: row.id };
      }
    }
    return { mode: 'finished', accepted, attempts, remaining: pending.length - attempts, note: 'API đã nhận yêu cầu; chưa xác nhận người nhận đã đọc.' };
  } finally { closeSync(lock); unlinkSync(lockPath); }
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const [planPath, ...flags] = process.argv.slice(2);
    if (!planPath) throw Error('Dùng campaign.mjs <plan.json> [--send --limit N]');
    for (let i = 0; i < flags.length; i++) {
      if (flags[i] === '--limit') { if (!flags[++i]) throw Error('--limit cần giá trị.'); }
      else if (flags[i] !== '--send') throw Error(`Tham số không hỗ trợ: ${flags[i]}`);
    }
    const limitAt = flags.indexOf('--limit');
    const result = await dispatch(readJson(resolve(planPath)), { send: flags.includes('--send'), limit: limitAt < 0 ? 0 : Number(flags[limitAt + 1]) });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.mode === 'stopped' ? 1 : 0);
  } catch (error) { console.error(error.message); process.exit(1); }
}
