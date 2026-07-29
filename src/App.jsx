import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc,
  onSnapshot, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import {
  LayoutDashboard, Users, AlertTriangle, ClipboardCheck, Wallet,
  Plus, Pencil, Trash2, X, Menu, LogOut, Check, Loader2, Shield, Lock,
  GraduationCap, ShoppingCart, Tractor, Home, Settings, MapPin, Clock,
} from "lucide-react";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyDQMYwKTt05hfSPW-Trl7NYPGyDFKA76dQ",
  authDomain: "golf-ciudad-real-50819.firebaseapp.com",
  projectId: "golf-ciudad-real-50819",
  storageBucket: "golf-ciudad-real-50819.firebasestorage.app",
  messagingSenderId: "447720199984",
  appId: "1:447720199984:web:312a8a1140d95554821af5",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function resolverClubId() { return "ciudad-real"; }
const CLUB_ID = resolverClubId();
const ROLES_PERMITIDOS_RECEPCION = ["superadmin", "admin", "recepcion"];

// --- Paleta "Libro de registro" (ledger de clubhouse) ---
const PAPEL = "#F7F4EC";
const PAPEL_TARJETA = "#FFFFFF";
const PAPEL_LINEA = "#DED5BD";
const TINTA = "#20291F";
const TINTA_SUAVE = "rgba(32,41,31,0.62)";
const TINTA_TENUE = "rgba(32,41,31,0.38)";
const VINO = "#7C2A35";
const VINO_SUAVE = "rgba(124,42,53,0.08)";
const VINO_LINEA = "rgba(124,42,53,0.35)";
const LATON = "#8C6C2C";
const SALVIA = "#4E6B4F";
const SALVIA_SUAVE = "rgba(78,107,79,0.12)";
const LADRILLO = "#A6512F";
const LADRILLO_SUAVE = "rgba(166,81,47,0.12)";
const SERIF = "'Spectral', Georgia, serif";
const SANS = "'IBM Plex Sans', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

function cx(...args) { return args.filter(Boolean).join(" "); }

function EstiloGlobal() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      body { background: ${PAPEL}; font-family: ${SANS}; }
      .bg-white { background-color: ${PAPEL_TARJETA} !important; }
      .bg-stone-50 { background-color: ${PAPEL} !important; }
      .bg-stone-100 { background-color: ${VINO_SUAVE} !important; }
      .hover\\:bg-stone-50:hover { background-color: ${PAPEL} !important; }
      .hover\\:bg-stone-100:hover { background-color: ${VINO_SUAVE} !important; }
      .border-stone-100, .border-stone-200, .border-stone-200\\/60,
      .border-stone-200\\/70, .border-stone-300 { border-color: ${PAPEL_LINEA} !important; }
      .text-stone-400 { color: ${TINTA_TENUE} !important; }
      .text-stone-500 { color: ${TINTA_SUAVE} !important; }
      .text-stone-600 { color: ${TINTA_SUAVE} !important; }
      .text-stone-700 { color: ${TINTA} !important; }
      .text-stone-800 { color: ${TINTA} !important; }
      .placeholder\\:text-stone-400::placeholder { color: ${TINTA_TENUE} !important; }
      .bg-emerald-50 { background-color: ${SALVIA_SUAVE} !important; }
      .text-emerald-700 { color: ${SALVIA} !important; }
      .bg-amber-50 { background-color: rgba(140,108,44,0.12) !important; }
      .text-amber-700, .text-amber-800 { color: ${LATON} !important; }
      .bg-red-50 { background-color: ${LADRILLO_SUAVE} !important; }
      .text-red-600 { color: ${LADRILLO} !important; }
      input::placeholder, textarea::placeholder { color: ${TINTA_TENUE}; }
      .num { font-family: ${MONO}; font-variant-numeric: tabular-nums; }
      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-thumb { background: ${PAPEL_LINEA}; border-radius: 999px; }
      ::-webkit-scrollbar-track { background: transparent; }
    `}</style>
  );
}

const GOLFB_APPS = [
  { id: "academia", nombre: "Academia", color: "#B03A2E", url: "https://academia.golfb.es/", Icon: GraduationCap },
  { id: "mantenimiento", nombre: "Mantenimiento", color: "#1A5C2A", url: "https://mantenimiento.golfb.es/", Icon: Tractor },
  { id: "proshop", nombre: "Proshop", color: "#2E6DA4", url: "https://proshop.golfb.es/", Icon: ShoppingCart },
  { id: "finanzas", nombre: "Finanzas", color: "#8E969E", url: "https://finanzas.golfb.es/", Icon: Wallet },
  { id: "master", nombre: "Golf B Master", color: "#C9A227", url: "https://golfb.es/", Icon: Home },
];
function AppSwitcher({ actual }) {
  return (
    <div>
      <p className="text-[10px] uppercase font-semibold mb-2.5 tracking-wider" style={{ color: TINTA_TENUE }}>Cambiar de app</p>
      <div className="flex items-center gap-2 flex-wrap">
        {GOLFB_APPS.map((appItem) => {
          const esActual = appItem.id === actual;
          return (
            
              <a
              key={appItem.id}
              href={esActual ? undefined : appItem.url}
              title={appItem.nombre}
              className={cx(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0",
                esActual ? "ring-2 ring-offset-1" : "opacity-55 hover:opacity-100 hover:scale-110"
              )}
              style={{ background: appItem.color, ...(esActual ? { "--tw-ring-color": VINO, "--tw-ring-offset-color": PAPEL } : {}) }}
              onClick={(e) => { if (esActual) e.preventDefault(); }}
            >
              <appItem.Icon size={15} color="white" strokeWidth={2} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function fechaCorta(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : null);
  if (!d) return "";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function horaCorta(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : null);
  if (!d) return "";
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
function fechaISO(ts) {
  const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fechaLegible(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { background: VINO_SUAVE, color: TINTA_SUAVE },
    verde: { background: SALVIA_SUAVE, color: SALVIA },
    ambar: { background: "rgba(140,108,44,0.12)", color: LATON },
    rojo: { background: LADRILLO_SUAVE, color: LADRILLO },
    dorado: { background: "rgba(140,108,44,0.12)", color: LATON },
  };
  return (
    <span className="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap" style={tones[tone] || tones.neutral}>
      {children}
    </span>
  );
}
function toneGravedad(g) {
  if (g === "Grave") return "rojo";
  if (g === "Moderada") return "ambar";
  return "verde";
}
function toneEstado(estado) {
  if (estado === "Completada" || estado === "Resuelta") return "verde";
  if (estado === "Pendiente") return "ambar";
  return "neutral";
}

function Cabecera({ titulo, subtitulo, children }) {
  return (
    <div className="flex items-start justify-between mb-8 pb-5 flex-wrap gap-3" style={{ borderBottom: `1px solid ${PAPEL_LINEA}` }}>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] mb-2 italic" style={{ color: VINO, fontFamily: SERIF }}>
          Recepcion · Golf Ciudad Real
        </p>
        <h1 className="text-[30px] font-medium tracking-tight leading-tight" style={{ color: TINTA, fontFamily: SERIF }}>{titulo}</h1>
        {subtitulo && <p className="text-sm mt-2" style={{ color: TINTA_SUAVE }}>{subtitulo}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
function BotonPrimario({ children, onClick, icon: Icon = Plus, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:brightness-110 active:scale-[0.99] transition"
      style={{ background: VINO, color: "#FFF9EF" }}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  );
}
function BotonSecundario({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition hover:bg-[rgba(124,42,53,0.05)]"
      style={{ borderColor: VINO_LINEA, color: VINO, background: "transparent" }}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}
function PillFiltro({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition"
      style={activo
        ? { background: VINO, color: "#FFF9EF", borderColor: VINO, fontWeight: 600 }
        : { color: TINTA_SUAVE, borderColor: PAPEL_LINEA, background: PAPEL_TARJETA }}
    >
      {children}
    </button>
  );
}
function Tarjeta({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={cx("rounded-xl border transition-all duration-200", onClick && "cursor-pointer hover:shadow-md", className)}
      style={{ background: PAPEL_TARJETA, borderColor: PAPEL_LINEA, boxShadow: "0 1px 2px rgba(32,41,31,0.04)" }}
    >
      {children}
    </div>
  );
}
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className={cx("bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto", wide ? "max-w-2xl" : "max-w-md")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${PAPEL_LINEA}` }}>
          <h3 className="font-medium text-lg" style={{ color: TINTA, fontFamily: SERIF }}>{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 transition" style={{ color: TINTA_TENUE }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <span className="block text-[13px] font-medium mb-1.5" style={{ color: TINTA_SUAVE }}>{label}</span>
      {children}
    </div>
  );
}
const inputCls = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition";
const inputStyle = { borderColor: PAPEL_LINEA, color: TINTA, background: PAPEL_TARJETA };

