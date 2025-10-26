import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Supabase project credentials
const supabaseUrl = 'https://ppcgjeiamazpujkqdgjm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwY2dqZWlhbWF6cHVqa3FkZ2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTgyNzcsImV4cCI6MjA3Njk3NDI3N30.7LC96k6n1cOM5vvsytgjY2YDduJHpzbDIRqZmaB-G9M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// User Profile Types
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  age?: string;
  gender?: string;
  weight?: string;
  due_date?: string;
  trimester: 'first' | 'second' | 'third' | 'not_pregnant';
  allergies: string[];
  focus_areas: string[];
  dietary_restrictions: string[];
  account_status: 'pending' | 'active';
  reminder_enabled?: boolean;
  reminder_time?: string;
  reminder_message?: string;
  reminder_trimester_specific?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrimesterInfo {
  trimester: 'first' | 'second' | 'third' | 'not_pregnant';
  recommended_vitamins: string[];
  important_nutrients: string[];
  foods_to_avoid: string[];
  foods_to_include: string[];
  description: string;
}

export interface VitaminIntakeLog {
  id: string;
  user_id: string;
  vitamin_name: string;
  vitamin_type?: string;
  dosage?: string;
  intake_date: string;
  intake_time?: string;
  notes?: string;
  created_at: string;
}

export interface DailyVitaminSummary {
  user_id: string;
  vitamin_name: string;
  intake_date: string;
  times_taken: number;
  dosages_taken: string;
  notes_summary?: string;
}

export interface VitaminIntakeStats {
  user_id: string;
  vitamin_name: string;
  week_start: string;
  month_start: string;
  total_intakes: number;
  days_taken: number;
  weekly_compliance_percentage: number;
  monthly_compliance_percentage: number;
}

// Authentication operations
export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });
      
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://your-app.com/reset-password',
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }
};

// Database operations
export const userService = {
  // Create new user profile
  async createProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // Ensure we have a user ID
      if (!profile.id) {
        throw new Error('Profile ID is required');
      }

      console.log('Creating new profile with ID:', profile.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully created profile:', data);
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  },

  // Update existing user profile
  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // Ensure we have a user ID
      if (!profile.id) {
        throw new Error('Profile ID is required');
      }

      console.log('Updating profile with ID:', profile.id);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(profile)
        .eq('id', profile.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Successfully updated profile:', data);
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  },

  // Create or update user profile (for backward compatibility)
  async upsertProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    // Try to get existing profile first
    const existingProfile = await this.getProfile(profile.id!);
    
    if (existingProfile) {
      return this.updateProfile(profile);
    } else {
      return this.createProfile(profile);
    }
  },

  // Get user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },

  // Get trimester information
  async getTrimesterInfo(trimester: string): Promise<TrimesterInfo | null> {
    try {
      const { data, error } = await supabase
        .from('trimester_info')
        .select('*')
        .eq('trimester', trimester)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting trimester info:', error);
      return null;
    }
  },

  // Save scan results
  async saveScanResult(scanData: {
    user_id: string;
    image_url: string;
    ingredients: string[];
    analysis: string;
    recommendations: string[];
  }) {
    try {
      const { data, error } = await supabase
        .from('scan_results')
        .insert(scanData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving scan result:', error);
      return null;
    }
  }
};

// Vitamin intake tracking operations
export const vitaminIntakeService = {
  // Log a vitamin intake
  async logIntake(intakeData: {
    user_id: string;
    vitamin_name: string;
    vitamin_type?: string;
    dosage?: string;
    intake_time?: string;
    notes?: string;
  }): Promise<VitaminIntakeLog | null> {
    try {
      const { data, error } = await supabase
        .from('vitamin_intake_logs')
        .insert({
          ...intakeData,
          intake_date: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging vitamin intake:', error);
      return null;
    }
  },

  // Get daily vitamin intake summary
  async getDailySummary(userId: string, date?: string): Promise<DailyVitaminSummary[]> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_vitamin_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('intake_date', targetDate);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting daily summary:', error);
      return [];
    }
  },

  // Get vitamin intake statistics
  async getIntakeStats(userId: string, vitaminName?: string): Promise<VitaminIntakeStats[]> {
    try {
      let query = supabase
        .from('vitamin_intake_stats')
        .select('*')
        .eq('user_id', userId);
      
      if (vitaminName) {
        query = query.eq('vitamin_name', vitaminName);
      }
      
      const { data, error } = await query.order('week_start', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting intake stats:', error);
      return [];
    }
  },

  // Get recent vitamin intake history
  async getRecentIntakes(userId: string, limit: number = 10): Promise<VitaminIntakeLog[]> {
    try {
      const { data, error } = await supabase
        .from('vitamin_intake_logs')
        .select('*')
        .eq('user_id', userId)
        .order('intake_date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting recent intakes:', error);
      return [];
    }
  },

  // Get total intake count for a specific vitamin
  async getTotalIntakeCount(userId: string, vitaminName: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('vitamin_intake_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('vitamin_name', vitaminName);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting total intake count:', error);
      return 0;
    }
  },

  // Get intake count for today
  async getTodayIntakeCount(userId: string, vitaminName: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabase
        .from('vitamin_intake_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('vitamin_name', vitaminName)
        .gte('intake_date', `${today}T00:00:00`)
        .lt('intake_date', `${today}T23:59:59`);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting today intake count:', error);
      return 0;
    }
  }
};

// Trimester-specific guidance data
export const trimesterGuidance = {
  first: {
    trimester: 'first' as const,
    recommended_vitamins: ['Folic Acid', 'Iron', 'Vitamin D', 'B12'],
    important_nutrients: ['Folate', 'Iron', 'Calcium', 'Protein'],
    foods_to_avoid: ['Raw fish', 'Unpasteurized dairy', 'High-mercury fish', 'Excessive caffeine'],
    foods_to_include: ['Leafy greens', 'Lean proteins', 'Whole grains', 'Citrus fruits'],
    description: 'First trimester focuses on neural tube development and preventing birth defects.'
  },
  second: {
    trimester: 'second' as const,
    recommended_vitamins: ['Iron', 'Vitamin D', 'Calcium', 'Omega-3'],
    important_nutrients: ['Iron', 'Calcium', 'Protein', 'Omega-3 fatty acids'],
    foods_to_avoid: ['Raw fish', 'Unpasteurized dairy', 'High-mercury fish'],
    foods_to_include: ['Dairy products', 'Fish (low mercury)', 'Nuts and seeds', 'Colorful vegetables'],
    description: 'Second trimester focuses on bone development and brain growth.'
  },
  third: {
    trimester: 'third' as const,
    recommended_vitamins: ['Iron', 'Vitamin D', 'Calcium', 'Vitamin K'],
    important_nutrients: ['Iron', 'Calcium', 'Protein', 'Vitamin K'],
    foods_to_avoid: ['Raw fish', 'Unpasteurized dairy', 'High-mercury fish'],
    foods_to_include: ['Iron-rich foods', 'Calcium sources', 'Protein', 'Healthy fats'],
    description: 'Third trimester prepares for birth and supports final growth spurts.'
  },
  not_pregnant: {
    trimester: 'not_pregnant' as const,
    recommended_vitamins: ['Multivitamin', 'Vitamin D', 'B12', 'Iron'],
    important_nutrients: ['Folate', 'Iron', 'Calcium', 'Protein'],
    foods_to_avoid: ['Excessive alcohol', 'High-mercury fish'],
    foods_to_include: ['Balanced diet', 'Fruits and vegetables', 'Whole grains', 'Lean proteins'],
    description: 'General health and wellness focus for preconception or general health.'
  }
};
