"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSessionProfile, getLocalSession } from "@/lib/session";
import {
  Search, UserPlus, Users, Bell, Check, X, Loader2, Sparkles,
  Star, HeartHandshake, UserCheck, Clock, ChevronRight,
} from "lucide-react";

const SIGNS = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

const SIGN_EMOJI: Record<string, string> = {
  Aries: "♈", Tauro: "♉", Géminis: "♊", Cáncer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Escorpio: "♏", Sagitario: "♐", Capricornio: "♑", Acuario: "♒", Piscis: "♓",
};

const ELEMENT: Record<string, string> = {
  Aries: "Fuego", Leo: "Fuego", Sagitario: "Fuego",
  Tauro: "Tierra", Virgo: "Tierra", Capricornio: "Tierra",
  Géminis: "Aire", Libra: "Aire", Acuario: "Aire",
  Cáncer: "Agua", Escorpio: "Agua", Piscis: "Agua",
};

const ELEMENT_COMPAT: Record<string, Record<string, number>> = {
  Fuego: { Fuego: 85, Aire: 88, Tierra: 55, Agua: 48 },
  Tierra: { Tierra: 82, Agua: 87, Fuego: 55, Aire: 60 },
  Aire:   { Aire: 80, Fuego: 88, Agua: 52, Tierra: 60 },
  Agua:   { Agua: 88, Tierra: 87, Aire: 52, Fuego: 48 },
};

const SPECIAL_BONUS: Record<string, number> = {
  "Aries-Sagitario": 7, "Sagitario-Aries": 7,
  "Tauro-Cáncer": 6, "Cáncer-Tauro": 6,
  "Géminis-Acuario": 8, "Acuario-Géminis": 8,
  "Leo-Aries": 6, "Aries-Leo": 6,
  "Virgo-Capricornio": 7, "Capricornio-Virgo": 7,
  "Libra-Géminis": 7, "Géminis-Libra": 7,
  "Escorpio-Piscis": 9, "Piscis-Escorpio": 9,
  "Sagitario-Acuario": 5, "Acuario-Sagitario": 5,
};

function getCompatScore(mySign: string, theirSign: string): number {
  const myEl = ELEMENT[mySign] ?? "Fuego";
  const theirEl = ELEMENT[theirSign] ?? "Fuego";
  const base = ELEMENT_COMPAT[myEl]?.[theirEl] ?? 65;
  const bonus = SPECIAL_BONUS[`${mySign}-${theirSign}`] ?? 0;
  const seed = (mySign.charCodeAt(0) + theirSign.charCodeAt(0)) % 8;
  return Math.min(99, Math.max(45, base + bonus + seed));
}

function scoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 88) return { label: "Conexión estelar", color: "text-lime-300", bg: "bg-lime-300/15 border-lime-300/30" };
  if (score >= 78) return { label: "Alta afinidad", color: "text-cyan-300", bg: "bg-cyan-300/15 border-cyan-300/30" };
  if (score >= 65) return { label: "Buena química", color: "text-violet-300", bg: "bg-violet-300/15 border-violet-300/30" };
  if (score >= 50) return { label: "Energía tensa", color: "text-amber-300", bg: "bg-amber-300/15 border-amber-300/30" };
  return { label: "Choque de fuerzas", color: "text-orange-400", bg: "bg-orange-400/15 border-orange-400/30" };
}

type Tab = "amigos" | "buscar" | "solicitudes";

interface FriendData {
  requestId: string;
  uid: string;
  username: string;
  displayName: string;
  sign: string;
  avatar: string;
}

interface RequestData {
  id: string;
  fromUid: string;
  fromUsername: string;
  fromDisplayName: string;
  fromSign: string;
  fromAvatar: string;
}

interface SearchUser {
  uid: string;
  username: string;
  displayName: string;
  sign: string;
  avatar: string;
}