function coleccionClub(nombre) { return collection(db, "clubes", CLUB_ID, nombre); }
function docClub(nombre, id) { return doc(db, "clubes", CLUB_ID, nombre, id); }
function useColeccion(nombre, ordenarPor = "creadoEn", dir = "desc") {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const q = query(coleccionClub(nombre), orderBy(ordenarPor, dir));
    const unsub = onSnapshot(q, (snap) => {
      setDatos(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setCargando(false);
    }, (err) => { console.error(`Error leyendo ${nombre}:`, err); });
    return () => unsub();
  }, [nombre, ordenarPor, dir]);
  return { datos, cargando };
}
async function crearDoc(coleccion, data) { return addDoc(coleccionClub(coleccion), { ...data, creadoEn: serverTimestamp() }); }
async function actualizarDoc(coleccion, id, data) { return updateDoc(docClub(coleccion, id), data); }
async function borrarDoc(coleccion, id) { return deleteDoc(docClub(coleccion, id)); }

function docUsuario(uid) { return doc(db, "Usuarios", uid); }
function useAuthRecepcion() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [modulosActivos, setModulosActivos] = useState(null);
  const [nombreOperario, setNombreOperario] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDoc(docUsuario(user.uid));
          setUserRole(snap.exists() ? (snap.data().role || "pendiente") : "pendiente");
          setNombreOperario(snap.exists() ? (snap.data().nombre || null) : null);
        } catch (err) {
          console.error("Error al cargar rol:", err);
          setUserRole("pendiente");
        }
        try {
          const clubSnap = await getDoc(doc(db, "clubes", CLUB_ID));
          setModulosActivos(clubSnap.exists() && clubSnap.data().modulosActivos ? clubSnap.data().modulosActivos : null);
        } catch (err) {
          console.error("Error al cargar modulos activos del club:", err);
          setModulosActivos(null);
        }
      } else {
        setUserRole(null); setModulosActivos(null); setNombreOperario(null);
      }
      setCargandoAuth(false);
    });
    return unsub;
  }, []);
  return { currentUser, userRole, modulosActivos, nombreOperario, cargandoAuth };
}

