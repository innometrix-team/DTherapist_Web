import React, { useState } from 'react';
import { Article } from '../../components/library/types';
import ArticlesPage from '../../components/library/ArticlesPage';
import ArticleDetailPage from '../../components/library/ArticleDetailPage';

const Library: React.FC = () => {
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

export default Library;
