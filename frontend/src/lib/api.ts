import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

// Types corrispondenti al backend
export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
}

export interface UserProfile {
  id: string;
  user_id: string;
  age_range?: string;
  education_level?: string;
  current_role?: string;
  industry?: string;
  experience_years?: number;
  learning_style?: Record<string, number>;
  preferred_pace?: string;
  daily_time_commitment?: number;
  current_skills?: Record<string, number>;
  target_skills?: Record<string, number>;
  primary_goal?: string;
  secondary_goals?: string[];
  target_timeline?: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  difficulty_level?: string;
  estimated_duration_hours?: number;
  modules: any[];
  progress_percentage: number;
  is_completed: boolean;
  status: string;
  learning_objectives?: string[];
  generated_by_model?: string;
  confidence_score?: number;
  personalization_factors?: Record<string, any>;
}

// 🆕 NUOVI TYPES PER LE NUOVE API
export interface UserProgress {
  id: string;
  user_id: string;
  current_xp: number;
  level: number;
  total_xp_earned: number;
  xp_to_next_level: number;
  level_progress_percentage: number;
  daily_xp: number;
  weekly_xp: number;
  monthly_xp: number;
  current_streak: number;
  longest_streak: number;
  is_streak_active: boolean;
  total_lessons_completed: number;
  total_quizzes_completed: number;
  total_assessments_completed: number;
  total_learning_time_minutes: number;
  average_quiz_score: number;
  accuracy_percentage: number;
  learning_velocity: number;
  consistency_score: number;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_id: string;
  title: string;
  description?: string;
  category: string;
  badge_icon: string;
  badge_color: string;
  rarity: string;
  xp_reward: number;
  progress_current: number;
  progress_required: number;
  progress_percentage: number;
  is_unlocked: boolean;
  is_completed: boolean;
  unlocked_at?: string;
}

export interface DashboardOverview {
  user: User;
  progress: UserProgress;
  recent_achievements: Achievement[];
  active_learning_paths: LearningPath[];
  weekly_stats: {
    xp_gained: number;
    lessons_completed: number;
    quizzes_completed: number;
    learning_time_minutes: number;
    streak_maintained: boolean;
  };
  ai_insights: string[];
  recommendations: string[];
  next_milestones: string[];
}

export interface CommunityPost {
  id: string;
  author_id: string;
  title: string;
  content: string;
  post_type: string;
  topic?: string;
  tags: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  is_featured: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  topic: string;
  is_public: boolean;
  max_members: number;
  creator_id: string;
  members_count: number;
  activity_score: number;
  learning_goals: string[];
  created_at: string;
  creator: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  time_limit_minutes?: number;
  difficulty: string;
  topic: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'code_completion' | 'short_answer';
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

export interface AgentResponse {
  success: boolean;
  agent_name: string;
  execution_time: number;
  result: any;
  request_id: string;
  timestamp: string;
}

// API Client Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor per aggiungere token
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor per gestire errori
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      Cookies.remove('access_token');
      window.location.href = '/login';
    }
    
    const message = error.response?.data?.detail || 'Si è verificato un errore';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const response = await apiClient.post('/api/v1/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, username: string): Promise<{ access_token: string; user: User }> => {
    const response = await apiClient.post('/api/v1/auth/register', { 
      email, 
      password, 
      username 
    });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/api/v1/users/me');
    return response.data;
  },

  refreshToken: async (): Promise<{ access_token: string }> => {
    const response = await apiClient.post('/api/v1/auth/refresh');
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/api/v1/users/profile');
    return response.data;
  },

  updateProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.put('/api/v1/users/profile', profileData);
    return response.data;
  },

  analyzeProfile: async (analysisData: {
    age_range: string;
    education_level: string;
    current_role: string;
    industry: string;
    experience_years: number;
    goals: Record<string, any>;
    preferences: Record<string, any>;
    constraints: Record<string, any>;
    self_assessment: Record<string, any>;
  }): Promise<AgentResponse> => {
    const response = await apiClient.post('/api/v1/agents/profile/analyze', analysisData);
    return response.data;
  },
};

