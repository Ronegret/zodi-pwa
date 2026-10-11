/**
 * Comunidad en el servidor. Todo va con la sesión del usuario: la RLS
 * decide qué puede ver y tocar; el feed y los comentarios salen de
 * funciones que solo exponen la tarjeta pública del autor.
 */
import type { ReactionKind } from '@/lib/community/options';
import type { CommunityTopic, Database } from '@/lib/supabase/database.types';
import type { ZodiSupabaseClient } from '@/lib/supabase/server';

export type FeedPost = Database['public']['Functions']['community_feed']['Returns'][number];
export type FeedComment = Database['public']['Functions']['post_comments']['Returns'][number];

export const PAGE_SIZE = 15;

export async function listFeed(
  supabase: ZodiSupabaseClient,
  opts: { topic?: CommunityTopic | undefined; before?: string | undefined } = {},
): Promise<FeedPost[]> {
  const { data, error } = await supabase.rpc('community_feed', {
    p_topic: opts.topic ?? null,
    p_before: opts.before ?? null,
    p_limit: PAGE_SIZE,
  });
  if (error) throw new Error(`community_feed: ${error.message}`);
  return data;
}

export async function createPost(
  supabase: ZodiSupabaseClient,
  post: { body: string; topic: CommunityTopic },
): Promise<string> {
  const { data, error } = await supabase.from('community_posts').insert(post).select('id').single();
  if (error) throw new Error(`community_posts.insert: ${error.message}`);
  return data.id;
}

/** Devuelve si borró algo (la RLS solo deja borrar lo propio). */
export async function deletePost(supabase: ZodiSupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await supabase.from('community_posts').delete().eq('id', id).select('id');
  if (error) throw new Error(`community_posts.delete: ${error.message}`);
  return data.length > 0;
}

export async function setReaction(
  supabase: ZodiSupabaseClient,
  postId: string,
  userId: string,
  kind: ReactionKind,
  on: boolean,
): Promise<void> {
  if (on) {
    const { error } = await supabase.from('post_reactions').insert({ post_id: postId, kind });
    // Ya reaccionado (doble clic, dos pestañas): no es un error.
    if (error && error.code !== '23505') throw new Error(`post_reactions.insert: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('post_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('kind', kind);
    if (error) throw new Error(`post_reactions.delete: ${error.message}`);
  }
}

export async function listComments(
  supabase: ZodiSupabaseClient,
  postId: string,
): Promise<FeedComment[]> {
  const { data, error } = await supabase.rpc('post_comments', { p_post: postId });
  if (error) throw new Error(`post_comments: ${error.message}`);
  return data;
}

export async function createComment(
  supabase: ZodiSupabaseClient,
  postId: string,
  body: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, body })
    .select('id')
    .single();
  if (error) throw new Error(`comments.insert: ${error.message}`);
  return data.id;
}

export async function deleteComment(supabase: ZodiSupabaseClient, id: string): Promise<boolean> {
  const { data, error } = await supabase.from('comments').delete().eq('id', id).select('id');
  if (error) throw new Error(`comments.delete: ${error.message}`);
  return data.length > 0;
}

/** Denuncia; si ya la había hecho esa persona, no pasa nada. */
export async function report(
  supabase: ZodiSupabaseClient,
  target: { post_id?: string | undefined; comment_id?: string | undefined; reason: string },
): Promise<void> {
  const { error } = await supabase.from('content_reports').insert({
    post_id: target.post_id ?? null,
    comment_id: target.comment_id ?? null,
    reason: target.reason,
  });
  if (error && error.code !== '23505') throw new Error(`content_reports.insert: ${error.message}`);
}
