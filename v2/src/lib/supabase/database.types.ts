/**
 * Tipos de la base de datos escritos a mano a partir de supabase/migrations,
 * con el mismo formato que `supabase gen types typescript`. Cuando exista el
 * proyecto, regenerar con:
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string; updated_at: string };

export type CommunityTopic = 'general' | 'amor' | 'trabajo' | 'dinero' | 'confesion' | 'pregunta';

/** Tarjeta pública del autor que devuelven community_feed y post_comments. */
type FeedAuthor = {
  author_id: string;
  author_name: string;
  author_username: string | null;
  author_avatar: string | null;
  author_level: number;
  author_sign: string | null;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13';
  };
  public: {
    Tables: {
      profiles: {
        Row: Timestamps & {
          id: string;
          display_name: string;
          username: string | null;
          avatar_url: string | null;
          birth_date: string | null;
          birth_time: string | null;
          birth_time_known: boolean | null;
          birth_place: string | null;
          birth_lat: number | null;
          birth_lon: number | null;
          time_zone: string | null;
          language: Database['public']['Enums']['app_language'];
          reading_tone: Database['public']['Enums']['reading_tone'];
          favorite_topics: string[];
          notification_prefs: string[];
          relationship_status: string | null;
          partner_name: string | null;
          has_kids: boolean | null;
          kids_count: number | null;
          personal_bio: string | null;
          sun_sign: string | null;
          plan: Database['public']['Enums']['plan_tier'];
          gems: number;
          xp: number;
          level: number;
          streak: number;
          best_streak: number;
          last_active_on: string | null;
          referral_code: string;
          referred_by: string | null;
          onboarding_completed_at: string | null;
        };
        Insert: {
          id: string;
          display_name?: string;
          username?: string | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          birth_time?: string | null;
          birth_time_known?: boolean | null;
          birth_place?: string | null;
          birth_lat?: number | null;
          birth_lon?: number | null;
          time_zone?: string | null;
          language?: Database['public']['Enums']['app_language'];
          reading_tone?: Database['public']['Enums']['reading_tone'];
          favorite_topics?: string[];
          notification_prefs?: string[];
          relationship_status?: string | null;
          partner_name?: string | null;
          has_kids?: boolean | null;
          kids_count?: number | null;
          personal_bio?: string | null;
          plan?: Database['public']['Enums']['plan_tier'];
          gems?: number;
          xp?: number;
          level?: number;
          streak?: number;
          best_streak?: number;
          last_active_on?: string | null;
          referral_code?: string;
          referred_by?: string | null;
          onboarding_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'profiles_referred_by_fkey';
            columns: ['referred_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      natal_charts: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          is_self: boolean;
          input: Json;
          chart: Json;
          engine_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          label?: string;
          is_self?: boolean;
          input: Json;
          chart: Json;
          engine_version: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['natal_charts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'natal_charts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      readings: {
        Row: {
          id: string;
          user_id: string;
          kind: Database['public']['Enums']['reading_kind'];
          input: Json;
          content: string;
          model: string;
          input_tokens: number | null;
          output_tokens: number | null;
          favorite: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: Database['public']['Enums']['reading_kind'];
          input?: Json;
          content: string;
          model: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          favorite?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['readings']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'readings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_limits: {
        Row: {
          plan: Database['public']['Enums']['plan_tier'];
          daily_ai_readings: number;
          updated_at: string;
        };
        Insert: {
          plan: Database['public']['Enums']['plan_tier'];
          daily_ai_readings: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['usage_limits']['Insert']>;
        Relationships: [];
      };
      usage_events: {
        Row: {
          id: number;
          user_id: string;
          kind: Database['public']['Enums']['reading_kind'];
          created_at: string;
        };
        Insert: {
          user_id: string;
          kind: Database['public']['Enums']['reading_kind'];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['usage_events']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'usage_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      community_posts: {
        Row: Timestamps & {
          id: string;
          author_id: string;
          body: string;
          topic: CommunityTopic;
          status: Database['public']['Enums']['content_status'];
        };
        Insert: {
          id?: string;
          author_id?: string;
          body: string;
          topic?: CommunityTopic;
          status?: Database['public']['Enums']['content_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['community_posts']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'community_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      comments: {
        Row: Timestamps & {
          id: string;
          post_id: string;
          author_id: string;
          body: string;
          status: Database['public']['Enums']['content_status'];
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id?: string;
          body: string;
          status?: Database['public']['Enums']['content_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['comments']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'comments_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'community_posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comments_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement: string;
          unlocked_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
        Relationships: [];
      };
      post_reactions: {
        Row: {
          post_id: string;
          user_id: string;
          kind: Database['public']['Enums']['reaction_kind'];
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id?: string;
          kind: Database['public']['Enums']['reaction_kind'];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['post_reactions']['Insert']>;
        Relationships: [];
      };
      content_reports: {
        Row: {
          id: number;
          reporter_id: string;
          post_id: string | null;
          comment_id: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          reporter_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          reason: string;
        };
        Update: Partial<Database['public']['Tables']['content_reports']['Insert']>;
        Relationships: [];
      };
      friendships: {
        Row: Timestamps & {
          requester_id: string;
          addressee_id: string;
          status: Database['public']['Enums']['friendship_status'];
        };
        Insert: {
          requester_id?: string;
          addressee_id: string;
          status?: Database['public']['Enums']['friendship_status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'friendships_requester_id_fkey';
            columns: ['requester_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_addressee_id_fkey';
            columns: ['addressee_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          plan: Database['public']['Enums']['plan_tier'];
          status: Database['public']['Enums']['subscription_status'];
          current_period_end: string | null;
          cancel_at_period_end: boolean;
        };
        Insert: {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          plan: Database['public']['Enums']['plan_tier'];
          status: Database['public']['Enums']['subscription_status'];
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      gem_transactions: {
        Row: {
          id: number;
          user_id: string;
          delta: number;
          reason: Database['public']['Enums']['gem_reason'];
          reference: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          delta: number;
          reason: Database['public']['Enums']['gem_reason'];
          reference?: string | null;
          balance_after: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gem_transactions']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'gem_transactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      stripe_events: {
        Row: { id: string; type: string; received_at: string };
        Insert: { id: string; type: string; received_at?: string };
        Update: { id?: string; type?: string; received_at?: string };
        Relationships: [];
      };
      places: {
        Row: {
          id: number;
          name: string;
          name_norm: string;
          country_code: string;
          admin1: string | null;
          latitude: number;
          longitude: number;
          time_zone: string;
          population: number;
        };
        Insert: {
          id: number;
          name: string;
          name_norm: string;
          country_code: string;
          admin1?: string | null;
          latitude: number;
          longitude: number;
          time_zone: string;
          population?: number;
        };
        Update: Partial<Database['public']['Tables']['places']['Insert']>;
        Relationships: [];
      };
      place_aliases: {
        Row: { place_id: number; alias_norm: string };
        Insert: { place_id: number; alias_norm: string };
        Update: { place_id?: number; alias_norm?: string };
        Relationships: [
          {
            foreignKeyName: 'place_aliases_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      record_activity: {
        Args: { p_action: 'visit' | 'reading' | 'post' | 'comment' | 'favorite' };
        Returns: {
          xp: number;
          level: number;
          streak: number;
          best_streak: number;
          gems: number;
          unlocked: string[];
        }[];
      };
      toggle_favorite: {
        Args: { p_reading: string };
        Returns: boolean;
      };
      level_for_xp: {
        Args: { p_xp: number };
        Returns: number;
      };
      search_places: {
        Args: { p_query: string; p_limit?: number };
        Returns: {
          id: number;
          name: string;
          country_code: string;
          admin1: string | null;
          latitude: number;
          longitude: number;
          time_zone: string;
          population: number;
        }[];
      };
      normalize_place_query: {
        Args: { p: string };
        Returns: string;
      };
      consume_ai_quota: {
        Args: { p_kind: Database['public']['Enums']['reading_kind'] };
        Returns: { allowed: boolean; used: number; daily_limit: number; event_id: number | null }[];
      };
      ai_quota_status: {
        Args: Record<PropertyKey, never>;
        Returns: { used: number; daily_limit: number }[];
      };
      profile_cards: {
        Args: { p_ids: string[] };
        Returns: {
          id: string;
          username: string | null;
          display_name: string;
          avatar_url: string | null;
          level: number;
        }[];
      };
      community_feed: {
        Args: { p_topic?: string | null; p_before?: string | null; p_limit?: number };
        Returns: (FeedAuthor & {
          id: string;
          body: string;
          topic: CommunityTopic;
          created_at: string;
          comment_count: number;
          reactions: Partial<Record<Database['public']['Enums']['reaction_kind'], number>>;
          my_reactions: Database['public']['Enums']['reaction_kind'][];
        })[];
      };
      post_comments: {
        Args: { p_post: string };
        Returns: (FeedAuthor & { id: string; body: string; created_at: string })[];
      };
      apply_gem_transaction: {
        Args: {
          p_user: string;
          p_delta: number;
          p_reason: Database['public']['Enums']['gem_reason'];
          p_reference?: string;
        };
        Returns: number;
      };
    };
    Enums: {
      plan_tier: 'free' | 'premium' | 'vip';
      app_language: 'es' | 'en' | 'ca';
      reading_tone: 'suave' | 'directo' | 'brutal' | 'sarcastico';
      reading_kind:
        | 'daily-horoscope'
        | 'weekly-horoscope'
        | 'monthly-horoscope'
        | 'natal-chart'
        | 'tarot'
        | 'celtic-tarot'
        | 'compatibility'
        | 'dream'
        | 'transits'
        | 'numerology'
        | 'name-reading'
        | 'palm-reading'
        | 'biorhythm'
        | 'chinese-horoscope'
        | 'mayan-horoscope'
        | 'runes'
        | 'crystals'
        | 'roast'
        | 'assistant';
      content_status: 'published' | 'hidden' | 'removed';
      friendship_status: 'pending' | 'accepted' | 'blocked';
      subscription_status:
        | 'trialing'
        | 'active'
        | 'past_due'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'unpaid'
        | 'paused';
      gem_reason: 'purchase' | 'reading' | 'reward' | 'referral' | 'refund' | 'adjustment';
      reaction_kind: 'fuego' | 'magia' | 'calavera' | 'amor';
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database['public'];
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];
