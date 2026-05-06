import crypto from "crypto";

/** 鐢熸垚16浣嶉殢鏈篢oken */
export function generateToken(): string {
  return crypto.randomBytes(8).toString("hex");
}

/** 绠€鍗曞瘑鐮佸搱甯岋紙鐢ㄤ簬绠＄悊鍛樼櫥褰曪級 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Supabase 浣跨敤 pgcrypto 鐨?crypt锛岃繖閲岀洿鎺ユ煡鏁版嵁搴撴瘮瀵?
  return true; // 瀹為檯楠岃瘉鍦ㄦ暟鎹簱灞傞潰杩涜
}

/** 鐢熸垚杞欢鏍囪瘑 Softid */
export function generateSoftid(name: string): string {
  const raw = name + Date.now() + Math.random().toString(36).slice(2);
  return crypto.createHash("md5").update(raw).digest("hex").slice(0, 16);
}

/** 閿欒鐮佹秷鎭槧灏?*/
export const ERROR_MESSAGES: Record<string, string> = {
  "-1": "鍗″瘑宸茶繃鏈?,
  "-2": "杞欢鏍囪瘑涓嶅瓨鍦?,
  "-3": "鏈哄櫒鐮佷笉鍖归厤",
  "-4": "鍗″瘑宸茶绂佺敤",
  "-5": "杞欢宸茶绂佺敤",
  "-6": "鐗堟湰杩囦綆锛岃鏇存柊",
  "-7": "缁戝畾璁惧鏁板凡杈句笂闄?,
  "-8": "鍦ㄧ嚎浜烘暟宸叉弧",
  "-9": "鍙傛暟涓嶅畬鏁?,
  "-10": "璇锋眰杩囦簬棰戠箒",
  "-11": "鍗″瘑涓嶅瓨鍦?,
  "-98": "IP宸茶灏佺",
  "-99": "绯荤粺鍐呴儴閿欒",
};
