"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Search, SendHorizonal, Sparkles, Trash2, UserPlus, X } from "lucide-react";
import { demoProfile } from "@/lib/data";
import { getSessionProfile } from "@/lib/session";
import { saveChatMessage, saveCommunityComment, saveCommunityPost, saveDailyTopicComment } from "@/lib/firebase/community";

type CommunityUser = {
  username: string;
  name: string;
  sign: string;
  moon: string;
  level: number;
  rank: string;
  vibe: string;
};

type WallPost = {
  id: string;
  username: string;
  sign: string;
  body: string;
  likes: number;
  comments: string[];
};

type ChatMessage = {
  from: "me" | "them";
  text: string;
  ts: number;
};

const DEMO_USERS: CommunityUser[] = [
  { username: "lunaloca", name: "Luna Loca", sign: "Cáncer", moon: "Leo", level: 12, rank: "Bruja Lunar", vibe: "emocional, brillante y dramática con estilo" },
  { username: "saturno69", name: "Saturno 69", sign: "Capricornio", moon: "Virgo", level: 21, rank: "Jefe del Karma", vibe: "ordenado, sarcástico y con agenda de acero" },
  { username: "venusretro", name: "Venus Retro", sign: "Libra", moon: "Géminis", level: 9, rank: "Diplomática del Caos", vibe: "encantadora, indecisa y socialmente letal" },
  { username: "oraculo404", name: "Oráculo 404", sign: "Acuario", moon: "Sagitario", level: 14, rank: "Señal Perdida", vibe: "rara, libre y alérgica a las explicaciones simples" },
  { username: "tarotpunk", name: "Tarot Punk", sign: "Aries", moon: "Escorpio", level: 18, rank: "Fuego Salvaje", vibe: "rápida, intensa y cero paciente con la tibieza" },
  { username: "neonbruja", name: "Neon Bruja", sign: "Escorpio", moon: "Piscis", level: 17, rank: "Arcana Hacker", vibe: "intensa, leal y peligrosamente intuitiva" }
];

const TOPICS = [
  "¿Qué señal ignoraste esta semana y ahora te mira desde la esquina?",
  "Confiesa una decisión que tu signo tomaría aunque el universo grite que no.",
  "¿Qué frase de tarot debería estar prohibida por decir demasiada verdad?",
  "Describe tu caos amoroso usando solo una predicción meteorológica.",
  "¿Qué ritual inventado te funciona aunque suene sospechoso?"
];

const INITIAL_POSTS: WallPost[] = [
  { id: "p1", username: "lunaloca", sign: "Cáncer", body: "Hoy mi intuición dijo no. Yo dije sí. El resultado fue educativo y humillante.", likes: 42, comments: ["Eso fue muy Cáncer con WiFi emocional.", "El universo tomó nota."] },
  { id: "p2", username: "saturno69", sign: "Capricornio", body: "Mi descanso duró siete minutos porque recordé una tarea de 2021.", likes: 31, comments: ["Saturno aplaude con preocupación."] },
  { id: "p3", username: "venusretro", sign: "Libra", body: "Dije que no quería drama y luego revisé el chat archivado. Soy arte contemporáneo.", likes: 58, comments: ["Galería abierta, entrada libre."] }
];

const INITIAL_CONVERSATIONS: Record<string, ChatMessage[]> = {
  lunaloca: [
    { from: "them", text: "Hoy ZODI me dijo que no confunda nostalgia con señal divina. Grosero, pero útil.", ts: Date.now() - 120000 },
    { from: "me", text: "A veces el oráculo entra con botas.", ts: Date.now() - 60000 }
  ]
};

function getCompatibility(a: string, b: string, level: number) {
  const seed = `${a}-${b}-${level}`.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const score = 48 + (seed % 47);
  const text =
    score > 82
      ? "Conexión alta. Hay chispa, ritmo y una probabilidad peligrosa de entenderse incluso en silencio."
      : score > 68
        ? "Buena mezcla. Hay química, pero conviene hablar claro antes de que la imaginación monte una serie completa."
        : "Compatibilidad interesante, no imposible. Eso sí: aquí la comunicación no es opcional, es el cinturón de seguridad.";
  return { score, text };
}

