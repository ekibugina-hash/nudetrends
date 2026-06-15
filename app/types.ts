export interface Video {
  id: string;
  title: string;
  creator: string;
  views: string;
  time: string;
  duration: string;
  desc: string;
  initials: string;
  gradient: string;
  category: string;
  type?: 'video' | 'image';
  imageUrl?: string;
  interestingTitles?: string[];
  videoUrl?: string; // Optional real URL from R2
  thumbnailUrl?: string; // Optional real thumbnail from R2
  uploadedAt?: number; // Unix ms timestamp of when the file was uploaded
}

export interface Comment {
  id: string;
  videoId: string;
  author: string;
  time: string;
  text: string;
  avatarInitials: string;
}
