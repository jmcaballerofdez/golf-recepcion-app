import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, deleteDoc, updateDoc,
  onSnapshot, serverTimestamp, query, orderBy, where, Timestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import {
  LayoutDashboard, Users, AlertTriangle, ClipboardCheck, Wallet,
  Plus, Pencil, Trash2, X, Menu, LogOut, Check, Loader2, Shield, Lock,
  GraduationCap, ShoppingCart, Tractor, Home, Settings, MapPin, Clock,
  Calendar, ChevronLeft, ChevronRight,
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
// App Check (Fraud Defense / reCAPTCHA Enterprise): comprueba que las peticiones vienen de las webs reales de Golf B.
// Modo vigilar: no bloquea nada hasta que se active el cumplimiento en la consola de Firebase.
try {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider("6LeXiBsuAAAAAODBncyVXD11bnAMYF_AaiIwvktu"), isTokenAutoRefreshEnabled: true });
} catch (e) { console.warn("App Check:", e); }
const db = getFirestore(app);
const auth = getAuth(app);

function resolverClubId() { return "ciudad-real"; }
const CLUB_ID = resolverClubId();
const ROLES_PERMITIDOS_RECEPCION = ["superadmin", "admin", "responsable_recepcion", "recepcion"];

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
  { id: "recepcion", nombre: "Recepcion", color: "#7C2A35", url: "https://recepciongcr.golfb.es/", Icon: ClipboardCheck },
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
              target={esActual ? undefined : "_blank"}
              rel="noopener noreferrer"
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
          <img src="/logo.png" alt="Golf B" className="h-11 mx-auto" />
          <p className="text-sm mt-3" style={{ color: TINTA_SUAVE }}>Recepcion · Golf Ciudad Real</p>
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

// Cada usuario cambia o recupera SU contrasena; nadie mas la ve ni la gestiona
function MiCuenta({ usuario, onClose }) {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [msg, setMsg] = useState(null); // { ok, texto }
  const [trabajando, setTrabajando] = useState(false);

  async function cambiar() {
    setMsg(null);
    if (!actual) { setMsg({ ok: false, texto: "Escribe tu contrasena actual." }); return; }
    if (nueva.length < 8) { setMsg({ ok: false, texto: "La nueva contrasena debe tener al menos 8 caracteres." }); return; }
    if (nueva !== repetir) { setMsg({ ok: false, texto: "Las dos contrasenas nuevas no coinciden." }); return; }
    if (nueva === actual) { setMsg({ ok: false, texto: "La nueva contrasena debe ser distinta de la actual." }); return; }
    setTrabajando(true);
    try {
      await reauthenticateWithCredential(auth.currentUser, EmailAuthProvider.credential(usuario.email, actual));
      await updatePassword(auth.currentUser, nueva);
      setActual(""); setNueva(""); setRepetir("");
      setMsg({ ok: true, texto: "Contrasena cambiada. Usala la proxima vez que entres." });
    } catch (e) {
      const c = e?.code || "";
      setMsg({ ok: false, texto: (c.includes("wrong-password") || c.includes("invalid-credential")) ? "La contrasena actual no es correcta." : c.includes("weak-password") ? "La nueva contrasena es demasiado debil." : c.includes("too-many") ? "Demasiados intentos. Espera unos minutos." : "No se pudo cambiar la contrasena. Vuelve a intentarlo." });
    }
    setTrabajando(false);
  }
  async function enviarEnlace() {
    setMsg(null); setTrabajando(true);
    try { await sendPasswordResetEmail(auth, usuario.email); setMsg({ ok: true, texto: "Te hemos enviado un enlace a " + usuario.email + ". Si no lo ves, mira en spam." }); }
    catch { setMsg({ ok: false, texto: "No se pudo enviar el email. Vuelve a intentarlo." }); }
    setTrabajando(false);
  }
  return (
    <Modal open={true} onClose={onClose} title="Mi cuenta">
      <p className="text-sm mb-4" style={{ color: TINTA_SUAVE }}>{usuario.email}</p>
      <p className="text-sm font-medium mb-2" style={{ color: TINTA }}>Cambiar mi contrasena</p>
      <Field label="Contrasena actual"><input type="password" autoComplete="current-password" className={inputCls} style={inputStyle} value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
      <Field label="Contrasena nueva (minimo 8 caracteres)"><input type="password" autoComplete="new-password" className={inputCls} style={inputStyle} value={nueva} onChange={(e) => setNueva(e.target.value)} /></Field>
      <Field label="Repite la contrasena nueva"><input type="password" autoComplete="new-password" className={inputCls} style={inputStyle} value={repetir} onChange={(e) => setRepetir(e.target.value)} /></Field>
      {msg && <p className="text-sm rounded-lg px-3 py-2 mb-3" style={msg.ok ? { color: SALVIA, background: SALVIA_SUAVE } : { color: LADRILLO, background: LADRILLO_SUAVE }}>{msg.texto}</p>}
      <div className="flex items-center justify-between flex-wrap gap-2 mt-2">
        <button onClick={enviarEnlace} disabled={trabajando} className="text-sm underline" style={{ color: VINO }}>He olvidado la actual: enviarme un enlace por email</button>
        <BotonPrimario onClick={cambiar} icon={null}>{trabajando ? "Guardando..." : "Cambiar contrasena"}</BotonPrimario>
      </div>
    </Modal>
  );
}

// ---------- DOCUMENTOS PRIVADOS DE EMPLEADOS (nominas, certificados...) ----------
// Privacidad garantizada por las reglas de Firestore (colecciones documentos_empleado y
// documentos_archivo): solo el superadmin gestiona; cada empleado solo lee los suyos.
const CATEGORIAS_DOC = { nomina: "Nóminas", retenciones: "Certificado de retenciones", contrato: "Contratos", otros: "Otros documentos" };
const MAX_DOC_BYTES = 700 * 1024;
const ROLES_PERSONAL = ["recepcion", "responsable_recepcion", "admin", "jardinero", "greenkeeper", "mantenimiento"];

function leerComoDataUrl(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
function useDocsDe(uid) {
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    if (!uid) { setDocs([]); return; }
    const q = query(collection(db, "clubes", CLUB_ID, "documentos_empleado"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (s) => setDocs(s.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(b.periodo || "").localeCompare(String(a.periodo || "")) || (b.creadoEn?.toMillis?.() || 0) - (a.creadoEn?.toMillis?.() || 0))), () => setDocs([]));
    return () => unsub();
  }, [uid]);
  return docs;
}
async function abrirDocumento(meta, marcarVisto) {
  const ventana = window.open("", "_blank");
  try {
    const snap = await getDoc(docClub("documentos_archivo", meta.id));
    if (!snap.exists()) { if (ventana) ventana.close(); alert("No se encuentra el archivo."); return; }
    const blob = await (await fetch(snap.data().datos)).blob();
    const url = URL.createObjectURL(blob);
    if (ventana) ventana.location.href = url;
    else { const a = document.createElement("a"); a.href = url; a.download = meta.archivoNombre || "documento"; a.click(); }
    if (marcarVisto && !meta.visto) await actualizarDoc("documentos_empleado", meta.id, { visto: true, vistoEn: serverTimestamp() });
  } catch (e) { if (ventana) ventana.close(); alert("No se pudo abrir el documento."); }
}
function periodoLegible(p) {
  if (!p) return "";
  const [y, m] = String(p).split("-");
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return m ? meses[Number(m) - 1] + " " + y : y;
}

