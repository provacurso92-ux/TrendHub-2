/**
 * Video URL utility functions for handling different video platforms
 */

export type VideoEmbedType = 'iframe' | 'video' | 'error';

export interface VideoEmbed {
  type: VideoEmbedType;
  src: string;
  error?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=ABC123
 * - https://youtu.be/ABC123
 * - https://www.youtube.com/watch?v=ABC123&t=10s
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Vimeo video ID from URL
 * Supports:
 * - https://vimeo.com/123456789
 * - https://player.vimeo.com/video/123456789
 */
function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract Google Drive file ID
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 */
function extractGoogleDriveId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if URL is a direct video file
 * Supports: .mp4, .webm, .ogg, .mov, .mkv, .flv, .avi, .m3u8
 */
function isDirectVideoUrl(url: string): boolean {
  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.mov', '.mkv',
    '.flv', '.avi', '.m3u8', '.ts', '.3gp'
  ];

  const urlWithoutQuery = url.split('?')[0].toLowerCase();
  return videoExtensions.some(ext => urlWithoutQuery.endsWith(ext));
}

/**
 * Main function to detect video type and return appropriate embed configuration
 */
export function getVideoEmbed(url: string): VideoEmbed {
  if (!url || typeof url !== 'string') {
    return {
      type: 'error',
      src: '',
      error: 'URL inválida',
    };
  }

  try {
    // YouTube detection and conversion
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return {
          type: 'iframe',
          src: `https://www.youtube.com/embed/${videoId}`,
        };
      }
      return {
        type: 'error',
        src: '',
        error: 'URL do YouTube inválida',
      };
    }

    // Vimeo detection and conversion
    if (url.includes('vimeo.com')) {
      const videoId = extractVimeoId(url);
      if (videoId) {
        return {
          type: 'iframe',
          src: `https://player.vimeo.com/video/${videoId}`,
        };
      }
      return {
        type: 'error',
        src: '',
        error: 'URL do Vimeo inválida',
      };
    }

    // Google Drive detection and conversion
    if (url.includes('drive.google.com')) {
      const fileId = extractGoogleDriveId(url);
      if (fileId) {
        return {
          type: 'iframe',
          src: `https://drive.google.com/file/d/${fileId}/preview`,
        };
      }
      return {
        type: 'error',
        src: '',
        error: 'URL do Google Drive inválida',
      };
    }

    // Direct video file detection
    if (isDirectVideoUrl(url)) {
      return {
        type: 'video',
        src: url,
      };
    }

    // Unknown format
    return {
      type: 'error',
      src: '',
      error: 'URL de vídeo não suportada. Use um link do YouTube, Vimeo, Google Drive ou um arquivo de vídeo direto (.mp4, .webm, etc)',
    };
  } catch (err) {
    return {
      type: 'error',
      src: '',
      error: 'Erro ao processar URL do vídeo',
    };
  }
}

/**
 * Check if URL is any type of video
 */
export function isVideoUrl(url: string): boolean {
  const embed = getVideoEmbed(url);
  return embed.type !== 'error';
}

/**
 * Check if URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/.test(url);
}

/**
 * Check if URL is a Vimeo video
 */
export function isVimeoUrl(url: string): boolean {
  return /vimeo\.com/.test(url);
}

/**
 * Check if URL is a Google Drive video
 */
export function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com/.test(url);
}
