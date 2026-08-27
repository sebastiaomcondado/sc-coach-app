export type Role = "coach" | "athlete";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Role;
          created_at: string;
          photo_path: string | null;
          date_of_birth: string | null;
          position: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          jersey_number: number | null;
          squad_group_id: string | null;
          group_notice_seen_group_id: string | null;
        };
        Insert: {
          id: string;
          full_name: string;
          role: Role;
          created_at?: string;
          photo_path?: string | null;
          date_of_birth?: string | null;
          position?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          jersey_number?: number | null;
          squad_group_id?: string | null;
          group_notice_seen_group_id?: string | null;
        };
        Update: {
          full_name?: string;
          role?: Role;
          photo_path?: string | null;
          date_of_birth?: string | null;
          position?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          jersey_number?: number | null;
          squad_group_id?: string | null;
          group_notice_seen_group_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_squad_group_id_fkey";
            columns: ["squad_group_id"];
            isOneToOne: false;
            referencedRelation: "squad_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      squad_groups: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "squad_groups_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      coach_athletes: {
        Row: {
          coach_id: string;
          athlete_id: string;
          created_at: string;
        };
        Insert: {
          coach_id: string;
          athlete_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "coach_athletes_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "coach_athletes_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          video_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string | null;
          video_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          category?: string | null;
          video_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      workouts: {
        Row: {
          id: string;
          coach_id: string;
          athlete_id: string;
          title: string;
          notes: string | null;
          scheduled_date: string;
          created_at: string;
          cycle_id: string | null;
        };
        Insert: {
          id?: string;
          coach_id: string;
          athlete_id: string;
          title: string;
          notes?: string | null;
          scheduled_date?: string;
          created_at?: string;
          cycle_id?: string | null;
        };
        Update: {
          title?: string;
          notes?: string | null;
          scheduled_date?: string;
          cycle_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workouts_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workouts_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workouts_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "training_cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          position: number;
          prescribed_sets: number | null;
          prescribed_reps: string | null;
          prescribed_weight: number | null;
          prescribed_rpe: number | null;
          notes: string | null;
          section: string | null;
          superset_group: string | null;
          prescribed_rest: string | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          position?: number;
          prescribed_sets?: number | null;
          prescribed_reps?: string | null;
          prescribed_weight?: number | null;
          prescribed_rpe?: number | null;
          notes?: string | null;
          section?: string | null;
          superset_group?: string | null;
          prescribed_rest?: string | null;
        };
        Update: {
          position?: number;
          prescribed_sets?: number | null;
          prescribed_reps?: string | null;
          prescribed_weight?: number | null;
          prescribed_rpe?: number | null;
          notes?: string | null;
          section?: string | null;
          superset_group?: string | null;
          prescribed_rest?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey";
            columns: ["workout_id"];
            isOneToOne: false;
            referencedRelation: "workouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      logged_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          athlete_id: string;
          set_number: number;
          reps: number | null;
          weight: number | null;
          rpe: number | null;
          notes: string | null;
          logged_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          athlete_id: string;
          set_number: number;
          reps?: number | null;
          weight?: number | null;
          rpe?: number | null;
          notes?: string | null;
          logged_at?: string;
        };
        Update: {
          reps?: number | null;
          weight?: number | null;
          rpe?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "logged_sets_workout_exercise_id_fkey";
            columns: ["workout_exercise_id"];
            isOneToOne: false;
            referencedRelation: "workout_exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "logged_sets_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      athlete_invites: {
        Row: {
          token: string;
          coach_id: string;
          full_name: string | null;
          created_at: string;
          expires_at: string;
          used_at: string | null;
          is_reusable: boolean;
        };
        Insert: {
          token?: string;
          coach_id: string;
          full_name?: string | null;
          created_at?: string;
          expires_at?: string;
          used_at?: string | null;
          is_reusable?: boolean;
        };
        Update: {
          used_at?: string | null;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "athlete_invites_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      body_metrics: {
        Row: {
          id: string;
          athlete_id: string;
          logged_date: string;
          bodyweight_kg: number | null;
          sleep_hours: number | null;
          readiness: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          athlete_id: string;
          logged_date?: string;
          bodyweight_kg?: number | null;
          sleep_hours?: number | null;
          readiness?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          bodyweight_kg?: number | null;
          sleep_hours?: number | null;
          readiness?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "body_metrics_athlete_id_fkey";
            columns: ["athlete_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      program_templates: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          notes: string | null;
          created_at: string;
          cycle_id: string | null;
          day_of_week: number | null;
        };
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          notes?: string | null;
          created_at?: string;
          cycle_id?: string | null;
          day_of_week?: number | null;
        };
        Update: {
          name?: string;
          notes?: string | null;
          cycle_id?: string | null;
          day_of_week?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_templates_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_templates_cycle_id_fkey";
            columns: ["cycle_id"];
            isOneToOne: false;
            referencedRelation: "training_cycles";
            referencedColumns: ["id"];
          },
        ];
      };
      training_cycles: {
        Row: {
          id: string;
          coach_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "training_cycles_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      template_exercises: {
        Row: {
          id: string;
          template_id: string;
          exercise_id: string;
          position: number;
          sets: number | null;
          reps: string | null;
          weight: number | null;
          rpe: number | null;
          notes: string | null;
          section: string | null;
          superset_group: string | null;
        };
        Insert: {
          id?: string;
          template_id: string;
          exercise_id: string;
          position?: number;
          sets?: number | null;
          reps?: string | null;
          weight?: number | null;
          rpe?: number | null;
          notes?: string | null;
          section?: string | null;
          superset_group?: string | null;
        };
        Update: {
          position?: number;
          sets?: number | null;
          reps?: string | null;
          weight?: number | null;
          rpe?: number | null;
          notes?: string | null;
          section?: string | null;
          superset_group?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "template_exercises_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "program_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "template_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      template_exercise_phases: {
        Row: {
          id: string;
          template_exercise_id: string;
          label: string | null;
          position: number;
          sets: number | null;
          reps: string | null;
          rpe: number | null;
          rest: string | null;
          start_week: number | null;
          end_week: number | null;
        };
        Insert: {
          id?: string;
          template_exercise_id: string;
          label?: string | null;
          position?: number;
          sets?: number | null;
          reps?: string | null;
          rpe?: number | null;
          rest?: string | null;
          start_week?: number | null;
          end_week?: number | null;
        };
        Update: {
          label?: string | null;
          position?: number;
          sets?: number | null;
          reps?: string | null;
          rpe?: number | null;
          rest?: string | null;
          start_week?: number | null;
          end_week?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "template_exercise_phases_template_exercise_id_fkey";
            columns: ["template_exercise_id"];
            isOneToOne: false;
            referencedRelation: "template_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
