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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      api_settings: {
        Row: {
          created_at: string
          id: string
          key_name: string
          key_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_name: string
          key_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key_name?: string
          key_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: []
      }
      portfolio_snapshots: {
        Row: {
          created_at: string
          id: string
          token_breakdown: Json | null
          total_usd_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          token_breakdown?: Json | null
          total_usd_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          token_breakdown?: Json | null
          total_usd_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string
          day_of_week: string
          email: string
          enabled: boolean
          id: string
          last_sent_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week?: string
          email: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          email?: string
          enabled?: boolean
          id?: string
          last_sent_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_state: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_block_synced: number
          last_cursor: string | null
          last_sync_at: string | null
          sync_status: string
          updated_at: string
          wallet_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_block_synced?: number
          last_cursor?: string | null
          last_sync_at?: string | null
          sync_status?: string
          updated_at?: string
          wallet_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_block_synced?: number
          last_cursor?: string | null
          last_sync_at?: string | null
          sync_status?: string
          updated_at?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_state_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: true
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      token_contracts: {
        Row: {
          contract_address: string | null
          created_at: string
          id: string
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          contract_address?: string | null
          created_at?: string
          id?: string
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          contract_address?: string | null
          created_at?: string
          id?: string
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      tokens: {
        Row: {
          balance: number
          created_at: string
          id: string
          symbol: string
          updated_at: string
          usd_value: number
          wallet_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          symbol: string
          updated_at?: string
          usd_value?: number
          wallet_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          symbol?: string
          updated_at?: string
          usd_value?: number
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tokens_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_alerts: {
        Row: {
          created_at: string
          direction: string
          enabled: boolean
          id: string
          threshold_usd: number
          token_symbol: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direction?: string
          enabled?: boolean
          id?: string
          threshold_usd?: number
          token_symbol?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direction?: string
          enabled?: boolean
          id?: string
          threshold_usd?: number
          token_symbol?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          block_number: number
          created_at: string
          direction: string
          from_address: string
          gas_fee: number
          id: string
          status: string
          timestamp: string
          to_address: string
          token_address: string | null
          token_symbol: string
          tx_hash: string
          usd_value: number
          wallet_id: string
        }
        Insert: {
          amount: number
          block_number: number
          created_at?: string
          direction: string
          from_address: string
          gas_fee?: number
          id?: string
          status?: string
          timestamp?: string
          to_address: string
          token_address?: string | null
          token_symbol: string
          tx_hash: string
          usd_value?: number
          wallet_id: string
        }
        Update: {
          amount?: number
          block_number?: number
          created_at?: string
          direction?: string
          from_address?: string
          gas_fee?: number
          id?: string
          status?: string
          timestamp?: string
          to_address?: string
          token_address?: string | null
          token_symbol?: string
          tx_hash?: string
          usd_value?: number
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      tx_metadata: {
        Row: {
          category: string | null
          created_at: string
          id: string
          note: string | null
          tags: string[] | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          note?: string | null
          tags?: string[] | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          note?: string | null
          tags?: string[] | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tx_metadata_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          address: string
          chain: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address: string
          chain?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string
          chain?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_duplicate_transactions: {
        Args: never
        Returns: {
          count: number
          tx_hash: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
