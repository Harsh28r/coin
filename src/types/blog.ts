export interface BlogPost {
  id: string;
  _id?: string;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  date: string | Date;
}