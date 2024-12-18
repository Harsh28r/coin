import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BlogPost } from '../types/blog';
import * as api from '../services/api';

interface BlogContextType {
  posts: BlogPost[];
  addPost: (post: Omit<BlogPost, 'id'>) => Promise<void>;
  updatePost: (post: BlogPost) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  isAdmin: boolean;
  setIsAdmin: (value: boolean) => void;
  loading: boolean;
  error: string | null;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const getUserRole = (): string => {
  return localStorage.getItem('userRole') || 'user';
};

export const BlogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    checkUserRole();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await api.fetchPosts();
      setPosts(data);
    } catch (err) {
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const addPost = async (post: Omit<BlogPost, 'id'>) => {
    try {
      const newPost = await api.createPost(post);
      setPosts([newPost, ...posts]);
    } catch (err) {
      setError('Failed to create post');
    }
  };

  const updatePost = async (post: BlogPost) => {
    try {
      const updatedPost = await api.updatePost(post);
      setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
    } catch (err) {
      setError('Failed to update post');
    }
  };

  const deletePost = async (id: string) => {
    try {
      console.log(`Attempting to delete post with id: ${id}`);
      await api.deletePost(id);
      console.log(`Post with id: ${id} deleted successfully`);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      console.error('Error deleting post:', err);
      setError('Failed to delete post');
    }
  };

  const checkUserRole = () => {
    const userRole = getUserRole();
    console.log('Current user role:', userRole);
    setIsAdmin(userRole === 'admin');
  };

  console.log('Rendering BlogContext with isAdmin:', isAdmin);

  return (
    <BlogContext.Provider value={{ 
      posts, 
      addPost, 
      updatePost, 
      deletePost, 
      isAdmin, 
      setIsAdmin,
      loading,
      error 
    }}>
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