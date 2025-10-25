import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your actual Supabase project URL and anon key
// Get these from your Supabase dashboard: Settings → API
const supabaseUrl = 'YOUR_SUPABASE_URL'; // e.g., 'https://yourproject.supabase.co'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // e.g., 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

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
  trimester: 'first' | 'second' | 'third' | 'not_pregnant';
  allergies: string[];
  focus_areas: string[];
  dietary_restrictions: string[];
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

// Database operations
export const userService = {
  // Create or update user profile
  async upsertProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profile)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting profile:', error);
      return null;
    }
  },

  // Get user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
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
