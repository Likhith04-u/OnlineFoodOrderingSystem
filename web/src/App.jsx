import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, Search, UserRound, LogOut, Plus, Minus, Trash2, ChefHat, Clock3, PackageCheck, LayoutDashboard, Utensils, ClipboardList, X, ArrowRight, CheckCircle2, CircleUserRound } from "lucide-react";

const API = "http://localhost:5000/api";
const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const fallbackFoods = [
  { _id:"demo1", name:"Classic Veg Burger", description:"Grilled veggie patty, lettuce and house sauce", category:"Burgers", price:129, image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", available:true },
  { _id:"demo2", name:"Margherita Pizza", description:"Tomato, mozzarella and fresh basil", category:"Pizza", price:249, image:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800", available:true },
  { _id:"demo3", name:"Creamy Alfredo Pasta", description:"Pasta in a creamy parmesan sauce", category:"Pasta", price:219, image:"https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800", available:true },
  { _id:"demo4", name:"Crispy French Fries", description:"Golden fries with a pinch of sea salt", category:"Sides", price:89, image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800", available:true },
  { _id:"demo5", name:"Chocolate Brownie", description:"Rich chocolate brownie dessert", category:"Desserts", price:99, image:"https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800", available:true },
  { _id:"demo6", name:"Fresh Lemonade", description:"Fresh lemon, mint and chilled water", category:"Drinks", price:69, image:"https://images.unsplash.com/photo-1513558161293-cdad765edc2b?w=800", available:true }
];
const emptyFood = { name:"", description:"", category:"Burgers", price:"", image:"", available:true };
async function request(path, options = {}, token = "") {
  const res = await fetch(`${API}${path}`, { ...options, headers: { "Content-Type":"application/json", ...(token ? { Authorization:`Bearer ${token}` } : {}), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export default function App() {
  const [foods, setFoods] = useState(fallbackFoods);
  const [apiOnline, setApiOnline] = useState(false);
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("craveUser") || "null"); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("craveToken") || "");
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem("craveCart") || "[]"); } catch { return []; } });
  const [orders, setOrders] = useState([]);
  const [adminStats, setAdminStats] = useState({ foods:0, orders:0, customers:0, revenue:0 });
  const [view, setView] = useState("menu");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ name:"", email:"", password:"" });
  const [address, setAddress] = useState("");
  const [foodForm, setFoodForm] = useState(emptyFood);
  const [editingId, setEditingId] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("All");
  const [busy, setBusy] = useState(false);

  useEffect(() => { localStorage.setItem("craveCart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { if (token && user) { localStorage.setItem("craveToken", token); localStorage.setItem("craveUser", JSON.stringify(user)); } else { localStorage.removeItem("craveToken"); localStorage.removeItem("craveUser"); } }, [token, user]);
  useEffect(() => {
    request("/foods").then(data => { setFoods(data); setApiOnline(true); }).catch(() => setApiOnline(false));
  }, []);
  useEffect(() => {
    if (!token || !user) return;
    if (user.role === "admin") {
      request("/foods?admin=true", {}, token).then(setFoods).catch(() => {});
      request("/orders", {}, token).then(setOrders).catch(() => {});
      request("/admin/stats", {}, token).then(setAdminStats).catch(() => {});
    } else request("/orders/mine", {}, token).then(setOrders).catch(() => {});
  }, [token, user, view]);

  const categories = useMemo(() => ["All", ...new Set(foods.map(f => f.category).filter(Boolean))], [foods]);
  const filteredFoods = useMemo(() => foods.filter(f => (category === "All" || f.category === category) && `${f.name} ${f.description} ${f.category}`.toLowerCase().includes(search.toLowerCase())), [foods, category, search]);
  const cartCount = cart.reduce((n, item) => n + item.quantity, 0);
  const total = cart.reduce((n, item) => n + item.price * item.quantity, 0);
  const isAdmin = user?.role === "admin";

  function addToCart(food) {
    if (!food._id || String(food._id).startsWith("demo")) { setNotice("Start the backend and seed the menu before placing real orders."); return; }
    setCart(old => { const found = old.find(x => x.foodId === food._id); return found ? old.map(x => x.foodId === food._id ? { ...x, quantity:x.quantity + 1 } : x) : [...old, { foodId:food._id, name:food.name, price:food.price, image:food.image, quantity:1 }]; });
    setNotice(`${food.name} added to your cart`);
  }
  function changeQty(id, delta) { setCart(old => old.map(x => x.foodId === id ? { ...x, quantity:x.quantity + delta } : x).filter(x => x.quantity > 0)); }
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setNotice("");
    try {
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const data = await request(path, { method:"POST", body:JSON.stringify(authForm) });
      setUser(data.user); setToken(data.token); setAuthOpen(false); setAuthForm({ name:"", email:"", password:"" });
      setView(data.user.role === "admin" ? "dashboard" : "menu"); setNotice(`Welcome, ${data.user.name}!`);
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }
  function logout() { setUser(null); setToken(""); setOrders([]); setView("menu"); setNotice("You have been logged out."); }
  async function checkout(e) {
    e.preventDefault();
    if (!user) { setAuthMode("login"); setAuthOpen(true); setNotice("Please log in before placing an order."); return; }
    setBusy(true);
    try {
      const order = await request("/orders", { method:"POST", body:JSON.stringify({ items:cart.map(x => ({ foodId:x.foodId, quantity:x.quantity })), deliveryAddress:address }) }, token);
      setOrders(old => [order, ...old]); setCart([]); setAddress(""); setView("orders"); setNotice("Order placed successfully! You can track its status in My Orders.");
    } catch (err) { setNotice(err.message); }
    finally { setBusy(false); }
  }
  function resetFoodForm() { setFoodForm(emptyFood); setEditingId(""); }
  async function saveFood(e) {
    e.preventDefault();
    try {
      const payload = { ...foodForm, price:Number(foodForm.price) };
      const saved = editingId ? await request(`/foods/${editingId}`, { method:"PUT", body:JSON.stringify(payload) }, token) : await request("/foods", { method:"POST", body:JSON.stringify(payload) }, token);
      setFoods(old => editingId ? old.map(x => x._id === editingId ? saved : x) : [saved, ...old]); resetFoodForm(); setNotice(editingId ? "Food item updated." : "Food item added.");
    } catch (err) { setNotice(err.message); }
  }
  async function deleteFood(id) {
    if (!window.confirm("Delete this food item?")) return;
    try { await request(`/foods/${id}`, { method:"DELETE" }, token); setFoods(old => old.filter(x => x._id !== id)); setNotice("Food item removed."); }
    catch (err) { setNotice(err.message); }
  }
  function editFood(food) { setEditingId(food._id); setFoodForm({ name:food.name, description:food.description || "", category:food.category, price:String(food.price), image:food.image || "", available:food.available !== false }); window.scrollTo({ top:0, behavior:"smooth" }); }
  async function updateOrder(id, status) {
    try { const updated = await request(`/orders/${id}/status`, { method:"PATCH", body:JSON.stringify({ status }) }, token); setOrders(old => old.map(o => o._id === id ? updated : o)); setNotice("Order status updated."); }
    catch (err) { setNotice(err.message); }
  }
  const visibleOrders = orders.filter(o => (orderStatus === "All" || o.status === orderStatus) && `${o.customerName} ${o.deliveryAddress} ${o._id}`.toLowerCase().includes(orderSearch.toLowerCase()));

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView("menu")}><span className="brand-mark"><ChefHat size={23}/></span><span>crave<span className="brand-dot">.</span><small>GOOD FOOD, GOOD MOOD</small></span></button>
      <nav className="main-nav">
        <button className={view === "menu" ? "nav-link active" : "nav-link"} onClick={() => setView("menu")}>Explore menu</button>
        {user && !isAdmin && <button className={view === "orders" ? "nav-link active" : "nav-link"} onClick={() => setView("orders")}>My orders</button>}
        {isAdmin && <><button className={view === "dashboard" ? "nav-link active" : "nav-link"} onClick={() => setView("dashboard")}>Dashboard</button><button className={view === "manage" ? "nav-link active" : "nav-link"} onClick={() => setView("manage")}>Manage menu</button><button className={view === "orders" ? "nav-link active" : "nav-link"} onClick={() => setView("orders")}>Orders</button></>}
      </nav>
      <div className="top-actions">
        <button className="cart-button" onClick={() => setView("cart")} aria-label="Open cart"><ShoppingBag size={19}/><span>Cart</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
        {user ? <div className="user-chip"><CircleUserRound size={18}/><span>{user.name.split(" ")[0]}</span><button title="Log out" onClick={logout} className="icon-button"><LogOut size={16}/></button></div> : <button className="login-button" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}><UserRound size={17}/> Sign in</button>}
      </div>
    </header>

    {notice && <div className="notice"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16}/></button></div>}
    {!apiOnline && <div className="offline-banner">Demo menu is shown. Start the backend and MongoDB to enable accounts, administration, and real orders.</div>}

    {view === "menu" && <main>
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-dot"/> FRESHLY MADE, JUST FOR YOU</span><h1>Good food.<br/><em>Great mood.</em></h1><p>Cravings don't wait. Discover delicious favourites, made fresh and delivered right to your door.</p><button className="primary-button" onClick={() => document.getElementById("menu-section")?.scrollIntoView({ behavior:"smooth" })}>Explore our menu <ArrowRight size={18}/></button><div className="hero-meta"><span><Clock3 size={16}/> 25–35 min delivery</span><span><PackageCheck size={16}/> Freshly prepared</span></div></div>
        <div className="hero-visual"><div className="hero-photo"><img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1100" alt="Fresh pizza on a table"/></div><div className="floating-card"><span className="floating-emoji">⭐</span><div><strong>4.9/5</strong><small>Loved by foodies</small></div></div><div className="hero-sticker">MADE WITH<br/>♥ & FRESHNESS</div></div>
      </section>
      <section className="benefit-strip"><div><span className="benefit-icon">✦</span><span><b>Fresh ingredients</b><small>Quality in every bite</small></span></div><div><span className="benefit-icon">⌁</span><span><b>Quick delivery</b><small>At your doorstep fast</small></span></div><div><span className="benefit-icon">♡</span><span><b>Made with love</b><small>Food that feels good</small></span></div></section>
      <section id="menu-section" className="menu-section"><div className="section-heading"><div><span className="eyebrow">THE GOOD STUFF</span><h2>Find your <em>favourite.</em></h2><p>Fresh picks for every kind of craving.</p></div><div className="menu-search"><Search size={18}/><input placeholder="Search dishes..." value={search} onChange={e => setSearch(e.target.value)}/>{search && <button onClick={() => setSearch("")}><X size={15}/></button>}</div></div>
        <div className="category-row">{categories.map(c => <button key={c} className={category === c ? "category-pill selected" : "category-pill"} onClick={() => setCategory(c)}>{c}</button>)}</div>
        <div className="food-grid">{filteredFoods.map((food, i) => <article className="food-card" key={food._id}><div className="food-image"><img src={food.image || fallbackFoods[i % fallbackFoods.length].image} alt={food.name} onError={e => { e.currentTarget.src = fallbackFoods[i % fallbackFoods.length].image; }}/><span className="food-category">{food.category}</span><button className="add-button" onClick={() => addToCart(food)} title="Add to cart"><Plus size={20}/></button></div><div className="food-info"><div className="food-title-row"><h3>{food.name}</h3><span className="veg-dot"/></div><p>{food.description || "Made fresh in our kitchen, especially for you."}</p><div className="food-bottom"><strong>{money(food.price)}</strong><span>★ 4.8 <small>({12 + i * 7})</small></span></div></div></article>)}</div>
        {filteredFoods.length === 0 && <div className="empty-state"><span>🍽️</span><h3>No dishes found</h3><p>Try another search or category.</p><button className="secondary-button" onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button></div>}
      </section>
      <section className="bottom-cta"><div><span className="eyebrow">A LITTLE TREAT FOR YOU</span><h2>Your next favourite is<br/>just a few clicks away.</h2><p>Pick your favourites and let us handle the delicious part.</p></div><button className="primary-button" onClick={() => document.getElementById("menu-section")?.scrollIntoView({ behavior:"smooth" })}>Order something good <ArrowRight size={18}/></button></section>
    </main>}

    {view === "cart" && <main className="page-wrap"><div className="page-title"><span className="eyebrow">YOUR SELECTION</span><h1>Your <em>cart.</em></h1><p>All the good stuff, in one place.</p></div>{cart.length === 0 ? <div className="empty-state"><ShoppingBag size={42}/><h3>Your cart is waiting</h3><p>Add something delicious from the menu.</p><button className="primary-button" onClick={() => setView("menu")}>Browse menu <ArrowRight size={18}/></button></div> : <div className="cart-layout"><div className="cart-list">{cart.map(item => <div className="cart-item" key={item.foodId}><img src={item.image || fallbackFoods[0].image} alt={item.name}/><div className="cart-item-info"><h3>{item.name}</h3><strong>{money(item.price)}</strong><div className="qty-control"><button onClick={() => changeQty(item.foodId,-1)}><Minus size={14}/></button><span>{item.quantity}</span><button onClick={() => changeQty(item.foodId,1)}><Plus size={14}/></button></div></div><button className="remove-button" onClick={() => setCart(old => old.filter(x => x.foodId !== item.foodId))}><Trash2 size={17}/></button></div>)}</div><form className="checkout-card" onSubmit={checkout}><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{money(total)}</span></div><div className="summary-line"><span>Delivery</span><span className="free-label">FREE</span></div><div className="summary-line total-line"><b>Total</b><b>{money(total)}</b></div><label className="field-label">Delivery address<textarea required rows="3" placeholder="House no., street, area, city..." value={address} onChange={e => setAddress(e.target.value)}/></label><button className="primary-button full-button" disabled={busy}>{busy ? "Placing order..." : "Place order"} <ArrowRight size={18}/></button><small className="secure-note">🔒 Secure checkout · Pay on delivery</small></form></div>}</main>}

    {view === "orders" && <main className="page-wrap"><div className="page-title"><span className="eyebrow">{isAdmin ? "RESTAURANT OPERATIONS" : "YOUR FOOD JOURNEY"}</span><h1>{isAdmin ? "Manage " : "My "}<em>orders.</em></h1><p>{isAdmin ? "Review incoming orders and keep customers updated." : "Track every delicious delivery."}</p></div>{isAdmin && <div className="filter-toolbar"><div className="menu-search"><Search size={18}/><input placeholder="Search customer, address or order ID..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)}/></div><select value={orderStatus} onChange={e => setOrderStatus(e.target.value)}><option>All</option>{["Pending","Preparing","Ready","Delivered","Cancelled"].map(s => <option key={s}>{s}</option>)}</select></div>}{visibleOrders.length === 0 ? <div className="empty-state"><ClipboardList size={42}/><h3>No orders yet</h3><p>{isAdmin ? "Customer orders will appear here." : "Once you place an order, its progress will appear here."}</p><button className="secondary-button" onClick={() => setView("menu")}>Explore menu</button></div> : <div className="orders-list">{visibleOrders.map(order => <article className="order-card" key={order._id}><div className="order-top"><div><small>ORDER #{String(order._id).slice(-8).toUpperCase()}</small><h3>{order.customerName}</h3><p>{new Date(order.createdAt).toLocaleString()}</p></div><span className={`status status-${order.status.toLowerCase()}`}>{order.status}</span></div><div className="order-items">{order.items.map((item,i) => <span key={i}>{item.name} × {item.quantity}</span>)}</div><div className="order-bottom"><span>📍 {order.deliveryAddress}</span><strong>{money(order.total)}</strong></div>{isAdmin && <div className="order-admin-actions"><label>Update status</label><select value={order.status} onChange={e => updateOrder(order._id,e.target.value)}>{["Pending","Preparing","Ready","Delivered","Cancelled"].map(s => <option key={s}>{s}</option>)}</select></div>}<div className="order-progress">{["Pending","Preparing","Ready","Delivered"].map((s,i) => <div key={s} className={`progress-step ${["Pending","Preparing","Ready","Delivered"].indexOf(order.status) >= i && order.status !== "Cancelled" ? "done" : ""}`}><span>{i+1}</span><small>{s}</small></div>)}</div>{order.status === "Cancelled" && <p className="cancelled-note">This order has been cancelled.</p>}</article>)}</div>}</main>}

    {view === "dashboard" && isAdmin && <main className="page-wrap"><div className="page-title"><span className="eyebrow">YOUR RESTAURANT AT A GLANCE</span><h1>Admin <em>dashboard.</em></h1><p>Welcome back, {user.name}. Here's what's happening today.</p></div><div className="stats-grid"><div className="stat-card"><span className="stat-icon orange"><Utensils/></span><small>Menu items</small><strong>{adminStats.foods}</strong><span>Items listed in menu</span></div><div className="stat-card"><span className="stat-icon purple"><ClipboardList/></span><small>Total orders</small><strong>{adminStats.orders}</strong><span>Orders received</span></div><div className="stat-card"><span className="stat-icon green"><CircleUserRound/></span><small>Customers</small><strong>{adminStats.customers}</strong><span>Registered customers</span></div><div className="stat-card"><span className="stat-icon yellow">₹</span><small>Order value</small><strong>{money(adminStats.revenue)}</strong><span>Excluding cancelled orders</span></div></div><div className="dashboard-panels"><section className="panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>Latest customer activity</p></div><button className="text-button" onClick={() => setView("orders")}>View all <ArrowRight size={15}/></button></div>{orders.slice(0,5).length ? orders.slice(0,5).map(o => <div className="recent-row" key={o._id}><span className="recent-avatar"><ClipboardList size={17}/></span><div className="recent-info"><b>{o.customerName}</b><small>{o.items.length} item(s) · {new Date(o.createdAt).toLocaleDateString()}</small></div><strong>{money(o.total)}</strong><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></div>) : <p className="muted">No orders have been placed yet.</p>}</section><section className="panel quick-panel"><span className="quick-icon"><ChefHat size={25}/></span><h2>Keep the menu fresh</h2><p>Add seasonal specials, update prices, or remove items that are unavailable.</p><button className="primary-button" onClick={() => { resetFoodForm(); setView("manage"); }}>Manage menu <ArrowRight size={17}/></button><button className="secondary-button" onClick={() => setView("orders")}>Review orders</button></section></div></main>}

    {view === "manage" && isAdmin && <main className="page-wrap"><div className="page-title"><span className="eyebrow">RESTAURANT ADMINISTRATION</span><h1>Manage the <em>menu.</em></h1><p>Add new dishes, update details, and keep your menu current.</p></div><div className="manage-layout"><form className="food-form panel" onSubmit={saveFood}><h2>{editingId ? "Edit food item" : "Add a food item"}</h2><label className="field-label">Food name<input required value={foodForm.name} onChange={e => setFoodForm({...foodForm,name:e.target.value})} placeholder="e.g. Paneer Tikka Pizza"/></label><label className="field-label">Description<textarea rows="3" value={foodForm.description} onChange={e => setFoodForm({...foodForm,description:e.target.value})} placeholder="Describe this dish"/></label><div className="form-two"><label className="field-label">Category<select value={foodForm.category} onChange={e => setFoodForm({...foodForm,category:e.target.value})}>{["Burgers","Pizza","Pasta","Sides","Desserts","Drinks","Indian","Other"].map(c => <option key={c}>{c}</option>)}</select></label><label className="field-label">Price (₹)<input required min="0" type="number" step="1" value={foodForm.price} onChange={e => setFoodForm({...foodForm,price:e.target.value})} placeholder="199"/></label></div><label className="field-label">Image URL (optional)<input value={foodForm.image} onChange={e => setFoodForm({...foodForm,image:e.target.value})} placeholder="https://..."/></label><label className="checkbox-label"><input type="checkbox" checked={foodForm.available} onChange={e => setFoodForm({...foodForm,available:e.target.checked})}/> Available to customers</label><div className="form-actions"><button className="primary-button">{editingId ? "Save changes" : "Add item"} <Plus size={17}/></button>{editingId && <button type="button" className="secondary-button" onClick={resetFoodForm}>Cancel</button>}</div></form><section className="panel menu-admin-list"><div className="panel-heading"><div><h2>Current menu</h2><p>{foods.length} item(s)</p></div></div>{foods.map(food => <div className="admin-food-row" key={food._id}><img src={food.image || fallbackFoods[0].image} alt={food.name}/><div className="admin-food-info"><b>{food.name}</b><small>{food.category} · {money(food.price)}</small><span className={food.available === false ? "unavailable-label" : "available-label"}>{food.available === false ? "Unavailable" : "Available"}</span></div><button className="icon-button" title="Edit" onClick={() => editFood(food)}>✎</button><button className="icon-button danger" title="Delete" onClick={() => deleteFood(food._id)}><Trash2 size={16}/></button></div>)}</section></div></main>}

    <footer className="footer"><div className="footer-brand"><span className="brand-mark"><ChefHat size={20}/></span><b>crave.</b></div><span>Made fresh. Served with love.</span><span>© {new Date().getFullYear()} Crave Kitchen</span></footer>

    {authOpen && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setAuthOpen(false); }}><section className="auth-modal"><button className="modal-close" onClick={() => setAuthOpen(false)}><X size={19}/></button><div className="auth-logo"><span className="brand-mark"><ChefHat size={24}/></span></div><span className="eyebrow">{authMode === "register" ? "JOIN THE TABLE" : "WELCOME BACK"}</span><h2>{authMode === "register" ? "Create your account." : "Good to see you."}</h2><p>{authMode === "register" ? "Sign up for a better way to satisfy your cravings." : "Sign in to order your favourites and track deliveries."}</p><form onSubmit={submitAuth}>{authMode === "register" && <label className="field-label">Full name<input required value={authForm.name} onChange={e => setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label>}<label className="field-label">Email address<input type="email" required value={authForm.email} onChange={e => setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label><label className="field-label">Password<input type="password" minLength={8} required value={authForm.password} onChange={e => setAuthForm({...authForm,password:e.target.value})} placeholder="At least 8 characters"/></label><button className="primary-button full-button" disabled={busy}>{busy ? "Please wait..." : authMode === "register" ? "Create account" : "Sign in"} <ArrowRight size={17}/></button></form><div className="auth-switch">{authMode === "register" ? "Already have an account?" : "New to Crave?"} <button onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); setNotice(""); }}> {authMode === "register" ? "Sign in" : "Create an account"}</button></div><div className="admin-hint">Restaurant administrator? Sign in with your admin credentials.</div></section></div>}
  </div>;
}
