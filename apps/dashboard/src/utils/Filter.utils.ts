
import { Article, FilterOptions } from '../components/library/types';

/**
 * Filter articles based on search term and filter options
 */
export const filterArticles = (
  articles: Article[],
  searchTerm: string,
  filters: FilterOptions
): Article[] => {
  return articles.filter(article => {
    const matchesSearch = searchTerm === '' || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      
      article.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === 'All Categories' || 
      article.category === filters.category;
    
    
    
    
    const matchesDate = filters.dateRange === 'All Time';
    
    return matchesSearch && matchesCategory && matchesDate;
  });
};

/**
 * Format date string for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Generate reading time estimate based on word count
 */
export const calculateReadingTime = (content: string): string => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
};