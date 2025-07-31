import React, { useState } from 'react';
import { Article } from '../../components/library/types';
import ArticlesPage from '../../components/library/ArticlesPage';
import ArticleDetailPage from '../../components/library/ArticleDetailPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a query client for this component tree if not already provided
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const LibraryContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'articles' | 'detail'>('articles');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setCurrentView('detail');
  };

  const handleBackToArticles = () => {
    setCurrentView('articles');
    setSelectedArticle(null);
  };

  return (
    <div className="min-h-screen">
      {currentView === 'articles' ? (
        <ArticlesPage onArticleClick={handleArticleClick} />
      ) : (
        selectedArticle && (
          <ArticleDetailPage 
            article={selectedArticle} 
            onBack={handleBackToArticles} 
          />
        )
      )}
    </div>
  );
};

const Library: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LibraryContent />
     
    </QueryClientProvider>
  );
};

export default Library;