export function CommunityHub() {
  const sessionProfile = getSessionProfile();
  const me = sessionProfile ?? demoProfile;
  const myUsername = me.username ?? me.displayName ?? "yo";
  const mySign = me.zodiac ?? "Escorpio";

  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<WallPost[]>(INITIAL_POSTS);
  const [postText, setPostText] = useState("");
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [topicComment, setTopicComment] = useState("");
  const [topicComments, setTopicComments] = useState([
    "Yo ignoré la señal y ahora la señal tiene mi número.",
    "Mi signo pidió calma. Yo pedí café."
  ]);

  // Chat privado
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(INITIAL_CONVERSATIONS);
  const [activeChatUser, setActiveChatUser] = useState<string>("lunaloca");
  const [selectedUser, setSelectedUser] = useState<CommunityUser>(DEMO_USERS[0]);
  const [chatText, setChatText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("zodi.community_welcomed")) setShowWelcome(true);
    } catch { /* ignore */ }
  }, []);

  const topic = TOPICS[new Date().getDate() % TOPICS.length];
  const filtered = DEMO_USERS.filter((u) =>
    `${u.username} ${u.name} ${u.sign}`.toLowerCase().includes(query.toLowerCase())
  );
  const compatibility = useMemo(
    () => getCompatibility(mySign, selectedUser.sign, selectedUser.level),
    [mySign, selectedUser]
  );
  const activeMessages = conversations[activeChatUser] ?? [];
  const conversationList = Object.keys(conversations);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  function publishPost() {
    if (!postText.trim()) return;
    const body = postText.trim();
    setPosts((items) => [
      { id: crypto.randomUUID(), username: myUsername, sign: mySign, body, likes: 0, comments: [] },
      ...items
    ]);
    void saveCommunityPost({ username: myUsername, sign: mySign, body }).catch(() => undefined);
    setPostText("");
  }

  function addTopicComment() {
    if (!topicComment.trim()) return;
    const body = topicComment.trim();
    setTopicComments((items) => [body, ...items]);
    void saveDailyTopicComment({ topic, username: myUsername, body }).catch(() => undefined);
    setTopicComment("");
  }

  function addComment(postId: string) {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    const body = text;
    setPosts((items) =>
      items.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, body] } : post
      )
    );
    void saveCommunityComment({ postId, username: myUsername, body }).catch(() => undefined);
    setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
  }

  function openChat(user: CommunityUser) {
    setSelectedUser(user);
    setActiveChatUser(user.username);
    if (!conversations[user.username]) {
      setConversations((prev) => ({ ...prev, [user.username]: [] }));
    }
  }

  function sendMessage() {
    if (!chatText.trim()) return;
    const body = chatText.trim();
    const msg: ChatMessage = { from: "me", text: body, ts: Date.now() };
    setConversations((prev) => ({
      ...prev,
      [activeChatUser]: [...(prev[activeChatUser] ?? []), msg]
    }));
    void saveChatMessage({ fromUsername: myUsername, toUsername: activeChatUser, body }).catch(() => undefined);
    setChatText("");
  }

  function deleteConversation(username: string) {
    setConversations((prev) => {
      const updated = { ...prev };
      delete updated[username];
      return updated;
    });
    setShowDeleteConfirm(null);
    if (activeChatUser === username) {
      const remaining = conversationList.filter((u) => u !== username);
      setActiveChatUser(remaining[0] ?? "");
    }
  }

  const activeChatUserObj = DEMO_USERS.find((u) => u.username === activeChatUser);

  const WELCOME_PROMPTS = [
    `¿Qué señal del universo ignoraste esta semana y cómo te pasó la factura?`,
    `Describe en una frase el caos de tu vida usando solo términos astrológicos.`,
    `¿Qué tiene que pasar para que dejes de ignorar esa cosa que sabes que tienes que hacer?`,
  ];
  const welcomePrompt = WELCOME_PROMPTS[new Date().getDate() % WELCOME_PROMPTS.length];

  function dismissWelcome(withPost?: string) {
    try { localStorage.setItem("zodi.community_welcomed", "1"); } catch { /* ignore */ }
    if (withPost) {
      setPostText(withPost);
    }
    setShowWelcome(false);
  }

  return (
    <section className="grid gap-5">
      {/* ── Onboarding overlay — primera visita ── */}
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-lime-300/30 bg-gradient-to-br from-lime-950/60 to-black/80 p-5 sm:p-6"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(184,255,23,0.1),transparent_65%)]" />
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-300/70 mb-2">Tu primer mensaje a la comunidad</p>
            <p className="text-lg font-black leading-snug mb-1">Bienvenido al caos colectivo 🌌</p>
            <p className="text-sm text-white/55 mb-4">La comunidad ZODI vive de lo que escribes. ¿Por dónde empiezas?</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => dismissWelcome(welcomePrompt)}
                className="rounded-xl border border-lime-300/30 bg-lime-300/10 px-3 py-2 text-xs font-bold text-lime-200 transition hover:bg-lime-300/20"
              >
                💬 &quot;{welcomePrompt.slice(0, 50)}...&quot;
              </button>
              <button
                onClick={() => dismissWelcome()}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/40 hover:text-white/70 transition"
              >
                Explorar primero
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tema del día */}
      <div className="glass-panel neon-border rounded-md p-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-lime-200/70">
          <Sparkles className="h-4 w-4" /> Tema del día
        </div>
        <h2 className="mt-2 text-2xl font-black sm:text-3xl">{topic}</h2>
        <p className="mt-3 text-sm leading-6 text-white/62">
          ZODI deja una chispa diaria para comentar. La comunidad pone el drama, las risas y alguna que otra verdad difícil de mirar directamente.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={topicComment}
            onChange={(e) => setTopicComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTopicComment()}
            placeholder="Responde al tema de hoy..."
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-lime-300/50"
          />
          <button onClick={addTopicComment} className="rounded-md bg-lime-300 px-4 py-3 font-black text-black">
            Comentar
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {topicComments.map((comment, i) => (
            <p key={i} className="rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-white/68">
              {comment}
            </p>
          ))}
        </div>
      </div>

      {/* Usuarios + Compatibilidad */}
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="glass-panel rounded-md p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-lime-200/70">Usuarios de la comunidad</p>
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/45 px-3 py-3">
            <Search className="h-4 w-4 shrink-0 text-lime-200" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por usuario, nombre o signo..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
          </div>
          <div className="mt-3 grid gap-2">
            {filtered.map((user) => (
              <button
                key={user.username}
                onClick={() => openChat(user)}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 text-left transition ${
                  selectedUser.username === user.username
                    ? "border-lime-300 bg-lime-300/10 text-lime-100"
                    : "border-white/10 bg-white/[0.03] text-white/75 hover:border-purple-300/40"
                }`}
              >
                <div>
                  <p className="font-black">@{user.username}</p>
                  <p className="text-xs opacity-70">
                    {user.name} · {user.sign} · nv {user.level}
                  </p>
                </div>
                <UserPlus className="h-4 w-4 shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-md p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-200/70">Compatibilidad</p>
          <h2 className="mt-2 text-3xl font-black">
            {mySign} + {selectedUser.sign}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/66">
            @{selectedUser.username}: {selectedUser.vibe}.
          </p>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs text-white/55">
              <span>Nivel de conexión</span>
              <span>{compatibility.score}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lime-300 via-fuchsia-400 to-cyan-300 transition-all duration-700"
                style={{ width: `${compatibility.score}%` }}
              />
            </div>
          </div>
          <p className="mt-4 rounded-md border border-lime-300/20 bg-lime-300/10 p-3 text-sm leading-6 text-lime-100">
            {compatibility.text}
          </p>
          <button
            onClick={() => openChat(selectedUser)}
            className="mt-4 rounded-md border border-white/15 px-4 py-3 text-sm font-black text-white/78 transition hover:border-lime-300/50 hover:text-lime-100"
          >
            Abrir chat privado con @{selectedUser.username}
          </button>
        </div>
      </div>

      {/* Muro social */}
      <div className="glass-panel rounded-md p-5">
        <h2 className="text-2xl font-black">Muro de estados y señales</h2>
        <p className="mt-1 text-xs text-white/50">
          Publicas como @{myUsername} · {mySign}
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && publishPost()}
            placeholder="Publica una señal, confesión o mini caos..."
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/45 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-lime-300/50"
          />
          <button onClick={publishPost} className="rounded-md bg-lime-300 px-4 py-3 font-black text-black">
            Publicar
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col rounded-md border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-lime-100">
                  @{post.username} · {post.sign}
                </p>
                <button
                  onClick={() =>
                    setPosts((items) =>
                      items.map((item) =>
                        item.id === post.id ? { ...item, likes: item.likes + 1 } : item
                      )
                    )
                  }
                  className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-xs text-white/60 transition hover:border-lime-300/40 hover:text-lime-200"
                >
                  <Heart className="h-3 w-3" /> {post.likes}
                </button>
              </div>
              <p className="mt-2 flex-1 text-sm leading-6 text-white/72">{post.body}</p>
              <div className="mt-3 grid gap-1">
                {post.comments.map((comment, i) => (
                  <p key={i} className="rounded-md bg-white/[0.04] p-2 text-xs text-white/62">
                    ZODI crew: {comment}
                  </p>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={commentTexts[post.id] ?? ""}
                  onChange={(e) =>
                    setCommentTexts((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addComment(post.id)}
                  placeholder="Comentar..."
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/35 px-3 py-2 text-xs text-white outline-none focus:border-lime-300/40"
                />
                <button
                  onClick={() => addComment(post.id)}
                  aria-label="Comentar publicación"
                  className="rounded-md border border-lime-300/25 px-3 py-2 text-xs text-lime-100 transition hover:border-lime-300"
                >
                  <MessageCircle className="h-3 w-3" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Chat privado */}
      <div className="glass-panel rounded-md p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-lime-200/70">Chats privados</p>
        <h2 className="mt-1 text-2xl font-black">Mensajes directos</h2>

        <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
          {/* Lista de conversaciones */}
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/45 uppercase tracking-wider">Conversaciones</p>
            {conversationList.length === 0 && (
              <p className="text-xs text-white/40 italic">
                Abre un chat desde el panel de usuarios.
              </p>
            )}
            {conversationList.map((username) => {
              const user = DEMO_USERS.find((u) => u.username === username);
              const isActive = activeChatUser === username;
              const lastMsg = conversations[username]?.at(-1);
              return (
                <div key={username} className="group relative">
                  <button
                    onClick={() => setActiveChatUser(username)}
                    className={`w-full rounded-md border p-3 text-left transition ${
                      isActive
                        ? "border-lime-300 bg-lime-300/10"
                        : "border-white/10 bg-white/[0.03] hover:border-purple-300/30"
                    }`}
                  >
                    <p className="text-sm font-black text-white">@{username}</p>
                    {user && (
                      <p className="text-xs text-white/45">
                        {user.sign} · nv {user.level}
                      </p>
                    )}
                    {lastMsg && (
                      <p className="mt-1 truncate text-xs text-white/40">
                        {lastMsg.from === "me" ? "Tú: " : ""}
                        {lastMsg.text}
                      </p>
                    )}
                  </button>
                  {/* Botón eliminar */}
                  {showDeleteConfirm === username ? (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-md border border-red-400/40 bg-black/90 p-2">
                      <span className="text-xs text-white/70">¿Eliminar?</span>
                      <button
                        onClick={() => deleteConversation(username)}
                        className="rounded bg-red-500 px-2 py-1 text-xs font-black text-white"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="rounded border border-white/20 px-2 py-1 text-xs text-white/60"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(username)}
                      title="Eliminar conversación"
                      className="absolute right-2 top-2 hidden rounded p-1 text-white/30 transition hover:text-red-400 group-hover:block"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Área de mensajes */}
          {activeChatUser && activeChatUserObj ? (
            <div className="flex flex-col">
              <div className="mb-3 flex items-center justify-between rounded-md border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <p className="font-black text-white">@{activeChatUser}</p>
                  <p className="text-xs text-white/45">
                    {activeChatUserObj.sign} · {activeChatUserObj.rank}
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(activeChatUser)}
                  title="Eliminar conversación"
                  className="rounded-md border border-white/10 p-2 text-white/40 transition hover:border-red-400/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-72 min-h-48 space-y-2 overflow-auto rounded-md border border-white/10 bg-black/30 p-3">
                {activeMessages.length === 0 && (
                  <p className="py-6 text-center text-xs text-white/35 italic">
                    Inicia la conversación. Cuidado: el cosmos escucha.
                  </p>
                )}
                {activeMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] rounded-md p-3 text-sm leading-5 ${
                      msg.from === "me"
                        ? "ml-auto bg-lime-300 text-black"
                        : "mr-auto bg-white/[0.08] text-white/80"
                    }`}
                  >
                    <p className="mb-1 text-[10px] font-black opacity-60">
                      {msg.from === "me" ? "Tú" : `@${activeChatUser}`}
                    </p>
                    {msg.text}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={`Mensaje a @${activeChatUser}...`}
                  className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/45 px-3 py-3 text-sm text-white outline-none focus:border-lime-300/50"
                />
                <button
                  onClick={sendMessage}
                  aria-label="Enviar mensaje"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-lime-300 text-black transition hover:bg-lime-200"
                >
                  <SendHorizonal className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-2 text-xs text-white/35">
                Los chats privados son solo tuyos. Puedes borrar la conversación en cualquier momento.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-md border border-white/10 bg-black/20 p-10 text-center">
              <div>
                <X className="mx-auto mb-3 h-8 w-8 text-white/20" />
                <p className="text-sm text-white/40">
                  Selecciona un usuario para abrir un chat privado.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
