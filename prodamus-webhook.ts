import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PRODAMUS_SECRET = Deno.env.get("PRODAMUS_SECRET") || "255a0cf202fa0c2ec1f23e642d4d785320d98ac96e500628817365c4edcb6663";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_TG_ID = 788984484;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Sign"
};

function sortObject(obj: any): any {
  const sorted: any = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    const val = obj[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      sorted[key] = sortObject(val);
    } else if (Array.isArray(val)) {
      sorted[key] = val.map((item: any) => item !== null && typeof item === "object" ? sortObject(item) : String(item));
    } else {
      sorted[key] = String(val ?? "");
    }
  }
  return sorted;
}

async function verifySignature(data: any, signature: string, secret: string): Promise<boolean> {
  try {
    const sorted = sortObject(data);
    let jsonStr = JSON.stringify(sorted);
    jsonStr = jsonStr.replace(/\//g, "\\/");
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(jsonStr));
    const hexSig = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return hexSig === signature.toLowerCase();
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}

async function notifyTelegram(chatId: string | number, text: string) {
  const token = Deno.env.get("TG_BOT_TOKEN");
  if (!token) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (e) {
    console.error("Telegram notify error:", e);
  }
}

function setNestedValue(obj: any, key: string, value: string) {
  const match = key.match(/^([^[]+)(?:\[([^\]]*)\])*$/);
  if (!match) {
    obj[key] = value;
    return;
  }
  const parts: string[] = [];
  parts.push(match[1]);
  const rest = key.slice(match[1].length);
  const bracketRegex = /\[([^\]]*)\]/g;
  let m;
  while ((m = bracketRegex.exec(rest)) !== null) {
    parts.push(m[1]);
  }
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const nextP = parts[i + 1];
    const isNextArray = /^\d+$/.test(nextP);
    if (current[p] === undefined) {
      current[p] = isNextArray ? [] : {};
    }
    current = current[p];
  }
  current[parts[parts.length - 1]] = value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("Sign") || req.headers.get("sign") || "";
    let body: any;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = {};
      for (const [key, value] of params.entries()) {
        setNestedValue(body, key, value);
      }
    }

    console.log("Webhook received. Order ID:", body.order_id);
    console.log("Payment status:", body.payment_status);

    const dataForVerify = { ...body };
    delete dataForVerify.sign;
    delete dataForVerify.Sign;
    const isValid = await verifySignature(dataForVerify, signature, PRODAMUS_SECRET);
    if (!isValid) {
      console.error("Invalid signature! Rejecting webhook.");
      return new Response("Invalid signature", { status: 403, headers: corsHeaders });
    }
    console.log("Signature verified successfully.");

    const paymentStatus = String(body.payment_status || "");
    if (paymentStatus !== "success") {
      console.log("Payment status is not success:", paymentStatus);
      return new Response("OK (not success)", { status: 200, headers: corsHeaders });
    }

    const telegramId = String(body._param_telegram_id || "");
    const guideSlug = String(body._param_guide_slug || "");
    const productPrice = String(body._param_product_price || "");
    const orderId = String(body.order_id || body.customer_extra || "");
    const paymentMethod = String(body.payment_type || body.payment_method || "");
    const customerEmail = String(body.customer_email || body._param_email || "").toLowerCase().trim();

    console.log("Processing payment - TG:", telegramId, "Slug:", guideSlug, "Price:", productPrice, "Email:", customerEmail);

    if (!guideSlug) {
      console.error("Missing guide_slug");
      return new Response("Missing guide_slug", { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Find user
    let userData: any = null;

    if (telegramId && telegramId !== "unknown" && telegramId !== "undefined" && telegramId !== "null" && telegramId !== "") {
      const { data, error } = await supabase.from("users").select("id").eq("telegram_id", telegramId).maybeSingle();
      if (!error && data) { userData = data; console.log("User found by telegram_id:", userData.id); }
    }

    if (!userData && telegramId && telegramId !== "unknown" && telegramId !== "") {
      const { data, error } = await supabase.from("users").select("id").eq("max_user_id", telegramId).maybeSingle();
      if (!error && data) { userData = data; console.log("User found by max_user_id:", userData.id); }
    }

    if (!userData && customerEmail && customerEmail.includes("@")) {
      const { data, error } = await supabase.from("users").select("id").eq("email", customerEmail).maybeSingle();
      if (!error && data) { userData = data; console.log("User found by email:", userData.id); }
    }

    const maxUserId = String(body._param_max_user_id || "");
    if (!userData && maxUserId && maxUserId !== "unknown" && maxUserId !== "") {
      const { data, error } = await supabase.from("users").select("id").eq("max_user_id", maxUserId).maybeSingle();
      if (!error && data) { userData = data; console.log("User found by max_user_id fallback:", userData.id); }
    }

    if (!userData) {
      console.error("User not found. TG:", telegramId, "Email:", customerEmail, "MAX:", maxUserId);
      return new Response("User not found", { status: 200, headers: corsHeaders });
    }

    // Find product (include product_type and name)
    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("id,price,product_type,name")
      .eq("content_access->>slug", guideSlug)
      .single();

    if (productError || !productData) {
      console.error("Product not found for slug:", guideSlug, productError);
      return new Response("Product not found", { status: 200, headers: corsHeaders });
    }

    // Idempotency: for inner_circle renewals check by order_id; for guides check by user+product
    if (productData.product_type === "inner_circle") {
      if (orderId) {
        const { data: existingByOrder } = await supabase
          .from("purchases")
          .select("id")
          .eq("prodamus_order", orderId)
          .maybeSingle();
        if (existingByOrder) {
          console.log("Order already processed:", orderId);
          return new Response("OK (duplicate)", { status: 200, headers: corsHeaders });
        }
      }
    } else {
      const { data: existingPurchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", userData.id)
        .eq("product_id", productData.id)
        .eq("status", "paid")
        .maybeSingle();
      if (existingPurchase) {
        console.log("Purchase already exists, skipping.");
        return new Response("OK (duplicate)", { status: 200, headers: corsHeaders });
      }
    }

    // Insert purchase
    const { error: insertError } = await supabase.from("purchases").insert({
      user_id: userData.id,
      product_id: productData.id,
      amount: parseFloat(productPrice) || productData.price,
      currency: "rub",
      status: "paid",
      prodamus_order: orderId,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString()
    });

    if (insertError) {
      console.error("Insert purchase error:", insertError);
      return new Response("DB error", { status: 500, headers: corsHeaders });
    }

    console.log("Purchase recorded. User:", userData.id, "Product:", productData.id);

    // Handle inner_circle subscription
    if (productData.product_type === "inner_circle") {
      const days = guideSlug.startsWith("private_30") ? 30 : 90;
      const isSenior = guideSlug.includes("_senior");

      const { data: currentAccess } = await supabase
        .from("user_access")
        .select("inner_circle_expires")
        .eq("user_id", userData.id)
        .maybeSingle();

      const now = new Date();
      const base = currentAccess?.inner_circle_expires && new Date(currentAccess.inner_circle_expires) > now
        ? new Date(currentAccess.inner_circle_expires)
        : now;

      const expiresAt = new Date(base);
      expiresAt.setDate(expiresAt.getDate() + days);

      const { error: accessError } = await supabase.from("user_access").upsert({
        user_id: userData.id,
        has_inner_circle: true,
        inner_circle_expires: expiresAt.toISOString(),
        is_senior: isSenior,
        updated_at: now.toISOString(),
      }, { onConflict: "user_id" });

      if (accessError) {
        console.error("user_access upsert error:", accessError);
      } else {
        console.log("Inner circle granted: user", userData.id, days, "days, expires", expiresAt.toISOString());
      }

      // Get user info for notifications
      const { data: userInfo } = await supabase
        .from("users")
        .select("telegram_id, first_name")
        .eq("id", userData.id)
        .single();

      const expiryStr = expiresAt.toLocaleDateString("ru-RU");

      if (userInfo?.telegram_id) {
        await notifyTelegram(
          userInfo.telegram_id,
          `Добро пожаловать в Ближний круг! Доступ активен до ${expiryStr}.`
        );
      }

      const userName = userInfo?.first_name || `User #${userData.id}`;
      await notifyTelegram(
        ADMIN_TG_ID,
        `Новая оплата Ближнего круга: ${userName}, ${days} дней${isSenior ? " (пенсионер)" : ""}. Доступ до ${expiryStr}.`
      );
    }

    return new Response("OK", { status: 200, headers: corsHeaders });

  } catch (e) {
    console.error("Webhook processing error:", e);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
