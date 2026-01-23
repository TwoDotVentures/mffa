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
      accounts: {
        Row: {
          account_number: string | null
          account_type: string
          available_balance: number | null
          bsb: string | null
          connected_account_id: string | null
          created_at: string
          credit_limit: number | null
          currency: string | null
          current_balance: number | null
          id: string
          institution: string | null
          interest_rate: number | null
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type: string
          available_balance?: number | null
          bsb?: string | null
          connected_account_id?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          available_balance?: number | null
          bsb?: string | null
          connected_account_id?: string | null
          created_at?: string
          credit_limit?: number | null
          currency?: string | null
          current_balance?: number | null
          id?: string
          institution?: string | null
          interest_rate?: number | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_connected_account_id_fkey"
            columns: ["connected_account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_types: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          messages: Json
          model_used: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json
          model_used?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json
          model_used?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          api_key_encrypted: string | null
          created_at: string | null
          id: string
          model: string
          provider: string
          temperature: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          model?: string
          provider?: string
          temperature?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          created_at?: string | null
          id?: string
          model?: string
          provider?: string
          temperature?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          calls_limit: number | null
          calls_used: number | null
          created_at: string | null
          id: string
          month: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calls_limit?: number | null
          calls_used?: number | null
          created_at?: string | null
          id?: string
          month: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calls_limit?: number | null
          calls_used?: number | null
          created_at?: string | null
          id?: string
          month?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_connections: {
        Row: {
          basiq_connection_id: string | null
          basiq_user_id: string | null
          created_at: string | null
          id: string
          institution_id: string | null
          institution_logo_url: string | null
          institution_name: string | null
          last_sync_at: string | null
          next_sync_at: string | null
          status: string | null
          status_message: string | null
          sync_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          basiq_connection_id?: string | null
          basiq_user_id?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string | null
          institution_logo_url?: string | null
          institution_name?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          status_message?: string | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          basiq_connection_id?: string | null
          basiq_user_id?: string | null
          created_at?: string | null
          id?: string
          institution_id?: string | null
          institution_logo_url?: string | null
          institution_name?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          status_message?: string | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_sync_logs: {
        Row: {
          accounts_synced: number | null
          api_calls_used: number | null
          completed_at: string | null
          connection_id: string | null
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          id: string
          started_at: string | null
          status: string
          sync_type: string
          transactions_imported: number | null
          transactions_skipped: number | null
        }
        Insert: {
          accounts_synced?: number | null
          api_calls_used?: number | null
          completed_at?: string | null
          connection_id?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status: string
          sync_type: string
          transactions_imported?: number | null
          transactions_skipped?: number | null
        }
        Update: {
          accounts_synced?: number | null
          api_calls_used?: number | null
          completed_at?: string | null
          connection_id?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          started_at?: string | null
          status?: string
          sync_type?: string
          transactions_imported?: number | null
          transactions_skipped?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          alert_enabled: boolean | null
          alert_threshold: number | null
          amount: number
          category_id: string | null
          category_name: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          period: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_enabled?: boolean | null
          alert_threshold?: number | null
          amount: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          period: string
          start_date?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_enabled?: boolean | null
          alert_threshold?: number | null
          amount?: number
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          period?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          category_type: string
          colour: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_type: string
          colour?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_type?: string
          colour?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categorisation_rules: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean | null
          match_field: string
          match_type: string
          match_value: string
          priority: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_field: string
          match_type: string
          match_value: string
          priority?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          match_field?: string
          match_type?: string
          match_value?: string
          priority?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorisation_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorisation_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          account_name: string | null
          account_number_masked: string | null
          account_type: string | null
          available_balance: number | null
          balance: number | null
          balance_updated_at: string | null
          basiq_account_id: string
          bsb: string | null
          connection_id: string
          created_at: string | null
          credit_limit: number | null
          currency: string | null
          id: string
          is_active: boolean | null
          last_transaction_date: string | null
          local_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          account_number_masked?: string | null
          account_type?: string | null
          available_balance?: number | null
          balance?: number | null
          balance_updated_at?: string | null
          basiq_account_id: string
          bsb?: string | null
          connection_id: string
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_transaction_date?: string | null
          local_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          account_number_masked?: string | null
          account_type?: string | null
          available_balance?: number | null
          balance?: number | null
          balance_updated_at?: string | null
          basiq_account_id?: string
          bsb?: string | null
          connection_id?: string
          created_at?: string | null
          credit_limit?: number | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_transaction_date?: string | null
          local_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connected_accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "bank_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connected_accounts_local_account_id_fkey"
            columns: ["local_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      deductions: {
        Row: {
          amount: number
          calculation_details: Json | null
          calculation_method: string | null
          category: string
          created_at: string | null
          date: string
          description: string
          financial_year: string
          id: string
          is_approved: boolean | null
          linked_transaction_id: string | null
          notes: string | null
          person: string
          receipt_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          calculation_details?: Json | null
          calculation_method?: string | null
          category: string
          created_at?: string | null
          date: string
          description: string
          financial_year: string
          id?: string
          is_approved?: boolean | null
          linked_transaction_id?: string | null
          notes?: string | null
          person: string
          receipt_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          calculation_details?: Json | null
          calculation_method?: string | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          financial_year?: string
          id?: string
          is_approved?: boolean | null
          linked_transaction_id?: string | null
          notes?: string | null
          person?: string
          receipt_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string
          entity_type: string
          file_size: number
          file_type: string
          financial_year: string | null
          id: string
          is_processed: boolean | null
          linked_transaction_id: string | null
          name: string
          original_filename: string
          processing_error: string | null
          storage_path: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type: string
          entity_type: string
          file_size: number
          file_type: string
          financial_year?: string | null
          id?: string
          is_processed?: boolean | null
          linked_transaction_id?: string | null
          name: string
          original_filename: string
          processing_error?: string | null
          storage_path: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string
          entity_type?: string
          file_size?: number
          file_type?: string
          financial_year?: string | null
          id?: string
          is_processed?: boolean | null
          linked_transaction_id?: string | null
          name?: string
          original_filename?: string
          processing_error?: string | null
          storage_path?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_linked_transaction_id_fkey"
            columns: ["linked_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      extracurriculars: {
        Row: {
          activity_type_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          cost_amount: number | null
          cost_frequency_id: string | null
          created_at: string | null
          day_of_week: string[] | null
          equipment_cost: number | null
          family_member_id: string
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          other_costs: number | null
          other_costs_description: string | null
          provider: string | null
          registration_fee: number | null
          season_end: string | null
          season_start: string | null
          time_end: string | null
          time_start: string | null
          uniform_cost: number | null
          updated_at: string | null
          venue: string | null
          website: string | null
        }
        Insert: {
          activity_type_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cost_amount?: number | null
          cost_frequency_id?: string | null
          created_at?: string | null
          day_of_week?: string[] | null
          equipment_cost?: number | null
          family_member_id: string
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          other_costs?: number | null
          other_costs_description?: string | null
          provider?: string | null
          registration_fee?: number | null
          season_end?: string | null
          season_start?: string | null
          time_end?: string | null
          time_start?: string | null
          uniform_cost?: number | null
          updated_at?: string | null
          venue?: string | null
          website?: string | null
        }
        Update: {
          activity_type_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          cost_amount?: number | null
          cost_frequency_id?: string | null
          created_at?: string | null
          day_of_week?: string[] | null
          equipment_cost?: number | null
          family_member_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          other_costs?: number | null
          other_costs_description?: string | null
          provider?: string | null
          registration_fee?: number | null
          season_end?: string | null
          season_start?: string | null
          time_end?: string | null
          time_start?: string | null
          uniform_cost?: number | null
          updated_at?: string | null
          venue?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extracurriculars_activity_type_id_fkey"
            columns: ["activity_type_id"]
            isOneToOne: false
            referencedRelation: "activity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracurriculars_cost_frequency_id_fkey"
            columns: ["cost_frequency_id"]
            isOneToOne: false
            referencedRelation: "frequencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracurriculars_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          gender: string | null
          id: string
          is_primary: boolean | null
          medicare_number: string | null
          member_type: string
          name: string
          notes: string | null
          phone: string | null
          relationship: string | null
          tax_file_number_encrypted: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_primary?: boolean | null
          medicare_number?: string | null
          member_type: string
          name: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          tax_file_number_encrypted?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          is_primary?: boolean | null
          medicare_number?: string | null
          member_type?: string
          name?: string
          notes?: string | null
          phone?: string | null
          relationship?: string | null
          tax_file_number_encrypted?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      franking_credits: {
        Row: {
          created_at: string | null
          credits_distributed: number | null
          credits_received: number | null
          financial_year: string
          id: string
          opening_balance: number | null
          trust_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_distributed?: number | null
          credits_received?: number | null
          financial_year: string
          id?: string
          opening_balance?: number | null
          trust_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_distributed?: number | null
          credits_received?: number | null
          financial_year?: string
          id?: string
          opening_balance?: number | null
          trust_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "franking_credits_trust_id_fkey"
            columns: ["trust_id"]
            isOneToOne: false
            referencedRelation: "trusts"
            referencedColumns: ["id"]
          },
        ]
      }
      frequencies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          per_year_multiplier: number | null
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          per_year_multiplier?: number | null
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          per_year_multiplier?: number | null
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frequencies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hecs_debt: {
        Row: {
          created_at: string | null
          current_balance: number
          financial_year: string
          id: string
          indexation_rate: number | null
          notes: string | null
          opening_balance: number
          person: string
          repayments_ytd: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_balance: number
          financial_year: string
          id?: string
          indexation_rate?: number | null
          notes?: string | null
          opening_balance: number
          person: string
          repayments_ytd?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_balance?: number
          financial_year?: string
          id?: string
          indexation_rate?: number | null
          notes?: string | null
          opening_balance?: number
          person?: string
          repayments_ytd?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      income: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          financial_year: string
          franking_credits: number | null
          id: string
          income_type: string
          is_taxable: boolean | null
          linked_trust_distribution_id: string | null
          notes: string | null
          person: string
          source: string
          tax_withheld: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          financial_year: string
          franking_credits?: number | null
          id?: string
          income_type: string
          is_taxable?: boolean | null
          linked_trust_distribution_id?: string | null
          notes?: string | null
          person: string
          source: string
          tax_withheld?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          financial_year?: string
          franking_credits?: number | null
          id?: string
          income_type?: string
          is_taxable?: boolean | null
          linked_trust_distribution_id?: string | null
          notes?: string | null
          person?: string
          source?: string
          tax_withheld?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      member_documents: {
        Row: {
          created_at: string | null
          document_category: string
          document_id: string
          family_member_id: string
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          document_category: string
          document_id: string
          family_member_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          document_category?: string
          document_id?: string
          family_member_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_documents_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          link_url: string | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string
          related_entity_id: string | null
          related_entity_type: string | null
          scheduled_for: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          link_url?: string | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          link_url?: string | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      school_enrolments: {
        Row: {
          created_at: string | null
          enrolment_date: string | null
          expected_graduation: string | null
          family_member_id: string
          house: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          school_id: string
          student_id: string | null
          updated_at: string | null
          year_level: string | null
        }
        Insert: {
          created_at?: string | null
          enrolment_date?: string | null
          expected_graduation?: string | null
          family_member_id: string
          house?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          school_id: string
          student_id?: string | null
          updated_at?: string | null
          year_level?: string | null
        }
        Update: {
          created_at?: string | null
          enrolment_date?: string | null
          expected_graduation?: string | null
          family_member_id?: string
          house?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          school_id?: string
          student_id?: string | null
          updated_at?: string | null
          year_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_enrolments_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_enrolments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_fees: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          due_date: string | null
          enrolment_id: string
          fee_type_id: string
          frequency_id: string
          id: string
          invoice_number: string | null
          is_paid: boolean | null
          notes: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          school_term_id: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          due_date?: string | null
          enrolment_id: string
          fee_type_id: string
          frequency_id: string
          id?: string
          invoice_number?: string | null
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          school_term_id?: string | null
          updated_at?: string | null
          year?: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          due_date?: string | null
          enrolment_id?: string
          fee_type_id?: string
          frequency_id?: string
          id?: string
          invoice_number?: string | null
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          school_term_id?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "school_fees_enrolment_id_fkey"
            columns: ["enrolment_id"]
            isOneToOne: false
            referencedRelation: "school_enrolments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_fees_fee_type_id_fkey"
            columns: ["fee_type_id"]
            isOneToOne: false
            referencedRelation: "fee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_fees_frequency_id_fkey"
            columns: ["frequency_id"]
            isOneToOne: false
            referencedRelation: "frequencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_fees_school_term_id_fkey"
            columns: ["school_term_id"]
            isOneToOne: false
            referencedRelation: "school_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      school_terms: {
        Row: {
          created_at: string | null
          end_date: string
          fees_due_date: string | null
          id: string
          name: string | null
          notes: string | null
          school_year_id: string
          start_date: string
          term_number: number
          term_type: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          fees_due_date?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          school_year_id: string
          start_date: string
          term_number: number
          term_type: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          fees_due_date?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          school_year_id?: string
          start_date?: string
          term_number?: number
          term_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_terms_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      school_years: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          school_id: string
          updated_at: string | null
          year: number
          year_end: string
          year_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          school_id: string
          updated_at?: string | null
          year: number
          year_end: string
          year_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          school_id?: string
          updated_at?: string | null
          year?: number
          year_end?: string
          year_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postcode: string | null
          school_type: string
          sector: string | null
          state: string | null
          suburb: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          school_type: string
          sector?: string | null
          state?: string | null
          suburb?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postcode?: string | null
          school_type?: string
          sector?: string | null
          state?: string | null
          suburb?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      smsf_carry_forward: {
        Row: {
          concessional_cap: number
          concessional_used: number
          created_at: string | null
          eligible_for_carry_forward: boolean | null
          financial_year: string
          id: string
          member_id: string
          total_super_balance_at_year_end: number | null
          unused_amount: number | null
        }
        Insert: {
          concessional_cap?: number
          concessional_used?: number
          created_at?: string | null
          eligible_for_carry_forward?: boolean | null
          financial_year: string
          id?: string
          member_id: string
          total_super_balance_at_year_end?: number | null
          unused_amount?: number | null
        }
        Update: {
          concessional_cap?: number
          concessional_used?: number
          created_at?: string | null
          eligible_for_carry_forward?: boolean | null
          financial_year?: string
          id?: string
          member_id?: string
          total_super_balance_at_year_end?: number | null
          unused_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "smsf_carry_forward_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "smsf_members"
            referencedColumns: ["id"]
          },
        ]
      }
      smsf_compliance: {
        Row: {
          annual_return_due_date: string | null
          annual_return_lodged_date: string | null
          audit_completed_date: string | null
          audit_due_date: string | null
          audit_status: string | null
          created_at: string | null
          financial_year: string
          fund_id: string
          id: string
          investment_strategy_date: string | null
          investment_strategy_reviewed: boolean | null
          lodgement_status: string | null
          member_statements_issued: boolean | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          annual_return_due_date?: string | null
          annual_return_lodged_date?: string | null
          audit_completed_date?: string | null
          audit_due_date?: string | null
          audit_status?: string | null
          created_at?: string | null
          financial_year: string
          fund_id: string
          id?: string
          investment_strategy_date?: string | null
          investment_strategy_reviewed?: boolean | null
          lodgement_status?: string | null
          member_statements_issued?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_return_due_date?: string | null
          annual_return_lodged_date?: string | null
          audit_completed_date?: string | null
          audit_due_date?: string | null
          audit_status?: string | null
          created_at?: string | null
          financial_year?: string
          fund_id?: string
          id?: string
          investment_strategy_date?: string | null
          investment_strategy_reviewed?: boolean | null
          lodgement_status?: string | null
          member_statements_issued?: boolean | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smsf_compliance_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "smsf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      smsf_contributions: {
        Row: {
          amount: number
          contribution_type: string
          created_at: string | null
          date: string
          description: string | null
          financial_year: string
          fund_id: string
          id: string
          member_id: string
        }
        Insert: {
          amount: number
          contribution_type: string
          created_at?: string | null
          date: string
          description?: string | null
          financial_year: string
          fund_id: string
          id?: string
          member_id: string
        }
        Update: {
          amount?: number
          contribution_type?: string
          created_at?: string | null
          date?: string
          description?: string | null
          financial_year?: string
          fund_id?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smsf_contributions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "smsf_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smsf_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "smsf_members"
            referencedColumns: ["id"]
          },
        ]
      }
      smsf_funds: {
        Row: {
          abn: string | null
          created_at: string | null
          establishment_date: string | null
          fund_status: string | null
          id: string
          name: string
          trustee_abn: string | null
          trustee_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abn?: string | null
          created_at?: string | null
          establishment_date?: string | null
          fund_status?: string | null
          id?: string
          name: string
          trustee_abn?: string | null
          trustee_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abn?: string | null
          created_at?: string | null
          establishment_date?: string | null
          fund_status?: string | null
          id?: string
          name?: string
          trustee_abn?: string | null
          trustee_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      smsf_investments: {
        Row: {
          acquisition_date: string | null
          asset_type: string
          cost_base: number
          created_at: string | null
          current_value: number
          description: string | null
          fund_id: string
          id: string
          income_ytd: number | null
          name: string
          units: number | null
          updated_at: string | null
        }
        Insert: {
          acquisition_date?: string | null
          asset_type: string
          cost_base: number
          created_at?: string | null
          current_value: number
          description?: string | null
          fund_id: string
          id?: string
          income_ytd?: number | null
          name: string
          units?: number | null
          updated_at?: string | null
        }
        Update: {
          acquisition_date?: string | null
          asset_type?: string
          cost_base?: number
          created_at?: string | null
          current_value?: number
          description?: string | null
          fund_id?: string
          id?: string
          income_ytd?: number | null
          name?: string
          units?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smsf_investments_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "smsf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      smsf_members: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          fund_id: string
          id: string
          member_status: string | null
          name: string
          preservation_age: number | null
          tfn_encrypted: string | null
          total_super_balance: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          fund_id: string
          id?: string
          member_status?: string | null
          name: string
          preservation_age?: number | null
          tfn_encrypted?: string | null
          total_super_balance?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          fund_id?: string
          id?: string
          member_status?: string | null
          name?: string
          preservation_age?: number | null
          tfn_encrypted?: string | null
          total_super_balance?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "smsf_members_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "smsf_funds"
            referencedColumns: ["id"]
          },
        ]
      }
      smsf_transactions: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          description: string | null
          financial_year: string
          fund_id: string
          id: string
          investment_id: string | null
          member_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          description?: string | null
          financial_year: string
          fund_id: string
          id?: string
          investment_id?: string | null
          member_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          description?: string | null
          financial_year?: string
          fund_id?: string
          id?: string
          investment_id?: string | null
          member_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "smsf_transactions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "smsf_funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smsf_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "smsf_investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smsf_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "smsf_members"
            referencedColumns: ["id"]
          },
        ]
      }
      super_accounts: {
        Row: {
          balance: number | null
          balance_date: string | null
          created_at: string | null
          fund_abn: string | null
          fund_name: string
          id: string
          insurance_cover: Json | null
          investment_option: string | null
          is_active: boolean | null
          member_number: string | null
          notes: string | null
          person: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          balance_date?: string | null
          created_at?: string | null
          fund_abn?: string | null
          fund_name: string
          id?: string
          insurance_cover?: Json | null
          investment_option?: string | null
          is_active?: boolean | null
          member_number?: string | null
          notes?: string | null
          person: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          balance_date?: string | null
          created_at?: string | null
          fund_abn?: string | null
          fund_name?: string
          id?: string
          insurance_cover?: Json | null
          investment_option?: string | null
          is_active?: boolean | null
          member_number?: string | null
          notes?: string | null
          person?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      super_contributions: {
        Row: {
          amount: number
          contribution_type: string
          created_at: string | null
          date: string
          employer_name: string | null
          financial_year: string
          fund_abn: string | null
          fund_name: string
          id: string
          is_concessional: boolean
          notes: string | null
          person: string
          user_id: string
        }
        Insert: {
          amount: number
          contribution_type: string
          created_at?: string | null
          date: string
          employer_name?: string | null
          financial_year: string
          fund_abn?: string | null
          fund_name: string
          id?: string
          is_concessional: boolean
          notes?: string | null
          person: string
          user_id: string
        }
        Update: {
          amount?: number
          contribution_type?: string
          created_at?: string | null
          date?: string
          employer_name?: string | null
          financial_year?: string
          fund_abn?: string | null
          fund_name?: string
          id?: string
          is_concessional?: boolean
          notes?: string | null
          person?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_estimates: {
        Row: {
          capital_gains: number | null
          created_at: string | null
          dividends_franked: number | null
          dividends_unfranked: number | null
          effective_tax_rate: number | null
          financial_year: string
          franking_credit_offset: number | null
          franking_credits: number | null
          gross_income: number | null
          hecs_repayment: number | null
          id: string
          income_tax: number | null
          marginal_tax_rate: number | null
          medicare_levy: number | null
          medicare_surcharge: number | null
          net_tax_payable: number | null
          notes: string | null
          other_income: number | null
          person: string
          rental_income: number | null
          salary_wages: number | null
          scenario_name: string | null
          tax_withheld: number | null
          taxable_income: number | null
          total_deductions: number | null
          trust_distributions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          capital_gains?: number | null
          created_at?: string | null
          dividends_franked?: number | null
          dividends_unfranked?: number | null
          effective_tax_rate?: number | null
          financial_year: string
          franking_credit_offset?: number | null
          franking_credits?: number | null
          gross_income?: number | null
          hecs_repayment?: number | null
          id?: string
          income_tax?: number | null
          marginal_tax_rate?: number | null
          medicare_levy?: number | null
          medicare_surcharge?: number | null
          net_tax_payable?: number | null
          notes?: string | null
          other_income?: number | null
          person: string
          rental_income?: number | null
          salary_wages?: number | null
          scenario_name?: string | null
          tax_withheld?: number | null
          taxable_income?: number | null
          total_deductions?: number | null
          trust_distributions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          capital_gains?: number | null
          created_at?: string | null
          dividends_franked?: number | null
          dividends_unfranked?: number | null
          effective_tax_rate?: number | null
          financial_year?: string
          franking_credit_offset?: number | null
          franking_credits?: number | null
          gross_income?: number | null
          hecs_repayment?: number | null
          id?: string
          income_tax?: number | null
          marginal_tax_rate?: number | null
          medicare_levy?: number | null
          medicare_surcharge?: number | null
          net_tax_payable?: number | null
          notes?: string | null
          other_income?: number | null
          person?: string
          rental_income?: number | null
          salary_wages?: number | null
          scenario_name?: string | null
          tax_withheld?: number | null
          taxable_income?: number | null
          total_deductions?: number | null
          trust_distributions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          external_id: string | null
          external_source: string | null
          id: string
          import_id: string | null
          is_pending: boolean | null
          is_reconciled: boolean | null
          notes: string | null
          payee: string | null
          reference: string | null
          transaction_type: string
          transfer_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          description: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          import_id?: string | null
          is_pending?: boolean | null
          is_reconciled?: boolean | null
          notes?: string | null
          payee?: string | null
          reference?: string | null
          transaction_type: string
          transfer_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          import_id?: string | null
          is_pending?: boolean | null
          is_reconciled?: boolean | null
          notes?: string | null
          payee?: string | null
          reference?: string | null
          transaction_type?: string
          transfer_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transfer_account_id_fkey"
            columns: ["transfer_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_beneficiaries: {
        Row: {
          beneficiary_type: string
          created_at: string | null
          family_member_id: string | null
          id: string
          is_active: boolean | null
          name: string
          trust_id: string
          updated_at: string | null
        }
        Insert: {
          beneficiary_type: string
          created_at?: string | null
          family_member_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trust_id: string
          updated_at?: string | null
        }
        Update: {
          beneficiary_type?: string
          created_at?: string | null
          family_member_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trust_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_beneficiaries_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_beneficiaries_trust_id_fkey"
            columns: ["trust_id"]
            isOneToOne: false
            referencedRelation: "trusts"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_distributions: {
        Row: {
          amount: number
          beneficiary_id: string
          capital_gains_streamed: number | null
          created_at: string | null
          date: string
          distribution_type: string
          financial_year: string
          franking_credits_streamed: number | null
          id: string
          is_paid: boolean | null
          notes: string | null
          payment_date: string | null
          trust_id: string
        }
        Insert: {
          amount: number
          beneficiary_id: string
          capital_gains_streamed?: number | null
          created_at?: string | null
          date: string
          distribution_type: string
          financial_year: string
          franking_credits_streamed?: number | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          payment_date?: string | null
          trust_id: string
        }
        Update: {
          amount?: number
          beneficiary_id?: string
          capital_gains_streamed?: number | null
          created_at?: string | null
          date?: string
          distribution_type?: string
          financial_year?: string
          franking_credits_streamed?: number | null
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          payment_date?: string | null
          trust_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_distributions_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "trust_beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_distributions_trust_id_fkey"
            columns: ["trust_id"]
            isOneToOne: false
            referencedRelation: "trusts"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_income: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          financial_year: string
          franking_credits: number | null
          id: string
          income_type: string
          notes: string | null
          source: string
          trust_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          financial_year: string
          franking_credits?: number | null
          id?: string
          income_type: string
          notes?: string | null
          source: string
          trust_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          financial_year?: string
          franking_credits?: number | null
          id?: string
          income_type?: string
          notes?: string | null
          source?: string
          trust_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_income_trust_id_fkey"
            columns: ["trust_id"]
            isOneToOne: false
            referencedRelation: "trusts"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_investments: {
        Row: {
          acquisition_date: string | null
          asset_type: string
          cost_base: number
          created_at: string | null
          current_value: number
          description: string | null
          id: string
          last_valued_date: string | null
          name: string
          notes: string | null
          trust_id: string
          units: number | null
          updated_at: string | null
        }
        Insert: {
          acquisition_date?: string | null
          asset_type: string
          cost_base: number
          created_at?: string | null
          current_value: number
          description?: string | null
          id?: string
          last_valued_date?: string | null
          name: string
          notes?: string | null
          trust_id: string
          units?: number | null
          updated_at?: string | null
        }
        Update: {
          acquisition_date?: string | null
          asset_type?: string
          cost_base?: number
          created_at?: string | null
          current_value?: number
          description?: string | null
          id?: string
          last_valued_date?: string | null
          name?: string
          notes?: string | null
          trust_id?: string
          units?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_investments_trust_id_fkey"
            columns: ["trust_id"]
            isOneToOne: false
            referencedRelation: "trusts"
            referencedColumns: ["id"]
          },
        ]
      }
      trusts: {
        Row: {
          abn: string | null
          created_at: string | null
          establishment_date: string | null
          id: string
          name: string
          trustee_abn: string | null
          trustee_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abn?: string | null
          created_at?: string | null
          establishment_date?: string | null
          id?: string
          name: string
          trustee_abn?: string | null
          trustee_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abn?: string | null
          created_at?: string | null
          establishment_date?: string | null
          id?: string
          name?: string
          trustee_abn?: string | null
          trustee_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      whitelisted_users: {
        Row: {
          added_by: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      xero_connections: {
        Row: {
          id: string
          user_id: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          tenant_id: string
          tenant_name: string | null
          tenant_type: string | null
          status: string
          status_message: string | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          last_sync_at: string | null
          next_sync_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          tenant_id: string
          tenant_name?: string | null
          tenant_type?: string | null
          status?: string
          status_message?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          tenant_id?: string
          tenant_name?: string | null
          tenant_type?: string | null
          status?: string
          status_message?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          last_sync_at?: string | null
          next_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      xero_sync_logs: {
        Row: {
          id: string
          connection_id: string
          sync_type: string
          status: string
          accounts_synced: number | null
          transactions_imported: number | null
          transactions_skipped: number | null
          transactions_updated: number | null
          started_at: string | null
          completed_at: string | null
          duration_ms: number | null
          error_code: string | null
          error_message: string | null
          api_calls_used: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          connection_id: string
          sync_type: string
          status: string
          accounts_synced?: number | null
          transactions_imported?: number | null
          transactions_skipped?: number | null
          transactions_updated?: number | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          api_calls_used?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          connection_id?: string
          sync_type?: string
          status?: string
          accounts_synced?: number | null
          transactions_imported?: number | null
          transactions_skipped?: number | null
          transactions_updated?: number | null
          started_at?: string | null
          completed_at?: string | null
          duration_ms?: number | null
          error_code?: string | null
          error_message?: string | null
          api_calls_used?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "xero_connections"
            referencedColumns: ["id"]
          }
        ]
      }
      xero_account_mappings: {
        Row: {
          id: string
          connection_id: string
          xero_account_id: string
          xero_account_name: string | null
          xero_account_code: string | null
          xero_account_type: string | null
          local_account_id: string | null
          is_sync_enabled: boolean | null
          last_transaction_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          connection_id: string
          xero_account_id: string
          xero_account_name?: string | null
          xero_account_code?: string | null
          xero_account_type?: string | null
          local_account_id?: string | null
          is_sync_enabled?: boolean | null
          last_transaction_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          connection_id?: string
          xero_account_id?: string
          xero_account_name?: string | null
          xero_account_code?: string | null
          xero_account_type?: string | null
          local_account_id?: string | null
          is_sync_enabled?: boolean | null
          last_transaction_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xero_account_mappings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "xero_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xero_account_mappings_local_account_id_fkey"
            columns: ["local_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_whitelist_on_signup: { Args: { event: Json }; Returns: Json }
      search_document_embeddings: {
        Args: {
          filter_document_type?: string
          filter_entity_type?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_content: string
          chunk_index: number
          document_id: string
          document_name: string
          document_type: string
          entity_type: string
          financial_year: string
          similarity: number
        }[]
      }
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
