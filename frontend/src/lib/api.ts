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

// Learning Path API
export const learningPathAPI = {
  generatePath: async (pathData: {
    goal: string;
    timeline?: string;
    priority_skills?: string[];
    constraints?: Record<string, any>;
  }): Promise<AgentResponse> => {
    const response = await apiClient.post('/api/v1/agents/learning-path/generate', pathData);
    return response.data;
  },

  getLearningPaths: async (): Promise<LearningPath[]> => {
    const response = await apiClient.get('/api/v1/learning-paths');
    return response.data;
  },

  getLearningPath: async (pathId: string): Promise<LearningPath> => {
    const response = await apiClient.get(`/api/v1/learning-paths/${pathId}`);
    return response.data;
  },

  updateProgress: async (pathId: string, moduleId: string, progress: number): Promise<void> => {
    await apiClient.put(`/api/v1/learning-paths/${pathId}/progress`, {
      module_id: moduleId,
      progress
    });
  },
};

// Workflow API
export const workflowAPI = {
  executeNewUserOnboarding: async (profileData: any, learningGoal: string): Promise<any> => {
    const response = await apiClient.post('/api/v1/agents/workflow/new-user-onboarding', {
      ...profileData,
      learning_goal: learningGoal
    });
    return response.data;
  },
};

// System API
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

export default apiClient;
