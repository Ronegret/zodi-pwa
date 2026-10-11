import { useId, useState, type FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SIGN_GLYPHS } from '@/lib/astro-engine/labels';
import type { Sign } from '@/lib/astro-engine/types';
import {
  REACTIONS,
  TOPICS,
  TOPIC_BY_VALUE,
  timeAgo,
  type ReactionKind,
} from '@/lib/community/options';
import type { CommunityTopic } from '@/lib/supabase/database.types';
import type { FeedComment, FeedPost } from '@/lib/server/community';

interface Props {
  initialPosts: FeedPost[];
  initialTopic: CommunityTopic | null;
  me: { id: string; firstName: string };
  pageSize: number;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(
    url,
    init?.body ? { ...init, headers: { 'Content-Type': 'application/json' } } : init,
  );
  const body = (await res.json().catch(() => ({}))) as { data?: T; error?: { message?: string } };
  if (!res.ok) throw new Error(body.error?.message ?? 'Algo se ha torcido en el más allá.');
  return body.data as T;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'Z';

function Author({
  p,
}: {
  p: Pick<
    FeedPost,
    'author_name' | 'author_username' | 'author_avatar' | 'author_level' | 'author_sign'
  >;
}) {
  const sign = p.author_sign as Sign | null;
  return (
    <span className="author">
      <span className="avatar avatar-sm" aria-hidden="true">
        {p.author_avatar ? (
          <img src={p.author_avatar} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span>{initials(p.author_name)}</span>
        )}
      </span>
      <span className="author-text">
        <strong>{p.author_name}</strong>
        <span className="author-meta">
          {sign && (
            <span className="author-sign">
              <span aria-hidden="true">{SIGN_GLYPHS[sign]}</span> {sign}
            </span>
          )}
          <span className="author-level">Nv {p.author_level}</span>
        </span>
      </span>
    </span>
  );
}

export function CommunityFeed({ initialPosts, initialTopic, me, pageSize }: Props) {
  const uid = useId();
  const [posts, setPosts] = useState(initialPosts);
  const [topic, setTopic] = useState<CommunityTopic | null>(initialTopic);
  const [hasMore, setHasMore] = useState(initialPosts.length >= pageSize);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftTopic, setDraftTopic] = useState<CommunityTopic>(initialTopic ?? 'general');
  const [composerError, setComposerError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState('');

  async function load(next: CommunityTopic | null, before?: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (next) params.set('tema', next);
      if (before) params.set('antes', before);
      const page = await api<FeedPost[]>(`/api/comunidad?${params}`);
      setPosts((cur) => (before ? [...cur, ...page] : page));
      setHasMore(page.length >= pageSize);
      setStatus(before ? `${page.length} posts más cargados.` : `${page.length} posts.`);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function chooseTopic(next: CommunityTopic | null) {
    setTopic(next);
    if (next) setDraftTopic(next);
    const url = new URL(location.href);
    if (next) url.searchParams.set('tema', next);
    else url.searchParams.delete('tema');
    history.replaceState(null, '', url);
    void load(next);
  }

  async function publish(e: FormEvent) {
    e.preventDefault();
    if (publishing) return;
    setPublishing(true);
    setComposerError(null);
    try {
      const post = await api<FeedPost>('/api/comunidad', {
        method: 'POST',
        body: JSON.stringify({ body: draft, topic: draftTopic }),
      });
      if (!topic || topic === post.topic) setPosts((cur) => [post, ...cur]);
      setDraft('');
      setStatus('Publicado. El universo (y la comunidad) ya lo saben.');
    } catch (err) {
      setComposerError((err as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  const update = (id: string, fn: (p: FeedPost) => FeedPost) =>
    setPosts((cur) => cur.map((p) => (p.id === id ? fn(p) : p)));
  const remove = (id: string) => setPosts((cur) => cur.filter((p) => p.id !== id));

  return (
    <div className="community">
      <form className="composer card" onSubmit={publish} noValidate>
        <label className="field-label" htmlFor={`${uid}-body`}>
          ¿Qué te dicen los astros hoy, {me.firstName}?
        </label>
        {composerError && (
          <p id={`${uid}-err`} className="field-error">
            <span className="visually-hidden">Error: </span>
            {composerError}
          </p>
        )}
        <textarea
          id={`${uid}-body`}
          className="input"
          rows={3}
          maxLength={2000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Mercurio me ha hecho mandar un audio de 4 minutos a mi ex. Necesito apoyo."
          aria-invalid={composerError ? true : undefined}
          aria-describedby={composerError ? `${uid}-err` : undefined}
        />
        <fieldset className="composer-topics">
          <legend className="visually-hidden">Tema</legend>
          <div className="chip-group">
            {TOPICS.map((t) => (
              <label key={t.value} className="chip chip-sm">
                <input
                  type="radio"
                  name="topic"
                  value={t.value}
                  checked={draftTopic === t.value}
                  onChange={() => setDraftTopic(t.value)}
                />
                <span aria-hidden="true">{t.emoji}</span> {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="composer-foot">
          <span className="muted small" aria-live="polite">
            {draft.length > 1800 ? `${2000 - draft.length} caracteres` : ''}
          </span>
          <button type="submit" className="btn btn-primary" disabled={publishing || !draft.trim()}>
            {publishing ? <span className="spinner" aria-hidden="true" /> : <Icon name="send" />}
            <span className="btn-label">Publicar</span>
          </button>
        </div>
      </form>

      <nav className="topics" aria-label="Filtrar por tema">
        <button
          type="button"
          className="chip chip-button"
          aria-pressed={topic === null}
          onClick={() => chooseTopic(null)}
        >
          Todo
        </button>
        {TOPICS.map((t) => (
          <button
            key={t.value}
            type="button"
            className="chip chip-button"
            aria-pressed={topic === t.value}
            onClick={() => chooseTopic(t.value)}
          >
            <span aria-hidden="true">{t.emoji}</span> {t.label}
          </button>
        ))}
      </nav>

      {posts.length === 0 && !loading ? (
        <p className="community-empty">
          Aquí no ha hablado nadie todavía. Sé la primera persona en romper el silencio cósmico.
        </p>
      ) : (
        <ol className="feed" aria-label="Publicaciones" aria-busy={loading}>
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              me={me}
              onChange={(fn) => update(p.id, fn)}
              onRemove={() => remove(p.id)}
              onStatus={setStatus}
            />
          ))}
        </ol>
      )}

      {hasMore && posts.length > 0 && (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          disabled={loading}
          onClick={() => void load(topic, posts.at(-1)!.created_at)}
        >
          {loading ? <span className="spinner" aria-hidden="true" /> : null}
          <span className="btn-label">Ver más</span>
        </button>
      )}
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  );
}

function PostCard({
  post,
  me,
  onChange,
  onRemove,
  onStatus,
}: {
  post: FeedPost;
  me: { id: string };
  onChange: (fn: (p: FeedPost) => FeedPost) => void;
  onRemove: () => void;
  onStatus: (s: string) => void;
}) {
  const uid = useId();
  const mine = post.author_id === me.id;
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reporting, setReporting] = useState(false);
  const topic = TOPIC_BY_VALUE.get(post.topic);

  async function toggleReaction(kind: ReactionKind) {
    const on = !post.my_reactions.includes(kind);
    const apply = (p: FeedPost, add: boolean): FeedPost => ({
      ...p,
      my_reactions: add ? [...p.my_reactions, kind] : p.my_reactions.filter((k) => k !== kind),
      reactions: { ...p.reactions, [kind]: Math.max(0, (p.reactions[kind] ?? 0) + (add ? 1 : -1)) },
    });
    onChange((p) => apply(p, on));
    try {
      await api(`/api/comunidad/${post.id}/reacciones`, {
        method: on ? 'POST' : 'DELETE',
        body: JSON.stringify({ kind }),
      });
    } catch (e) {
      onChange((p) => apply(p, !on));
      onStatus((e as Error).message);
    }
  }

  async function toggleComments() {
    const next = !open;
    setOpen(next);
    if (next && comments === null) {
      try {
        setComments(await api<FeedComment[]>(`/api/comunidad/${post.id}/comentarios`));
      } catch (e) {
        onStatus((e as Error).message);
        setComments([]);
      }
    }
  }

  async function del() {
    try {
      await api(`/api/comunidad/${post.id}`, { method: 'DELETE' });
      onRemove();
      onStatus('Post borrado. Como si nunca hubiera pasado.');
    } catch (e) {
      onStatus((e as Error).message);
    }
  }

  async function sendReport(reason: string) {
    try {
      await api('/api/comunidad/denuncias', {
        method: 'POST',
        body: JSON.stringify({ post_id: post.id, reason }),
      });
      setReporting(false);
      onStatus('Gracias. Lo revisaremos; con varias denuncias se oculta solo.');
    } catch (e) {
      onStatus((e as Error).message);
    }
  }

  return (
    <li className="post card">
      <header className="post-head">
        <Author p={post} />
        <span className="post-meta">
          {topic && (
            <span className="badge badge-violet">
              <span aria-hidden="true">{topic.emoji}</span> {topic.label}
            </span>
          )}
          <time dateTime={post.created_at} className="muted small">
            {timeAgo(post.created_at)}
          </time>
        </span>
      </header>
      <p className="post-body">{post.body}</p>
      <div className="post-actions">
        <div className="reactions" role="group" aria-label="Reacciones">
          {REACTIONS.map((r) => {
            const count = post.reactions[r.value] ?? 0;
            return (
              <button
                key={r.value}
                type="button"
                className="reaction"
                aria-pressed={post.my_reactions.includes(r.value)}
                aria-label={`${r.label}, ${count}`}
                onClick={() => void toggleReaction(r.value)}
              >
                <span aria-hidden="true">{r.emoji}</span>
                <span aria-hidden="true" className="reaction-count">
                  {count || ''}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          aria-expanded={open}
          aria-controls={`${uid}-comments`}
          onClick={() => void toggleComments()}
        >
          <Icon name="chat" size={18} />
          <span className="btn-label">
            {post.comment_count} {post.comment_count === 1 ? 'comentario' : 'comentarios'}
          </span>
        </button>
        {mine ? (
          confirmDelete ? (
            <span className="inline-confirm">
              <span className="small">¿Borrar?</span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => void del()}>
                Sí, borrar
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setConfirmDelete(true)}
            >
              <Icon name="trash" size={16} />
              <span className="btn-label">Borrar</span>
            </button>
          )
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            aria-expanded={reporting}
            onClick={() => setReporting((r) => !r)}
          >
            <Icon name="info" size={16} />
            <span className="btn-label">Denunciar</span>
          </button>
        )}
      </div>
      {reporting && (
        <div className="report" role="group" aria-label="Motivo de la denuncia">
          <span className="small">¿Qué pasa con este post?</span>
          {['Spam', 'Ofensivo o acoso', 'Datos personales', 'Otro'].map((reason) => (
            <button
              key={reason}
              type="button"
              className="chip chip-sm"
              onClick={() => void sendReport(reason)}
            >
              {reason}
            </button>
          ))}
        </div>
      )}
      {open && (
        <Comments
          id={`${uid}-comments`}
          postId={post.id}
          postIsMine={mine}
          me={me}
          comments={comments}
          setComments={(c) => {
            setComments(c);
            onChange((p) => ({ ...p, comment_count: c.length }));
          }}
          onStatus={onStatus}
        />
      )}
    </li>
  );
}

function Comments({
  id,
  postId,
  postIsMine,
  me,
  comments,
  setComments,
  onStatus,
}: {
  id: string;
  postId: string;
  postIsMine: boolean;
  me: { id: string };
  comments: FeedComment[] | null;
  setComments: (c: FeedComment[]) => void;
  onStatus: (s: string) => void;
}) {
  const uid = useId();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      setComments(
        await api<FeedComment[]>(`/api/comunidad/${postId}/comentarios`, {
          method: 'POST',
          body: JSON.stringify({ body: draft }),
        }),
      );
      setDraft('');
      onStatus('Comentario publicado.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  async function del(commentId: string) {
    try {
      await api(`/api/comunidad/comentarios/${commentId}`, { method: 'DELETE' });
      setComments((comments ?? []).filter((c) => c.id !== commentId));
      onStatus('Comentario borrado.');
    } catch (err) {
      onStatus((err as Error).message);
    }
  }

  return (
    <section id={id} className="comments" aria-label="Comentarios">
      {comments === null ? (
        <p className="muted small">Cargando comentarios…</p>
      ) : comments.length === 0 ? (
        <p className="muted small">Nadie ha comentado. Rompe el hielo (con cariño).</p>
      ) : (
        <ol className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <Author p={c} />
              <p className="comment-body">{c.body}</p>
              <span className="comment-foot">
                <time dateTime={c.created_at} className="muted small">
                  {timeAgo(c.created_at)}
                </time>
                {(c.author_id === me.id || postIsMine) && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void del(c.id)}
                  >
                    <Icon name="trash" size={14} />
                    <span className="btn-label">Borrar</span>
                  </button>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
      <form className="comment-form" onSubmit={send} noValidate>
        <label className="visually-hidden" htmlFor={`${uid}-c`}>
          Tu comentario
        </label>
        <input
          id={`${uid}-c`}
          className="input"
          maxLength={1000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un comentario…"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${uid}-ce` : undefined}
        />
        <button
          type="submit"
          className="btn btn-primary btn-icon"
          aria-label="Comentar"
          disabled={sending || !draft.trim()}
        >
          <Icon name="send" />
        </button>
      </form>
      {error && (
        <p id={`${uid}-ce`} className="field-error">
          {error}
        </p>
      )}
    </section>
  );
}
