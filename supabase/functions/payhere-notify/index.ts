import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function textResponse(body: string, status = 200) {
  return new Response(body, { status, headers: corsHeaders });
}

function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role credentials are not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapOrderStatus(statusCode: string) {
  switch (statusCode) {
    case "2":
      return "processing";
    case "0":
      return "pending";
    case "-1":
      return "cancelled";
    case "-2":
      return "failed";
    case "-3":
      return "chargedback";
    default:
      return "pending";
  }
}

function md5(input: string): string {
  return computeMD5(input);
}

function computeMD5(str: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }

  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }

  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }

  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function strToUtf8Arr(value: string): number[] {
    const out: number[] = [];
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code < 128) out.push(code);
      else if (code < 2048) out.push((code >> 6) | 192, (code & 63) | 128);
      else out.push((code >> 12) | 224, ((code >> 6) & 63) | 128, (code & 63) | 128);
    }
    return out;
  }

  const bytes = strToUtf8Arr(str);
  const length8 = bytes.length;
  const length16 = Math.ceil((length8 + 9) / 64) * 16;
  const words = new Array(length16).fill(0);

  for (let i = 0; i < length8; i++) {
    words[i >> 2] |= bytes[i] << ((i % 4) * 8);
  }

  words[length8 >> 2] |= 0x80 << ((length8 % 4) * 8);
  words[length16 - 2] = length8 * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < length16; i += 16) {
    const aa = a;
    const bb = b;
    const cc = c;
    const dd = d;

    a = md5ff(a, b, c, d, words[i + 0], 7, -680876936);
    d = md5ff(d, a, b, c, words[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, words[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, words[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, words[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, words[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, words[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, words[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, words[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, words[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, words[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, words[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, words[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, words[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, words[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, words[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, words[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, words[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, words[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, words[i + 0], 20, -373897302);
    a = md5gg(a, b, c, d, words[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, words[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, words[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, words[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, words[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, words[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, words[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, words[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, words[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, words[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, words[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, words[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, words[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, words[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, words[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, words[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, words[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, words[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, words[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, words[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, words[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, words[i + 0], 11, -358537222);
    c = md5hh(c, d, a, b, words[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, words[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, words[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, words[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, words[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, words[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, words[i + 0], 6, -198630844);
    d = md5ii(d, a, b, c, words[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, words[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, words[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, words[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, words[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, words[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, words[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, words[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, words[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, words[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, words[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, words[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, words[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, words[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, words[i + 9], 21, -343485551);

    a = safeAdd(a, aa);
    b = safeAdd(b, bb);
    c = safeAdd(c, cc);
    d = safeAdd(d, dd);
  }

  return [a, b, c, d]
    .map((value) => {
      let hex = "";
      for (let j = 0; j < 4; j++) {
        hex += (`0${((value >> (j * 8)) & 0xff).toString(16)}`).slice(-2);
      }
      return hex;
    })
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return textResponse("ok");
  }

  if (req.method !== "POST") {
    return textResponse("Method not allowed", 405);
  }

  try {
    const merchantSecret = Deno.env.get("PAYHERE_MERCHANT_SECRET");
    const expectedMerchantId = Deno.env.get("PAYHERE_MERCHANT_ID")?.trim();

    if (!merchantSecret) {
      return textResponse("PAYHERE_MERCHANT_SECRET not configured", 500);
    }

    const params = new URLSearchParams(await req.text());
    const merchantId = (params.get("merchant_id") || "").trim();
    const orderId = (params.get("order_id") || "").trim();
    const amount = (params.get("payhere_amount") || "").trim();
    const currency = (params.get("payhere_currency") || "").trim();
    const statusCode = (params.get("status_code") || "").trim();
    const md5sig = (params.get("md5sig") || "").trim().toUpperCase();
    const custom1 = (params.get("custom_1") || "").trim();
    const custom2 = (params.get("custom_2") || "").trim();

    if (!merchantId || !orderId || !amount || !currency || !statusCode || !md5sig) {
      return textResponse("Missing required fields", 400);
    }

    if (expectedMerchantId && merchantId !== expectedMerchantId) {
      return textResponse("Merchant id mismatch", 400);
    }

    const localMd5sig = md5(
      merchantId +
        orderId +
        amount +
        currency +
        statusCode +
        md5(merchantSecret).toUpperCase(),
    ).toUpperCase();

    if (localMd5sig !== md5sig) {
      return textResponse("Invalid signature", 400);
    }

    if (custom2 !== "checkout" || !custom1) {
      return textResponse("OK");
    }

    const admin = getAdminClient();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, status")
      .eq("id", custom1)
      .single();

    if (orderError || !order) {
      return textResponse("Order not found", 404);
    }

    const nextStatus = mapOrderStatus(statusCode);
    const alreadyProcessed = ["processing", "shipped", "delivered"].includes(order.status);

    if (statusCode === "2" && !alreadyProcessed) {
      const { data: items, error: itemsError } = await admin
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", custom1);

      if (itemsError) {
        return textResponse("Could not load order items", 500);
      }

      for (const item of items || []) {
        const quantity = Number(item.quantity || 0);
        if (!item.product_id || quantity <= 0) continue;

        const { data: product, error: productError } = await admin
          .from("products")
          .select("stock")
          .eq("id", item.product_id)
          .single();

        if (productError) {
          return textResponse("Could not load product stock", 500);
        }

        const currentStock = Number(product?.stock ?? 0);
        const nextStock = Math.max(0, currentStock - quantity);
        const { error: stockError } = await admin
          .from("products")
          .update({ stock: nextStock })
          .eq("id", item.product_id);

        if (stockError) {
          return textResponse("Could not update product stock", 500);
        }
      }
    } else if (alreadyProcessed && statusCode !== "2") {
      return textResponse("OK");
    }

    const { error: updateError } = await admin
      .from("orders")
      .update({ status: nextStatus, payment_method: "payhere" })
      .eq("id", custom1);

    if (updateError) {
      return textResponse("Could not update order", 500);
    }

    return textResponse("OK");
  } catch (err) {
    return textResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
});
