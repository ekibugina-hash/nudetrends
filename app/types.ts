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
  isPinnedToCarousel?: boolean; // Whether to pin this item to the Latest Drops carousel
  attachments?: MediaAttachment[]; // Related videos/images attached to this video
}

export interface Creator {
  name: string;
  thumbnailUrl?: string;
  gradient: string;
}

export interface MediaAttachment {
  id: string;
  type: 'video' | 'image';
  url: string;
  thumbnailUrl?: string; // Optional thumbnail for video attachments
}

export interface Comment {
  id: string;
  videoId: string;
  author: string;
  time: string;
  text: string;
  avatarInitials: string;
}