const inputLoginCls = "w-full px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors";
function LoginRecepcion() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mostrarReset, setMostrarReset] = useState(false);
  const [resetEnviado, setResetEnviado] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError(""); setCargando(true);
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch { setError("Email o contrasena incorrectos."); }
    finally { setCargando(false); }
  }
  async function recuperar(e) {
    e.preventDefault();
    setError(""); setCargando(true);
    try { await sendPasswordResetEmail(auth, email); setResetEnviado(true); }
    catch { setError("No se pudo enviar el email. Revisa la direccion."); }
    finally { setCargando(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAPEL }}>
      <EstiloGlobal />
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <p className="text-3xl font-medium italic" style={{ color: TINTA, fontFamily: SERIF }}>Golf B</p>
          <p className="text-sm mt-2" style={{ color: TINTA_SUAVE }}>Recepcion · Golf Ciudad Real</p>
        </div>
        <div className="rounded-2xl p-7" style={{ background: PAPEL_TARJETA, border: `1px solid ${PAPEL_LINEA}`, boxShadow: "0 2px 12px rgba(32,41,31,0.06)" }}>
          {!mostrarReset ? (
            <form onSubmit={entrar} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: TINTA_SUAVE }}>Email</label>
                <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={inputLoginCls} style={inputStyle} placeholder="tu@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: TINTA_SUAVE }}>Contrasena</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputLoginCls} style={inputStyle} placeholder="********" />
              </div>
              {error && <p className="text-xs rounded-lg px-3 py-2" style={{ color: LADRILLO, background: LADRILLO_SUAVE }}>{error}</p>}
              <button type="submit" disabled={cargando} className="w-full font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50" style={{ background: VINO, color: "#FFF9EF" }}>
                {cargando ? "Entrando..." : "Entrar"}
              </button>
              <button type="button" onClick={() => { setMostrarReset(true); setError(""); }} className="w-full text-xs transition" style={{ color: TINTA_TENUE }}>
                He olvidado mi contrasena
              </button>
            </form>
          ) : (
            <>
              {!resetEnviado ? (
                <form onSubmit={recuperar} className="space-y-4">
                  <p className="text-xs" style={{ color: TINTA_SUAVE }}>Introduce tu email y te enviaremos un enlace para restablecer tu contrasena.</p>
                  <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={inputLoginCls} style={inputStyle} placeholder="tu@email.com" />
                  {error && <p className="text-xs rounded-lg px-3 py-2" style={{ color: LADRILLO, background: LADRILLO_SUAVE }}>{error}</p>}
                  <button type="submit" disabled={cargando} className="w-full font-semibold py-2.5 rounded-xl text-sm transition disabled:opacity-50" style={{ background: VINO, color: "#FFF9EF" }}>
                    {cargando ? "Enviando..." : "Enviar enlace"}
                  </button>
                </form>
              ) : (
                <p className="text-sm rounded-lg px-3 py-3" style={{ color: SALVIA, background: SALVIA_SUAVE }}>Te hemos enviado un email con instrucciones para recuperar tu contrasena.</p>
              )}
              <button type="button" onClick={() => { setMostrarReset(false); setResetEnviado(false); setError(""); }} className="w-full text-xs transition mt-3" style={{ color: TINTA_TENUE }}>
                Volver
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function AccesoPendienteRecepcion({ email }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAPEL }}>
      <EstiloGlobal />
      <div className="max-w-sm text-center">
        <Shield size={30} className="mx-auto mb-4" style={{ color: VINO }} />
        <p className="font-medium mb-1.5" style={{ color: TINTA, fontFamily: SERIF }}>Todavia no tienes acceso a Recepcion</p>
        <p className="text-sm mb-6" style={{ color: TINTA_SUAVE }}>La cuenta <span style={{ color: TINTA }}>{email}</span> ha entrado correctamente, pero no tiene un rol asignado en esta app. Pide al administrador que te de de alta.</p>
        <button onClick={() => signOut(auth)} className="text-sm font-medium px-5 py-2.5 rounded-xl" style={{ background: VINO, color: "#FFF9EF" }}>Cerrar sesion</button>
      </div>
    </div>
  );
}
function ModuloDesactivadoRecepcion({ email }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAPEL }}>
      <EstiloGlobal />
      <div className="max-w-sm text-center">
        <Lock size={30} className="mx-auto mb-4" style={{ color: VINO }} />
        <p className="font-medium mb-1.5" style={{ color: TINTA, fontFamily: SERIF }}>Recepcion no esta activo para tu club</p>
        <p className="text-sm mb-6" style={{ color: TINTA_SUAVE }}>La cuenta <span style={{ color: TINTA }}>{email}</span> ha entrado correctamente, pero este modulo no esta contratado actualmente. Contacta con el administrador del club.</p>
        <button onClick={() => signOut(auth)} className="text-sm font-medium px-5 py-2.5 rounded-xl" style={{ background: VINO, color: "#FFF9EF" }}>Cerrar sesion</button>
      </div>
    </div>
  );
}

export default function App() {
  const { currentUser: usuario, userRole, modulosActivos, nombreOperario, cargandoAuth } = useAuthRecepcion();
  const [vista, setVista] = useState("dashboard");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const NAV_GROUPS = [
    { label: "Principal", items: [
      { id: "dashboard", label: "Panel", Icon: LayoutDashboard },
    ]},
    { label: "Operativa", items: [
      { id: "ventas", label: "Ventas del dia", Icon: Wallet },
      { id: "checklist", label: "Checklist de tareas", Icon: ClipboardCheck },
      { id: "incidencias", label: "Incidencias", Icon: AlertTriangle },
      { id: "fichajes", label: "Fichajes", Icon: Clock },
    ]},
    { label: "Recursos", items: [
      { id: "equipo", label: "Equipo", Icon: Users },
      { id: "tipos_tarea", label: "Tareas del checklist", Icon: Settings },
      { id: "puntos_qr", label: "Puntos QR", Icon: MapPin },
    ]},
  ];

  const TITULOS = {
    dashboard: "Panel", ventas: "Ventas del dia", checklist: "Checklist de tareas",
    incidencias: "Incidencias", equipo: "Equipo", tipos_tarea: "Tareas del checklist", fichajes: "Fichajes", puntos_qr: "Puntos QR",
  };

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: PAPEL }}>
        <EstiloGlobal />
        <Loader2 size={28} className="animate-spin" style={{ color: VINO }} />
      </div>
    );
  }
  if (!usuario) return <LoginRecepcion />;
  if (!ROLES_PERMITIDOS_RECEPCION.includes(userRole)) return <AccesoPendienteRecepcion email={usuario.email} />;
  const qrParam = new URLSearchParams(window.location.search).get("qr");
  if (qrParam) return <FicharQR usuario={usuario} nombreOperario={nombreOperario} codigo={qrParam} />;
  if (userRole !== "superadmin" && modulosActivos && modulosActivos.recepcion === false) {
    return <ModuloDesactivadoRecepcion email={usuario.email} />;
  }

  return (
    <div className="min-h-screen flex" style={{ background: PAPEL }}>
      <EstiloGlobal />
      <aside
        className={cx(
          "fixed md:sticky top-0 left-0 h-screen w-72 flex-shrink-0 z-40 flex flex-col transition-transform duration-200",
          menuAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{ background: PAPEL_TARJETA, borderRight: `1px solid ${PAPEL_LINEA}` }}
      >
        <div className="px-6 pt-7 pb-5">
          <p className="text-[26px] font-medium italic" style={{ color: TINTA, fontFamily: SERIF }}>Golf B</p>
          <p className="text-[10.5px] mt-3 uppercase tracking-[0.2em] font-semibold" style={{ color: VINO }}>Recepcion</p>
          <p className="text-xs mt-2" style={{ color: TINTA_TENUE }}>Golf Ciudad Real C.D.</p>
          <div className="mt-5 h-px" style={{ background: PAPEL_LINEA }} />
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider px-2.5 mb-2" style={{ color: TINTA_TENUE }}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const activo = vista === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setVista(item.id); setMenuAbierto(false); }}
                      className="relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors"
                      style={activo ? { background: VINO_SUAVE, color: VINO } : { color: TINTA_SUAVE }}
                    >
                      {activo && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: VINO }} />
                      )}
                      <item.Icon size={16} strokeWidth={1.75} style={activo ? { color: VINO } : { color: TINTA_TENUE }} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-4 pb-4">
          <AppSwitcher actual="recepcion" />
        </div>
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-[11px] truncate" style={{ color: TINTA_TENUE }}>{usuario.email}</span>
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: TINTA_SUAVE }}
          >
            <LogOut size={13} /> Salir
          </button>
        </div>
        <div className="px-6 py-4 text-[11px] leading-relaxed" style={{ borderTop: `1px solid ${PAPEL_LINEA}`, color: TINTA_TENUE }}>
          Golf Ciudad Real C.D.
          <div className="mt-1.5" style={{ opacity: 0.7 }}>Club: {CLUB_ID}</div>
        </div>
      </aside>

      {menuAbierto && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setMenuAbierto(false)} />
      )}

      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: PAPEL_TARJETA, borderBottom: `1px solid ${PAPEL_LINEA}` }}>
          <button onClick={() => setMenuAbierto(true)} className="p-1" style={{ color: TINTA }}><Menu size={22} /></button>
          <p className="font-medium italic" style={{ color: TINTA, fontFamily: SERIF }}>Golf B · {TITULOS[vista]}</p>
        </header>
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          {vista === "dashboard" && <Dashboard irA={setVista} />}
          {vista === "ventas" && <VentasDia usuario={usuario} nombreOperario={nombreOperario} />}
          {vista === "checklist" && <Checklist usuario={usuario} nombreOperario={nombreOperario} />}
          {vista === "incidencias" && <Incidencias />}
          {vista === "equipo" && <Equipo />}
          {vista === "tipos_tarea" && <TiposTareaChecklist />}
          {vista === "fichajes" && <Fichajes />}
          {vista === "puntos_qr" && <PuntosQR />}
        </div>
      </main>
    </div>
  );
}

