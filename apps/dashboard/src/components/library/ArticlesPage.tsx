import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, Loader2 } from 'lucide-react';
import { ArticlesPageProps, FilterOptions, Article } from './types';
import { useQuery } from '@tanstack/react-query';
import { getAllArticlesApi, getArticlesByCategoryApi, getCategoriesApi, IArticle } from '../../api/Articles.api';
import ArticleCard from './ArticleCard';
import FilterDropdown from './FilterDropdown';
import toast from 'react-hot-toast';

const FILTER_OPTIONS = {
  dateRanges: ['All Time', 'Last Week', 'Last Month', 'Last 3 Months', 'Last Year'],
};

const ArticlesPage: React.FC<ArticlesPageProps> = ({ onArticleClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All Categories',
    dateRange: 'All Time',
  });
  const [showFilters, setShowFilters] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function to format date
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }, []);

  // Transform API article to include computed properties
  const transformArticle = useCallback((article: IArticle): Article => {
    return {
      ...article,
      date: formatDate(article.createdAt),
      // Ensure all required fields have fallbacks
      title: article.title || 'Untitled',
      body: article.body || '',
      category: article.category || 'Uncategorized',
      image: article.image || 'https://via.placeholder.com/400x300?text=Article+Image',
    };
  }, [formatDate]);

  // Query for categories
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading 
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const response = await getCategoriesApi({ signal: controller.signal });
        return response?.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Prepare categories for dropdown
  const categories = useMemo(() => {
    const baseCategories = ['All Categories'];
    if (categoriesData && categoriesData.length > 0) {
      return [...baseCategories, ...categoriesData];
    }
    return baseCategories;
  }, [categoriesData]);

  // Query for articles
  const { 
    data: articlesData, 
    isLoading: articlesLoading, 
    error: articlesError,
    refetch 
  } = useQuery({
    queryKey: ['articles', filters.category],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        let response;
        if (filters.category === 'All Categories') {
          response = await getAllArticlesApi({ signal: controller.signal });
        } else {
          response = await getArticlesByCategoryApi(filters.category, { signal: controller.signal });
        }
        
        // Handle different response structures
        if (response === null) {
          return [];
        }
        
        if (response && response.data) {
          // Ensure we return an array
          const articles = Array.isArray(response.data) ? response.data : [response.data];
          return articles;
        }
        
        return [];
      } catch (error) {
        // Don't throw the error for AbortError, just return empty array
        if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
          return [];
        }
        // Re-throw other errors so React Query can handle them properly
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: true, // Always enabled
  });

  // Transform articles data
  const articles = useMemo(() => {
    if (!articlesData) {
      return [];
    }
    
    // Handle if articlesData is not an array
    const articlesArray = Array.isArray(articlesData) ? articlesData : [articlesData];
    
    if (articlesArray.length === 0) {
      return [];
    }
    
    const transformed = articlesArray
      .filter(article => article && typeof article === 'object' && article._id) // Filter out invalid articles
      .map(transformArticle);
    
    return transformed;
  }, [articlesData, transformArticle]);

  // Filter articles based on search and date
  const filteredArticles = useMemo(() => {
    if (!articles || articles.length === 0) {
      return [];
    }

    const filtered = articles.filter(article => {
      // Ensure we have valid data before filtering
      if (!article || !article._id) {
        return false;
      }
      
      const title = article.title || '';
      const body = article.body || '';
      
      const matchesSearch = searchTerm === '' || 
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        body.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date filtering logic
      let matchesDate = true;
      if (filters.dateRange !== 'All Time') {
        try {
          const articleDate = new Date(article.createdAt);
          const now = new Date();
          const daysDiff = (now.getTime() - articleDate.getTime()) / (1000 * 3600 * 24);
          
          switch (filters.dateRange) {
            case 'Last Week':
              matchesDate = daysDiff <= 7;
              break;
            case 'Last Month':
              matchesDate = daysDiff <= 30;
              break;
            case 'Last 3 Months':
              matchesDate = daysDiff <= 90;
              break;
            case 'Last Year':
              matchesDate = daysDiff <= 365;
              break;
            default:
              matchesDate = true;
          }
        } catch {
          matchesDate = true; // Default to showing the article if date parsing fails
        }
      }
      
      return matchesSearch && matchesDate;
    });
    
    return filtered;
  }, [articles, searchTerm, filters.dateRange]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      category: 'All Categories',
      dateRange: 'All Time',
    });
  };

  // Handle errors
  useEffect(() => {
    if (articlesError) {
      toast.error('Failed to load articles. Please try again.');
    }
  }, [articlesError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const isLoading = articlesLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm m-6">
        <div 
          className="h-48 relative overflow-hidden rounded-xl"
          style={{
            backgroundImage: "url('https://ik.imagekit.io/rqi1dzw2h/banner.jpg?updatedAt=1746532646637')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
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
                disabled={isLoading}
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <FilterDropdown
                    label="Category"
                    options={categories}
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
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-gray-600">Loading articles...</span>
          </div>
        )}

        {/* Error State */}
        {articlesError && !isLoading && (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-4">Failed to load articles</div>
            <p className="text-gray-600 mb-4">
              Error: {articlesError instanceof Error ? articlesError.message : 'Unknown error'}
            </p>
            <button
              onClick={() => refetch()}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Articles Grid */}
        {!isLoading && !articlesError && filteredArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article._id}
                article={article}
                onClick={() => onArticleClick(article)}
              />
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && !articlesError && filteredArticles.length === 0 && articles.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No articles found matching your criteria.</div>
            <p className="text-gray-400 mb-4">
              Found {articles.length} total articles, but none match your current filters.
            </p>
            <button
              onClick={handleClearFilters}
              className="mt-4 text-primary hover:text-primary underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* No Articles Available */}
        {!isLoading && !articlesError && articles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No articles available at the moment.</div>
            <p className="text-gray-400 mb-4">
              {articlesData === null ? 'Request may have been cancelled.' : 'The server returned no articles.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-primary hover:text-primary underline"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;