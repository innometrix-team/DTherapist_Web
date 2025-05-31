import React from 'react';
import { Calendar, User } from 'lucide-react';
import { ArticleDetailPageProps } from './types';

const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ article, onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-96 overflow-hidden">
        <img 
          src={article.image} 
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 "></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white max-w-4xl px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{article.title}</h1>
            <p className="text-xl opacity-90">{article.date}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-blue-600 hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Articles
        </button>

        {/* Article Meta */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {article.date}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {article.author}
            </div>
            <span className="bg-blue-100 text-primary px-3 py-1 rounded-full">
              {article.category}
            </span>
            <span className="text-gray-500">{article.readTime}</span>
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6 text-gray-700 leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        {/* <div className="mt-8 bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Need Professional Support?
          </h3>
          <p className="text-gray-600 mb-4">
            Our licensed therapists are here to help you on your mental health journey.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-primary transition-colors">
            Schedule a Session
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default ArticleDetailPage;