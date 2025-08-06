import React from 'react';
import { ArticleCardProps } from './types';

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'https://via.placeholder.com/400x300?text=Article+Image';
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
      onClick={onClick}
    >
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={handleImageError}
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">
          {article.date || new Date(article.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {article.body.substring(0, 120)}...
        </p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="bg-blue-100 text-primary px-2 py-1 rounded-full text-xs font-medium">
            {article.category}
          </span>
          <span className="text-xs">
            {article.date || new Date(article.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;