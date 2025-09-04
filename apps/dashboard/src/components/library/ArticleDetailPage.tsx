import React, { useEffect, useRef, useCallback } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Article } from './types';
import { useQuery } from '@tanstack/react-query';
import { getArticleByIdApi } from '../../api/Articles.api';
import toast from 'react-hot-toast';

interface ArticleDetailPageProps {
  article: Article;
  onBack: () => void;
}

const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ article, onBack }) => {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function to format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Fetch detailed article data
  const { 
    data: detailedArticle, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['article', article._id],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await getArticleByIdApi(article._id, { signal: controller.signal });
      if (response?.data) {
        return {
          ...response.data,
          date: formatDate(response.data.createdAt),
        };
      }
      return null;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    // Use the passed article as initial data
    initialData: {
      ...article,
      date: article.date || formatDate(article.createdAt),
    },
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error('Failed to load article details. Please try again.');
    }
  }, [error]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Use the detailed article if available, fallback to the passed article
  const displayArticle = detailedArticle || article;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {isLoading && !detailedArticle && (
        <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading article...</span>
          </div>
        </div>
      )}

      {/* Header Image */}
      <div className="relative h-64 overflow-hidden rounded-xl m-6">
        <img 
          src={displayArticle.image} 
          alt={displayArticle.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/800x400?text=Article+Image';
          }}
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-6xl px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{displayArticle.title}</h1>
            <p className="text-xl opacity-90">{displayArticle.date}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-blue-600 hover:text-primary transition-colors"
          disabled={isLoading && !detailedArticle}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Articles
        </button>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-700">
              Failed to load complete article details. Showing cached version.
            </div>
          </div>
        )}

        {/* Article Meta */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {displayArticle.date}
            </div>
            
            <span className="bg-blue-100 text-primary px-3 py-1 rounded-full">
              {displayArticle.category}
            </span>
            
            {/* Loading indicator for detailed content */}
            {isLoading && detailedArticle && (
              <div className="flex items-center gap-1 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Updating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            {displayArticle.body.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6 text-gray-700 leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>

       
      </div>
    </div>
  );
};

export default ArticleDetailPage;