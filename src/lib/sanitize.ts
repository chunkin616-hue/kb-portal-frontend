/**
 * XSS Sanitizer - Prevents Cross-Site Scripting (XSS) attacks
 */

export const sanitizeHtml = (content: string): string => {
  if (!content) return '';
  
  // Create a temporary element to safely encode HTML entities
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potential XSS vectors
  return input
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove on* event handlers
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs (potential XSS)
    .replace(/data:/gi, '');
};

// For displaying in React (without dangerous innerHTML)
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

// For textarea input - safe for editing
export const sanitizeForInput = (value: string): string => {
  return value || '';
};

// Validate and sanitize URLs
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  // Only allow http, https, and relative URLs
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return url;
  }
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  return '';
};