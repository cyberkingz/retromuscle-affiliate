export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          admin_user_id: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip: unknown;
          metadata: Json;
          request_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          admin_user_id: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip?: unknown;
          metadata?: Json;
          request_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          admin_user_id?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip?: unknown;
          metadata?: Json;
          request_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      creator_applications: {
        Row: {
          address: string;
          country: string;
          created_at: string;
          email: string;
          followers_instagram: number;
          followers_tiktok: number;
          full_name: string;
          handle: string;
          id: string;
          review_notes: string | null;
          reviewed_at: string | null;
          social_instagram: string | null;
          social_tiktok: string | null;
          status: string;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          whatsapp: string;
        };
        Insert: {
          address: string;
          country: string;
          created_at?: string;
          email: string;
          followers_instagram?: number;
          followers_tiktok?: number;
          full_name: string;
          handle: string;
          id?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          social_instagram?: string | null;
          social_tiktok?: string | null;
          status?: string;
          submitted_at?: string | null;
          updated_at?: string;
          user_id: string;
          whatsapp: string;
        };
        Update: {
          address?: string;
          country?: string;
          created_at?: string;
          email?: string;
          followers_instagram?: number;
          followers_tiktok?: number;
          full_name?: string;
          handle?: string;
          id?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          social_instagram?: string | null;
          social_tiktok?: string | null;
          status?: string;
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      creator_contract_signatures: {
        Row: {
          acceptance: Json;
          contract_checksum: string;
          contract_text: string;
          contract_version: string;
          created_at: string;
          creator_id: string;
          id: string;
          ip: unknown;
          signed_at: string;
          signer_name: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          acceptance: Json;
          contract_checksum: string;
          contract_text: string;
          contract_version: string;
          created_at?: string;
          creator_id: string;
          id?: string;
          ip?: unknown;
          signed_at?: string;
          signer_name: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          acceptance?: Json;
          contract_checksum?: string;
          contract_text?: string;
          contract_version?: string;
          created_at?: string;
          creator_id?: string;
          id?: string;
          ip?: unknown;
          signed_at?: string;
          signer_name?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creator_contract_signatures_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          }
        ];
      };
      creator_payout_profiles: {
        Row: {
          account_holder_name: string | null;
          created_at: string;
          creator_id: string;
          iban: string | null;
          method: string;
          paypal_email: string | null;
          stripe_account: string | null;
          updated_at: string;
        };
        Insert: {
          account_holder_name?: string | null;
          created_at?: string;
          creator_id: string;
          iban?: string | null;
          method?: string;
          paypal_email?: string | null;
          stripe_account?: string | null;
          updated_at?: string;
        };
        Update: {
          account_holder_name?: string | null;
          created_at?: string;
          creator_id?: string;
          iban?: string | null;
          method?: string;
          paypal_email?: string | null;
          stripe_account?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "creator_payout_profiles_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: true;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          }
        ];
      };
      creators: {
        Row: {
          address: string;
          contract_signed_at: string | null;
          country: string;
          created_at: string;
          display_name: string;
          email: string;
          followers_instagram: number;
          followers_tiktok: number;
          handle: string;
          id: string;
          kit_order_amount: number | null;
          kit_order_currency: string | null;
          kit_order_placed_at: string | null;
          kit_promo_code: string | null;
          notes: string | null;
          shopify_discount_id: string | null;
          shopify_kit_order_id: string | null;
          social_links: Json;
          start_date: string;
          status: string;
          updated_at: string;
          user_id: string | null;
          whatsapp: string;
        };
        Insert: {
          address: string;
          contract_signed_at?: string | null;
          country: string;
          created_at?: string;
          display_name: string;
          email: string;
          followers_instagram?: number;
          followers_tiktok?: number;
          handle: string;
          id?: string;
          kit_order_amount?: number | null;
          kit_order_currency?: string | null;
          kit_order_placed_at?: string | null;
          kit_promo_code?: string | null;
          notes?: string | null;
          shopify_discount_id?: string | null;
          shopify_kit_order_id?: string | null;
          social_links?: Json;
          start_date: string;
          status: string;
          updated_at?: string;
          user_id?: string | null;
          whatsapp: string;
        };
        Update: {
          address?: string;
          contract_signed_at?: string | null;
          country?: string;
          created_at?: string;
          display_name?: string;
          email?: string;
          followers_instagram?: number;
          followers_tiktok?: number;
          handle?: string;
          id?: string;
          kit_order_amount?: number | null;
          kit_order_currency?: string | null;
          kit_order_placed_at?: string | null;
          kit_promo_code?: string | null;
          notes?: string | null;
          shopify_discount_id?: string | null;
          shopify_kit_order_id?: string | null;
          social_links?: Json;
          start_date?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          whatsapp?: string;
        };
        Relationships: [];
      };
      monthly_tracking: {
        Row: {
          created_at: string;
          creator_id: string;
          delivered: Json;
          id: string;
          month: string;
          paid_amount: number | null;
          paid_at: string | null;
          payment_status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          creator_id: string;
          delivered: Json;
          id?: string;
          month: string;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_status: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          creator_id?: string;
          delivered?: Json;
          id?: string;
          month?: string;
          paid_amount?: number | null;
          paid_at?: string | null;
          payment_status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_tracking_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          }
        ];
      };
      onboarding_drafts: {
        Row: {
          created_at: string;
          form_data: Json;
          id: string;
          step: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          form_data?: Json;
          id?: string;
          step?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          form_data?: Json;
          id?: string;
          step?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      rushes: {
        Row: {
          created_at: string;
          creator_id: string;
          file_name: string;
          file_size_mb: number;
          file_url: string | null;
          id: string;
          monthly_tracking_id: string;
        };
        Insert: {
          created_at?: string;
          creator_id: string;
          file_name: string;
          file_size_mb: number;
          file_url?: string | null;
          id?: string;
          monthly_tracking_id: string;
        };
        Update: {
          created_at?: string;
          creator_id?: string;
          file_name?: string;
          file_size_mb?: number;
          file_url?: string | null;
          id?: string;
          monthly_tracking_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rushes_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rushes_monthly_tracking_id_fkey";
            columns: ["monthly_tracking_id"];
            isOneToOne: false;
            referencedRelation: "monthly_tracking";
            referencedColumns: ["id"];
          }
        ];
      };
      shopify_webhook_events: {
        Row: {
          creator_id: string | null;
          processed_at: string | null;
          received_at: string;
          shop_domain: string | null;
          topic: string;
          webhook_id: string;
        };
        Insert: {
          creator_id?: string | null;
          processed_at?: string | null;
          received_at?: string;
          shop_domain?: string | null;
          topic: string;
          webhook_id: string;
        };
        Update: {
          creator_id?: string | null;
          processed_at?: string | null;
          received_at?: string;
          shop_domain?: string | null;
          topic?: string;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopify_webhook_events_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          }
        ];
      };
      video_rates: {
        Row: {
          created_at: string;
          is_placeholder: boolean;
          rate_per_video: number;
          updated_at: string;
          video_type: string;
        };
        Insert: {
          created_at?: string;
          is_placeholder?: boolean;
          rate_per_video: number;
          updated_at?: string;
          video_type: string;
        };
        Update: {
          created_at?: string;
          is_placeholder?: boolean;
          rate_per_video?: number;
          updated_at?: string;
          video_type?: string;
        };
        Relationships: [];
      };
      batch_submissions: {
        Row: {
          id: string;
          monthly_tracking_id: string;
          creator_id: string;
          video_type: string;
          status: string;
          min_clips_required: number;
          rejection_reason: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          monthly_tracking_id: string;
          creator_id: string;
          video_type: string;
          status?: string;
          min_clips_required?: number;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          monthly_tracking_id?: string;
          creator_id?: string;
          video_type?: string;
          status?: string;
          min_clips_required?: number;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "batch_submissions_monthly_tracking_id_fkey";
            columns: ["monthly_tracking_id"];
            isOneToOne: false;
            referencedRelation: "monthly_tracking";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batch_submissions_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          }
        ];
      };
      videos: {
        Row: {
          batch_submission_id: string | null;
          created_at: string;
          creator_id: string;
          duration_seconds: number;
          file_size_mb: number;
          file_url: string;
          id: string;
          monthly_tracking_id: string;
          rejection_reason: string | null;
          resolution: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          superseded_by: string | null;
          video_type: string;
        };
        Insert: {
          batch_submission_id?: string | null;
          created_at?: string;
          creator_id: string;
          duration_seconds: number;
          file_size_mb: number;
          file_url: string;
          id?: string;
          monthly_tracking_id: string;
          rejection_reason?: string | null;
          resolution: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status: string;
          superseded_by?: string | null;
          video_type: string;
        };
        Update: {
          batch_submission_id?: string | null;
          created_at?: string;
          creator_id?: string;
          duration_seconds?: number;
          file_size_mb?: number;
          file_url?: string;
          id?: string;
          monthly_tracking_id?: string;
          rejection_reason?: string | null;
          resolution?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          superseded_by?: string | null;
          video_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey";
            columns: ["creator_id"];
            isOneToOne: false;
            referencedRelation: "creators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "videos_monthly_tracking_id_fkey";
            columns: ["monthly_tracking_id"];
            isOneToOne: false;
            referencedRelation: "monthly_tracking";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      review_batch_and_update_tracking: {
        Args: {
          p_batch_id: string;
          p_rejection_reason?: string | null;
          p_reviewed_by?: string | null;
          p_status: string;
        };
        Returns: Json;
      };
      review_video_and_update_tracking: {
        Args: {
          p_rejection_reason?: string;
          p_reviewed_by?: string;
          p_status: string;
          p_video_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {}
  }
} as const;
