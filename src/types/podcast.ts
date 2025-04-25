export interface Author {
  id: string;
  name: string;
  email: string;
  instagram: string;
  website: string;
  school_start: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Audio {
  id: string;
  url: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cover {
  id: string;
  url: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  publishedAt: Date;
  author: Author;
  category: Category;
  audio: Audio;
  cover: any;
}
