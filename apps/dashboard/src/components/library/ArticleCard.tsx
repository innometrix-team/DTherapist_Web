import React from 'react';
import { ArticleCardProps } from './types';

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={onClick}
    >
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">{article.date}</div>
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{article.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{article.excerpt}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
            {article.category}
          </span>
          <span>{article.readTime}</span>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;