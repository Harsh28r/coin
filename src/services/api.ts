import axios from 'axios';
import { BlogPost } from '../types/blog';

const API_URL = 'http://localhost:5000/api';

export const fetchPosts = async (): Promise<BlogPost[]> => {
  const response = await axios.get(`${API_URL}/posts`);
  return response.data as BlogPost[];
};

export const createPost = async (post: Omit<BlogPost, 'id'>): Promise<BlogPost> => {
  const response = await axios.post(`${API_URL}/posts`, post);
  return response.data as BlogPost;
};

export const updatePost = async (post: BlogPost): Promise<BlogPost> => {
  const response = await axios.put(`${API_URL}/posts/${post.id}`, post);
  return response.data as BlogPost;
};

export const deletePost = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/posts/${id}`);
}; 