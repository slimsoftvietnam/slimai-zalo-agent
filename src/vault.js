import { Entry } from '@napi-rs/keyring';

const SERVICE = 'vn.slimai.zalo-agent';

export function assertPlatform(platform = process.platform) {
  if (platform !== 'win32' && platform !== 'darwin') {
    throw new Error('Chỉ hỗ trợ Windows và macOS. Không lưu bí mật trên hệ này.');
  }
}

export class Vault {
  constructor(EntryType = Entry) {
    assertPlatform();
    this.EntryType = EntryType;
  }

  entry(name) { return new this.EntryType(SERVICE, name); }

  probe() {
    const e = this.entry('healthcheck');
    const value = `probe-${crypto.randomUUID()}`;
    try {
      e.setPassword(value);
      if (e.getPassword() !== value) throw new Error('Kho khóa không trả lại dữ liệu vừa lưu');
    } catch {
      throw new Error('Không dùng được kho khóa hệ điều hành. Mở khóa tài khoản máy rồi thử lại.');
    } finally {
      try { e.deletePassword(); } catch { /* healthcheck cleanup best effort */ }
    }
  }

  put(name, value) { this.entry(name).setPassword(JSON.stringify(value)); }
  get(name) {
    const raw = this.entry(name).getPassword();
    return raw == null ? null : JSON.parse(raw);
  }
  remove(name) {
    try { this.entry(name).deletePassword(); } catch (error) {
      if (!String(error).toLowerCase().includes('no entry')) throw error;
    }
  }
}