export function AmigosSectionUI() {
  const [tab, setTab] = useState<Tab>("amigos");

  // My profile
  const [myUid, setMyUid]         = useState("");
  const [mySign, setMySign]       = useState("");
  const [myName, setMyName]       = useState("");
  const [myAvatar, setMyAvatar]   = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [myReadingTone, setMyReadingTone] = useState("directo");

  // Friends list
  const [friends, setFriends]     = useState<FriendData[]>([]);
  const [friendUids, setFriendUids] = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);

  // Requests
  const [requests, setRequests]   = useState<RequestData[]>([]);

  // Search
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingUids, setPendingUids]   = useState<Set<string>>(new Set());
  const [sendingTo, setSendingTo]       = useState<string | null>(null);

  // Active friend detail (expanded reading)
  const [activeFriendUid, setActiveFriendUid] = useState<string | null>(null);
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [readingLoading, setReadingLoading] = useState<string | null>(null);

  // Accept / reject
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load session
  useEffect(() => {
    const profile = getSessionProfile();
    const session = getLocalSession();
    setMyUid(session.uid ?? "");
    setMySign(profile?.zodiac ?? "");
    setMyName(profile?.displayName?.split(" ")[0] ?? "tú");
    setMyAvatar(profile?.avatar ?? "/zodi-art/perfil/perfil-1.webp");
    setMyUsername((session.onboardingData as any)?.username ?? "");
    setMyReadingTone(profile?.readingTone ?? "directo");
  }, []);

  // Load friends + incoming requests
  const loadData = useCallback(async () => {
    if (!myUid) return;
    setLoading(true);
    try {
      const [{ collection, query, where, getDocs }, { getFirebaseDb }] = await Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase/client"),
      ]);
      const db = getFirebaseDb();
      if (!db) return;

      const [sentAccepted, receivedAccepted, incoming, sentPending] = await Promise.all([
        getDocs(query(collection(db, "friends"), where("requesterUid", "==", myUid), where("status", "==", "accepted"))),
        getDocs(query(collection(db, "friends"), where("receiverUid", "==", myUid), where("status", "==", "accepted"))),
        getDocs(query(collection(db, "friends"), where("receiverUid", "==", myUid), where("status", "==", "pending"))),
        getDocs(query(collection(db, "friends"), where("requesterUid", "==", myUid), where("status", "==", "pending"))),
      ]);

      const friendsList: FriendData[] = [];
      const uidSet = new Set<string>();

      sentAccepted.forEach(doc => {
        const d = doc.data();
        if (!uidSet.has(d.receiverUid)) {
          uidSet.add(d.receiverUid);
          friendsList.push({ requestId: doc.id, uid: d.receiverUid, username: d.receiverUsername ?? "", displayName: d.receiverDisplayName ?? "", sign: d.receiverSign ?? "", avatar: d.receiverAvatar ?? "/zodi-art/perfil/perfil-1.webp" });
        }
      });

      receivedAccepted.forEach(doc => {
        const d = doc.data();
        if (!uidSet.has(d.requesterUid)) {
          uidSet.add(d.requesterUid);
          friendsList.push({ requestId: doc.id, uid: d.requesterUid, username: d.requesterUsername ?? "", displayName: d.requesterDisplayName ?? "", sign: d.requesterSign ?? "", avatar: d.requesterAvatar ?? "/zodi-art/perfil/perfil-1.webp" });
        }
      });

      const requestsList: RequestData[] = [];
      incoming.forEach(doc => {
        const d = doc.data();
        requestsList.push({ id: doc.id, fromUid: d.requesterUid, fromUsername: d.requesterUsername ?? "", fromDisplayName: d.requesterDisplayName ?? "", fromSign: d.requesterSign ?? "", fromAvatar: d.requesterAvatar ?? "/zodi-art/perfil/perfil-1.webp" });
      });

      const pendingSet = new Set<string>();
      sentPending.forEach(doc => pendingSet.add(doc.data().receiverUid));

      setFriends(friendsList);
      setFriendUids(uidSet);
      setRequests(requestsList);
      setPendingUids(pendingSet);
    } catch (e) {
      console.error("[ZODI] Error loading friends:", e);
    } finally {
      setLoading(false);
    }
  }, [myUid]);

  useEffect(() => { if (myUid) loadData(); }, [myUid, loadData]);

  // Search users by username
  const searchUsers = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const [{ collection, query: fbQuery, where, getDocs }, { getFirebaseDb }] = await Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase/client"),
      ]);
      const db = getFirebaseDb();
      if (!db) return;

      const snap = await getDocs(fbQuery(collection(db, "users"), where("username", "==", term)));
      const results: SearchUser[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (doc.id !== myUid) {
          results.push({ uid: doc.id, username: d.username ?? "", displayName: d.displayName ?? "", sign: d.sunSign ?? "", avatar: d.avatar ?? "/zodi-art/perfil/perfil-1.webp" });
        }
      });
      setSearchResults(results);
    } catch (e) {
      console.error("[ZODI] Search error:", e);
    } finally {
      setSearchLoading(false);
    }
  }, [myUid]);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery, searchUsers]);

  // Send friend request
  async function sendRequest(toUser: SearchUser) {
    if (!myUid || sendingTo) return;
    setSendingTo(toUser.uid);
    try {
      const [{ collection, addDoc, serverTimestamp }, { getFirebaseDb }] = await Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase/client"),
      ]);
      const db = getFirebaseDb();
      if (!db) return;
      await addDoc(collection(db, "friends"), {
        requesterUid: myUid,
        requesterUsername: myUsername,
        requesterDisplayName: myName,
        requesterSign: mySign,
        requesterAvatar: myAvatar,
        receiverUid: toUser.uid,
        receiverUsername: toUser.username,
        receiverDisplayName: toUser.displayName,
        receiverSign: toUser.sign,
        receiverAvatar: toUser.avatar,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setPendingUids(prev => new Set([...prev, toUser.uid]));
    } catch (e) {
      console.error("[ZODI] Error sending request:", e);
    } finally {
      setSendingTo(null);
    }
  }

  // Accept request
  async function acceptRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const [{ doc, updateDoc }, { getFirebaseDb }] = await Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase/client"),
      ]);
      const db = getFirebaseDb();
      if (!db) return;
      await updateDoc(doc(db, "friends", requestId), { status: "accepted" });
      await loadData();
      setTab("amigos");
    } catch (e) {
      console.error("[ZODI] Error accepting:", e);
    } finally {
      setActionLoading(null);
    }
  }

  // Reject request
  async function rejectRequest(requestId: string) {
    setActionLoading(requestId);
    try {
      const [{ doc, updateDoc }, { getFirebaseDb }] = await Promise.all([
        import("firebase/firestore"),
        import("@/lib/firebase/client"),
      ]);
      const db = getFirebaseDb();
      if (!db) return;
      await updateDoc(doc(db, "friends", requestId), { status: "rejected" });
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e) {
      console.error("[ZODI] Error rejecting:", e);
    } finally {
      setActionLoading(null);
    }
  }

  // Load / toggle AI reading for a friend
  async function toggleFriendReading(friend: FriendData) {
    if (activeFriendUid === friend.uid) {
      setActiveFriendUid(null);
      return;
    }
    setActiveFriendUid(friend.uid);
    if (readings[friend.uid]) return; // already loaded

    setReadingLoading(friend.uid);
    const session = getLocalSession();
    const profile = getSessionProfile();

    const myProfile = {
      zodiac: profile?.zodiac ?? "desconocido",
      moonSign: profile?.moonSign ?? "desconocida",
      ascendant: profile?.ascendant ?? "desconocido",
      displayName: myName,
      birthDate: session.onboardingData?.birthDate ?? null,
      readingTone: myReadingTone,
    };

    const prompt = `Analiza la compatibilidad entre ${myName} (${myProfile.zodiac}, Luna ${myProfile.moonSign}, Asc ${myProfile.ascendant}) y ${friend.displayName || friend.username} (${friend.sign}). Incluye: química natural, puntos de choque, cómo se comunican, área más fuerte y consejo directo. Estilo ZODI: directo, gracioso, sin postureo espiritual. Máximo 200 palabras.`;

    try {
      const res = await fetch("/api/ai/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "compatibility", input: prompt, profile: myProfile }),
      });
      const data = await res.json().catch(() => ({}));
      setReadings(prev => ({ ...prev, [friend.uid]: data.reading ?? data.text ?? "El cosmos guardó silencio. Inténtalo de nuevo." }));
    } catch {
      setReadings(prev => ({ ...prev, [friend.uid]: "No pude conectar con las estrellas. Inténtalo de nuevo." }));
    } finally {
      setReadingLoading(null);
    }
  }

  const TABS = [
    { id: "amigos" as Tab, label: "Mis amigos", Icon: Users },
    { id: "buscar" as Tab, label: "Buscar", Icon: Search },
    { id: "solicitudes" as Tab, label: "Solicitudes", Icon: Bell },
  ];

  return (
    <div className="space-y-4">

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/25 p-5 sm:p-6"
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 shrink-0">
            <HeartHandshake className="h-6 w-6 text-violet-300" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300/70">Amigos en ZODI</p>
            <h2 className="text-lg sm:text-xl font-black leading-tight">Tu círculo astral</h2>
            <p className="mt-0.5 text-sm text-white/50">Añade amigos y descubre cuánta energía compartís.</p>
          </div>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <div className="flex gap-1 rounded-xl border border-white/06 bg-black/30 p-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition ${
              tab === id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{id === "solicitudes" ? "Solicitudes" : label}</span>
            {id === "solicitudes" && requests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-fuchsia-400 text-[9px] font-black text-black">
                {requests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── TAB: MIS AMIGOS ── */}
        {tab === "amigos" && (
          <motion.div key="amigos" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-14 text-white/30">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center">
                <div className="mb-3 text-5xl">🪐</div>
                <p className="font-black text-white">Aún no tienes amigos en ZODI</p>
                <p className="mt-1 text-sm text-white/50 mb-5">Búscalos por su @usuario o invítalos a la app.</p>
                <button
                  onClick={() => setTab("buscar")}
                  className="rounded-xl bg-lime-300 px-5 py-2.5 text-sm font-black text-black transition hover:bg-lime-200 active:scale-95"
                >
                  Buscar amigos
                </button>
              </div>
            ) : (
              friends.map(friend => {
                const score = getCompatScore(mySign || "Aries", friend.sign || "Aries");
                const { label, color, bg } = scoreLabel(score);
                const isOpen = activeFriendUid === friend.uid;
                const isLoadingReading = readingLoading === friend.uid;

                return (
                  <motion.div key={friend.uid} layout className="glass-panel rounded-2xl overflow-hidden">
                    {/* Friend row */}
                    <button
                      onClick={() => toggleFriendReading(friend)}
                      className="flex w-full items-center gap-3 p-4 sm:p-5 text-left transition hover:bg-white/03"
                    >
                      <img
                        src={friend.avatar}
                        alt={friend.displayName}
                        className="h-12 w-12 shrink-0 rounded-full border border-white/10 object-cover"
                        onError={e => { (e.target as HTMLImageElement).src = "/zodi-art/perfil/perfil-1.webp"; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-black text-white">{friend.displayName || friend.username}</p>
                          <span className="shrink-0 text-lg">{SIGN_EMOJI[friend.sign] ?? "⭐"}</span>
                        </div>
                        <p className="text-xs text-white/40">@{friend.username} · {friend.sign || "Signo desconocido"}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xl font-black text-white">{score}%</p>
                        <p className={`text-[10px] font-bold ${color}`}>{label}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 text-white/25 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </button>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          key="detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28 }}
                          className="overflow-hidden border-t border-white/06"
                        >
                          <div className="space-y-4 p-4 sm:p-5">
                            {/* Compat bar */}
                            <div>
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-xs text-white/40">Compatibilidad astral</span>
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${bg} ${color}`}>{label}</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-white/08">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-lime-300 via-fuchsia-400 to-cyan-300"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </div>
                            </div>

                            {/* Signs row */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{SIGN_EMOJI[mySign] ?? "⭐"}</span>
                                <span className="font-bold text-white/70">{myName}</span>
                              </div>
                              <span className="text-[10px] text-white/25">vs</span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white/70">{friend.displayName?.split(" ")[0] || friend.username}</span>
                                <span className="text-2xl">{SIGN_EMOJI[friend.sign] ?? "⭐"}</span>
                              </div>
                            </div>

                            {/* AI reading */}
                            {isLoadingReading ? (
                              <div className="flex items-center gap-2 text-sm text-white/40">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Consultando las constelaciones...
                              </div>
                            ) : readings[friend.uid] ? (
                              <div>
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.28em] text-lime-300/70">✦ Lo que dicen las estrellas</p>
                                <p className="text-sm leading-relaxed text-white/75">{readings[friend.uid]}</p>
                              </div>
                            ) : null}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* ── TAB: BUSCAR ── */}
        {tab === "buscar" && (
          <motion.div key="buscar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <p className="mb-3 text-xs font-bold text-white/50">Busca por @usuario exacto</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="@usuario..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-9 pr-10 text-sm text-white placeholder-white/25 outline-none transition focus:border-lime-300/40"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/30" />
                )}
              </div>

              {/* Mi usuario */}
              <div className="mt-3 rounded-xl border border-white/06 bg-white/02 px-3 py-2.5 flex items-center gap-2">
                <Star className="h-3.5 w-3.5 shrink-0 text-amber-300/60" />
                <p className="text-[11px] text-white/45">
                  Tu usuario:{" "}
                  {myUsername
                    ? <span className="font-bold text-lime-300/80">@{myUsername}</span>
                    : <span className="text-white/30 italic">no configurado — ve a perfil</span>
                  }. Compártelo para que te encuentren.
                </p>
              </div>
            </div>

            {/* Sin resultados */}
            {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div className="glass-panel rounded-2xl p-6 text-center">
                <p className="text-sm text-white/50">
                  No encontramos a <span className="font-bold text-white">@{searchQuery}</span> en ZODI.
                </p>
                <p className="mt-1 text-xs text-white/30">El usuario debe estar registrado y tener alias configurado.</p>
              </div>
            )}

            {/* Resultados */}
            {searchResults.map(user => {
              const isFriend  = friendUids.has(user.uid);
              const isPending = pendingUids.has(user.uid);
              const isSending = sendingTo === user.uid;
              return (
                <div key={user.uid} className="glass-panel flex items-center gap-3 rounded-2xl p-4">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "/zodi-art/perfil/perfil-1.webp"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-black text-white">{user.displayName}</p>
                    <p className="text-xs text-white/40">
                      @{user.username}{user.sign ? ` · ${SIGN_EMOJI[user.sign] ?? ""} ${user.sign}` : ""}
                    </p>
                  </div>
                  {isFriend ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-xl border border-lime-300/30 bg-lime-300/15 px-3 py-1.5 text-xs font-bold text-lime-300">
                      <UserCheck className="h-3.5 w-3.5" /> Amigos
                    </span>
                  ) : isPending ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-xl border border-white/12 bg-white/06 px-3 py-1.5 text-xs font-bold text-white/50">
                      <Clock className="h-3.5 w-3.5" /> Pendiente
                    </span>
                  ) : (
                    <button
                      onClick={() => sendRequest(user)}
                      disabled={!!isSending}
                      className="flex shrink-0 items-center gap-1 rounded-xl border border-violet-400/30 bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-violet-500/25 active:scale-95 disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                      {isSending ? "..." : "Añadir"}
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── TAB: SOLICITUDES ── */}
        {tab === "solicitudes" && (
          <motion.div key="solicitudes" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-14 text-white/30">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center">
                <div className="mb-3 text-4xl">📭</div>
                <p className="font-black text-white">Sin solicitudes pendientes</p>
                <p className="mt-1 text-sm text-white/50">Cuando alguien te añada, aparecerá aquí.</p>
              </div>
            ) : (
              requests.map(req => (
                <div key={req.id} className="glass-panel flex items-center gap-3 rounded-2xl p-4">
                  <img
                    src={req.fromAvatar}
                    alt={req.fromDisplayName}
                    className="h-11 w-11 shrink-0 rounded-full border border-white/10 object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "/zodi-art/perfil/perfil-1.webp"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-black text-white">{req.fromDisplayName}</p>
                    <p className="text-xs text-white/40">
                      @{req.fromUsername}{req.fromSign ? ` · ${SIGN_EMOJI[req.fromSign] ?? ""} ${req.fromSign}` : ""}
                    </p>
                    <p className="mt-0.5 text-[10px] text-violet-300/70">Quiere ser tu amigo en ZODI</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => rejectRequest(req.id)}
                      disabled={actionLoading === req.id}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/05 text-white/40 transition hover:border-orange-400/40 hover:text-orange-400 active:scale-95 disabled:opacity-40"
                      aria-label="Rechazar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => acceptRequest(req.id)}
                      disabled={actionLoading === req.id}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-lime-300/30 bg-lime-300/15 text-lime-300 transition hover:bg-lime-300/25 active:scale-95 disabled:opacity-40"
                      aria-label="Aceptar"
                    >
                      {actionLoading === req.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Check className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