// --- Fila de "libro de registro": etiqueta ... linea de puntos ... importe ---
function FilaLedger({ etiqueta, valor, destacado }) {
  return (
    <div className="flex items-baseline gap-2 py-2.5">
      <span className="text-sm shrink-0" style={{ color: destacado ? TINTA : TINTA_SUAVE }}>{etiqueta}</span>
      <span className="flex-1 border-b border-dotted translate-y-[-3px]" style={{ borderColor: PAPEL_LINEA }} />
      <span className={cx("num text-sm shrink-0", destacado && "text-base font-medium")} style={{ color: destacado ? VINO : TINTA }}>{valor}</span>
    </div>
  );
}

function Dashboard({ irA }) {
  const hoy = fechaISO(new Date());
  const { datos: ventas } = useColeccion("recep_ventas_gf", "creadoEn", "desc");
  const { datos: proshopDias } = useColeccion("recep_ventas_proshop", "fecha", "desc");
  const { datos: checklistHoy } = useColeccion("recep_checklist_diario", "fecha", "desc");
  const { datos: incidencias } = useColeccion("recep_incidencias", "creadoEn", "desc");

  const ventasHoy = ventas.filter((v) => v.fecha === hoy);
  const totalSocios = ventasHoy.filter((v) => v.tipo === "socio").reduce((s, v) => s + Number(v.importe || 0), 0);
  const totalNoSocios = ventasHoy.filter((v) => v.tipo === "no_socio").reduce((s, v) => s + Number(v.importe || 0), 0);
  const totalCampo = totalSocios + totalNoSocios;
  const proshopHoy = proshopDias.find((p) => p.fecha === hoy);
  const totalProshop = Number(proshopHoy?.importe || 0);
  const totalGeneral = totalCampo + totalProshop;

  const checklistDeHoy = checklistHoy.find((c) => c.fecha === hoy);
  const tareasHechas = checklistDeHoy ? Object.values(checklistDeHoy.hechas || {}).filter(Boolean).length : 0;
  const tareasTotal = checklistDeHoy ? Object.keys(checklistDeHoy.hechas || {}).length : 0;

  const incidenciasAbiertas = incidencias.filter((i) => i.estado !== "Resuelta").length;

  return (
    <div>
      <Cabecera titulo="Panel de recepcion" subtitulo={`Registro del ${fechaLegible(hoy)}`} />

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 mb-8">
        <Tarjeta className="p-6" onClick={() => irA("ventas")}>
          <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color: TINTA_TENUE }}>Libro de ventas · hoy</p>
          <div className="mt-3" style={{ borderTop: `1px solid ${PAPEL_LINEA}` }}>
            <FilaLedger etiqueta="Green fees · socios" valor={`${totalSocios.toFixed(2)} EUR`} />
            <div style={{ borderTop: `1px solid ${PAPEL_LINEA}` }} />
            <FilaLedger etiqueta="Green fees · no socios" valor={`${totalNoSocios.toFixed(2)} EUR`} />
            <div style={{ borderTop: `1px solid ${PAPEL_LINEA}` }} />
            <FilaLedger etiqueta="Proshop (manual)" valor={`${totalProshop.toFixed(2)} EUR`} />
            <div style={{ borderTop: `2px solid ${TINTA}` }} />
            <FilaLedger etiqueta="Total del dia" valor={`${totalGeneral.toFixed(2)} EUR`} destacado />
          </div>
        </Tarjeta>

        <div className="grid grid-cols-2 gap-4 content-start">
          <Tarjeta className="p-5" onClick={() => irA("checklist")}>
            <ClipboardCheck size={18} strokeWidth={1.75} style={{ color: LATON }} className="mb-3" />
            <div className="text-2xl num font-medium" style={{ color: TINTA }}>{tareasHechas}/{tareasTotal || 0}</div>
            <div className="text-xs mt-1.5" style={{ color: TINTA_SUAVE }}>Checklist de hoy</div>
          </Tarjeta>
          <Tarjeta className="p-5" onClick={() => irA("incidencias")}>
            <AlertTriangle size={18} strokeWidth={1.75} style={{ color: incidenciasAbiertas > 0 ? LADRILLO : SALVIA }} className="mb-3" />
            <div className="text-2xl num font-medium" style={{ color: TINTA }}>{incidenciasAbiertas}</div>
            <div className="text-xs mt-1.5" style={{ color: TINTA_SUAVE }}>Incidencias abiertas</div>
          </Tarjeta>
          <Tarjeta className="p-5 col-span-2">
            <Wallet size={18} strokeWidth={1.75} style={{ color: VINO }} className="mb-3" />
            <div className="text-2xl num font-medium" style={{ color: VINO }}>{ventasHoy.length}</div>
            <div className="text-xs mt-1.5" style={{ color: TINTA_SUAVE }}>Ventas de green fee registradas hoy</div>
          </Tarjeta>
        </div>
      </div>

      <Tarjeta className="p-6">
        <h2 className="font-medium mb-4" style={{ color: TINTA, fontFamily: SERIF, fontSize: "17px" }}>Ultimas incidencias</h2>
        {incidencias.slice(0, 5).length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin incidencias registradas.</p>}
        <div>
          {incidencias.slice(0, 5).map((i, idx) => (
            <div key={i.id} className="flex items-center justify-between text-sm gap-3 py-2.5" style={idx > 0 ? { borderTop: `1px solid ${PAPEL_LINEA}` } : {}}>
              <span className="truncate" style={{ color: TINTA }}>{i.titulo}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge tone={toneGravedad(i.gravedad)}>{i.gravedad}</Badge>
                <Badge tone={toneEstado(i.estado)}>{i.estado}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}

function Equipo() {
  const { datos: equipo } = useColeccion("recep_equipo", "nombre", "asc");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const vacio = { nombre: "", rol: "", telefono: "" };
  const [form, setForm] = useState(vacio);

  function abrirNuevo() { setEditando(null); setForm(vacio); setModal(true); }
  function abrirEditar(m) { setEditando(m); setForm({ nombre: m.nombre, rol: m.rol || "", telefono: m.telefono || "" }); setModal(true); }
  async function guardar() {
    if (!form.nombre.trim()) { alert("Escribe un nombre."); return; }
    if (editando) await actualizarDoc("recep_equipo", editando.id, form);
    else await crearDoc("recep_equipo", form);
    setModal(false);
  }

  return (
    <div>
      <Cabecera titulo="Equipo" subtitulo="Personal de recepcion del club.">
        <BotonPrimario onClick={abrirNuevo}>Anadir</BotonPrimario>
      </Cabecera>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipo.map((m) => (
          <Tarjeta key={m.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium" style={{ color: TINTA }}>{m.nombre}</p>
                <p className="text-sm" style={{ color: TINTA_SUAVE }}>{m.rol}</p>
                {m.telefono && <p className="text-xs mt-1 num" style={{ color: TINTA_TENUE }}>{m.telefono}</p>}
              </div>
              <button onClick={() => abrirEditar(m)} className="p-1 rounded transition" style={{ color: TINTA_TENUE }}>
                <Pencil size={15} />
              </button>
            </div>
          </Tarjeta>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar miembro" : "Nuevo miembro"}>
        <Field label="Nombre"><input className={inputCls} style={inputStyle} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
        <Field label="Rol / puesto"><input className={inputCls} style={inputStyle} value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} /></Field>
        <Field label="Telefono (opcional)"><input className={inputCls} style={inputStyle} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Field>
        <div className="flex items-center justify-between mt-2">
          {editando ? (
            <button onClick={async () => { await borrarDoc("recep_equipo", editando.id); setModal(false); }} className="inline-flex items-center gap-1.5 text-sm" style={{ color: LADRILLO }}>
              <Trash2 size={14} /> Eliminar
            </button>
          ) : <span />}
          <BotonPrimario onClick={guardar} icon={null}>Guardar</BotonPrimario>
        </div>
      </Modal>
    </div>
  );
}

function VentasDia({ usuario, nombreOperario }) {
  const hoy = fechaISO(new Date());
  const [fecha, setFecha] = useState(hoy);
  const { datos: ventas } = useColeccion("recep_ventas_gf", "creadoEn", "desc");
  const { datos: proshopDias } = useColeccion("recep_ventas_proshop", "fecha", "desc");

  const [modal, setModal] = useState(false);
  const vacio = { tipo: "socio", jugadores: "1", importe: "" };
  const [form, setForm] = useState(vacio);

  const [proshopImporte, setProshopImporte] = useState("");
  const proshopDoc = proshopDias.find((p) => p.fecha === fecha);

  useEffect(() => {
    setProshopImporte(proshopDoc ? String(proshopDoc.importe) : "");
  }, [fecha, proshopDoc?.id]);

  const ventasFecha = ventas.filter((v) => v.fecha === fecha);
  const totalSocios = ventasFecha.filter((v) => v.tipo === "socio").reduce((s, v) => s + Number(v.importe || 0), 0);
  const totalNoSocios = ventasFecha.filter((v) => v.tipo === "no_socio").reduce((s, v) => s + Number(v.importe || 0), 0);

  function abrirNuevaVenta() { setForm(vacio); setModal(true); }
  async function guardarVenta() {
    if (!form.importe || Number(form.importe) <= 0) { alert("Introduce un importe valido."); return; }
    await crearDoc("recep_ventas_gf", {
      tipo: form.tipo,
      jugadores: Number(form.jugadores) || 1,
      importe: Number(form.importe),
      fecha,
      registradoPor: nombreOperario || usuario?.email || "",
    });
    setModal(false);
  }
  async function borrarVenta(id) {
    if (!confirm("Eliminar esta venta?")) return;
    await borrarDoc("recep_ventas_gf", id);
  }
  async function guardarProshop() {
    const importe = Number(proshopImporte) || 0;
    if (proshopDoc) await actualizarDoc("recep_ventas_proshop", proshopDoc.id, { importe });
    else await crearDoc("recep_ventas_proshop", { fecha, importe });
  }

  return (
    <div>
      <Cabecera titulo="Ventas del dia" subtitulo="Green fees de socios y no socios, y venta diaria de Proshop.">
        <BotonPrimario onClick={abrirNuevaVenta}>Nueva venta de green fee</BotonPrimario>
      </Cabecera>

      <div className="mb-6 max-w-xs">
        <Field label="Fecha"><input type="date" className={inputCls} style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
      </div>

      <Tarjeta className="p-6 mb-8 max-w-md">
        <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color: TINTA_TENUE }}>Resumen del dia</p>
        <div style={{ borderTop: `1px solid ${PAPEL_LINEA}` }}>
          <FilaLedger etiqueta="Socios" valor={`${totalSocios.toFixed(2)} EUR`} />
          <div style={{ borderTop: `1px solid ${PAPEL_LINEA}` }} />
          <FilaLedger etiqueta="No socios" valor={`${totalNoSocios.toFixed(2)} EUR`} />
        </div>
      </Tarjeta>

      <p className="text-sm font-medium mb-3" style={{ color: TINTA }}>Ventas de green fee del dia</p>
      <div className="space-y-2 mb-8">
        {ventasFecha.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin ventas registradas este dia.</p>}
        {ventasFecha.map((v) => (
          <Tarjeta key={v.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: TINTA }}>{v.tipo === "socio" ? "Socio" : "No socio"} · {v.jugadores} jugador{v.jugadores !== 1 ? "es" : ""}</p>
              <p className="text-xs" style={{ color: TINTA_SUAVE }}>{horaCorta(v.creadoEn)} {v.registradoPor ? `· ${v.registradoPor}` : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="num font-medium text-sm" style={{ color: VINO }}>{Number(v.importe).toFixed(2)} EUR</span>
              <button onClick={() => borrarVenta(v.id)} className="p-1 rounded transition" style={{ color: TINTA_TENUE }}><Trash2 size={14} /></button>
            </div>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta className="p-5 max-w-md">
        <p className="text-sm font-medium mb-3" style={{ color: TINTA }}>Venta de Proshop del dia</p>
        <Field label="Importe total (EUR)">
          <input type="number" step="0.01" className={inputCls} style={inputStyle} value={proshopImporte} onChange={(e) => setProshopImporte(e.target.value)} placeholder="0.00" />
        </Field>
        <BotonPrimario onClick={guardarProshop} icon={null}>Guardar importe de Proshop</BotonPrimario>
      </Tarjeta>

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva venta de green fee">
        <Field label="Tipo">
          <select className={inputCls} style={inputStyle} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value="socio">Socio</option>
            <option value="no_socio">No socio</option>
          </select>
        </Field>
        <Field label="Numero de jugadores"><input type="number" min="1" className={inputCls} style={inputStyle} value={form.jugadores} onChange={(e) => setForm({ ...form, jugadores: e.target.value })} /></Field>
        <Field label="Importe (EUR)"><input type="number" step="0.01" className={inputCls} style={inputStyle} value={form.importe} onChange={(e) => setForm({ ...form, importe: e.target.value })} placeholder="0.00" /></Field>
        <div className="mt-4"><BotonPrimario onClick={guardarVenta} icon={null}>Guardar venta</BotonPrimario></div>
      </Modal>
    </div>
  );
}

function useCategoriasChecklist() {
  const [tareas, setTareas] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(docClub("recep_config", "tareasChecklist"), (snap) => {
      setTareas(snap.exists() ? (snap.data().lista || []) : []);
    }, () => setTareas([]));
    return () => unsub();
  }, []);
  async function guardar(nuevaLista) {
    await setDoc(docClub("recep_config", "tareasChecklist"), { lista: nuevaLista });
  }
  return { tareas: tareas || [], guardar };
}

function TiposTareaChecklist() {
  const { tareas, guardar } = useCategoriasChecklist();
  const [nueva, setNueva] = useState("");

  return (
    <div>
      <Cabecera titulo="Tareas del checklist" subtitulo="Catalogo de tareas que apareceran cada dia en el checklist de recepcion." />
      <Tarjeta className="p-6 max-w-xl">
        <div className="flex flex-wrap gap-2 mb-4">
          {tareas.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs rounded-full pl-3 pr-1.5 py-1" style={{ background: VINO_SUAVE, color: TINTA }}>
              {t}
              <button onClick={() => guardar(tareas.filter((x) => x !== t))} className="hover:opacity-70"><X size={12} /></button>
            </span>
          ))}
          {tareas.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin tareas configuradas todavia.</p>}
        </div>
        <div className="flex gap-2">
          <input className={inputCls} style={inputStyle} placeholder="Nueva tarea..." value={nueva} onChange={(e) => setNueva(e.target.value)} />
          <BotonSecundario
            onClick={() => {
              if (!nueva.trim() || tareas.includes(nueva.trim())) return;
              guardar([...tareas, nueva.trim()]);
              setNueva("");
            }}
            icon={Plus}
          >Anadir</BotonSecundario>
        </div>
      </Tarjeta>
    </div>
  );
}

function Checklist({ usuario, nombreOperario }) {
  const hoy = fechaISO(new Date());
  const { tareas } = useCategoriasChecklist();
  const { datos: dias } = useColeccion("recep_checklist_diario", "fecha", "desc");
  const diaDoc = dias.find((d) => d.fecha === hoy);
  const hechas = diaDoc?.hechas || {};

  async function marcar(tarea, valor) {
    const nuevasHechas = { ...hechas, [tarea]: valor };
    if (diaDoc) {
      await actualizarDoc("recep_checklist_diario", diaDoc.id, { hechas: nuevasHechas });
    } else {
      await crearDoc("recep_checklist_diario", { fecha: hoy, hechas: nuevasHechas, actualizadoPor: nombreOperario || usuario?.email || "" });
    }
  }

  const total = tareas.length;
  const completadas = tareas.filter((t) => hechas[t]).length;

  return (
    <div>
      <Cabecera titulo="Checklist de tareas" subtitulo={`Tareas de hoy (${fechaLegible(hoy)}). ${completadas}/${total} completadas.`} />
      {tareas.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>No hay tareas configuradas. Anadelas en "Tareas del checklist".</p>}
      <div className="space-y-2 max-w-xl">
        {tareas.map((t) => {
          const hecha = !!hechas[t];
          return (
            <Tarjeta key={t} className="p-4 flex items-center justify-between" onClick={() => marcar(t, !hecha)}>
              <span className="text-sm" style={{ color: hecha ? TINTA_SUAVE : TINTA, textDecoration: hecha ? "line-through" : "none" }}>{t}</span>
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center border"
                style={{ borderColor: hecha ? SALVIA : PAPEL_LINEA, background: hecha ? SALVIA : "transparent" }}
              >
                {hecha && <Check size={14} color="#FFF" />}
              </span>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}

function Incidencias() {
  const { datos: incidencias } = useColeccion("recep_incidencias", "creadoEn", "desc");
  const { datos: equipo } = useColeccion("recep_equipo", "nombre", "asc");
  const [filtroEstado, setFiltroEstado] = useState("Todas");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const vacio = { titulo: "", descripcion: "", gravedad: "Leve", estado: "Pendiente", reportadoPor: "" };
  const [form, setForm] = useState(vacio);

  function abrirNuevo() { setEditando(null); setForm(vacio); setModal(true); }
  function abrirEditar(i) { setEditando(i); setForm({ ...vacio, ...i }); setModal(true); }
  async function guardar() {
    if (!form.titulo.trim()) { alert("Escribe un titulo."); return; }
    if (editando) await actualizarDoc("recep_incidencias", editando.id, form);
    else await crearDoc("recep_incidencias", form);
    setModal(false);
  }

  const filtradas = incidencias.filter((i) => filtroEstado === "Todas" || i.estado === filtroEstado);

  return (
    <div>
      <Cabecera titulo="Incidencias" subtitulo="Incidencias y avisos de recepcion.">
        <BotonPrimario onClick={abrirNuevo}>Nueva incidencia</BotonPrimario>
      </Cabecera>
      <div className="flex flex-wrap gap-2 mb-6">
        {["Todas", "Pendiente", "En curso", "Resuelta"].map((e) => (
          <PillFiltro key={e} activo={filtroEstado === e} onClick={() => setFiltroEstado(e)}>{e}</PillFiltro>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {filtradas.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>No hay incidencias en este filtro.</p>}
        {filtradas.map((i) => (
          <Tarjeta key={i.id} onClick={() => abrirEditar(i)} className="p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium truncate" style={{ color: TINTA }}>{i.titulo}</p>
            </div>
            <p className="text-xs mb-2" style={{ color: TINTA_SUAVE }}>{fechaCorta(i.creadoEn)} {i.reportadoPor ? `· ${i.reportadoPor}` : ""}</p>
            <div className="flex items-center gap-2">
              <Badge tone={toneGravedad(i.gravedad)}>{i.gravedad}</Badge>
              <Badge tone={toneEstado(i.estado)}>{i.estado}</Badge>
            </div>
          </Tarjeta>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar incidencia" : "Nueva incidencia"} wide>
        <Field label="Titulo"><input className={inputCls} style={inputStyle} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Gravedad">
            <select className={inputCls} style={inputStyle} value={form.gravedad} onChange={(e) => setForm({ ...form, gravedad: e.target.value })}>
              {["Leve", "Moderada", "Grave"].map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputCls} style={inputStyle} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              {["Pendiente", "En curso", "Resuelta"].map((e2) => <option key={e2}>{e2}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Reportado por">
          <select className={inputCls} style={inputStyle} value={form.reportadoPor} onChange={(e) => setForm({ ...form, reportadoPor: e.target.value })}>
            <option value="">Selecciona...</option>
            {equipo.map((m) => <option key={m.id}>{m.nombre}</option>)}
          </select>
        </Field>
        <Field label="Descripcion"><textarea className={inputCls} style={inputStyle} rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></Field>
        <div className="flex items-center justify-between mt-2">
          {editando ? (
            <button onClick={async () => { await borrarDoc("recep_incidencias", editando.id); setModal(false); }} className="inline-flex items-center gap-1.5 text-sm" style={{ color: LADRILLO }}>
              <Trash2 size={14} /> Eliminar
            </button>
          ) : <span />}
          <BotonPrimario onClick={guardar} icon={null}>Guardar</BotonPrimario>
        </div>
      </Modal>
    </div>
  );
}

function ultimoEstadoFichaje(fichajes, nombre) {
  const delEmpleado = fichajes.filter((f) => f.empleado === nombre);
  if (delEmpleado.length === 0) return "fuera";
  return delEmpleado[0].tipo === "entrada" ? "dentro" : "fuera";
}

function Fichajes() {
  const { datos: equipo } = useColeccion("recep_equipo", "nombre", "asc");
  const { datos: fichajes } = useColeccion("recep_fichajes", "momento", "desc");
  const hoy = fechaISO(new Date());
  const fichajesHoy = fichajes.filter((f) => fechaISO(f.momento) === hoy);

  return (
    <div>
      <Cabecera titulo="Fichajes" subtitulo="Entradas y salidas del personal de recepcion, registradas por codigo QR." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {equipo.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Anade primero miembros del equipo.</p>}
        {equipo.map((m) => {
          const estado = ultimoEstadoFichaje(fichajes, m.nombre);
          return (
            <Tarjeta key={m.id} className="p-4 flex items-center justify-between">
              <span className="font-medium" style={{ color: TINTA }}>{m.nombre}</span>
              <Badge tone={estado === "dentro" ? "verde" : "neutral"}>{estado === "dentro" ? "Dentro" : "Fuera"}</Badge>
            </Tarjeta>
          );
        })}
      </div>
      <p className="text-sm font-medium mb-3" style={{ color: TINTA }}>Fichajes de hoy</p>
      <div className="space-y-2">
        {fichajesHoy.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin fichajes registrados hoy.</p>}
        {fichajesHoy.map((f) => (
          <Tarjeta key={f.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: TINTA }}>{f.empleado}</p>
              <p className="text-xs" style={{ color: TINTA_SUAVE }}>{f.puntoNombre ? `${f.puntoNombre} - ` : ""}{horaCorta(f.momento)}</p>
            </div>
            <Badge tone={f.tipo === "entrada" ? "verde" : "neutral"}>{f.tipo}</Badge>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}

function PuntosQR() {
  const { datos: puntos } = useColeccion("recep_puntos_qr", "nombre", "asc");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const vacio = { nombre: "", lat: "", lng: "", radioMetros: "50" };
  const [form, setForm] = useState(vacio);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);

  function abrirNuevo() { setEditando(null); setForm(vacio); setModal(true); }
  function abrirEditar(p) { setEditando(p); setForm({ nombre: p.nombre, lat: String(p.lat), lng: String(p.lng), radioMetros: String(p.radioMetros) }); setModal(true); }

  function usarMiUbicacion() {
    if (!navigator.geolocation) { alert("Este dispositivo no soporta geolocalizacion."); return; }
    setCargandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setForm((f) => ({ ...f, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) })); setCargandoUbicacion(false); },
      () => { alert("No se pudo obtener la ubicacion."); setCargandoUbicacion(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function guardar() {
    if (!form.nombre.trim()) { alert("Escribe un nombre para el punto."); return; }
    if (form.lat === "" || form.lng === "") { alert("Falta la ubicacion. Usa el boton para capturarla."); return; }
    const datos = { nombre: form.nombre.trim(), lat: Number(form.lat), lng: Number(form.lng), radioMetros: Number(form.radioMetros) || 50 };
    if (editando) await actualizarDoc("recep_puntos_qr", editando.id, datos);
    else await crearDoc("recep_puntos_qr", datos);
    setModal(false);
  }

  function urlFichaje(p) { return `${window.location.origin}${window.location.pathname}?qr=${p.id}`; }
  function urlQR(p) { return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(urlFichaje(p))}`; }

  return (
    <div>
      <Cabecera titulo="Puntos de fichaje QR" subtitulo="Genera un codigo QR para el punto donde el personal de recepcion fichara entrada y salida.">
        <BotonPrimario onClick={abrirNuevo}>Anadir punto</BotonPrimario>
      </Cabecera>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {puntos.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin puntos de fichaje configurados todavia.</p>}
        {puntos.map((p) => (
          <Tarjeta key={p.id} className="p-4">
            <p className="font-medium mb-2" style={{ color: TINTA }}>{p.nombre}</p>
            <img src={urlQR(p)} alt={`QR de ${p.nombre}`} className="rounded-lg mb-3 w-full max-w-[220px]" style={{ border: `1px solid ${PAPEL_LINEA}` }} />
            <p className="text-xs mb-1" style={{ color: TINTA_SUAVE }}>Radio permitido: {p.radioMetros} m</p>
            <a href={urlFichaje(p)} target="_blank" rel="noreferrer" className="text-xs block mb-3 break-all" style={{ color: VINO }}>{urlFichaje(p)}</a>
            <div className="flex gap-2">
              <button onClick={() => abrirEditar(p)} className="p-1 rounded transition" style={{ color: TINTA_TENUE }}><Pencil size={15} /></button>
              <button onClick={async () => { if (!confirm("Eliminar este punto de fichaje?")) return; await borrarDoc("recep_puntos_qr", p.id); }} className="p-1 rounded transition" style={{ color: TINTA_TENUE }}><Trash2 size={15} /></button>
            </div>
          </Tarjeta>
        ))}
      </div>
      <Modal open={modal} onClose={() => setModal(false)} title={editando ? "Editar punto" : "Nuevo punto de fichaje"}>
        <Field label="Nombre"><input className={inputCls} style={inputStyle} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="p.ej. Recepcion" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitud"><input className={inputCls} style={inputStyle} value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} /></Field>
          <Field label="Longitud"><input className={inputCls} style={inputStyle} value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} /></Field>
        </div>
        <BotonSecundario onClick={usarMiUbicacion} icon={MapPin}>{cargandoUbicacion ? "Obteniendo ubicacion..." : "Usar mi ubicacion actual"}</BotonSecundario>
        <div className="mt-4">
          <Field label="Radio permitido (metros)"><input type="number" className={inputCls} style={inputStyle} value={form.radioMetros} onChange={(e) => setForm({ ...form, radioMetros: e.target.value })} /></Field>
        </div>
        <div className="mt-4"><BotonPrimario onClick={guardar} icon={null}>Guardar</BotonPrimario></div>
      </Modal>
    </div>
  );
}

function FicharQR({ usuario, nombreOperario, codigo }) {
  const { datos: puntos, cargando: cargandoPuntos } = useColeccion("recep_puntos_qr", "nombre", "asc");
  const { datos: fichajes } = useColeccion("recep_fichajes", "momento", "desc");
  const [ubicacion, setUbicacion] = useState(null);
  const [errorUbicacion, setErrorUbicacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(null);

  const punto = puntos.find((p) => p.id === codigo);

  useEffect(() => {
    if (!navigator.geolocation) { setErrorUbicacion("Este dispositivo no soporta geolocalizacion."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude, precision: pos.coords.accuracy }),
      () => setErrorUbicacion("No se pudo obtener tu ubicacion. Activa el GPS y los permisos de ubicacion del navegador."),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  function distanciaMetros(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const misFichajes = fichajes.filter((f) => f.empleado === nombreOperario);
  const tipo = misFichajes.length === 0 || misFichajes[0].tipo === "salida" ? "entrada" : "salida";

  const distancia = punto && ubicacion ? distanciaMetros(ubicacion.lat, ubicacion.lng, punto.lat, punto.lng) : null;
  const dentroDeRango = distancia != null && distancia <= (punto?.radioMetros || 50);

  async function confirmar() {
    if (!dentroDeRango) { alert("Debes estar mas cerca del punto de fichaje."); return; }
    setGuardando(true);
    try {
      await crearDoc("recep_fichajes", {
        empleado: nombreOperario,
        tipo,
        momento: serverTimestamp(),
        origen: "qr",
        puntoId: punto.id,
        puntoNombre: punto.nombre,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        precisionM: ubicacion.precision,
        distanciaM: Math.round(distancia),
      });
      setHecho(tipo);
    } catch (err) {
      alert("No se pudo registrar el fichaje. Intentalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function volver() { window.location.href = window.location.origin + window.location.pathname; }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: PAPEL }}>
      <EstiloGlobal />
      <Tarjeta className="p-7 max-w-sm w-full text-center">
        {!cargandoPuntos && !punto && (
          <>
            <p className="font-medium mb-2" style={{ color: TINTA, fontFamily: SERIF }}>Codigo QR no reconocido</p>
            <p className="text-sm mb-4" style={{ color: TINTA_SUAVE }}>Este punto de fichaje no existe o ha sido eliminado.</p>
            <BotonPrimario onClick={volver} icon={null}>Volver a la app</BotonPrimario>
          </>
        )}
        {punto && hecho && (
          <>
            <p className="font-medium text-lg mb-2" style={{ color: TINTA, fontFamily: SERIF }}>{hecho === "entrada" ? "Entrada registrada" : "Salida registrada"}</p>
            <p className="text-sm mb-4" style={{ color: TINTA_SUAVE }}>{punto.nombre} - {nombreOperario}</p>
            <BotonPrimario onClick={volver} icon={null}>Volver a la app</BotonPrimario>
          </>
        )}
        {punto && !hecho && (
          <>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: VINO }}>{punto.nombre}</p>
            <p className="font-medium text-lg mb-4" style={{ color: TINTA, fontFamily: SERIF }}>Fichar {tipo}</p>
            {!ubicacion && !errorUbicacion && <p className="text-sm mb-4" style={{ color: TINTA_SUAVE }}>Obteniendo tu ubicacion...</p>}
            {errorUbicacion && <p className="text-sm mb-4" style={{ color: LADRILLO }}>{errorUbicacion}</p>}
            {ubicacion && distancia != null && (
              <p className="text-sm mb-4" style={{ color: dentroDeRango ? SALVIA : LADRILLO }}>
                {dentroDeRango ? `Estas dentro del punto (${Math.round(distancia)} m).` : `Estas a ${Math.round(distancia)} m del punto. Debes estar a menos de ${punto.radioMetros} m para fichar.`}
              </p>
            )}
            <BotonPrimario onClick={confirmar} icon={null} disabled={!dentroDeRango || guardando}>
              {guardando ? "Registrando..." : `Confirmar ${tipo}`}
            </BotonPrimario>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
