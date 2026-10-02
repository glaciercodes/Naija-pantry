"use client";
import { useState, useEffect } from "react";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, provider } from "../lib/firebase";
import { PRODUCTS } from "../lib/products";

const naira = (n) => "₦" + n.toLocaleString("en-NG");
async function api(method, body) {
  const t = await auth.currentUser.getIdToken();
  const r = await fetch("/api/orders", { method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: body && JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("shop");
  const [cart, setCart] = useState({});
  const [orders, setOrders] = useState([]);
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api("GET").then((j) => setOrders(j.orders)).catch((e) => setMsg(e.message));
  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); if (u) { setF((x) => ({ ...x, name: x.name || u.displayName || "" })); load(); } else setOrders([]); }), []);

  const lines = PRODUCTS.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] }));
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const add = (id, d) => setCart((c) => { const q = (c[id] || 0) + d; const n = { ...c }; q > 0 ? (n[id] = q) : delete n[id]; return n; });
  const login = () => signInWithPopup(auth, provider).catch((e) => setMsg(e.message));

  async function checkout() {
    setBusy(true); setMsg("");
    try {
      const j = await api("POST", { items: lines.map((l) => ({ id: l.id, qty: l.qty })), ...f });
      setCart({}); await load(); setView("orders");
      setMsg(j.emailed ? "Order placed. A confirmation email is on its way to " + user.email : "Order placed, but the confirmation email could not be sent.");
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  }

  return (<>
    <div className="strip" />
    <header>
      <h1>Naija Pantry</h1>
      <nav>
        {["shop", "cart", "orders"].map((v) => <button key={v} className={view === v ? "on" : ""} onClick={() => { setView(v); setMsg(""); }}>{v === "cart" ? `Cart (${count})` : v === "shop" ? "Shop" : "My orders"}</button>)}
        {user ? <button onClick={() => signOut(auth)}>Log out</button> : <button className="p" onClick={login}>Sign in with Google</button>}
      </nav>
    </header>
    <main>
      {msg && <div className="msg" role="status">{msg}</div>}
      {view === "shop" && <><p>Everything for your soup pot, from garri to egusi. Pick your items and we deliver.</p>
        <div className="grid">{PRODUCTS.map((p) => <div className="card" key={p.id}><div className="ic">{p.icon}</div><b>{p.name}</b><small>{p.note}</small><div className="pr">{naira(p.price)}</div><button onClick={() => add(p.id, 1)}>Add to cart</button></div>)}</div></>}
      {view === "cart" && <>{!lines.length ? <p>Your cart is empty. Add something from the shop.</p> : <>
        {lines.map((l) => <div className="row" key={l.id}><span>{l.icon} {l.name}</span><span><button onClick={() => add(l.id, -1)}>−</button> {l.qty} <button onClick={() => add(l.id, 1)}>+</button></span><b>{naira(l.price * l.qty)}</b></div>)}
        <h2>Total: {naira(total)}</h2>
        {!user ? <button className="p" onClick={login}>Sign in to check out</button> : <>
          <h3>Delivery details</h3>
          <input placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input placeholder="Phone number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <input placeholder="Delivery address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          <button className="p" disabled={busy} onClick={checkout}>{busy ? "Placing order…" : "Place order"}</button></>}</>}</>}
      {view === "orders" && (!user ? <p>Sign in to see your orders.</p> : !orders.length ? <p>No orders yet. Your orders will show here after checkout.</p> :
        orders.map((o) => <div className="card" key={o.id} style={{ marginBottom: 12 }}><b>Order {o.id.slice(0, 8).toUpperCase()}</b><small>{new Date(o.created_at).toLocaleString("en-NG")}</small>
          {o.items.map((i) => <div key={i.id}>{i.name} × {i.qty}</div>)}<div className="pr">{naira(o.total)}</div></div>))}
    </main></>);
}