function MisDocumentos({ usuario }) {
  const docs = useDocsDe(usuario?.uid);
  const [cat, setCat] = useState("nomina");
  const lista = docs.filter((d) => d.categoria === cat);
  const nuevos = (c) => docs.filter((d) => d.categoria === c && !d.visto).length;
  return (
    <div>
      <Cabecera titulo="Mis documentos" subtitulo="Tus documentos personales. Solo tú puedes verlos." />
      <div className="flex gap-2 flex-wrap mb-5">
        {Object.entries(CATEGORIAS_DOC).map(([k, v]) => (
          <PillFiltro key={k} activo={cat === k} onClick={() => setCat(k)}>{v}{nuevos(k) > 0 ? " (" + nuevos(k) + " nuevo" + (nuevos(k) > 1 ? "s" : "") + ")" : ""}</PillFiltro>
        ))}
      </div>
      <div className="space-y-3 max-w-xl">
        {lista.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>No hay documentos en este apartado.</p>}
        {lista.map((d) => (
          <Tarjeta key={d.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium" style={{ color: TINTA }}>{d.titulo}</p>
                <p className="text-xs" style={{ color: TINTA_SUAVE }}>{periodoLegible(d.periodo)} · subido el {fechaCorta(d.creadoEn)}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!d.visto && <Badge tone="ambar">Nuevo</Badge>}
                <BotonSecundario onClick={() => abrirDocumento(d, true)}>Abrir</BotonSecundario>
              </div>
            </div>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}

function DocumentosAdmin({ nombreOperario }) {
  const [personal, setPersonal] = useState([]);
  const [uid, setUid] = useState("");
  const docs = useDocsDe(uid);
  const vacio = { categoria: "nomina", periodo: new Date().toISOString().slice(0, 7), titulo: "" };
  const [form, setForm] = useState(vacio);
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [cat, setCat] = useState("todas");
  useEffect(() => {
    getDocs(query(collection(db, "Usuarios"), where("role", "in", ROLES_PERSONAL)))
      .then((s) => setPersonal(s.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => String(a.nombre || a.email).localeCompare(String(b.nombre || b.email)))))
      .catch(() => setPersonal([]));
  }, []);
  const persona = personal.find((p) => p.uid === uid);

  async function subir() {
    if (!persona) { alert("Elige primero al trabajador."); return; }
    if (!archivo) { alert("Elige el archivo (PDF o imagen)."); return; }
    if (archivo.size > MAX_DOC_BYTES) { alert("El archivo pesa " + Math.round(archivo.size / 1024) + " KB. El maximo es 700 KB. Comprime el PDF e intentalo de nuevo."); return; }
    if (!/^application\/pdf$|^image\//.test(archivo.type)) { alert("Solo se admiten PDF o imagenes."); return; }
    setSubiendo(true);
    try {
      const datos = await leerComoDataUrl(archivo);
      const titulo = form.titulo.trim() || (CATEGORIAS_DOC[form.categoria] + (form.periodo ? " " + periodoLegible(form.periodo) : ""));
      const ref = await addDoc(collection(db, "clubes", CLUB_ID, "documentos_empleado"), {
        uid: persona.uid, empleado: persona.nombre || persona.email, categoria: form.categoria, periodo: form.periodo || "", titulo,
        archivoNombre: archivo.name, mime: archivo.type, bytes: archivo.size, subidoPor: nombreOperario || "Administrador", visto: false, creadoEn: serverTimestamp(),
      });
      try { await setDoc(docClub("documentos_archivo", ref.id), { uid: persona.uid, datos }); }
      catch (e) { await deleteDoc(docClub("documentos_empleado", ref.id)); throw e; }
      setArchivo(null); setForm({ ...form, titulo: "" });
      const inp = document.getElementById("doc-archivo"); if (inp) inp.value = "";
    } catch (e) { alert("No se pudo subir el documento. Comprueba que las reglas de Firebase estan actualizadas."); }
    setSubiendo(false);
  }
  async function eliminar(d) {
    if (!confirm("Eliminar '" + d.titulo + "' de " + d.empleado + "? Se borra del todo y no se puede recuperar.")) return;
    await borrarDoc("documentos_archivo", d.id);
    await borrarDoc("documentos_empleado", d.id);
  }
  const lista = cat === "todas" ? docs : docs.filter((d) => d.categoria === cat);

  return (
    <div>
      <Cabecera titulo="Documentos de empleados" subtitulo="Nominas, certificados de retenciones y otros documentos. Cada trabajador solo ve los suyos." />
      <div className="max-w-2xl">
        <Field label="Trabajador">
          <select className={inputCls} style={inputStyle} value={uid} onChange={(e) => setUid(e.target.value)}>
            <option value="">Selecciona...</option>
            {personal.map((p) => <option key={p.uid} value={p.uid}>{(p.nombre || p.email) + " · " + p.role}</option>)}
          </select>
        </Field>
        {uid && (
          <>
            <Tarjeta className="p-4 mb-6">
              <p className="text-sm font-medium mb-3" style={{ color: TINTA }}>Subir documento a {persona?.nombre || persona?.email}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Tipo">
                  <select className={inputCls} style={inputStyle} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                    {Object.entries(CATEGORIAS_DOC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label={form.categoria === "retenciones" ? "Ejercicio (mes de cierre)" : "Mes / periodo"}>
                  <input type="month" className={inputCls} style={inputStyle} value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} />
                </Field>
              </div>
              <Field label="Titulo (opcional; si lo dejas vacio se pone solo)"><input className={inputCls} style={inputStyle} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="p.ej. Nomina octubre 2026" /></Field>
              <div className="mb-3.5">
                <span className="block text-[13px] font-medium mb-1.5" style={{ color: TINTA_SUAVE }}>Archivo (PDF o imagen, maximo 700 KB)</span>
                <input id="doc-archivo" type="file" accept="application/pdf,image/*" style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files && e.target.files[0] ? e.target.files[0] : null)} />
                <div className="flex items-center gap-3 flex-wrap">
                  <BotonSecundario onClick={() => document.getElementById("doc-archivo").click()}>Elegir archivo</BotonSecundario>
                  <span className="text-sm" style={{ color: TINTA_SUAVE }}>{archivo ? archivo.name + " (" + Math.round(archivo.size / 1024) + " KB)" : "Ningun archivo elegido"}</span>
                </div>
              </div>
              <BotonPrimario onClick={subir} icon={null}>{subiendo ? "Subiendo..." : "Subir documento"}</BotonPrimario>
            </Tarjeta>
            <div className="flex gap-2 flex-wrap mb-4">
              <PillFiltro activo={cat === "todas"} onClick={() => setCat("todas")}>Todos</PillFiltro>
              {Object.entries(CATEGORIAS_DOC).map(([k, v]) => <PillFiltro key={k} activo={cat === k} onClick={() => setCat(k)}>{v}</PillFiltro>)}
            </div>
            <div className="space-y-3">
              {lista.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>No hay documentos.</p>}
              {lista.map((d) => (
                <Tarjeta key={d.id} className="p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-medium" style={{ color: TINTA }}>{d.titulo}</p>
                      <p className="text-xs" style={{ color: TINTA_SUAVE }}>{CATEGORIAS_DOC[d.categoria]} · {periodoLegible(d.periodo)} · subido el {fechaCorta(d.creadoEn)} · {Math.round((d.bytes || 0) / 1024)} KB</p>
                      <p className="text-xs" style={{ color: d.visto ? SALVIA : TINTA_TENUE }}>{d.visto ? "Visto por el trabajador" : "Aun no lo ha abierto"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <BotonSecundario onClick={() => abrirDocumento(d, false)}>Abrir</BotonSecundario>
                      <button onClick={() => eliminar(d)} className="p-1" style={{ color: LADRILLO }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </Tarjeta>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- INFORME DE HORAS POR TAREA (solo superadmin) ----------
function minTxtInf(m) {
  const t = Math.round(m || 0);
  const h = Math.floor(t / 60), r = t % 60;
  return h ? h + " h " + String(r).padStart(2, "0") + " min" : r + " min";
}
function isoLocalInf(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
function descargarCsvInf(nombre, filas) {
  const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
  const txt = "﻿" + filas.map((f) => f.map(esc).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([txt], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// filas: [{ fecha:"YYYY-MM-DD", tarea, persona, minutos, inicio?, fin?, nota? }]
function InformeHorasVista({ titulo, subtitulo, filas, pendientes = [], nombreArchivo }) {
  const hoy = new Date();
  const [rango, setRango] = useState("mes");
  const [pDesde, setPDesde] = useState(isoLocalInf(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [pHasta, setPHasta] = useState(isoLocalInf(hoy));
  const [persona, setPersona] = useState("Todos");
  const [abiertas, setAbiertas] = useState({});
  const [verDetalle, setVerDetalle] = useState(false);

  let desde = pDesde, hasta = pHasta;
  if (rango === "7") { desde = isoLocalInf(new Date(Date.now() - 6 * 86400000)); hasta = isoLocalInf(hoy); }
  if (rango === "mes") { desde = isoLocalInf(new Date(hoy.getFullYear(), hoy.getMonth(), 1)); hasta = isoLocalInf(hoy); }
  if (rango === "mesant") { desde = isoLocalInf(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)); hasta = isoLocalInf(new Date(hoy.getFullYear(), hoy.getMonth(), 0)); }

  const personas = Array.from(new Set(filas.map((f) => f.persona))).sort();
  const sel = filas.filter((f) => f.fecha >= desde && f.fecha <= hasta && (persona === "Todos" || f.persona === persona));
  const total = sel.reduce((s, f) => s + f.minutos, 0);
  const sinTerminar = pendientes.filter((f) => f.fecha >= desde && f.fecha <= hasta && (persona === "Todos" || f.persona === persona)).length;

  function agrupar(clave, sub) {
    const m = {};
    sel.forEach((f) => {
      const k = f[clave];
      m[k] = m[k] || { nombre: k, n: 0, min: 0, sub: {} };
      m[k].n += 1; m[k].min += f.minutos;
      const s = f[sub];
      m[k].sub[s] = m[k].sub[s] || { nombre: s, n: 0, min: 0 };
      m[k].sub[s].n += 1; m[k].sub[s].min += f.minutos;
    });
    return Object.values(m).sort((a, b) => b.min - a.min);
  }
  const porTarea = agrupar("tarea", "persona");
  const porPersona = agrupar("persona", "tarea");

  function exportar() {
    const cab = [["Fecha", "Trabajador", "Tarea", "Inicio", "Fin", "Minutos", "Horas"]];
    const cuerpo = sel.slice().sort((a, b) => a.fecha.localeCompare(b.fecha)).map((f) => [f.fecha, f.persona, f.tarea, f.inicio || "", f.fin || "", f.minutos, (f.minutos / 60).toFixed(2).replace(".", ",")]);
    const resumen = [[], ["RESUMEN POR TAREA"], ["Tarea", "Veces", "Minutos", "Horas"]].concat(porTarea.map((t) => [t.nombre, t.n, t.min, (t.min / 60).toFixed(2).replace(".", ",")]));
    descargarCsvInf(nombreArchivo + "_" + desde + "_" + hasta + ".csv", cab.concat(cuerpo, resumen));
  }

  function Bloque({ lista, clave }) {
    return (
      <div className="space-y-2">
        {lista.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin datos en este periodo.</p>}
        {lista.map((g) => {
          const k = clave + g.nombre;
          return (
            <Tarjeta key={k} className="p-4">
              <button className="w-full flex items-center justify-between gap-3 text-left" onClick={() => setAbiertas({ ...abiertas, [k]: !abiertas[k] })}>
                <span className="text-sm font-medium" style={{ color: TINTA }}>{g.nombre}</span>
                <span className="text-sm flex-shrink-0" style={{ color: TINTA_SUAVE }}>{g.n} {g.n === 1 ? "vez" : "veces"} · <b style={{ color: TINTA }}>{minTxtInf(g.min)}</b> · media {minTxtInf(g.min / g.n)}</span>
              </button>
              {abiertas[k] && (
                <div className="mt-3 pt-3 space-y-1" style={{ borderTop: "1px solid " + PAPEL_LINEA }}>
                  {Object.values(g.sub).sort((a, b) => b.min - a.min).map((s) => (
                    <div key={s.nombre} className="flex items-center justify-between text-xs" style={{ color: TINTA_SUAVE }}>
                      <span>{s.nombre}</span><span>{s.n} · {minTxtInf(s.min)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Tarjeta>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <Cabecera titulo={titulo} subtitulo={subtitulo}>
        <BotonSecundario onClick={exportar}>Descargar Excel (CSV)</BotonSecundario>
      </Cabecera>
      <div className="flex gap-2 flex-wrap mb-4">
        <PillFiltro activo={rango === "7"} onClick={() => setRango("7")}>Ultimos 7 dias</PillFiltro>
        <PillFiltro activo={rango === "mes"} onClick={() => setRango("mes")}>Este mes</PillFiltro>
        <PillFiltro activo={rango === "mesant"} onClick={() => setRango("mesant")}>Mes anterior</PillFiltro>
        <PillFiltro activo={rango === "pers"} onClick={() => setRango("pers")}>Personalizado</PillFiltro>
      </div>
      <div className="grid sm:grid-cols-3 gap-x-4 max-w-2xl">
        {rango === "pers" && <Field label="Desde"><input type="date" className={inputCls} style={inputStyle} value={pDesde} onChange={(e) => setPDesde(e.target.value)} /></Field>}
        {rango === "pers" && <Field label="Hasta"><input type="date" className={inputCls} style={inputStyle} value={pHasta} onChange={(e) => setPHasta(e.target.value)} /></Field>}
        <Field label="Trabajador">
          <select className={inputCls} style={inputStyle} value={persona} onChange={(e) => setPersona(e.target.value)}>
            <option value="Todos">Todos</option>
            {personas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <p className="text-xs mb-4" style={{ color: TINTA_TENUE }}>Del {desde} al {hasta}</p>

      <Tarjeta className="p-5 mb-6 max-w-md">
        <p className="text-xs uppercase tracking-wide mb-1" style={{ color: VINO }}>Total dedicado</p>
        <p className="text-2xl font-semibold" style={{ color: TINTA }}>{minTxtInf(total)}</p>
        <p className="text-xs" style={{ color: TINTA_SUAVE }}>{sel.length} tareas registradas{sinTerminar > 0 ? " · " + sinTerminar + " sin terminar (no cuentan)" : ""}</p>
      </Tarjeta>

      <p className="text-sm font-semibold mb-2" style={{ color: TINTA }}>Por tarea <span className="font-normal text-xs" style={{ color: TINTA_TENUE }}>(pulsa una para ver quien la hizo)</span></p>
      <Bloque lista={porTarea} clave="t:" />
      <p className="text-sm font-semibold mt-6 mb-2" style={{ color: TINTA }}>Por trabajador</p>
      <Bloque lista={porPersona} clave="p:" />

      <button className="text-sm underline mt-6" style={{ color: VINO }} onClick={() => setVerDetalle(!verDetalle)}>{verDetalle ? "Ocultar detalle" : "Ver detalle dia a dia"}</button>
      {verDetalle && (
        <div className="space-y-1 mt-3">
          {sel.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 300).map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-xs py-1" style={{ color: TINTA_SUAVE, borderBottom: "1px solid " + PAPEL_LINEA }}>
              <span>{f.fecha} · {f.persona} · {f.tarea}</span>
              <span className="flex-shrink-0">{f.inicio ? f.inicio + "-" + f.fin + " · " : ""}{minTxtInf(f.minutos)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InformeHorasRecep() {
  const { datos: dias } = useColeccion("recep_checklist_diario", "fecha", "desc");
  const aMin = (h) => { const [a, b] = String(h || "").split(":").map(Number); return isNaN(a) || isNaN(b) ? null : a * 60 + b; };
  const filas = [];
  const pendientes = [];
  dias.forEach((d) => {
    Object.entries(d.detalle || {}).forEach(([tarea, x]) => {
      if (!x || !x.inicio) return;
      const i = aMin(x.inicio), f = aMin(x.fin);
      if (!x.fin || i == null || f == null || f < i) { pendientes.push({ fecha: d.fecha, persona: x.por || d.actualizadoPor || "Sin nombre" }); return; }
      filas.push({ fecha: d.fecha, tarea, persona: x.por || d.actualizadoPor || "Sin nombre", minutos: f - i, inicio: x.inicio, fin: x.fin });
    });
  });
  return <InformeHorasVista titulo="Informe de horas por tarea" subtitulo="Tiempo dedicado a cada tarea del checklist de Recepcion." filas={filas} pendientes={pendientes} nombreArchivo="horas_recepcion" />;
}

// ═══════════════════════════════════════════════════════════════════
// MI AGENDA (solo superadmin): eventos personales compartidos entre todas las apps
// (clubes/ciudad-real/agenda_personal) + clases de Academia en solo lectura.
// ═══════════════════════════════════════════════════════════════════
const MA_DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const MA_H = 28;
const maIso = (d) => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
const maSuma = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return maIso(d); };
const maLunes = (iso) => { const d = new Date(iso + "T12:00:00"); return maSuma(iso, -((d.getDay() + 6) % 7)); };
const maMin = (h) => { const [a, b] = String(h || "0:0").split(":"); return (Number(a) || 0) * 60 + (Number(b) || 0); };
const maHora = (m) => String(Math.floor(m / 60)).padStart(2,"0") + ":" + String(m % 60).padStart(2,"0");

function MiAgendaVista({ db, F }) {
  const [lunes, setLunes] = useState(() => maLunes(maIso(new Date())));
  const [personales, setPersonales] = useState([]);
  const [datos, setDatos] = useState({});
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const u1 = F.onSnapshot(F.collection(db, "clubes", "ciudad-real", "agenda_personal"),
      (s) => setPersonales(s.docs.map((d) => ({ ...d.data(), id: d.id, personal: true }))),
      (e) => setError("No se pudo leer la agenda personal: " + e.message));
    const u2 = F.onSnapshot(F.doc(db, "academia", "datos"),
      (s) => setDatos(s.exists() ? s.data() : {}),
      (e) => console.warn("Academia:", e));
    return () => { u1(); u2(); };
  }, []);

  const dias = [0,1,2,3,4,5,6].map((i) => maSuma(lunes, i));
  const domingo = dias[6];
  const hoy = maIso(new Date());

  // Clases de Academia (solo lectura), incluidas las automáticas de infantil
  const clases = [];
  (datos.agendaAdultos || []).forEach((e) => { if (e.tipo !== "personal" && !e.cancelada && e.fecha >= lunes && e.fecha <= domingo) clases.push({ id: e.id, fecha: e.fecha, hora: e.hora, durMin: (e.dur || 2) * 30, titulo: e.titulo || "Clase", tipo: e.tipo }); });
  const omit = datos.agendaOmitidas || [];
  (datos.gruposCurso || []).forEach((g) => {
    const di = ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"].findIndex((x) => (g.dia || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").startsWith(x));
    if (di < 0 || !g.horaIni) return;
    const f = dias[di]; if (f < "2026-10-18") return;
    const ini = Math.floor(maMin(g.horaIni) / 30) * 30;
    const fin = g.horaFin ? maMin(g.horaFin) : ini + 60;
    const hora = maHora(ini);
    if ((datos.agendaAdultos || []).some((e) => e.fecha === f && e.tipo !== "personal" && e.hora === hora)) return;
    if (omit.includes("auto-" + g.id + "-" + f)) return;
    clases.push({ id: "auto-" + g.id + "-" + f, fecha: f, hora, durMin: Math.max(30, fin - ini), titulo: g.nombre || "Grupo infantil", tipo: "escuela" });
  });
  const pers = personales.filter((e) => e.fecha >= lunes && e.fecha <= domingo);

  const ini0 = 8 * 60, fin0 = 21 * 60;
  const alto = ((fin0 - ini0) / 30) * MA_H;
  const topDe = (h) => ((Math.max(maMin(h), ini0) - ini0) / 30) * MA_H;

  function carriles(evs) {
    const o = [...evs].sort((a, b) => maMin(a.hora) - maMin(b.hora));
    const fines = []; const res = {};
    o.forEach((e) => { const i = maMin(e.hora), f = i + e.durMin; let l = fines.findIndex((x) => x <= i); if (l < 0) { l = fines.length; fines.push(0); } fines[l] = f; res[e.id] = { lane: l, n: 1, i, f }; });
    o.forEach((e) => { const r = res[e.id]; let mx = r.lane; o.forEach((x) => { const q = res[x.id]; if (q.i < r.f && q.f > r.i) mx = Math.max(mx, q.lane); }); r.n = mx + 1; });
    return res;
  }

  function nuevo(fecha, hora) { setForm({ fecha, hora, durMin: 60, titulo: "", nota: "" }); setModal("new"); setError(""); }
  function editar(e) { setForm({ fecha: e.fecha, hora: e.hora, durMin: e.durMin || 60, titulo: e.titulo || "", nota: e.nota || "" }); setModal(e.id); setError(""); }
  async function guardar() {
    if (!form.fecha || !form.hora) return;
    const reg = { titulo: (form.titulo || "").trim() || "Reunión", fecha: form.fecha, hora: form.hora, durMin: Math.max(5, Number(form.durMin) || 60), nota: (form.nota || "").trim() };
    try {
      if (modal === "new") await F.addDoc(F.collection(db, "clubes", "ciudad-real", "agenda_personal"), { ...reg, creadoEn: Date.now() });
      else await F.updateDoc(F.doc(db, "clubes", "ciudad-real", "agenda_personal", modal), reg);
      setModal(null);
    } catch (e) { setError("No se pudo guardar: " + e.message); }
  }
  async function borrar() {
    if (modal === "new" || !window.confirm("¿Eliminar este evento?")) return;
    try { await F.deleteDoc(F.doc(db, "clubes", "ciudad-real", "agenda_personal", modal)); setModal(null); }
    catch (e) { setError("No se pudo eliminar: " + e.message); }
  }

  const colores = { individual: ["#E3ECFC", "#2A5FD9"], grupo: ["#ECE6F8", "#6B4FBB"], curso: ["#FBEBD8", "#B0651A"], escuela: ["#DDF2E6", "#2E8B57"] };
  const fmt = (iso) => { const d = new Date(iso + "T12:00:00"); return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }); };
  const inp = { color: "#1f2a33", background: "#fff", width: "100%", border: "1.5px solid #C7D2DC", borderRadius: 8, padding: "8px 10px", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
  const btn = (bg, col) => ({ background: bg, color: col, border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" });

  return (
    <div style={{ color: "#f3f6f4" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <button style={btn("#E6EBF0", "#333")} onClick={() => setLunes(maSuma(lunes, -7))}>◀</button>
        <button style={btn("#E6EBF0", "#333")} onClick={() => setLunes(maLunes(hoy))}>Hoy</button>
        <button style={btn("#E6EBF0", "#333")} onClick={() => setLunes(maSuma(lunes, 7))}>▶</button>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{fmt(lunes)} – {fmt(domingo)}</div>
        <div style={{ flex: 1 }} />
        <button style={btn("#2F6B3F", "#fff")} onClick={() => nuevo(hoy >= lunes && hoy <= domingo ? hoy : lunes, "10:00")}>+ Evento</button>
      </div>
      {error && <div style={{ background: "#FBE4E1", color: "#C0392B", padding: 8, borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{error}</div>}
      <div style={{ overflowX: "auto", border: "1px solid #DCE4EB", borderRadius: 12, background: "#fff", color: "#1f2a33" }}>
        <div style={{ minWidth: 720, display: "grid", gridTemplateColumns: "48px repeat(7,1fr)" }}>
          <div style={{ background: "#F5F8FA", borderBottom: "1px solid #DCE4EB" }} />
          {dias.map((f, i) => (
            <div key={f} style={{ padding: "6px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, borderBottom: "1px solid #DCE4EB", borderLeft: "1px solid #EEF2F5", background: f === hoy ? "#2F6B3F" : "#F5F8FA", color: f === hoy ? "#fff" : "#222" }}>
              {MA_DIAS[i]} {new Date(f + "T12:00:00").getDate()}
            </div>
          ))}
          <div style={{ position: "relative", height: alto }}>
            {Array.from({ length: (fin0 - ini0) / 60 }, (_, k) => (
              <div key={k} style={{ position: "absolute", top: k * 2 * MA_H, width: "100%", fontSize: 10, color: "#6b7a86", textAlign: "right", paddingRight: 5, boxSizing: "border-box" }}>{maHora(ini0 + k * 60)}</div>
            ))}
          </div>
          {dias.map((f) => {
            const evs = [...clases.filter((c) => c.fecha === f), ...pers.filter((p) => p.fecha === f).map((p) => ({ ...p, durMin: p.durMin || 60 }))];
            const car = carriles(evs);
            return (
              <div key={f} style={{ position: "relative", height: alto, borderLeft: "1px solid #EEF2F5" }}>
                {Array.from({ length: (fin0 - ini0) / 30 }, (_, k) => (
                  <div key={k} onClick={() => nuevo(f, maHora(ini0 + k * 30))} style={{ position: "absolute", top: k * MA_H, height: MA_H, width: "100%", boxSizing: "border-box", cursor: "pointer", borderTop: k % 2 === 0 ? "1px solid #DCE4EB" : "1px dotted #E8EEF3" }} />
                ))}
                {evs.map((e) => {
                  const c = car[e.id] || { lane: 0, n: 1 };
                  const col = e.personal ? ["#E6EBF0", "#5C7284"] : (colores[e.tipo] || colores.individual);
                  return (
                    <div key={e.id} onClick={(ev) => { ev.stopPropagation(); e.personal ? editar(e) : setInfo(e); }}
                      style={{ position: "absolute", top: topDe(e.hora) + 1, height: Math.max(15, e.durMin / 30 * MA_H) - 2, left: "calc(" + (c.lane * 100 / c.n) + "% + 2px)", width: "calc(" + (100 / c.n) + "% - 4px)", boxSizing: "border-box", overflow: "hidden", cursor: "pointer", background: col[0], borderLeft: "4px solid " + col[1], borderRadius: 6, padding: "2px 5px", fontSize: 11, lineHeight: 1.25, boxShadow: "0 1px 2px rgba(0,0,0,.08)", opacity: e.personal ? 1 : 0.9 }}>
                      <div style={{ fontWeight: 700, color: col[1] }}>{e.personal ? "" : "🎓 "}{e.titulo}</div>
                      <div style={{ color: "#6b7a86", fontSize: 10 }}>{e.hora}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#c9d3cc", marginTop: 8 }}>Pulsa en una hora vacía para añadir un evento. Los eventos grises son tuyos y se sincronizan en todas las apps. Las clases (🎓) se editan en Academia.</div>

      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "#1f2a33", borderRadius: 14, padding: 18, width: "100%", maxWidth: 440 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>{modal === "new" ? "Nuevo evento" : "Editar evento"}</div>
            <label style={{ fontSize: 12, color: "#6b7a86" }}>Título</label>
            <input style={{ ...inp, marginBottom: 10 }} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej: Reunión con proveedor" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div><label style={{ fontSize: 12, color: "#6b7a86" }}>Fecha</label><input type="date" style={inp} value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></div>
              <div><label style={{ fontSize: 12, color: "#6b7a86" }}>Hora</label><input type="time" style={inp} value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
              <div><label style={{ fontSize: 12, color: "#6b7a86" }}>Duración (min)</label><input type="number" style={inp} value={form.durMin} onChange={(e) => setForm({ ...form, durMin: e.target.value })} /></div>
            </div>
            <label style={{ fontSize: 12, color: "#6b7a86" }}>Nota</label>
            <textarea rows={2} style={{ ...inp, marginBottom: 12 }} value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
            {error && <div style={{ color: "#C0392B", fontSize: 12, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>{modal !== "new" && <button style={btn("#FBE4E1", "#C0392B")} onClick={borrar}>Eliminar</button>}</div>
              <div style={{ display: "flex", gap: 8 }}><button style={btn("#E6EBF0", "#333")} onClick={() => setModal(null)}>Cancelar</button><button style={btn("#2F6B3F", "#fff")} onClick={guardar}>Guardar</button></div>
            </div>
          </div>
        </div>
      )}
      {info && (
        <div onClick={() => setInfo(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", color: "#1f2a33", borderRadius: 14, padding: 18, width: "100%", maxWidth: 380 }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>🎓 {info.titulo}</div>
            <div style={{ fontSize: 14, marginBottom: 12 }}>{new Date(info.fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {info.hora} ({info.durMin} min)</div>
            <div style={{ fontSize: 12, color: "#6b7a86", marginBottom: 14 }}>Las clases se editan en Academia (ahí están los alumnos, la asistencia y los cobros).</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button style={btn("#E6EBF0", "#333")} onClick={() => setInfo(null)}>Cerrar</button>
              <a href="https://academia.golfb.es/" target="_blank" rel="noreferrer" style={{ ...btn("#2F6B3F", "#fff"), textDecoration: "none" }}>Abrir Academia</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const MI_AGENDA_F = { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc };

export default function App() {
  const { currentUser: usuario, userRole, modulosActivos, nombreOperario, cargandoAuth } = useAuthRecepcion();
  const [vista, setVista] = useState("dashboard");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [miCuentaAbierta, setMiCuentaAbierta] = useState(false);

  const esSuperadmin = userRole === "superadmin" || userRole === "admin";
  const esResponsable = userRole === "responsable_recepcion";
  const puedeGestionEquipo = esSuperadmin || esResponsable;

  const NAV_GROUPS = [
    { label: "Principal", items: [
      { id: "dashboard", label: "Panel", Icon: LayoutDashboard },
      { id: "mis_documentos", label: "Mis documentos", Icon: Lock },
      ...(userRole === "superadmin" ? [{ id: "mi_agenda", label: "Mi agenda", Icon: Calendar }] : []),
    ]},
    { label: "Operativa", items: [
      { id: "ventas", label: "Ventas del dia", Icon: Wallet },
      { id: "checklist", label: "Checklist de tareas", Icon: ClipboardCheck },
      { id: "turnos", label: "Turnos", Icon: Calendar },
      { id: "necesidades", label: "Necesidades", Icon: ShoppingCart },
      { id: "incidencias", label: "Incidencias", Icon: AlertTriangle },
      { id: "fichajes", label: "Fichajes", Icon: Clock },
      { id: "ausencias", label: "Ausencias", Icon: Home },
    ]},
    ...(puedeGestionEquipo ? [{ label: "Equipo", items: [
      { id: "equipo", label: "Equipo", Icon: Users },
    ]}] : []),
    ...(esSuperadmin ? [{ label: "Configuracion", items: [
      { id: "tipos_tarea", label: "Tareas del checklist", Icon: Settings },
      { id: "puntos_qr", label: "Puntos QR", Icon: MapPin },
      ...(userRole === "superadmin" ? [{ id: "documentos_admin", label: "Documentos de empleados", Icon: Shield }] : []),
      ...(userRole === "superadmin" ? [{ id: "informe_horas", label: "Informe de horas", Icon: Clock }] : []),
    ]}] : []),
  ];

  const TITULOS = {
    mi_agenda: "Mi agenda", dashboard: "Panel", ventas: "Ventas del dia", checklist: "Checklist de tareas", turnos: "Turnos", necesidades: "Necesidades",
    incidencias: "Incidencias", ausencias: "Ausencias", equipo: "Equipo", tipos_tarea: "Tareas del checklist", fichajes: "Fichajes", puntos_qr: "Puntos QR", mis_documentos: "Mis documentos", documentos_admin: "Documentos de empleados", informe_horas: "Informe de horas",
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
          <img src="/logo.png" alt="Golf B" className="h-9" />
          <p className="text-[10.5px] mt-4 uppercase tracking-[0.2em] font-semibold" style={{ color: VINO }}>Recepcion</p>
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
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setMiCuentaAbierta(true)}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: TINTA_SUAVE }}
            >
              <Lock size={13} /> Mi cuenta
            </button>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: TINTA_SUAVE }}
            >
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>
        <div className="px-6 py-4 text-[11px] leading-relaxed" style={{ borderTop: `1px solid ${PAPEL_LINEA}`, color: TINTA_TENUE }}>
          Golf Ciudad Real C.D.
          <div className="mt-1.5" style={{ opacity: 0.7 }}>Club: {CLUB_ID}</div>
        </div>
      </aside>

      {miCuentaAbierta && <MiCuenta usuario={usuario} onClose={() => setMiCuentaAbierta(false)} />}
      {menuAbierto && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setMenuAbierto(false)} />
      )}

      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3" style={{ background: PAPEL_TARJETA, borderBottom: `1px solid ${PAPEL_LINEA}` }}>
          <button onClick={() => setMenuAbierto(true)} className="p-1" style={{ color: TINTA }}><Menu size={22} /></button>
          <p className="font-medium italic" style={{ color: TINTA, fontFamily: SERIF }}>Golf B · {TITULOS[vista]}</p>
        </header>
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          {vista === "dashboard" && <Dashboard irA={setVista} verTotales={puedeGestionEquipo} />}
          {vista === "ventas" && <VentasDia usuario={usuario} nombreOperario={nombreOperario} soloHoy={!puedeGestionEquipo} verTotales={puedeGestionEquipo} />}
          {vista === "checklist" && <Checklist usuario={usuario} nombreOperario={nombreOperario} />}
          {vista === "turnos" && <Turnos nombreOperario={nombreOperario} puedeEditar={puedeGestionEquipo} />}
          {vista === "necesidades" && <Necesidades nombreOperario={nombreOperario} origen="Recepcion" puedeDestachar={esSuperadmin} />}
          {vista === "incidencias" && <Incidencias />}
          {vista === "equipo" && puedeGestionEquipo && <Equipo />}
          {vista === "tipos_tarea" && esSuperadmin && <TiposTareaChecklist />}
          {vista === "ausencias" && <Ausencias nombreOperario={nombreOperario} gestor={puedeGestionEquipo} />}
          {vista === "fichajes" && <Fichajes puedeInforme={puedeGestionEquipo} puedeCorregir={esSuperadmin} nombreOperario={nombreOperario} />}
          {vista === "puntos_qr" && esSuperadmin && <PuntosQR />}
          {vista === "mis_documentos" && <MisDocumentos usuario={usuario} />}
          {vista === "documentos_admin" && userRole === "superadmin" && <DocumentosAdmin nombreOperario={nombreOperario} />}
          {vista === "informe_horas" && userRole === "superadmin" && <InformeHorasRecep />}
          {vista === "mi_agenda" && userRole === "superadmin" && <MiAgendaVista db={db} F={MI_AGENDA_F} />}
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

function Dashboard({ irA, verTotales }) {
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

      <div className={"grid gap-6 mb-8 " + (verTotales ? "lg:grid-cols-[1.3fr_1fr]" : "lg:grid-cols-1")}>
        {verTotales && <Tarjeta className="p-6" onClick={() => irA("ventas")}>
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
        </Tarjeta>}

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
  const { datos: equipoTodos } = useColeccion("recep_equipo", "nombre", "asc");
  const [verBajas, setVerBajas] = useState(false);
  const equipo = equipoTodos.filter((m) => verBajas ? !!m.baja : !m.baja);
  const hayBajas = equipoTodos.some((m) => m.baja);
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
      {hayBajas && (
        <div className="flex gap-2 mb-4">
          <PillFiltro activo={!verBajas} onClick={() => setVerBajas(false)}>En plantilla</PillFiltro>
          <PillFiltro activo={verBajas} onClick={() => setVerBajas(true)}>Bajas</PillFiltro>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipo.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>{verBajas ? "No hay bajas." : "Nadie en plantilla."}</p>}
        {equipo.map((m) => (
          <Tarjeta key={m.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium" style={{ color: TINTA }}>{m.nombre}</p>
                <p className="text-sm" style={{ color: TINTA_SUAVE }}>{m.rol}</p>
                {m.baja && <p className="text-xs mt-1" style={{ color: LADRILLO }}>Baja desde {fechaLegible(m.fechaBaja)}</p>}
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
            editando.baja ? (
              <div className="flex flex-col gap-2 items-start">
              <button onClick={async () => { await actualizarDoc("recep_equipo", editando.id, { baja: false, fechaBaja: "" }); setModal(false); }} className="inline-flex items-center gap-1.5 text-sm" style={{ color: VINO }}>
                <Check size={14} /> Volver a la plantilla
              </button>
              <button onClick={async () => {
                if (!confirm("Eliminar del todo a " + editando.nombre + " de la lista del equipo? Sus fichajes NO se borran (se conservan por ley), pero ya no podras volver a ponerlo en plantilla.")) return;
                await borrarDoc("recep_equipo", editando.id);
                setModal(false);
              }} className="inline-flex items-center gap-1.5 text-sm" style={{ color: LADRILLO }}>
                <Trash2 size={14} /> Eliminar de la lista
              </button>
              </div>
            ) : (
              <button onClick={async () => {
                if (!confirm("Dar de baja a " + editando.nombre + "? Dejara de aparecer en turnos y fichajes, pero se conservan todos sus fichajes (hay que guardarlos por ley).")) return;
                await actualizarDoc("recep_equipo", editando.id, { baja: true, fechaBaja: fechaISO(new Date()) });
                setModal(false);
              }} className="inline-flex items-center gap-1.5 text-sm" style={{ color: LADRILLO }}>
                <Trash2 size={14} /> Dar de baja
              </button>
            )
          ) : <span />}
          <BotonPrimario onClick={guardar} icon={null}>Guardar</BotonPrimario>
        </div>
      </Modal>
    </div>
  );
}

function VentasDia({ usuario, nombreOperario, soloHoy, verTotales }) {
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
        {soloHoy ? (
          <Field label="Fecha"><p className="text-sm py-2" style={{ color: TINTA }}>{fechaLegible(fecha)} (hoy)</p></Field>
        ) : (
          <Field label="Fecha"><input type="date" className={inputCls} style={inputStyle} value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        )}
      </div>

      {verTotales && <Tarjeta className="p-6 mb-8 max-w-md">
        <p className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color: TINTA_TENUE }}>Resumen del dia</p>
        <div style={{ borderTop: `1px solid ${PAPEL_LINEA}` }}>
          <FilaLedger etiqueta="Socios" valor={`${totalSocios.toFixed(2)} EUR`} />
          <div style={{ borderTop: `1px solid ${PAPEL_LINEA}` }} />
          <FilaLedger etiqueta="No socios" valor={`${totalNoSocios.toFixed(2)} EUR`} />
        </div>
      </Tarjeta>}

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

const DIAS_SEM = [["L", 1], ["M", 2], ["X", 3], ["J", 4], ["V", 5], ["S", 6], ["D", 0]];
const TAREAS_EXCEL = {
  diaria: ["Barrer zona taquillas/carros", "Limpiar buggys", "Mantener recepción limpia", "Mirar papeleras de recepción", "Recoger cestas", "Recoger fichas"],
  semanal: ["Limpiar cristales", "Limpiar canchas", "Limpiar zona de carros, taquillas", "Revisión y limpieza de baños", "Limpiar recepción", "Limpieza dirección (José)", "Papeleras", "Comprobación y recogida de bolas", "Riego de plantas casa club y alrededores", "Limpiar pasillo abajo", "Control de facturas y archivar", "Organizar y recoger cancha de prácticas", "Revisión de correos y reservas correctas", "Mantener buggys limpios", "Revisar depósito de agua y espuma"],
};

function useCategoriasChecklist() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(docClub("recep_config", "tareasChecklist"), (snap) => {
      setCfg(snap.exists() ? snap.data() : {});
    }, () => setCfg({}));
    return () => unsub();
  }, []);
  async function guardar(nuevaLista) {
    await setDoc(docClub("recep_config", "tareasChecklist"), { lista: nuevaLista }, { merge: true });
  }
  async function guardarExtra(obj) {
    await setDoc(docClub("recep_config", "tareasChecklist"), obj, { merge: true });
  }
  const c = cfg || {};
  return { tareas: c.lista || [], grupos: c.grupos || {}, dias: c.dias || {}, guardar, guardarExtra };
}

function TiposTareaChecklist() {
  const { tareas, grupos, dias, guardar, guardarExtra } = useCategoriasChecklist();
  const [nueva, setNueva] = useState("");
  const grupoDe = (t) => grupos[t] || "semanal";
  const diasDe = (t) => dias[t] || [0, 1, 2, 3, 4, 5, 6];

  function cargarExcel() {
    const lista = [...tareas]; const g = { ...grupos };
    Object.entries(TAREAS_EXCEL).forEach(([grupo, nombres]) => nombres.forEach((n) => {
      if (!lista.includes(n)) { lista.push(n); g[n] = grupo; }
    }));
    guardarExtra({ lista, grupos: g });
  }
  function alternarDia(t, d) {
    const act = diasDe(t);
    const nuevo = act.includes(d) ? act.filter((x) => x !== d) : [...act, d];
    guardarExtra({ dias: { ...dias, [t]: nuevo } });
  }
  function quitar(t) {
    if (!confirm("Quitar la tarea '" + t + "' del checklist? (Lo ya registrado en dias pasados se conserva)")) return;
    const g = { ...grupos }; delete g[t]; const d = { ...dias }; delete d[t];
    guardarExtra({ lista: tareas.filter((x) => x !== t), grupos: g, dias: d });
  }

  return (
    <div>
      <Cabecera titulo="Tareas del checklist" subtitulo="Tareas que apareceran en el checklist de recepcion, con los dias en que toca cada una." />
      <div className="max-w-2xl space-y-3">
        {tareas.length === 0 && (
          <Tarjeta className="p-5">
            <p className="text-sm mb-3" style={{ color: TINTA_SUAVE }}>Aun no hay tareas. Puedes cargar las de tu Excel (6 diarias y 15 semanales) y luego ajustarlas.</p>
            <BotonSecundario onClick={cargarExcel} icon={Plus}>Cargar tareas del Excel</BotonSecundario>
          </Tarjeta>
        )}
        {tareas.map((t) => (
          <Tarjeta key={t} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium" style={{ color: TINTA }}>{t}</p>
              <button onClick={() => quitar(t)} className="p-1" style={{ color: TINTA_TENUE }}><Trash2 size={15} /></button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select className="border rounded-lg px-2 py-1 text-xs" style={inputStyle} value={grupoDe(t)} onChange={(e) => guardarExtra({ grupos: { ...grupos, [t]: e.target.value } })}>
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
              </select>
              {DIAS_SEM.map(([l, d]) => {
                const on = diasDe(t).includes(d);
                return <button key={d} onClick={() => alternarDia(t, d)} className="w-7 h-7 rounded-full text-xs border" style={{ background: on ? VINO : "transparent", color: on ? "#FFF" : TINTA_SUAVE, borderColor: on ? VINO : PAPEL_LINEA }}>{l}</button>;
              })}
            </div>
          </Tarjeta>
        ))}
        <div className="flex gap-2 pt-2">
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
        {tareas.length > 0 && <button onClick={cargarExcel} className="text-xs underline" style={{ color: VINO }}>Anadir las tareas del Excel que falten</button>}
      </div>
    </div>
  );
}

function horaAhora() { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }

function Checklist({ usuario, nombreOperario }) {
  const hoy = fechaISO(new Date());
  const diaSem = new Date().getDay();
  const { tareas, grupos, dias: diasCfg } = useCategoriasChecklist();
  const { datos: dias } = useColeccion("recep_checklist_diario", "fecha", "desc");
  const diaDoc = dias.find((d) => d.fecha === hoy);
  const hechas = diaDoc?.hechas || {};
  const detalle = diaDoc?.detalle || {};
  const [abiertas, setAbiertas] = useState({});

  async function guardarTarea(tarea, patch) {
    const nuevoDet = { ...detalle, [tarea]: { ...(detalle[tarea] || {}), ...patch, por: nombreOperario || usuario?.email || "" } };
    const nuevasHechas = { ...hechas, [tarea]: !!nuevoDet[tarea].fin };
    if (diaDoc) await actualizarDoc("recep_checklist_diario", diaDoc.id, { hechas: nuevasHechas, detalle: nuevoDet });
    else await crearDoc("recep_checklist_diario", { fecha: hoy, hechas: nuevasHechas, detalle: nuevoDet, actualizadoPor: nombreOperario || usuario?.email || "" });
  }

  const deHoy = tareas.filter((t) => (diasCfg[t] || [0, 1, 2, 3, 4, 5, 6]).includes(diaSem));
  const diarias = deHoy.filter((t) => (grupos[t] || "semanal") === "diaria");
  const semanales = deHoy.filter((t) => (grupos[t] || "semanal") !== "diaria");
  const completadas = deHoy.filter((t) => detalle[t]?.fin).length;

  function Fila({ t }) {
    const d = detalle[t] || {};
    const hecha = !!d.fin;
    const enCurso = !!d.inicio && !d.fin;
    const abierta = abiertas[t] || !!d.obs;
    return (
      <Tarjeta className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium" style={{ color: hecha ? TINTA_SUAVE : TINTA, textDecoration: hecha ? "line-through" : "none" }}>{t}</p>
          <span className="w-6 h-6 rounded-md flex items-center justify-center border flex-shrink-0" style={{ borderColor: hecha ? SALVIA : PAPEL_LINEA, background: hecha ? SALVIA : "transparent" }}>
            {hecha && <Check size={14} color="#FFF" />}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <p className="text-xs mb-1" style={{ color: TINTA_TENUE }}>Inicio</p>
            {d.inicio ? <input type="time" className={inputCls} style={inputStyle} value={d.inicio} onChange={(e) => guardarTarea(t, { inicio: e.target.value })} />
              : <button onClick={() => guardarTarea(t, { inicio: horaAhora() })} className="w-full rounded-lg px-3 py-2 text-sm font-medium border" style={{ borderColor: VINO, color: VINO }}>Empezar</button>}
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: TINTA_TENUE }}>Final</p>
            {d.fin ? <input type="time" className={inputCls} style={inputStyle} value={d.fin} onChange={(e) => guardarTarea(t, { fin: e.target.value })} />
              : <button onClick={() => guardarTarea(t, { fin: horaAhora() })} className="w-full rounded-lg px-3 py-2 text-sm font-medium" style={{ background: enCurso ? VINO : PAPEL_LINEA, color: enCurso ? "#FFF" : TINTA_SUAVE }}>Terminar</button>}
          </div>
        </div>
        {abierta ? (
          <textarea className={inputCls + " mt-3"} style={inputStyle} rows={2} placeholder="Observaciones..." defaultValue={d.obs || ""} onBlur={(e) => { if ((e.target.value || "") !== (d.obs || "")) guardarTarea(t, { obs: e.target.value }); }} />
        ) : (
          <button onClick={() => setAbiertas({ ...abiertas, [t]: true })} className="text-xs underline mt-3" style={{ color: VINO }}>+ Observaciones</button>
        )}
        {(d.inicio || d.fin) && (
          <button onClick={() => { if (confirm("Reiniciar esta tarea?")) guardarTarea(t, { inicio: "", fin: "" }); }} className="block text-xs mt-2" style={{ color: TINTA_TENUE }}>Reiniciar tarea</button>
        )}
      </Tarjeta>
    );
  }

  return (
    <div>
      <Cabecera titulo="Checklist de tareas" subtitulo={`Hoy, ${fechaLegible(hoy)}. ${completadas}/${deHoy.length} completadas.`} />
      {tareas.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>No hay tareas configuradas. El responsable las anade en "Tareas del checklist".</p>}
      {tareas.length > 0 && deHoy.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Hoy no hay tareas programadas.</p>}
      {diarias.length > 0 && <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Tareas diarias</p>}
      <div className="space-y-3 max-w-xl mb-6">{diarias.map((t) => <div key={t}>{Fila({ t })}</div>)}</div>
      {semanales.length > 0 && <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Tareas de la semana</p>}
      <div className="space-y-3 max-w-xl">{semanales.map((t) => <div key={t}>{Fila({ t })}</div>)}</div>
    </div>
  );
}

function Incidencias() {
  const { datos: incidencias } = useColeccion("recep_incidencias", "creadoEn", "desc");
  const { datos: equipoTodos } = useColeccion("recep_equipo", "nombre", "asc");
  const equipo = equipoTodos.filter((m) => !m.baja);
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

// ---------- AUSENCIAS (vacaciones, asuntos propios, asistencia medica, permisos) ----------
const TIPOS_AUS = { vacaciones: "Vacaciones", asuntos: "Asuntos propios", medica: "Asistencia médica", permiso: "Permiso retribuido (otro)", otros: "Otros" };
const AUS_DEF = { vacDias: 23, asuntosDias: 3, medicaHoras: 16, horasDia: 8, jornadaAnual: 1752 };

function tokensNombre(n) { return String(n || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, " ").split(/\s+/).filter(Boolean); }
function mismaPersona(a, b) {
  const ta = tokensNombre(a), tb = tokensNombre(b);
  if (!ta.length || !tb.length) return false;
  const [c, l] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return c.every((t) => l.includes(t));
}
function diasLaborablesEntre(desde, hasta) {
  if (!desde || !hasta || hasta < desde) return 0;
  let n = 0, f = desde;
  for (let i = 0; i < 400 && f <= hasta; i++) {
    const [y, m, d] = f.split("-").map(Number);
    const w = new Date(y, m - 1, d).getDay();
    if (w !== 0 && w !== 6) n++;
    f = sumarDiasISO(f, 1);
  }
  return n;
}
function useConfigAusencias() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(docClub("recep_config", "ausencias"), (s) => setCfg(s.exists() ? s.data() : {}), () => setCfg({}));
    return () => unsub();
  }, []);
  return { cfg: { ...AUS_DEF, ...(cfg || {}) }, guardar: (obj) => setDoc(docClub("recep_config", "ausencias"), obj, { merge: true }) };
}
function horasDeAusencia(a, cfg) {
  if (a.tipo === "medica") return Number(a.horas || 0);
  return Number(a.dias || 0) * Number(cfg.horasDia);
}
function toneAus(e) { return e === "aprobada" ? "verde" : e === "denegada" ? "rojo" : "ambar"; }
function textoAus(a) {
  const rango = a.desde === a.hasta ? fechaLegible(a.desde) : fechaLegible(a.desde) + " → " + fechaLegible(a.hasta);
  return rango + (a.tipo === "medica" ? " · " + a.horas + " h" : " · " + a.dias + " día" + (Number(a.dias) === 1 ? "" : "s"));
}

function Ausencias({ nombreOperario, gestor }) {
  const { datos: todas } = useColeccion("recep_ausencias", "creadoEn", "desc");
  const { datos: equipoTodos } = useColeccion("recep_equipo", "nombre", "asc");
  const { datos: fichajes } = useColeccion("recep_fichajes", "momento", "desc");
  const { cfg, guardar: guardarCfg } = useConfigAusencias();
  const anioHoy = new Date().getFullYear();
  const [anio, setAnio] = useState(anioHoy);
  const [modal, setModal] = useState(false);
  const [resolviendo, setResolviendo] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [ajustes, setAjustes] = useState(false);
  const hoy = fechaISO(new Date());
  const vacio = { tipo: "vacaciones", desde: hoy, hasta: hoy, dias: "1", horas: "2", motivo: "" };
  const [form, setForm] = useState(vacio);

  const delAnio = todas.filter((a) => String(a.desde || "").startsWith(String(anio)));
  const mias = delAnio.filter((a) => mismaPersona(a.empleado, nombreOperario));
  const pendientes = todas.filter((a) => a.estado === "pendiente");

  function cambiarFechas(patch) {
    const f = { ...form, ...patch };
    if (f.hasta < f.desde) f.hasta = f.desde;
    f.dias = String(diasLaborablesEntre(f.desde, f.hasta));
    setForm(f);
  }
  async function enviar() {
    if (!nombreOperario) { alert("No se reconoce tu nombre de operario. Avisa al responsable."); return; }
    if (form.tipo === "medica" ? !(Number(form.horas) > 0) : !(Number(form.dias) > 0)) { alert("Indica los dias u horas de la ausencia."); return; }
    await crearDoc("recep_ausencias", {
      empleado: nombreOperario, tipo: form.tipo, desde: form.desde, hasta: form.tipo === "medica" ? form.desde : form.hasta,
      dias: form.tipo === "medica" ? 0 : Number(form.dias), horas: form.tipo === "medica" ? Number(form.horas) : 0,
      motivo: form.motivo.trim(), estado: "pendiente",
    });
    setModal(false); setForm(vacio);
  }
  async function resolver(a, estado) {
    await actualizarDoc("recep_ausencias", a.id, { estado, respuesta: respuesta.trim(), resueltaEn: fechaISO(new Date()) });
    setResolviendo(null); setRespuesta("");
  }

  function saldo(persona) {
    const ap = delAnio.filter((a) => a.estado === "aprobada" && mismaPersona(a.empleado, persona));
    const suma = (t, campo) => ap.filter((a) => a.tipo === t).reduce((s, a) => s + Number(a[campo] || 0), 0);
    const horasAus = ap.reduce((s, a) => s + horasDeAusencia(a, cfg), 0);
    const horasFich = tramosDeFichajes(fichajes.filter((f) => mismaPersona(persona, f.empleado) && fechaISO(f.momento).startsWith(String(anio)))).reduce((s, d) => s + d.ms, 0) / 3600000;
    return {
      vac: suma("vacaciones", "dias"), asu: suma("asuntos", "dias"), med: suma("medica", "horas"), horasAus, horasFich,
      total: horasFich + horasAus,
    };
  }
  const personas = equipoTodos.filter((m) => !m.baja).map((m) => m.nombre);
  const yo = saldo(nombreOperario);

  function Resumen({ s, nombre }) {
    return (
      <Tarjeta className="p-4">
        {nombre && <p className="font-medium mb-2" style={{ color: TINTA }}>{nombre}</p>}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["Vacaciones", s.vac, cfg.vacDias, "d"], ["Asuntos propios", s.asu, cfg.asuntosDias, "d"], ["Médico", s.med, cfg.medicaHoras, "h"]].map(([l, u, m, ud]) => (
            <div key={l} className="rounded-lg py-2" style={{ background: VINO_SUAVE }}>
              <p className="text-xs" style={{ color: TINTA_SUAVE }}>{l}</p>
              <p className="text-sm font-medium num" style={{ color: u > m ? LADRILLO : TINTA }}>{u}/{m} {ud}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: TINTA_SUAVE }}>
          Horas del año: <b>{s.horasFich.toFixed(1)} h</b> fichadas + <b>{s.horasAus.toFixed(1)} h</b> de ausencias aprobadas = <b>{s.total.toFixed(1)} h</b> de {cfg.jornadaAnual} h
          {" "}(faltan {Math.max(0, cfg.jornadaAnual - s.total).toFixed(1)} h)
        </p>
      </Tarjeta>
    );
  }
  function Fila({ a, conAcciones }) {
    return (
      <Tarjeta className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm" style={{ color: TINTA }}>{conAcciones ? a.empleado + " · " : ""}{TIPOS_AUS[a.tipo] || a.tipo}</p>
            <p className="text-xs mt-0.5" style={{ color: TINTA_SUAVE }}>{textoAus(a)}</p>
            {a.motivo && <p className="text-xs mt-1" style={{ color: TINTA_SUAVE }}>“{a.motivo}”</p>}
            {a.respuesta && <p className="text-xs mt-1" style={{ color: TINTA_TENUE }}>Respuesta: {a.respuesta}</p>}
          </div>
          <Badge tone={toneAus(a.estado)}>{a.estado}</Badge>
        </div>
        {conAcciones && a.estado === "pendiente" && (resolviendo === a.id ? (
          <div className="mt-3">
            <input className={inputCls} style={inputStyle} placeholder="Comentario (opcional)" value={respuesta} onChange={(e) => setRespuesta(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button onClick={() => resolver(a, "aprobada")} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white" style={{ background: SALVIA }}>Aprobar</button>
              <button onClick={() => resolver(a, "denegada")} className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white" style={{ background: LADRILLO }}>Denegar</button>
              <button onClick={() => { setResolviendo(null); setRespuesta(""); }} className="px-3 text-sm" style={{ color: TINTA_SUAVE }}>Cancelar</button>
            </div>
          </div>
        ) : <button onClick={() => { setResolviendo(a.id); setRespuesta(""); }} className="mt-3 text-sm underline" style={{ color: VINO }}>Responder solicitud</button>)}
        {a.estado === "pendiente" && !conAcciones && (
          <button onClick={async () => { if (confirm("Cancelar esta solicitud?")) await borrarDoc("recep_ausencias", a.id); }} className="mt-2 text-xs" style={{ color: LADRILLO }}>Cancelar solicitud</button>
        )}
        {gestor && conAcciones && (
          <button onClick={async () => { if (confirm("Eliminar esta solicitud de " + a.empleado + "? Se borra del todo y deja de contar en su saldo.")) await borrarDoc("recep_ausencias", a.id); }} className="block mt-2 text-xs" style={{ color: LADRILLO }}>Eliminar solicitud</button>
        )}
        {gestor && a.estado !== "pendiente" && conAcciones && (
          <button onClick={() => actualizarDoc("recep_ausencias", a.id, { estado: "pendiente", respuesta: "" })} className="mt-2 text-xs" style={{ color: TINTA_TENUE }}>Volver a pendiente</button>
        )}
      </Tarjeta>
    );
  }

  return (
    <div>
      <Cabecera titulo="Ausencias" subtitulo="Solicitud de vacaciones, asuntos propios, asistencia médica y otros permisos.">
        <BotonPrimario onClick={() => { setForm(vacio); setModal(true); }}>Solicitar</BotonPrimario>
      </Cabecera>
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setAnio(anio - 1)} className="p-1" style={{ color: TINTA_SUAVE }}><ChevronLeft size={18} /></button>
        <p className="font-medium num" style={{ color: TINTA }}>{anio}</p>
        <button onClick={() => setAnio(anio + 1)} className="p-1" style={{ color: TINTA_SUAVE }}><ChevronRight size={18} /></button>
      </div>

      {gestor && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Pendientes de responder ({pendientes.length})</p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-4xl">
            {pendientes.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>No hay solicitudes pendientes.</p>}
            {pendientes.map((a) => <div key={a.id}>{Fila({ a, conAcciones: true })}</div>)}
          </div>
        </div>
      )}

      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Mi saldo {anio}</p>
      <div className="max-w-xl mb-6">{Resumen({ s: yo })}</div>
      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Mis solicitudes</p>
      <div className="grid sm:grid-cols-2 gap-3 max-w-4xl mb-8">
        {mias.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Todavía no has pedido nada en {anio}.</p>}
        {mias.map((a) => <div key={a.id}>{Fila({ a, conAcciones: false })}</div>)}
      </div>

      {gestor && (
        <>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Equipo · saldos y horas {anio}</p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-4xl mb-8">{personas.map((p) => <div key={p}>{Resumen({ s: saldo(p), nombre: p })}</div>)}</div>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Historial del equipo {anio}</p>
          <div className="grid sm:grid-cols-2 gap-3 max-w-4xl mb-8">
            {delAnio.filter((a) => a.estado !== "pendiente").map((a) => <div key={a.id}>{Fila({ a, conAcciones: true })}</div>)}
          </div>
          <button onClick={() => setAjustes(true)} className="text-sm underline" style={{ color: VINO }}>Ajustar cifras del convenio</button>
          <Modal open={ajustes} onClose={() => setAjustes(false)} title="Cifras del convenio">
            <p className="text-xs mb-3" style={{ color: TINTA_SUAVE }}>Valores de partida del V Convenio de instalaciones deportivas. Cámbialos si tu convenio o contrato dice otra cosa.</p>
            {[["vacDias", "Vacaciones (días laborables/año)"], ["asuntosDias", "Asuntos propios (días/año)"], ["medicaHoras", "Asistencia médica (horas/año)"], ["horasDia", "Horas por día de ausencia"], ["jornadaAnual", "Jornada anual (horas)"]].map(([k, l]) => (
              <Field key={k} label={l}><input type="number" className={inputCls} style={inputStyle} defaultValue={cfg[k]} onBlur={(e) => { const v = Number(e.target.value); if (v > 0 && v !== cfg[k]) guardarCfg({ [k]: v }); }} /></Field>
            ))}
            <div className="mt-2"><BotonPrimario onClick={() => setAjustes(false)} icon={null}>Listo</BotonPrimario></div>
          </Modal>
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Solicitar ausencia">
        <Field label="Tipo">
          <select className={inputCls} style={inputStyle} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {Object.entries(TIPOS_AUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        {form.tipo === "medica" ? (
          <>
            <Field label="Día"><input type="date" className={inputCls} style={inputStyle} value={form.desde} onChange={(e) => setForm({ ...form, desde: e.target.value, hasta: e.target.value })} /></Field>
            <Field label="Horas que te ausentas"><input type="number" step="0.5" min="0" className={inputCls} style={inputStyle} value={form.horas} onChange={(e) => setForm({ ...form, horas: e.target.value })} /></Field>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Desde"><input type="date" className={inputCls} style={inputStyle} value={form.desde} onChange={(e) => cambiarFechas({ desde: e.target.value })} /></Field>
              <Field label="Hasta"><input type="date" className={inputCls} style={inputStyle} value={form.hasta} min={form.desde} onChange={(e) => cambiarFechas({ hasta: e.target.value })} /></Field>
            </div>
            <Field label="Días a descontar (lunes a viernes; cámbialo si trabajas fines de semana)"><input type="number" min="0" className={inputCls} style={inputStyle} value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} /></Field>
          </>
        )}
        <Field label="Motivo (opcional)"><textarea rows={2} className={inputCls} style={inputStyle} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} /></Field>
        <div className="mt-2"><BotonPrimario onClick={enviar} icon={null}>Enviar solicitud</BotonPrimario></div>
      </Modal>
    </div>
  );
}

function ultimoEstadoFichaje(fichajes, nombre) {
  const delEmpleado = fichajes.filter((f) => f.empleado === nombre && !f.anulado);
  if (delEmpleado.length === 0) return "fuera";
  return delEmpleado[0].tipo === "entrada" ? "dentro" : "fuera";
}

// Empareja entradas y salidas de un empleado en tramos por dia
function tramosDeFichajes(lista) {
  const asc = lista.filter((f) => !f.anulado).sort((a, b) => (a.momento?.toMillis?.() || 0) - (b.momento?.toMillis?.() || 0));
  const dias = {};
  asc.forEach((f) => { const k = fechaISO(f.momento); (dias[k] = dias[k] || []).push(f); });
  return Object.keys(dias).sort().map((fecha) => {
    const tramos = []; let abierta = null;
    dias[fecha].forEach((f) => {
      if (f.tipo === "entrada") { if (abierta) tramos.push({ ent: abierta, sal: null }); abierta = f; }
      else { tramos.push({ ent: abierta, sal: f }); abierta = null; }
    });
    if (abierta) tramos.push({ ent: abierta, sal: null });
    const ms = tramos.reduce((t, x) => (x.ent && x.sal) ? t + (x.sal.momento.toMillis() - x.ent.momento.toMillis()) : t, 0);
    const pausaMs = tramos.reduce((t, x, i) => (x.sal?.motivo === "comida" && tramos[i + 1]?.ent) ? t + (tramos[i + 1].ent.momento.toMillis() - x.sal.momento.toMillis()) : t, 0);
    return { fecha, tramos, ms, pausaMs, incompleto: tramos.some((x) => !x.ent || !x.sal) };
  });
}
function hhmm(ms) { const m = Math.round(ms / 60000); return Math.floor(m / 60) + "h " + String(m % 60).padStart(2, "0") + "min"; }

// Cifras de referencia del V Convenio estatal de instalaciones deportivas y gimnasios (prorrogado)
const JORNADA_ANUAL_H = 1752;

function rangoInforme(modo, ancla, desdeC, hastaC) {
  const y = Number(ancla.slice(0, 4)); const m = Number(ancla.slice(5, 7));
  const pad = (n) => String(n).padStart(2, "0");
  const finMes = (yy, mm) => new Date(yy, mm, 0).getDate();
  if (modo === "dia") return { desde: ancla, hasta: ancla };
  if (modo === "semana") { const l = lunesDeSemana(ancla); return { desde: l, hasta: sumarDiasISO(l, 6) }; }
  if (modo === "mes") return { desde: `${y}-${pad(m)}-01`, hasta: `${y}-${pad(m)}-${pad(finMes(y, m))}` };
  if (modo === "trimestre") { const q = Math.floor((m - 1) / 3); const m1 = q * 3 + 1; const m3 = m1 + 2; return { desde: `${y}-${pad(m1)}-01`, hasta: `${y}-${pad(m3)}-${pad(finMes(y, m3))}` }; }
  if (modo === "anio") return { desde: `${y}-01-01`, hasta: `${y}-12-31` };
  return { desde: desdeC || "2000-01-01", hasta: hastaC || "2999-12-31" };
}
function moverAncla(modo, ancla, dir) {
  const y = Number(ancla.slice(0, 4)); const m = Number(ancla.slice(5, 7)); const d = ancla.slice(8, 10);
  const pad = (n) => String(n).padStart(2, "0");
  if (modo === "dia") return sumarDiasISO(ancla, dir);
  if (modo === "semana") return sumarDiasISO(ancla, 7 * dir);
  if (modo === "mes" || modo === "trimestre") {
    const salto = modo === "mes" ? 1 : 3; const t = (y * 12 + (m - 1)) + dir * salto;
    return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}-01`;
  }
  if (modo === "anio") return `${y + dir}-${pad(m)}-${d}`;
  return ancla;
}
function etiquetaRango(modo, r) {
  const mes = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  if (modo === "dia") return fechaLegible(r.desde);
  if (modo === "mes") return mes[Number(r.desde.slice(5, 7)) - 1] + " " + r.desde.slice(0, 4);
  if (modo === "trimestre") return "T" + (Math.floor((Number(r.desde.slice(5, 7)) - 1) / 3) + 1) + " " + r.desde.slice(0, 4);
  if (modo === "anio") return r.desde.slice(0, 4);
  return fechaLegible(r.desde) + " - " + fechaLegible(r.hasta);
}

function InformeFichajes({ equipo, fichajes }) {
  const hoyISO = fechaISO(new Date());
  const [empleado, setEmpleado] = useState("__todos");
  const [extras, setExtras] = useState([]); // otros nombres que el admin marca como de la misma persona
  const [modo, setModo] = useState("mes");
  const [ancla, setAncla] = useState(hoyISO);
  const [desdeC, setDesdeC] = useState("");
  const [hastaC, setHastaC] = useState("");
  const { datos: turnosTodos } = useColeccion("recep_turnos", "lunes", "desc");
  const { datos: tareasTodas } = useColeccion("recep_tareas_asignadas", "creadoEn", "desc");
  const { datos: ventasTodas } = useColeccion("recep_ventas_gf", "creadoEn", "desc");
  const { datos: incidTodas } = useColeccion("recep_incidencias", "creadoEn", "desc");
  const { datos: checkTodos } = useColeccion("recep_checklist_diario", "fecha", "desc");
  // Agrupa los nombres que solo se diferencian en mayusculas, tildes o espacios (p. ej. "Cristina Perez" y "Cristina Pérez")
  const norm = (n) => String(n || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  const mapaP = {};
  equipo.forEach((m) => { if (!m.nombre) return; const k = norm(m.nombre); (mapaP[k] = mapaP[k] || { key: k, nombre: m.nombre, set: new Set() }).set.add(m.nombre); });
  fichajes.forEach((f) => { if (!f.empleado) return; const k = norm(f.empleado); (mapaP[k] = mapaP[k] || { key: k, nombre: f.empleado, set: new Set() }).set.add(f.empleado); });
  [...turnosTodos.map((t) => t.empleado), ...tareasTodas.map((t) => t.empleado), ...ventasTodas.map((v) => v.registradoPor), ...incidTodas.map((x) => x.reportadoPor), ...checkTodos.map((c) => c.actualizadoPor)]
    .filter((n) => n && !String(n).includes("@")).forEach((n) => { const k = norm(n); (mapaP[k] = mapaP[k] || { key: k, nombre: n, set: new Set() }).set.add(n); });
  const personas = Object.values(mapaP).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const r = rangoInforme(modo, ancla, desdeC, hastaC);
  const enRango = (f) => { const k = fechaISO(f.momento); return k >= r.desde && k <= r.hasta; };
  const todos = empleado === "__todos";
  const personaSel = todos ? null : (mapaP[empleado] || { key: empleado, nombre: empleado, set: new Set() });
  const selNombre = personaSel ? personaSel.nombre : "todos";
  const selSet = personaSel ? new Set([...personaSel.set, ...extras]) : null;
  const lista = todos ? personas : [{ ...personaSel, set: selSet }];
  const resumen = lista.map((p) => {
    const dias = tramosDeFichajes(fichajes.filter((f) => p.set.has(f.empleado) && enRango(f)));
    const ms = dias.reduce((t, d) => t + d.ms, 0);
    const anioMs = tramosDeFichajes(fichajes.filter((f) => p.set.has(f.empleado) && fechaISO(f.momento).slice(0, 4) === r.desde.slice(0, 4))).reduce((t, d) => t + d.ms, 0);
    return { nombre: p.nombre, dias, ms, incompletos: dias.filter((d) => d.incompleto).length, anioMs };
  });
  const otrosNombres = todos ? [] : Object.values(mapaP).filter((p) => p.key !== personaSel.key).flatMap((p) => [...p.set]);
  const detalle = todos ? null : resumen[0];
  const totalMs = resumen.reduce((t, x) => t + x.ms, 0);
  const txt = (f) => (f ? horaCorta(f.momento) : "--:--");
  const MODOS = [["dia", "Dia"], ["semana", "Semana"], ["mes", "Mes"], ["trimestre", "Trimestre"], ["anio", "Ano"], ["custom", "Personalizado"]];

  function bajar(csv, nombre) {
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = nombre; a.click(); URL.revokeObjectURL(url);
  }
  const celda = (c) => '"' + String(c ?? "").replace(/"/g, '""') + '"';
  // Registro completo en bruto (todos los fichajes, sin filtrar por fechas) del empleado elegido o de todos
  const cuentas = {};
  fichajes.forEach((f) => { if (f.empleado) cuentas[f.empleado] = (cuentas[f.empleado] || 0) + 1; });
  function descargarBruto() {
    const sel = fichajes.filter((f) => todos || selSet.has(f.empleado))
      .sort((a, b) => (a.momento?.toMillis?.() || 0) - (b.momento?.toMillis?.() || 0));
    const filas = [["Fecha", "Hora", "Empleado", "Tipo", "Punto", "Origen", "Distancia al punto (m)", "Precision GPS (m)", "Latitud", "Longitud", "Motivo", "Estado", "Corregido por", "Motivo correccion/anulacion"]];
    sel.forEach((f) => filas.push([fechaLegible(fechaISO(f.momento)), horaCorta(f.momento), f.empleado || "", f.tipo || "", f.puntoNombre || "", f.origen || "", f.distanciaM ?? "", f.precisionM ?? "", f.lat ?? "", f.lng ?? "", f.motivo === "comida" ? "Pausa comida" : f.motivo === "vuelta_comida" ? "Vuelta de comida" : "", f.anulado ? "ANULADO" : f.origen === "correccion" ? "Corregido" : f.origen === "manual" ? "Anadido a mano" : "", f.anuladoPor || f.corregidoPor || "", f.motivoAnulacion || f.motivoCorreccion || ""]));
    bajar(filas.map((x) => x.map(celda).join(";")).join("\r\n"), "fichajes_registro_completo_" + (todos ? "todos" : selNombre.replace(/\s+/g, "_")) + ".csv");
  }
  // Todo lo que consta de un empleado: fichajes, turnos, tareas, ventas, incidencias y checklist
  function descargarTodoEmpleado() {
    const normSet = new Set([...selSet].map(norm));
    const es = (v) => normSet.has(norm(v));
    const filas = [];
    const sec = (titulo, cab, datos) => { filas.push([titulo]); filas.push(cab); datos.forEach((x) => filas.push(x)); filas.push([]); };
    const fich = fichajes.filter((f) => es(f.empleado)).sort((a, b) => (a.momento?.toMillis?.() || 0) - (b.momento?.toMillis?.() || 0));
    sec("FICHAJES (" + fich.length + ")", ["Fecha", "Hora", "Tipo", "Punto", "Origen", "Distancia al punto (m)", "Precision GPS (m)"],
      fich.map((f) => [fechaLegible(fechaISO(f.momento)), horaCorta(f.momento), f.tipo || "", f.puntoNombre || "", f.origen || "", f.distanciaM ?? "", f.precisionM ?? ""]));
    const tur = turnosTodos.filter((t) => es(t.empleado)).sort((a, b) => String(a.lunes).localeCompare(String(b.lunes)));
    sec("TURNOS (" + tur.length + " semanas)", ["Semana del lunes", ...DIAS_SEMANA],
      tur.map((t) => [fechaLegible(t.lunes), ...DIAS_SEMANA.map((_, i) => (t.turnos || [])[i] ?? "")]));
    const tar = tareasTodas.filter((t) => es(t.empleado));
    sec("TAREAS ASIGNADAS (" + tar.length + ")", ["Fecha", "Tarea", "Asignada por"], tar.map((t) => [fechaLegible(t.fecha), t.tarea || "", t.asignadoPor || ""]));
    const ven = ventasTodas.filter((v) => es(v.registradoPor));
    sec("VENTAS REGISTRADAS (" + ven.length + ")", ["Fecha", "Tipo", "Jugadores", "Importe"], ven.map((v) => [fechaLegible(v.fecha), v.tipo || "", v.jugadores ?? "", v.importe ?? ""]));
    const inc = incidTodas.filter((i) => es(i.reportadoPor));
    sec("INCIDENCIAS REPORTADAS (" + inc.length + ")", ["Fecha", "Titulo", "Gravedad", "Estado"], inc.map((i) => [fechaCorta(i.creadoEn), i.titulo || "", i.gravedad || "", i.estado || ""]));
    const chk = checkTodos.filter((c) => es(c.actualizadoPor));
    sec("CHECKLIST ACTUALIZADO (" + chk.length + " dias)", ["Fecha", "Tareas hechas"], chk.map((c) => [fechaLegible(c.fecha), (c.hechas || []).length]));
    bajar(filas.map((x) => x.map(celda).join(";")).join("\r\n"), "registros_completos_" + selNombre.replace(/\s+/g, "_") + ".csv");
  }
  function descargar() {
    const filas = [];
    if (todos) {
      filas.push(["Empleado", "Periodo", "Dias fichados", "Horas trabajadas", "Media por dia", "Dias incompletos", "Horas acumuladas en el ano"]);
      resumen.forEach((x) => filas.push([x.nombre, etiquetaRango(modo, r), x.dias.length, hhmm(x.ms), x.dias.length ? hhmm(x.ms / x.dias.length) : "", x.incompletos, hhmm(x.anioMs)]));
    } else {
      filas.push(["Empleado", "Fecha", "Entrada", "Salida", "Punto", "Duracion tramo", "Total del dia", "Pausa comida (no cuenta)"]);
      detalle.dias.forEach((d) => d.tramos.forEach((t, i) => filas.push([
        detalle.nombre, fechaLegible(d.fecha), txt(t.ent), txt(t.sal), (t.ent || t.sal)?.puntoNombre || "",
        (t.ent && t.sal) ? hhmm(t.sal.momento.toMillis() - t.ent.momento.toMillis()) : "incompleto", i === 0 ? hhmm(d.ms) : "", i === 0 && d.pausaMs > 0 ? hhmm(d.pausaMs) : "",
      ])));
      filas.push([]); filas.push(["TOTAL", etiquetaRango(modo, r), "", "", "", "", hhmm(totalMs), ""]);
    }
    bajar(filas.map((x) => x.map(celda).join(";")).join("\r\n"), "fichajes_" + (todos ? "todos" : selNombre.replace(/\s+/g, "_")) + "_" + modo + "_" + r.desde + ".csv");
  }

  return (
    <div className="mt-10">
      <p className="text-sm font-medium mb-3" style={{ color: TINTA }}>Informe de fichajes</p>
      <Tarjeta className="p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {MODOS.map(([id, nom]) => <PillFiltro key={id} activo={modo === id} onClick={() => setModo(id)}>{nom}</PillFiltro>)}
        </div>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <Field label="Empleado">
            <select className={inputCls} style={inputStyle} value={empleado} onChange={(e) => { setEmpleado(e.target.value); setExtras([]); }}>
              <option value="__todos">Todos (resumen)</option>
              {personas.map((p) => <option key={p.key} value={p.key}>{p.nombre}</option>)}
            </select>
          </Field>
          {modo === "custom" ? (
            <>
              <Field label="Desde"><input type="date" className={inputCls} style={inputStyle} value={desdeC} onChange={(e) => setDesdeC(e.target.value)} /></Field>
              <Field label="Hasta"><input type="date" className={inputCls} style={inputStyle} value={hastaC} onChange={(e) => setHastaC(e.target.value)} /></Field>
            </>
          ) : (
            <div className="sm:col-span-2 flex items-center gap-2">
              <button onClick={() => setAncla(moverAncla(modo, ancla, -1))} className="p-2 rounded-lg border" style={{ borderColor: PAPEL_LINEA, color: TINTA }}><ChevronLeft size={16} /></button>
              <input type="date" className={inputCls} style={inputStyle} value={ancla} onChange={(e) => e.target.value && setAncla(e.target.value)} />
              <button onClick={() => setAncla(moverAncla(modo, ancla, 1))} className="p-2 rounded-lg border" style={{ borderColor: PAPEL_LINEA, color: TINTA }}><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
          <p className="text-sm" style={{ color: TINTA_SUAVE }}><b style={{ color: TINTA }}>{etiquetaRango(modo, r)}</b> · Total {hhmm(totalMs)}</p>
          <div className="flex gap-2">
            <BotonSecundario onClick={descargar}>Descargar Excel (CSV)</BotonSecundario>
            <BotonSecundario onClick={descargarBruto}>Registro completo (todas las fechas)</BotonSecundario>
            {!todos && <BotonSecundario onClick={descargarTodoEmpleado}>Todo lo de {selNombre.split(" ")[0]} (fichajes, turnos, ventas...)</BotonSecundario>}
            <BotonSecundario onClick={() => window.print()}>Imprimir</BotonSecundario>
          </div>
        </div>
        {!todos && otrosNombres.length > 0 && (
          <div className="mt-3 text-xs" style={{ color: TINTA_SUAVE }}>
            <p className="mb-1">Si {selNombre} tambien ficho con otro nombre, marcalo para incluirlo:</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {otrosNombres.map((n) => (
                <label key={n} className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={extras.includes(n)} onChange={(e) => setExtras(e.target.checked ? [...extras, n] : extras.filter((x) => x !== n))} />
                  {n}{cuentas[n] ? " (" + cuentas[n] + ")" : ""}
                </label>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs mt-3" style={{ color: TINTA_SUAVE }}>
          Fichajes guardados por nombre: {Object.keys(cuentas).length === 0 ? "ninguno" : Object.entries(cuentas).sort((a, b) => a[0].localeCompare(b[0], "es")).map(([n, c]) => n + " (" + c + ")").join(" · ")}
        </p>
      </Tarjeta>

      {todos && (
        <div className="space-y-2">
          {resumen.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin empleados.</p>}
          {resumen.map((x) => (
            <Tarjeta key={x.nombre} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium" style={{ color: TINTA }}>{x.nombre}</p>
                  <p className="text-xs" style={{ color: TINTA_SUAVE }}>{x.dias.length} dias fichados{x.dias.length ? " · media " + hhmm(x.ms / x.dias.length) + " al dia" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  {x.incompletos > 0 && <Badge tone="rojo">{x.incompletos} dia{x.incompletos !== 1 ? "s" : ""} incompleto{x.incompletos !== 1 ? "s" : ""}</Badge>}
                  <span className="text-lg num font-semibold" style={{ color: TINTA }}>{hhmm(x.ms)}</span>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1" style={{ color: TINTA_SUAVE }}>
                  <span>Acumulado {r.desde.slice(0, 4)}: {hhmm(x.anioMs)}</span><span>Jornada anual: {JORNADA_ANUAL_H} h</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: PAPEL_LINEA }}>
                  <div className="h-2 rounded-full" style={{ width: Math.min(100, (x.anioMs / 3600000 / JORNADA_ANUAL_H) * 100) + "%", background: SALVIA }} />
                </div>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      {!todos && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: TINTA_SUAVE }}>Acumulado del ano {r.desde.slice(0, 4)}: <b style={{ color: TINTA }}>{hhmm(detalle.anioMs)}</b> de {JORNADA_ANUAL_H} h de jornada anual.</p>
          {detalle.dias.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin fichajes en ese periodo.</p>}
          {[...detalle.dias].reverse().map((d) => (
            <Tarjeta key={d.fecha} className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-medium text-sm" style={{ color: TINTA }}>{fechaLegible(d.fecha)}</p>
                <p className="text-xs num" style={{ color: TINTA_SUAVE }}>{d.tramos.map((t) => txt(t.ent) + " - " + txt(t.sal)).join("   ·   ")}{d.pausaMs > 0 ? "   ·   pausa comida " + hhmm(d.pausaMs) : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                {d.incompleto && <Badge tone="rojo">Falta entrada o salida</Badge>}
                <span className="text-sm num font-medium" style={{ color: TINTA }}>{hhmm(d.ms)}</span>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </div>
  );
}

// Correccion de fichajes por el responsable. Nada se borra: el original queda guardado
// (marcado como anulado) y cada cambio deja constancia de quien, cuando y por que.
function CorreccionFichajes({ equipo, fichajes, nombreOperario }) {
  const [abierto, setAbierto] = useState(false);
  const [persona, setPersona] = useState("");
  const [fecha, setFecha] = useState(fechaISO(new Date()));
  const [accion, setAccion] = useState(null); // { tipo: "editar" | "anular" | "nuevo", f }
  const [form, setForm] = useState({ hora: "", tipoF: "entrada", comida: false, motivo: "" });
  const [guardando, setGuardando] = useState(false);
  const { datos: log } = useColeccion("recep_fichajes_log", "creadoEn", "desc");

  const nombreFichaje = (nombre) => {
    const cont = {};
    fichajes.filter((f) => mismaPersona(nombre, f.empleado)).forEach((f) => { cont[f.empleado] = (cont[f.empleado] || 0) + 1; });
    return Object.entries(cont).sort((a, b) => b[1] - a[1])[0]?.[0] || nombre;
  };
  const delDia = persona ? fichajes
    .filter((f) => mismaPersona(persona, f.empleado) && fechaISO(f.momento) === fecha)
    .sort((a, b) => (a.momento?.toMillis?.() || 0) - (b.momento?.toMillis?.() || 0)) : [];
  const horaDe = (f) => horaCorta(f.momento);
  const etiqueta = (f) => (f.motivo === "comida" ? "salida a comer" : f.motivo === "vuelta_comida" ? "vuelta de comida" : f.tipo);

  function abrirAccion(tipo, f) {
    setAccion({ tipo, f });
    setForm({ hora: f ? horaDe(f) : "", tipoF: f?.tipo || "entrada", comida: f?.motivo === "comida", motivo: "" });
  }
  async function guardar() {
    if (!form.motivo.trim()) { alert("Escribe el motivo de la correccion. Es obligatorio y queda registrado."); return; }
    if (accion.tipo !== "anular" && !/^\d{2}:\d{2}$/.test(form.hora)) { alert("Indica la hora."); return; }
    setGuardando(true);
    try {
      const por = nombreOperario || "Responsable";
      const empleado = accion.f?.empleado || nombreFichaje(persona);
      const momentoNuevo = accion.tipo !== "anular" ? Timestamp.fromDate(new Date(fecha + "T" + form.hora + ":00")) : null;
      const baseNuevo = {
        empleado, momento: momentoNuevo, tipo: accion.tipo === "editar" ? accion.f.tipo : form.tipoF,
        ...((accion.tipo === "editar" ? accion.f.motivo : (form.comida && form.tipoF === "salida" ? "comida" : "")) ? { motivo: accion.tipo === "editar" ? accion.f.motivo : "comida" } : {}),
        origen: accion.tipo === "editar" ? "correccion" : "manual",
        motivoCorreccion: form.motivo.trim(), corregidoPor: por, corregidoEn: serverTimestamp(),
      };
      if (accion.tipo === "editar" || accion.tipo === "anular") {
        await actualizarDoc("recep_fichajes", accion.f.id, { anulado: true, anuladoPor: por, anuladoEn: serverTimestamp(), motivoAnulacion: form.motivo.trim() });
      }
      let nuevoId = null;
      if (accion.tipo !== "anular") {
        const ref = await crearDoc("recep_fichajes", { ...baseNuevo, ...(accion.tipo === "editar" ? { sustituyeA: accion.f.id } : {}) });
        nuevoId = ref.id;
      }
      await crearDoc("recep_fichajes_log", {
        accion: accion.tipo, empleado, fecha, por, motivo: form.motivo.trim(), fichajeOriginalId: accion.f?.id || null, fichajeNuevoId: nuevoId,
        antes: accion.f ? { hora: horaDe(accion.f), tipo: accion.f.tipo, motivo: accion.f.motivo || "" } : null,
        despues: accion.tipo === "anular" ? null : { hora: form.hora, tipo: baseNuevo.tipo, motivo: baseNuevo.motivo || "" },
      });
      setAccion(null);
    } catch (e) { alert("No se pudo guardar la correccion. Intentalo de nuevo."); }
    setGuardando(false);
  }
  const logPersona = persona ? log.filter((l) => mismaPersona(persona, l.empleado)).slice(0, 15) : [];

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm font-medium" style={{ color: TINTA }}>Corregir fichajes</p>
        <BotonSecundario onClick={() => setAbierto(!abierto)}>{abierto ? "Cerrar" : "Corregir o anadir un fichaje"}</BotonSecundario>
      </div>
      {abierto && (
        <Tarjeta className="p-4">
          <p className="text-xs mb-3" style={{ color: TINTA_SUAVE }}>
            Para olvidos o equivocaciones. No se borra nada: el fichaje original se conserva marcado como anulado y queda registrado quien lo corrige, cuando y el motivo (obligatorio). Los informes usan solo los fichajes vigentes.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Empleado">
              <select className={inputCls} style={inputStyle} value={persona} onChange={(e) => setPersona(e.target.value)}>
                <option value="">Selecciona...</option>
                {equipo.filter((m) => !m.baja).map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
              </select>
            </Field>
            <Field label="Dia"><input type="date" className={inputCls} style={inputStyle} value={fecha} onChange={(e) => e.target.value && setFecha(e.target.value)} /></Field>
          </div>
          {persona && (
            <div className="mt-3 space-y-2">
              {delDia.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin fichajes ese dia.</p>}
              {delDia.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-2 flex-wrap rounded-lg px-3 py-2" style={{ background: f.anulado ? LADRILLO_SUAVE : VINO_SUAVE }}>
                  <div style={{ textDecoration: f.anulado ? "line-through" : "none", color: TINTA }}>
                    <span className="num font-medium">{horaDe(f)}</span> · {etiqueta(f)}
                    {f.origen === "correccion" && <span className="text-xs"> · corregido</span>}
                    {f.origen === "manual" && <span className="text-xs"> · anadido a mano</span>}
                  </div>
                  {f.anulado ? <span className="text-xs" style={{ color: LADRILLO }}>Anulado por {f.anuladoPor}: {f.motivoAnulacion}</span> : (
                    <div className="flex gap-3 text-sm">
                      <button onClick={() => abrirAccion("editar", f)} className="underline" style={{ color: VINO }}>Cambiar hora</button>
                      <button onClick={() => abrirAccion("anular", f)} className="underline" style={{ color: LADRILLO }}>Anular</button>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => abrirAccion("nuevo", null)} className="text-sm underline" style={{ color: VINO }}>+ Anadir un fichaje olvidado</button>
            </div>
          )}
          {logPersona.length > 0 && (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: VINO }}>Historial de correcciones</p>
              <div className="space-y-1">
                {logPersona.map((l) => (
                  <p key={l.id} className="text-xs" style={{ color: TINTA_SUAVE }}>
                    {fechaCorta(l.creadoEn)} · {l.por} · {l.accion === "editar" ? "cambio " + l.antes?.hora + " → " + l.despues?.hora : l.accion === "anular" ? "anulo " + l.antes?.hora + " " + l.antes?.tipo : "anadio " + l.despues?.hora + " " + l.despues?.tipo} (dia {fechaLegible(l.fecha)}) · "{l.motivo}"
                  </p>
                ))}
              </div>
            </div>
          )}
        </Tarjeta>
      )}
      <Modal open={!!accion} onClose={() => setAccion(null)} title={accion?.tipo === "editar" ? "Cambiar hora del fichaje" : accion?.tipo === "anular" ? "Anular fichaje" : "Anadir fichaje olvidado"}>
        <p className="text-sm mb-3" style={{ color: TINTA_SUAVE }}>{persona} · {fechaLegible(fecha)}{accion?.f ? " · " + horaDe(accion.f) + " " + etiqueta(accion.f) : ""}</p>
        {accion?.tipo !== "anular" && (
          <Field label={accion?.tipo === "editar" ? "Hora correcta" : "Hora"}><input type="time" className={inputCls} style={inputStyle} value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Field>
        )}
        {accion?.tipo === "nuevo" && (
          <>
            <Field label="Tipo">
              <select className={inputCls} style={inputStyle} value={form.tipoF} onChange={(e) => setForm({ ...form, tipoF: e.target.value })}>
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
              </select>
            </Field>
            {form.tipoF === "salida" && (
              <label className="flex items-center gap-2 mb-3 text-sm" style={{ color: TINTA_SUAVE }}>
                <input type="checkbox" checked={form.comida} onChange={(e) => setForm({ ...form, comida: e.target.checked })} /> Es salida a comer (pausa de comida)
              </label>
            )}
          </>
        )}
        <Field label="Motivo de la correccion (obligatorio)"><textarea rows={2} className={inputCls} style={inputStyle} value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="p.ej. Olvido fichar la salida; me lo comunica por WhatsApp" /></Field>
        <div className="mt-2"><BotonPrimario onClick={guardar} icon={null}>{guardando ? "Guardando..." : "Guardar correccion"}</BotonPrimario></div>
      </Modal>
    </div>
  );
}

function Fichajes({ puedeInforme, puedeCorregir, nombreOperario }) {
  const { datos: equipoTodos } = useColeccion("recep_equipo", "nombre", "asc");
  const equipo = equipoTodos.filter((m) => !m.baja);
  const { datos: fichajes } = useColeccion("recep_fichajes", "momento", "desc");
  const hoy = fechaISO(new Date());
  const fichajesHoy = fichajes.filter((f) => fechaISO(f.momento) === hoy && !f.anulado);

  return (
    <div>
      <Cabecera titulo="Fichajes" subtitulo="Entradas y salidas del personal de recepcion, registradas por codigo QR." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {equipo.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Anade primero miembros del equipo.</p>}
        {equipo.map((m) => {
          const estado = ultimoEstadoFichaje(fichajes, m.nombre);
          const enComida = estado === "fuera" && fichajes.find((f) => f.empleado === m.nombre && !f.anulado)?.motivo === "comida";
          return (
            <Tarjeta key={m.id} className="p-4 flex items-center justify-between">
              <span className="font-medium" style={{ color: TINTA }}>{m.nombre}</span>
              <Badge tone={estado === "dentro" ? "verde" : enComida ? "ambar" : "neutral"}>{estado === "dentro" ? "Dentro" : enComida ? "En comida" : "Fuera"}</Badge>
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
            <Badge tone={f.tipo === "entrada" ? "verde" : f.motivo === "comida" ? "ambar" : "neutral"}>{f.motivo === "comida" ? "salida a comer" : f.motivo === "vuelta_comida" ? "vuelta de comida" : f.tipo}</Badge>
          </Tarjeta>
        ))}
      </div>
      {puedeInforme && <InformeFichajes equipo={equipoTodos} fichajes={fichajes} />}
      {puedeCorregir && <CorreccionFichajes equipo={equipoTodos} fichajes={fichajes} nombreOperario={nombreOperario} />}
    </div>
  );
}

const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const TURNOS_OPCIONES = ["Manana", "Tarde", "Partido", "Libre", "Vacaciones", "Baja"];

function lunesDeSemana(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const diaSemana = date.getDay();
  const offset = diaSemana === 0 ? -6 : 1 - diaSemana;
  date.setDate(date.getDate() + offset);
  return fechaISO(date);
}
function sumarDiasISO(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return fechaISO(date);
}
function idTurno(lunesISO, empleado) {
  return `${lunesISO}_${empleado.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}
function toneTurno(t) {
  if (t === "Manana" || t === "Tarde" || t === "Partido") return "verde";
  if (t === "Vacaciones") return "dorado";
  if (t === "Baja") return "rojo";
  return "neutral";
}

function Turnos({ nombreOperario, puedeEditar }) {
  const hoy = fechaISO(new Date());
  const [lunesActual, setLunesActual] = useState(lunesDeSemana(hoy));
  const dias = Array.from({ length: 7 }, (_, i) => sumarDiasISO(lunesActual, i));

  const { datos: equipoTodos } = useColeccion("recep_equipo", "nombre", "asc");
  const equipo = equipoTodos.filter((m) => !m.baja);
  const { datos: turnosTodos } = useColeccion("recep_turnos", "lunes", "desc");
  const { datos: tareasTodas } = useColeccion("recep_tareas_asignadas", "creadoEn", "desc");

  const turnosSemana = turnosTodos.filter((t) => t.lunes === lunesActual);
  const tareasSemana = tareasTodas.filter((t) => dias.includes(t.fecha));

  const [editando, setEditando] = useState(null);
  const [modalTarea, setModalTarea] = useState(false);
  const vacioTarea = { empleado: "", tarea: "", fecha: hoy };
  const [formTarea, setFormTarea] = useState(vacioTarea);

  function turnoDe(empleado, fecha) {
    const doc = turnosSemana.find((t) => t.empleado === empleado);
    return doc?.turnos?.[fecha] || "-";
  }
  async function guardarTurno(empleado, fecha, valor) {
    const id = idTurno(lunesActual, empleado);
    const existente = turnosSemana.find((t) => t.empleado === empleado);
    const nuevos = { ...(existente?.turnos || {}), [fecha]: valor };
    await setDoc(docClub("recep_turnos", id), { lunes: lunesActual, empleado, turnos: nuevos }, { merge: true });
    setEditando(null);
  }
  function abrirNuevaTarea() { setFormTarea({ ...vacioTarea, empleado: equipo[0]?.nombre || "" }); setModalTarea(true); }
  async function guardarTarea() {
    if (!formTarea.empleado || !formTarea.tarea.trim()) { alert("Elige un empleado y escribe la tarea."); return; }
    await crearDoc("recep_tareas_asignadas", { ...formTarea, asignadoPor: nombreOperario || "" });
    setModalTarea(false);
  }
  async function borrarTarea(id) {
    if (!confirm("Eliminar esta tarea asignada?")) return;
    await borrarDoc("recep_tareas_asignadas", id);
  }

  return (
    <div>
      <Cabecera titulo="Turnos" subtitulo="Planificacion semanal de turnos y tareas asignadas.">
        {puedeEditar && <BotonPrimario onClick={abrirNuevaTarea}>Asignar tarea</BotonPrimario>}
      </Cabecera>

      <div className="flex items-center justify-between mb-6 max-w-xl">
        <button onClick={() => setLunesActual(sumarDiasISO(lunesActual, -7))} className="p-2 rounded-lg border transition" style={{ borderColor: PAPEL_LINEA, color: TINTA_SUAVE }}>
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium" style={{ color: TINTA }}>
          Semana del {fechaLegible(lunesActual)} al {fechaLegible(sumarDiasISO(lunesActual, 6))}
        </p>
        <button onClick={() => setLunesActual(sumarDiasISO(lunesActual, 7))} className="p-2 rounded-lg border transition" style={{ borderColor: PAPEL_LINEA, color: TINTA_SUAVE }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {equipo.length === 0 && <p className="text-sm mb-6" style={{ color: TINTA_TENUE }}>Anade primero miembros del equipo en "Equipo".</p>}

      {equipo.length > 0 && (
        <div className="overflow-x-auto mb-10">
          <table className="w-full border-collapse min-w-[760px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold uppercase tracking-wide pb-3 pr-4" style={{ color: TINTA_TENUE }}>Empleado</th>
                {dias.map((f, i) => (
                  <th key={f} className="text-center text-xs font-semibold uppercase tracking-wide pb-3 px-2" style={{ color: f === hoy ? VINO : TINTA_TENUE }}>
                    {DIAS_SEMANA[i]}<br /><span className="num font-normal">{fechaLegible(f)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipo.map((m) => (
                <tr key={m.id} style={{ borderTop: `1px solid ${PAPEL_LINEA}` }}>
                  <td className="py-3 pr-4 font-medium text-sm" style={{ color: TINTA }}>{m.nombre}</td>
                  {dias.map((f) => {
                    const valor = turnoDe(m.nombre, f);
                    const estaEditando = editando && editando.empleado === m.nombre && editando.fecha === f;
                    return (
                      <td key={f} className="py-2 px-2 text-center">
                        {puedeEditar ? (
                          estaEditando ? (
                            <select
                              autoFocus
                              className="text-xs rounded-md border px-1.5 py-1"
                              style={{ borderColor: PAPEL_LINEA, color: TINTA }}
                              value={valor === "-" ? "" : valor}
                              onChange={(e) => guardarTurno(m.nombre, f, e.target.value)}
                              onBlur={() => setEditando(null)}
                            >
                              <option value="">-</option>
                              {TURNOS_OPCIONES.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <button onClick={() => setEditando({ empleado: m.nombre, fecha: f })}>
                              <Badge tone={toneTurno(valor)}>{valor}</Badge>
                            </button>
                          )
                        ) : (
                          <Badge tone={toneTurno(valor)}>{valor}</Badge>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm font-medium mb-3" style={{ color: TINTA }}>Tareas asignadas esta semana</p>
      <div className="space-y-2 max-w-xl">
        {tareasSemana.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>Sin tareas asignadas esta semana.</p>}
        {tareasSemana.map((t) => (
          <Tarjeta key={t.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm" style={{ color: TINTA }}>{t.tarea}</p>
              <p className="text-xs mt-0.5" style={{ color: TINTA_SUAVE }}>{t.empleado} · {fechaLegible(t.fecha)}</p>
            </div>
            {puedeEditar && (
              <button onClick={() => borrarTarea(t.id)} className="p-1 rounded transition" style={{ color: TINTA_TENUE }}><Trash2 size={14} /></button>
            )}
          </Tarjeta>
        ))}
      </div>

      <Modal open={modalTarea} onClose={() => setModalTarea(false)} title="Asignar tarea">
        <Field label="Empleado">
          <select className={inputCls} style={inputStyle} value={formTarea.empleado} onChange={(e) => setFormTarea({ ...formTarea, empleado: e.target.value })}>
            {equipo.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </Field>
        <Field label="Tarea"><input className={inputCls} style={inputStyle} value={formTarea.tarea} onChange={(e) => setFormTarea({ ...formTarea, tarea: e.target.value })} placeholder="p.ej. Repasar carro de golf 3" /></Field>
        <Field label="Fecha"><input type="date" className={inputCls} style={inputStyle} value={formTarea.fecha} onChange={(e) => setFormTarea({ ...formTarea, fecha: e.target.value })} /></Field>
        <div className="mt-4"><BotonPrimario onClick={guardarTarea} icon={null}>Guardar</BotonPrimario></div>
      </Modal>
    </div>
  );
}

function Necesidades({ nombreOperario, origen, puedeDestachar }) {
  const { datos: necesidades } = useColeccion("necesidades", "creadoEn", "desc");
  const [modalNueva, setModalNueva] = useState(false);
  const [texto, setTexto] = useState("");

  const pendientes = necesidades.filter((n) => !n.completada);
  const completadas = necesidades.filter((n) => n.completada);

  async function crearNecesidad() {
    if (!texto.trim()) { alert("Escribe la necesidad."); return; }
    await crearDoc("necesidades", { texto: texto.trim(), creadoPor: nombreOperario || "", origen });
    setTexto("");
    setModalNueva(false);
  }
  async function marcarCompletada(n) {
    await actualizarDoc("necesidades", n.id, { completada: true, completadaPor: nombreOperario || "", completadaEn: serverTimestamp() });
  }
  async function destacharNecesidad(n) {
    if (!confirm("Quitar el tachado de esta necesidad?")) return;
    await actualizarDoc("necesidades", n.id, { completada: false, completadaPor: null, completadaEn: null });
  }

  return (
    <div>
      <Cabecera titulo="Necesidades" subtitulo="Peticiones compartidas entre Recepcion, Mantenimiento y Direccion.">
        <BotonPrimario onClick={() => { setTexto(""); setModalNueva(true); }}>Nueva necesidad</BotonPrimario>
      </Cabecera>

      <div className="space-y-2 max-w-2xl mb-8">
        {pendientes.length === 0 && <p className="text-sm" style={{ color: TINTA_TENUE }}>No hay necesidades pendientes.</p>}
        {pendientes.map((n) => (
          <Tarjeta key={n.id} className="p-4 flex items-start gap-3">
            <button onClick={() => marcarCompletada(n)} className="mt-0.5 w-5 h-5 rounded border flex-shrink-0" style={{ borderColor: VINO }} aria-label="Marcar como cubierta" />
            <div>
              <p className="text-sm font-medium" style={{ color: TINTA }}>{n.texto}</p>
              <p className="text-xs mt-0.5" style={{ color: TINTA_SUAVE }}>Pedido por {n.creadoPor || "?"} · {n.origen}</p>
            </div>
          </Tarjeta>
        ))}
      </div>

      {completadas.length > 0 && (
        <>
          <p className="text-sm font-medium mb-3" style={{ color: TINTA }}>Cubiertas</p>
          <div className="space-y-2 max-w-2xl">
            {completadas.map((n) => (
              <Tarjeta key={n.id} className="p-4 flex items-start gap-3" style={{ opacity: 0.65 }}>
                <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: VINO }}>
                  <Check size={13} color={PAPEL} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-through" style={{ color: TINTA_SUAVE }}>{n.texto}</p>
                  <p className="text-xs mt-0.5" style={{ color: TINTA_TENUE }}>Pedido por {n.creadoPor || "?"} · {n.origen} — Cubierto por {n.completadaPor || "?"}</p>
                </div>
                {puedeDestachar && (
                  <button onClick={() => destacharNecesidad(n)} className="text-xs underline flex-shrink-0" style={{ color: TINTA_TENUE }}>Destachar</button>
                )}
              </Tarjeta>
            ))}
          </div>
        </>
      )}

      <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva necesidad">
        <Field label="Que se necesita">
          <input className={inputCls} style={inputStyle} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="p.ej. Comprar bolsas de basura" autoFocus />
        </Field>
        <div className="mt-4"><BotonPrimario onClick={crearNecesidad}>Guardar</BotonPrimario></div>
      </Modal>
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

  // Pide la ubicacion. Primero con precision normal (rapida, funciona dentro de
  // edificios) y, si falla por tiempo o posicion no disponible, lo reintenta con
  // GPS de alta precision. Los errores se explican segun su causa real.
  function pedirUbicacion() {
    setUbicacion(null);
    setErrorUbicacion("");
    if (!navigator.geolocation) { setErrorUbicacion("Este dispositivo no soporta geolocalizacion."); return; }
    if (window.isSecureContext === false) { setErrorUbicacion("La ubicacion solo funciona en una conexion segura (https)."); return; }
    const ok = (pos) => setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude, precision: pos.coords.accuracy });
    const mensaje = (err) => {
      if (err?.code === 1) return "Permiso de ubicacion denegado. Activalo en los ajustes del navegador para este sitio (en iPhone: Ajustes > Privacidad > Localizacion > Safari) y pulsa reintentar.";
      if (err?.code === 2) return "No se pudo determinar tu posicion. Activa el GPS del movil y sal al aire libre o junto a una ventana.";
      if (err?.code === 3) return "La ubicacion tarda demasiado. Activa el GPS, sal al aire libre o junto a una ventana y pulsa reintentar.";
      return "No se pudo obtener tu ubicacion. Activa el GPS y los permisos de ubicacion del navegador.";
    };
    navigator.geolocation.getCurrentPosition(
      ok,
      (err1) => {
        if (err1?.code === 1) { setErrorUbicacion(mensaje(err1)); return; }
        navigator.geolocation.getCurrentPosition(
          ok,
          (err2) => setErrorUbicacion(mensaje(err2)),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }

  useEffect(() => { pedirUbicacion(); }, []);

  function distanciaMetros(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const misFichajes = fichajes.filter((f) => f.empleado === nombreOperario && !f.anulado);
  const tipo = misFichajes.length === 0 || misFichajes[0].tipo === "salida" ? "entrada" : "salida";

  const distancia = punto && ubicacion ? distanciaMetros(ubicacion.lat, ubicacion.lng, punto.lat, punto.lng) : null;
  // El GPS del movil tiene un margen de error (precision/accuracy). Si ese
  // margen es grande, restamos parte de esa tolerancia a la distancia antes
  // de comparar con el radio permitido, hasta un tope de 30m para no anular
  // por completo el sentido del geofence.
  const tolerancia = ubicacion ? Math.min(30, ubicacion.precision || 0) : 0;
  const distanciaAjustada = distancia != null ? Math.max(0, distancia - tolerancia) : null;
  const dentroDeRango = distanciaAjustada != null && distanciaAjustada <= (punto?.radioMetros || 50);

  function reintentarUbicacion() { pedirUbicacion(); }

  const vuelveDeComer = tipo === "entrada" && misFichajes[0]?.motivo === "comida";
  async function confirmar(salidaComida) {
    if (!dentroDeRango) { alert("Debes estar mas cerca del punto de fichaje."); return; }
    setGuardando(true);
    try {
      await crearDoc("recep_fichajes", {
        empleado: nombreOperario,
        tipo,
        ...(salidaComida === true ? { motivo: "comida" } : vuelveDeComer ? { motivo: "vuelta_comida" } : {}),
        momento: serverTimestamp(),
        origen: "qr",
        puntoId: punto.id,
        puntoNombre: punto.nombre,
        lat: ubicacion.lat,
        lng: ubicacion.lng,
        precisionM: ubicacion.precision,
        distanciaM: Math.round(distancia),
      });
      setHecho(salidaComida === true ? "comida" : tipo);
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
            <BotonPrimario onClick={volver} icon={null}>Ir al menu de la app</BotonPrimario>
          </>
        )}
        {punto && hecho && (
          <>
            <p className="font-medium text-lg mb-2" style={{ color: TINTA, fontFamily: SERIF }}>{hecho === "entrada" ? (vuelveDeComer ? "Vuelta de comida registrada" : "Entrada registrada") : hecho === "comida" ? "Salida a comer registrada" : "Salida registrada"}</p>
            <p className="text-sm mb-4" style={{ color: TINTA_SUAVE }}>{punto.nombre} - {nombreOperario}</p>
            <BotonPrimario onClick={volver} icon={null}>Ir al menu de la app</BotonPrimario>
          </>
        )}
        {punto && !hecho && (
          <>
            <p className="text-xs uppercase tracking-wide mb-1" style={{ color: VINO }}>{punto.nombre}</p>
            <p className="font-medium text-lg mb-4" style={{ color: TINTA, fontFamily: SERIF }}>Fichar {tipo}</p>
            {!ubicacion && !errorUbicacion && <p className="text-sm mb-4" style={{ color: TINTA_SUAVE }}>Obteniendo tu ubicacion...</p>}
            {errorUbicacion && (
              <>
                <p className="text-sm mb-3" style={{ color: LADRILLO }}>{errorUbicacion}</p>
                <button onClick={reintentarUbicacion} className="text-xs underline mb-4" style={{ color: VINO }}>Reintentar ubicacion</button>
              </>
            )}
            {ubicacion && distancia != null && (
              <>
                <p className="text-sm mb-2" style={{ color: dentroDeRango ? SALVIA : LADRILLO }}>
                  {dentroDeRango ? `Estas dentro del punto (${Math.round(distancia)} m).` : `Estas a ${Math.round(distancia)} m del punto. Debes estar a menos de ${punto.radioMetros} m para fichar.`}
                </p>
                <p className="text-xs mb-4" style={{ color: TINTA_TENUE }}>
                  Precision del GPS: ±{Math.round(ubicacion.precision)} m.
                  {!dentroDeRango && " Si estas junto al punto, prueba a salir al aire libre o pulsa reintentar."}
                </p>
                {!dentroDeRango && (
                  <button onClick={reintentarUbicacion} className="text-xs underline mb-4" style={{ color: VINO }}>Reintentar ubicacion</button>
                )}
              </>
            )}
            <BotonPrimario onClick={() => confirmar(false)} icon={null} disabled={!dentroDeRango || guardando}>
              {guardando ? "Registrando..." : vuelveDeComer ? "Confirmar vuelta de comida" : tipo === "salida" ? "Confirmar salida (fin de jornada)" : "Confirmar entrada"}
            </BotonPrimario>
            {tipo === "salida" && (
              <button onClick={() => confirmar(true)} disabled={!dentroDeRango || guardando} className="block w-full mt-3 rounded-lg px-4 py-2.5 text-sm font-medium border" style={{ borderColor: VINO, color: VINO, opacity: (!dentroDeRango || guardando) ? 0.5 : 1 }}>
                Salgo a comer (pausa comida)
              </button>
            )}
            <button onClick={volver} className="block mx-auto mt-4 text-sm underline" style={{ color: VINO }}>Ir al menu de la app</button>
          </>
        )}
      </Tarjeta>
    </div>
  );
}
