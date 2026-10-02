import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { PRODUCTS } from "../../../lib/products";

const PID = "hngintern-f6d4f";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
const db = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const naira = (n) => "₦" + n.toLocaleString("en-NG");

async function who(req) {
  const t = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { payload } = await jwtVerify(t, JWKS, { issuer: "https://securetoken.google.com/" + PID, audience: PID });
  return payload;
}

export async function GET(req) {
  try {
    const u = await who(req);
    const { data, error } = await db().from("orders").select("*").eq("user_id", u.sub).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ orders: data });
  } catch (e) { return NextResponse.json({ error: "Could not load orders: " + e.message }, { status: 401 }); }
}

export async function POST(req) {
  let u;
  try { u = await who(req); } catch { return NextResponse.json({ error: "Sign in again to continue." }, { status: 401 }); }
  const b = await req.json();
  const items = (b.items || []).map((i) => {
    const p = PRODUCTS.find((x) => x.id === i.id); const qty = Math.min(50, Math.max(1, parseInt(i.qty) || 0));
    return p && { id: p.id, name: p.name, price: p.price, qty };
  }).filter(Boolean);
  if (!items.length || !b.name || !b.phone || !b.address) return NextResponse.json({ error: "Add items and fill in all delivery details." }, { status: 400 });
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const { data, error } = await db().from("orders").insert({ user_id: u.sub, email: u.email, customer_name: b.name, phone: b.phone, address: b.address, items, total }).select().single();
  if (error) return NextResponse.json({ error: "Could not save order: " + error.message }, { status: 500 });

  let emailed = false;
  try {
    const rows = items.map((i) => `<tr><td style="padding:8px;border-bottom:1px solid #e3eadc">${i.name} × ${i.qty}</td><td style="padding:8px;border-bottom:1px solid #e3eadc;text-align:right">${naira(i.price * i.qty)}</td></tr>`).join("");
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #cfdac8"><div style="background:#1d4b2a;color:#fff;padding:18px"><h2 style="margin:0">Naija Pantry</h2></div><div style="padding:18px"><p>E kaabo, ${b.name}! Your order is confirmed.</p><p style="color:#666;font-size:13px">Order ref: ${data.id.slice(0, 8).toUpperCase()}</p><table width="100%" style="border-collapse:collapse">${rows}<tr><td style="padding:10px;font-weight:bold">Total</td><td style="padding:10px;text-align:right;font-weight:bold;color:#d9480f">${naira(total)}</td></tr></table><p><b>Delivering to:</b><br>${b.address}<br>${b.phone}</p></div></div>`;
    const r = await fetch(`${process.env.MAILGUN_BASE || "https://api.mailgun.net"}/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from("api:" + process.env.MAILGUN_API_KEY).toString("base64") },
      body: new URLSearchParams({ from: process.env.MAILGUN_FROM, to: u.email, subject: "Your Naija Pantry order is confirmed", html }),
    });
    emailed = r.ok;
  } catch {}
  return NextResponse.json({ order: data, emailed });
}
