import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { BlogPost } from '../types/blog';
import * as api from '../services/api';

interface BlogContextType {
  posts: BlogPost[];
  addPost: (post: Omit<BlogPost, 'id'>) => Promise<{ success: boolean; message: string }>;
  updatePost: (post: BlogPost) => Promise<{ success: boolean; message: string }>;
  deletePost: (id: string) => Promise<{ success: boolean; message: string }>;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refreshPosts: () => Promise<void>;
  searchPosts: (query: string) => BlogPost[];
  getPostById: (id: string) => BlogPost | undefined;
  totalPosts: number;
  categories: string[];
  featuredPosts: BlogPost[];
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const getUserRole = (): string => {
  return localStorage.getItem('userRole') || 'user';
};

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const BlogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Enhanced error handling with auto-clear
  const setErrorWithTimeout = useCallback((message: string, timeout: number = 5000) => {
    setError(message);
    setTimeout(() => setError(null), timeout);
  }, []);

  // Clear error manually
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Enhanced fetch posts with retry logic
  const fetchPosts = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await api.fetchPosts();
      
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from API');
      }
      
      setPosts(data);
      setLastFetch(new Date());
      
      // Log successful fetch
      console.log(`✅ Successfully fetched ${data.length} posts at ${new Date().toLocaleTimeString()}`);
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to fetch posts';
      console.error('❌ Error fetching posts:', err);
      
      if (retryCount < 3) {
        console.log(`🔄 Retrying fetch (attempt ${retryCount + 1}/3)...`);
        setTimeout(() => fetchPosts(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setErrorWithTimeout(`Failed to fetch posts: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [setErrorWithTimeout]);

  // Refresh posts manually
  const refreshPosts = useCallback(async (): Promise<void> => {
    await fetchPosts();
  }, [fetchPosts]);

  // Enhanced add post with validation
  const addPost = useCallback(async (post: Omit<BlogPost, 'id'>): Promise<{ success: boolean; message: string }> => {
    try {
      setError(null);
      
      // Validate post data
      if (!post.title?.trim()) {
        throw new Error('Post title is required');
      }
      if (!post.content?.trim()) {
        throw new Error('Post content is required');
      }
      
      const newPost = await api.createPost(post);
      
      // Validate returned post
      if (!newPost?.id) {
        throw new Error('Invalid post data returned from API');
      }
      
      setPosts(prevPosts => [newPost, ...prevPosts]);
      
      console.log(`✅ Successfully created post: ${newPost.title}`);
      return { success: true, message: 'Post created successfully!' };
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create post';
      console.error('❌ Error creating post:', err);
      setErrorWithTimeout(`Failed to create post: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }, [setErrorWithTimeout]);

  // Enhanced update post
  const updatePost = useCallback(async (post: BlogPost): Promise<{ success: boolean; message: string }> => {
    try {
      setError(null);
      
      // Validate post data
      if (!post.id) {
        throw new Error('Post ID is required for update');
      }
      
      const updatedPost = await api.updatePost(post);
      
      // Validate returned post
      if (!updatedPost?.id) {
        throw new Error('Invalid updated post data returned from API');
      }
      
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p)
      );
      
      console.log(`✅ Successfully updated post: ${updatedPost.title}`);
      return { success: true, message: 'Post updated successfully!' };
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to update post';
      console.error('❌ Error updating post:', err);
      setErrorWithTimeout(`Failed to update post: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }, [setErrorWithTimeout]);

  // Enhanced delete post with confirmation
  const deletePost = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      setError(null);
      
      // Find post to get title for logging
      const postToDelete = posts.find(p => p.id === id);
      const postTitle = postToDelete?.title || 'Unknown Post';
      
      console.log(`🗑️ Attempting to delete post: ${postTitle} (ID: ${id})`);
      
      await api.deletePost(id);
      
      setPosts(prevPosts => prevPosts.filter(post => post.id !== id));
      
      console.log(`✅ Successfully deleted post: ${postTitle}`);
      return { success: true, message: 'Post deleted successfully!' };
      
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete post';
      console.error('❌ Error deleting post:', err);
      setErrorWithTimeout(`Failed to delete post: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }, [posts, setErrorWithTimeout]);

  // Enhanced user role checking
  const checkUserRole = useCallback(() => {
    try {
      const userRole = getUserRole();
      const authToken = getAuthToken();
      
      console.log('🔐 Current user role:', userRole);
      console.log('🔑 Auth token present:', !!authToken);
      
      // Enhanced admin check with token validation
      const isUserAdmin = userRole === 'admin' && !!authToken;
      setIsAdmin(isUserAdmin);
      
      if (isUserAdmin) {
        console.log('👑 User has admin privileges');
      }
      
    } catch (err) {
      console.error('❌ Error checking user role:', err);
      setIsAdmin(false);
    }
  }, []);

  // Search functionality
  const searchPosts = useCallback((query: string): BlogPost[] => {
    if (!query.trim()) return posts;
    
    const searchTerm = query.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.author.toLowerCase().includes(searchTerm)
    );
  }, [posts]);

  // Get post by ID
  const getPostById = useCallback((id: string): BlogPost | undefined => {
    return posts.find(post => post.id === id);
  }, [posts]);

  // Computed properties
  const totalPosts = posts.length;
  const categories = Array.from(new Set(posts.map(post => (post as any).category || 'Uncategorized')));
  const featuredPosts = posts.filter(post => (post as any).featured).slice(0, 3);

  // Auto-refresh posts every 5 minutes if user is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hasFocus() && posts.length > 0) {
        console.log('🔄 Auto-refreshing posts...');
        fetchPosts();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchPosts, posts.length]);

  // Enhanced initialization
  useEffect(() => {
    const initializeBlog = async () => {
      console.log('🚀 Initializing Blog Context...');
      await fetchPosts();
      checkUserRole();
    };

    initializeBlog();
  }, [fetchPosts, checkUserRole]);

  // Performance optimization: Memoize context value
  const contextValue = React.useMemo(() => ({
    posts,
    addPost,
    updatePost,
    deletePost,
    isAdmin,
    setIsAdmin,
    loading,
    error,
    clearError,
    refreshPosts,
    searchPosts,
    getPostById,
    totalPosts,
    categories,
    featuredPosts
  }), [
    posts,
    addPost,
    updatePost,
    deletePost,
    isAdmin,
    loading,
    error,
    clearError,
    refreshPosts,
    searchPosts,
    getPostById,
    totalPosts,
    categories,
    featuredPosts
  ]);

  console.log(`📊 BlogContext rendered - Posts: ${posts.length}, Admin: ${isAdmin}, Loading: ${loading}`);

  return (
    <BlogContext.Provider value={contextValue}>
      {children}
    </BlogContext.Provider>
  );
};

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
};