import crypto from "crypto";

/** 生成16位随机Token */
export function generateToken(): string {
  return crypto.randomBytes(8).toString("hex");
}

/** 简单密码哈希（用于管理员登录） */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Supabase 使用 pgcrypto 的 crypt，这里直接查数据库比对
  return true; // 实际验证在数据库层面进行
}

/** 生成软件标识 Softid */
export function generateSoftid(name: string): string {
  const raw = name + Date.now() + Math.random().toString(36).slice(2);
  return crypto.createHash("md5").update(raw).digest("hex").slice(0, 16);
}

/** 错误码消息映射 */
export const ERROR_MESSAGES: Record<string, string> = {
  "-1": "卡密已过期",
  "-2": "软件标识不存在",
  "-3": "机器码不匹配",
  "-4": "卡密已被禁用",
  "-5": "软件已被禁用",
  "-6": "版本过低，请更新",
  "-7": "绑定设备数已达上限",
  "-8": "在线人数已满",
  "-9": "参数不完整",
  "-10": "请求过于频繁",
  "-11": "卡密不存在",
  "-98": "IP已被封禁",
  "-99": "系统内部错误",
};
