export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      build_logs: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "build_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_posts: {
        Row: {
          created_at: string
          description: string
          id: string
          is_open: boolean
          project_id: string | null
          role_needed: string | null
          tech_tags: string[] | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_open?: boolean
          project_id?: string | null
          role_needed?: string | null
          tech_tags?: string[] | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_open?: boolean
          project_id?: string | null
          role_needed?: string | null
          tech_tags?: string[] | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collab_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collab_requests: {
        Row: {
          created_at: string
          id: string
          message: string
          post_id: string
          sender_id: string
          status: Database["public"]["Enums"]["collab_request_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          post_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["collab_request_status"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          post_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["collab_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "collab_requests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "collab_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collab_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          collab_request_id: string | null
          created_at: string
          event_id: string | null
          id: string
          kind: string
          title: string | null
          updated_at: string
          user_high: string | null
          user_low: string | null
        }
        Insert: {
          collab_request_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          kind?: string
          title?: string | null
          updated_at?: string
          user_high?: string | null
          user_low?: string | null
        }
        Update: {
          collab_request_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          kind?: string
          title?: string | null
          updated_at?: string
          user_high?: string | null
          user_low?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_collab_request_id_fkey"
            columns: ["collab_request_id"]
            isOneToOne: false
            referencedRelation: "collab_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string
          capacity: number | null
          chat_id: string | null
          city: string
          country: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          ends_at: string
          id: string
          latitude: number | null
          longitude: number | null
          maps_url: string | null
          organizer_id: string
          registration_count: number
          registration_deadline: string | null
          registration_enabled: boolean
          starts_at: string
          state: string | null
          status: Database["public"]["Enums"]["event_status"]
          tagline: string | null
          timezone: string
          title: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          address: string
          capacity?: number | null
          chat_id?: string | null
          city: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          organizer_id: string
          registration_count?: number
          registration_deadline?: string | null
          registration_enabled?: boolean
          starts_at: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          tagline?: string | null
          timezone?: string
          title: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          address?: string
          capacity?: number | null
          chat_id?: string | null
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          organizer_id?: string
          registration_count?: number
          registration_deadline?: string | null
          registration_enabled?: boolean
          starts_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          tagline?: string | null
          timezone?: string
          title?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_images: {
        Row: {
          created_at: string
          event_id: string
          id: string
          image_url: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          image_url: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          image_url?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guests: {
        Row: {
          created_at: string
          designation: string | null
          event_id: string
          id: string
          image_url: string | null
          name: string
          organization: string | null
          role: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          designation?: string | null
          event_id: string
          id?: string
          image_url?: string | null
          name: string
          organization?: string | null
          role?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          designation?: string | null
          event_id?: string
          id?: string
          image_url?: string | null
          name?: string
          organization?: string | null
          role?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: Database["public"]["Enums"]["event_registration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["event_registration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["event_registration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          like_count: number
          parent_id: string | null
          project_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          project_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          collab_status: Database["public"]["Enums"]["collab_status"] | null
          created_at: string
          currently_building: string | null
          currently_learning: string | null
          display_name: string | null
          id: string
          links: Json | null
          location: string | null
          skills: string[] | null
          tech_stack: string[] | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          collab_status?: Database["public"]["Enums"]["collab_status"] | null
          created_at?: string
          currently_building?: string | null
          currently_learning?: string | null
          display_name?: string | null
          id: string
          links?: Json | null
          location?: string | null
          skills?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          collab_status?: Database["public"]["Enums"]["collab_status"] | null
          created_at?: string
          currently_building?: string | null
          currently_learning?: string | null
          display_name?: string | null
          id?: string
          links?: Json | null
          location?: string | null
          skills?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      project_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          position: number
          project_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: string
          position?: number
          project_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          position?: number
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_media_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          comment_count: number
          cover_url: string | null
          created_at: string
          demo_url: string | null
          description: string | null
          github_url: string | null
          id: string
          like_count: number
          owner_id: string
          slug: string
          tagline: string | null
          tech_stack: string[] | null
          title: string
          updated_at: string
          view_count: number
          visibility: Database["public"]["Enums"]["project_visibility"]
          youtube_url: string | null
        }
        Insert: {
          category?: string | null
          comment_count?: number
          cover_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          like_count?: number
          owner_id: string
          slug: string
          tagline?: string | null
          tech_stack?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["project_visibility"]
          youtube_url?: string | null
        }
        Update: {
          category?: string | null
          comment_count?: number
          cover_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          like_count?: number
          owner_id?: string
          slug?: string
          tagline?: string | null
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
          visibility?: Database["public"]["Enums"]["project_visibility"]
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_collab_request: {
        Args: { request_id: string }
        Returns: string
      }
      can_manage_event: {
        Args: { check_event_id: string }
        Returns: boolean
      }
      can_view_event: {
        Args: { check_event_id: string }
        Returns: boolean
      }
      cancel_event_registration: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      check_chat_access: {
        Args: { check_chat_id: string }
        Returns: boolean
      }
      get_or_create_direct_chat: {
        Args: { other_user_id: string }
        Returns: string
      }
      has_role: {
        Args: { check_user_id: string; check_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_huddle_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_huddle_organizer: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      register_for_event: {
        Args: { p_event_id: string }
        Returns: Database["public"]["Tables"]["event_registrations"]["Row"]
      }
    }
    Enums: {
      app_role: "user" | "huddle_organizer" | "huddle_admin" | "openbuilder_admin"
      event_registration_status: "registered" | "cancelled"
      event_status: "draft" | "published" | "cancelled"
      collab_request_status: "pending" | "accepted" | "rejected"
      collab_status:
        | "not_looking"
        | "open_to_collab"
        | "seeking_cofounder"
        | "seeking_designer"
        | "seeking_developer"
        | "available_for_hackathons"
      notification_type:
        | "follow"
        | "like"
        | "comment"
        | "collab_request"
        | "collab_accepted"
        | "build_log"
        | "chat_message"
        | "event_registered"
        | "event_update"
      project_visibility: "public" | "unlisted" | "private"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      collab_request_status: ["pending", "accepted", "rejected"],
      collab_status: [
        "not_looking",
        "open_to_collab",
        "seeking_cofounder",
        "seeking_designer",
        "seeking_developer",
        "available_for_hackathons",
      ],
      notification_type: [
        "follow",
        "like",
        "comment",
        "collab_request",
        "collab_accepted",
        "build_log",
        "chat_message",
      ],
      project_visibility: ["public", "unlisted", "private"],
    },
  },
} as const
