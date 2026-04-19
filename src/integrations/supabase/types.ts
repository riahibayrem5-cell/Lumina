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
      ai_cache: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          image_url: string | null
          kind: string
          payload: Json | null
          style: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter?: number
          created_at?: string
          id?: string
          image_url?: string | null
          kind: string
          payload?: Json | null
          style?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          image_url?: string | null
          kind?: string
          payload?: Json | null
          style?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_cache_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          cover_url: string | null
          created_at: string
          description: string | null
          era: string | null
          gutenberg_id: string | null
          id: string
          open_library_id: string | null
          slug: string
          source: string
          title: string
          total_chapters: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          author: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          era?: string | null
          gutenberg_id?: string | null
          id?: string
          open_library_id?: string | null
          slug: string
          source?: string
          title: string
          total_chapters?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          author?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          era?: string | null
          gutenberg_id?: string | null
          id?: string
          open_library_id?: string | null
          slug?: string
          source?: string
          title?: string
          total_chapters?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          book_id: string
          chapter: number
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter?: number
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: number
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          note: string | null
          text: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          id?: string
          note?: string | null
          text: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          note?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlights_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      title_summaries: {
        Row: {
          author: string | null
          chapter_label: string | null
          content: string
          created_at: string
          id: string
          mode: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          chapter_label?: string | null
          content: string
          created_at?: string
          id?: string
          mode?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          chapter_label?: string | null
          content?: string
          created_at?: string
          id?: string
          mode?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_library: {
        Row: {
          book_id: string
          current_chapter: number
          id: string
          scroll_ratio: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          current_chapter?: number
          id?: string
          scroll_ratio?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          current_chapter?: number
          id?: string
          scroll_ratio?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      user_uploaded_books: {
        Row: {
          author: string | null
          chapters: Json | null
          created_at: string
          error_message: string | null
          file_path: string
          file_size_bytes: number | null
          format: string
          id: string
          status: string
          title: string
          total_chapters: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          chapters?: Json | null
          created_at?: string
          error_message?: string | null
          file_path: string
          file_size_bytes?: number | null
          format: string
          id?: string
          status?: string
          title: string
          total_chapters?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          chapters?: Json | null
          created_at?: string
          error_message?: string | null
          file_path?: string
          file_size_bytes?: number | null
          format?: string
          id?: string
          status?: string
          title?: string
          total_chapters?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