// 🆕 DASHBOARD API - NUOVO
export const dashboardAPI = {
  getOverview: async (): Promise<DashboardOverview> => {
    const response = await apiClient.get('/api/v1/dashboard/overview');
    return response.data;
  },

  getXPDetails: async (): Promise<{
    current_xp: number;
    total_xp_earned: number;
    level: number;
    xp_to_next_level: number;
    level_progress_percentage: number;
    multipliers: any[];
    goals_progress: {
      daily: { current: number; target: number; percentage: number };
      weekly: { current: number; target: number; percentage: number };
      monthly: { current: number; target: number; percentage: number };
    };
    xp_sources: Record<string, number>;
    recent_gains: { daily: number; weekly: number; monthly: number };
    learning_velocity: number;
    consistency_score: number;
  }> => {
    const response = await apiClient.get('/api/v1/dashboard/xp-details');
    return response.data;
  },

  getAchievements: async (params?: {
    show_locked?: boolean;
    category?: string;
  }): Promise<{
    unlocked: Achievement[];
    locked: Achievement[];
    in_progress: Achievement[];
    stats: {
      total_achievements: number;
      unlocked_count: number;
      completion_percentage: number;
      total_achievement_xp: number;
    };
    categories: string[];
    rarities: Record<string, number>;
  }> => {
    const response = await apiClient.get('/api/v1/dashboard/achievements', { params });
    return response.data;
  },

  getWeeklyStats: async (weeks_back?: number): Promise<{
    weekly_data: Array<{
      week_start: string;
      xp_gained: number;
      lessons_completed: number;
      quizzes_completed: number;
      learning_time_minutes: number;
      days_active: number;
      average_session_time: number;
    }>;
    trends: {
      xp_change: number;
      time_change: number;
      consistency_score: number;
    };
    summary: {
      total_weeks_tracked: number;
      average_weekly_xp: number;
      average_weekly_time: number;
      best_week_xp: number;
      most_consistent_week: number;
    };
  }> => {
    const response = await apiClient.get('/api/v1/dashboard/weekly-stats', { 
      params: { weeks_back } 
    });
    return response.data;
  },

  updateGoals: async (goals: {
    daily_xp_goal: number;
    weekly_xp_goal: number;
    monthly_xp_goal: number;
  }): Promise<{ message: string; goals: typeof goals }> => {
    const response = await apiClient.post('/api/v1/dashboard/update-goals', null, { params: goals });
    return response.data;
  },
};

// Learning Path API - AGGIORNATO
export const learningPathAPI = {
  generatePath: async (pathData: {
    goal: string;
    timeline?: string;
    daily_commitment?: number;
    current_skills?: string[];
    preferred_style?: string;
    difficulty_level?: string;
  }): Promise<{
    success: boolean;
    learning_path: LearningPath;
    generation_info: {
      model_used: string;
      confidence_score: number;
      processing_time: number;
      personalization_applied: boolean;
    };
    next_steps: string[];
  }> => {
    const response = await apiClient.post('/api/v1/learning/generate-path', pathData);
    return response.data;
  },

  getLearningPaths: async (status?: string): Promise<{
    learning_paths: LearningPath[];
    total_count: number;
    active_count: number;
    completed_count: number;
  }> => {
    const response = await apiClient.get('/api/v1/learning/paths', { 
      params: { status } 
    });
    return response.data;
  },

  getLearningPath: async (pathId: string): Promise<{
    learning_path: LearningPath;
    progress_details: {
      total_modules: number;
      completed_modules: number;
      current_module: any;
      estimated_completion_date: string | null;
    };
  }> => {
    const response = await apiClient.get(`/api/v1/learning/paths/${pathId}`);
    return response.data;
  },

  updateProgress: async (pathId: string, progressUpdate: {
    module_id: string;
    completed: boolean;
    time_spent_minutes?: number;
    notes?: string;
  }): Promise<{
    success: boolean;
    updated_progress: number;
    path_status: string;
    xp_earned: number;
  }> => {
    const response = await apiClient.post(`/api/v1/learning/paths/${pathId}/update-progress`, progressUpdate);
    return response.data;
  },

  getRecommendations: async (params?: {
    topic?: string;
    difficulty?: string;
    content_type?: string;
    limit?: number;
  }): Promise<{
    recommendations: any[];
    personalization_factors: Record<string, any>;
    trending_topics: string[];
    similar_users_content: any[];
  }> => {
    const response = await apiClient.get('/api/v1/learning/recommendations', { params });
    return response.data;
  },

  generateAssessment: async (assessmentData: {
    topic: string;
    difficulty?: string;
    question_count?: number;
    question_types?: string[];
    learning_path_id?: string;
    adaptive?: boolean;
  }): Promise<{
    success: boolean;
    assessment: Assessment;
    session_id: string;
    metadata: {
      generated_by: string;
      model_used: string;
      difficulty_level: string;
      adaptive_enabled: boolean;
    };
  }> => {
    const response = await apiClient.post('/api/v1/learning/assessments/generate', assessmentData);
    return response.data;
  },

  submitAssessment: async (submission: {
    session_id: string;
    answers: Array<{
      question_id: string;
      answer: string;
      time_spent: number;
    }>;
  }): Promise<{
    success: boolean;
    results: {
      score: number;
      correct_answers: number;
      total_questions: number;
      time_taken: number;
      topic: string;
      difficulty: string;
      detailed_feedback: any[];
    };
    xp_earned?: number;
    next_recommendations: any[];
  }> => {
    const response = await apiClient.post('/api/v1/learning/assessments/submit', submission);
    return response.data;
  },
};

