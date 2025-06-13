import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { ArticlesPageProps, FilterOptions } from './types';
import { DUMMY_ARTICLES, FILTER_OPTIONS } from './constant';
import ArticleCard from './ArticleCard';
import FilterDropdown from './FilterDropdown';

const ArticlesPage: React.FC<ArticlesPageProps> = ({ onArticleClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All Categories',
    dateRange: 'All Time',
    author: 'All Authors'
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredArticles = useMemo(() => {
    return DUMMY_ARTICLES.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filters.category === 'All Categories' || article.category === filters.category;
      const matchesAuthor = filters.author === 'All Authors' || article.author === filters.author;
      
      // For date filtering, we'll keep it simple for this demo
      const matchesDate = filters.dateRange === 'All Time';
      
      return matchesSearch && matchesCategory && matchesAuthor && matchesDate;
    });
  }, [searchTerm, filters]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: 'All Categories',
      dateRange: 'All Time',
      author: 'All Authors'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm m-6 ">
        <div 
          className="h-48  relative overflow-hidden rounded-xl"
          style={{
            backgroundImage: "url('https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/40 "></div>
          <div className="relative z-10 flex items-center justify-center h-full">
            <h1 className="text-4xl font-bold text-white">Articles</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search Articles"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <FilterDropdown
                    label="Category"
                    options={FILTER_OPTIONS.categories}
                    value={filters.category}
                    onChange={(value) => setFilters({...filters, category: value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Published</label>
                  <FilterDropdown
                    label="Date Range"
                    options={FILTER_OPTIONS.dateRanges}
                    value={filters.dateRange}
                    onChange={(value) => setFilters({...filters, dateRange: value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                  <FilterDropdown
                    label="Author"
                    options={FILTER_OPTIONS.authors}
                    value={filters.author}
                    onChange={(value) => setFilters({...filters, author: value})}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onClick={() => onArticleClick(article)}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No articles found matching your criteria.</div>
            <button
              onClick={handleClearFilters}
              className="mt-4 text-primary hover:text-primary underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;
