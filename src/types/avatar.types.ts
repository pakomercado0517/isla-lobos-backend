import { User } from '.';

export interface AvatarUploadResponse {
  user: Omit<User, 'password'>;
  avatar: {
    url: string;
    uploaded_at: string;
  };
}

export interface AvatarDeleteResponse {
  user: Omit<User, 'password'>;
  deleted_from_cloudinary: boolean;
}

export interface AvatarGenerateDefaultResponse {
  user: Omit<User, 'password'>;
  avatar: {
    url: string;
    type: 'default';
    generated_at: string;
  };
}

export interface AvatarInfoResponse {
  has_avatar: boolean;
  avatar_url: string | null;
  is_cloudinary: boolean;
  user: Pick<User, 'id' | 'nombre' | 'email'>;
}

export interface CloudinaryStats {
  totalImages: number;
  totalStorage: number;
  totalBandwidth: number;
}

export interface CloudinaryStatsResponse {
  usage_stats: CloudinaryStats;
  limits: {
    free_tier: {
      storage_gb: number;
      bandwidth_gb: number;
      transformations: number;
    };
  };
  retrieved_at: string;
}