// 🆕 COMMUNITY API - NUOVO
export const communityAPI = {
  getFeed: async (params?: {
    page?: number;
    limit?: number;
    post_type?: string;
    topic?: string;
  }): Promise<{
    posts: CommunityPost[];
    pagination: {
      page: number;
      limit: number;
      total_posts: number;
      has_next: boolean;
    };
    trending_topics: string[];
  }> => {
    const response = await apiClient.get('/api/v1/community/feed', { params });
    return response.data;
  },

  createPost: async (postData: {
    title: string;
    content: string;
    post_type?: string;
    topic?: string;
    tags?: string[];
    study_group_id?: string;
    achievement_data?: Record<string, any>;
    attachments?: string[];
  }): Promise<{
    success: boolean;
    post: CommunityPost;
    xp_earned: number;
  }> => {
    const response = await apiClient.post('/api/v1/community/posts', postData);
    return response.data;
  },

  getPost: async (postId: string): Promise<{
    post: CommunityPost & { user_liked: boolean };
    comments: Array<{
      id: string;
      content: string;
      author: { id: string; full_name: string; avatar_url?: string };
      likes_count: number;
      user_liked: boolean;
      created_at: string;
    }>;
  }> => {
    const response = await apiClient.get(`/api/v1/community/posts/${postId}`);
    return response.data;
  },

  addComment: async (postId: string, commentData: {
    content: string;
    parent_comment_id?: string;
  }): Promise<{
    success: boolean;
    comment: any;
    xp_earned: number;
  }> => {
    const response = await apiClient.post(`/api/v1/community/posts/${postId}/comments`, commentData);
    return response.data;
  },

  toggleLike: async (postId: string): Promise<{
    success: boolean;
    liked: boolean;
    likes_count: number;
    xp_earned: number;
  }> => {
    const response = await apiClient.post(`/api/v1/community/posts/${postId}/like`);
    return response.data;
  },

  getStudyGroups: async (params?: {
    page?: number;
    limit?: number;
    topic?: string;
    is_public?: boolean;
  }): Promise<{
    study_groups: Array<StudyGroup & { is_member: boolean }>;
    pagination: {
      page: number;
      limit: number;
      total_groups: number;
      has_next: boolean;
    };
  }> => {
    const response = await apiClient.get('/api/v1/community/study-groups', { params });
    return response.data;
  },

  createStudyGroup: async (groupData: {
    name: string;
    description?: string;
    topic: string;
    is_public?: boolean;
    max_members?: number;
    learning_goals?: string[];
    resources?: any[];
    schedule?: Record<string, any>;
  }): Promise<{
    success: boolean;
    study_group: StudyGroup;
    xp_earned: number;
  }> => {
    const response = await apiClient.post('/api/v1/community/study-groups', groupData);
    return response.data;
  },

  joinStudyGroup: async (groupId: string): Promise<{
    success: boolean;
    message: string;
    xp_earned: number;
  }> => {
    const response = await apiClient.post(`/api/v1/community/study-groups/${groupId}/join`);
    return response.data;
  },
};

// Workflow API - MANTENUTO
export const workflowAPI = {
  executeNewUserOnboarding: async (profileData: any, learningGoal: string): Promise<any> => {
    const response = await apiClient.post('/api/v1/agents/workflow/new-user-onboarding', {
      ...profileData,
      learning_goal: learningGoal
    });
    return response.data;
  },
};

// System API - MANTENUTO
export const systemAPI = {
  getSystemStatus: async (): Promise<any> => {
    const response = await apiClient.get('/api/v1/agents/system/status');
    return response.data;
  },

  getHealthCheck: async (): Promise<any> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

// 🆕 AGENTS API - AGGIORNATO per includere tutti gli agents
export const agentsAPI = {
  // Existing agent calls
  analyzeProfile: profileAPI.analyzeProfile,
  
  // Content Curator Agent
  getCuratedContent: async (params: {
    topic?: string;
    difficulty?: string;
    learning_style?: string;
    content_types?: string[];
  }): Promise<AgentResponse> => {
    const response = await apiClient.post('/api/v1/agents/content-curator/curate', params);
    return response.data;
  },

  // Progress Tracker Agent  
  getProgressInsights: async (): Promise<AgentResponse> => {
    const response = await apiClient.post('/api/v1/agents/progress-tracker/insights');
    return response.data;
  },

  // Motivation Coach Agent
  getMotivationTips: async (): Promise<AgentResponse> => {
    const response = await apiClient.post('/api/v1/agents/motivation-coach/tips');
    return response.data;
  },

  // Industry Intelligence Agent
  getIndustryInsights: async (params: {
    industry?: string;
    role?: string;
    skills?: string[];
  }): Promise<AgentResponse> => {
    const response = await apiClient.post('/api/v1/agents/industry-intelligence/insights', params);
    return response.data;
  },

  // Assessment Agent
  generateAssessment: learningPathAPI.generateAssessment,
  
  // Master Orchestrator
  processComplexQuery: async (query: {
    message: string;
    context?: Record<string, any>;
  }): Promise<AgentResponse> => {
    const response = await apiClient.post('/api/v1/agents/orchestrator/process', query);
    return response.data;
  },
};

export default apiClient;
