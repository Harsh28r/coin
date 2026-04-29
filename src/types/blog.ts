export interface BlogPost {
  id: string;
  _id?: string;
  slug?: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  tags?: string[];
  excerpt?: string;
  date: string | Date;
}