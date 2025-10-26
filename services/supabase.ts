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
