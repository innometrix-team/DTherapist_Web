import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";
import { getArticlesApi, getCategoriesApi } from "../../api/Articles.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const ArticlesList: React.FC = () => {
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { role } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Articles");

  // Check if user is admin
  const isAdmin = role === "admin";

  // Query to fetch articles
  const {
    data: articlesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await getArticlesApi({ 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No articles data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAdmin, // Only run query if user is admin
  });

  // Query to fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategoriesApi();
      if (!response?.data) {
        throw new Error("No categories data received");
      }
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: isAdmin,
  });

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Filter articles based on search term and category
  const filteredArticles = articlesData?.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All Articles" || 
      article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }) || [];

  // Handle checkbox selection
  const handleArticleSelect = (articleId: string, checked: boolean) => {
    if (checked) {
      setSelectedArticles(prev => [...prev, articleId]);
    } else {
      setSelectedArticles(prev => prev.filter(id => id !== articleId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(filteredArticles.map(article => article._id));
    } else {
      setSelectedArticles([]);
    }
  };

  // Handle navigation to create article
  const handleCreateArticle = () => {
    navigate("/library/create-article");
  };

  // Handle navigation to edit article
  const handleOpenArticle = (articleId: string) => {
    navigate(`/library/edit-article/${articleId}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format date for mobile (shorter)
  const formatDateMobile = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">Admin access required to view articles</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="bg-gray-200 animate-pulse h-10 w-full sm:w-32 rounded"></div>
            <div className="bg-gray-200 animate-pulse h-10 w-full sm:w-80 rounded"></div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="bg-gray-200 animate-pulse h-6 w-24 rounded"></div>
            <div className="bg-gray-200 animate-pulse h-10 w-full sm:w-32 rounded"></div>
          </div>
        </div>
        
        <div className="space-y-4">
          {Array(5).fill(0).map((_, index) => (
            <div key={index} className="bg-gray-200 animate-pulse h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">Failed to load articles</p>
          <p className="text-red-500 text-xs mt-1">Please refresh the page</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header - Stack on mobile, side-by-side on desktop */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
            >
              <option value="All Articles">All Articles</option>
              {categoriesData?.categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Articles"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Articles Count */}
          <span className="text-gray-600 text-sm">
            Articles: <span className="font-semibold">{filteredArticles.length.toLocaleString()}</span>
          </span>

          {/* Create Article Button */}
          <button
            onClick={handleCreateArticle}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Create Article
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm text-primary">
            {selectedArticles.length} article{selectedArticles.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAll(false)}
              className="text-sm text-primary hover:text-blue-800"
            >
              Clear Selection
            </button>
            <button
              onClick={() => handleSelectAll(true)}
              className="text-sm text-primary hover:text-blue-800"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No articles found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {/* Desktop/Tablet View - Hidden on mobile */}
            <div className="hidden sm:block">
              {filteredArticles.map((article, index) => (
                <div
                  key={article._id}
                  className={`flex items-center p-4 hover:bg-gray-50 transition-colors ${
                    index !== filteredArticles.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <div className="mr-4">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article._id)}
                      onChange={(e) => handleArticleSelect(article._id, e.target.checked)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>

                  {/* Article Image */}
                  <div className="w-12 h-12 lg:w-16 lg:h-16 mr-4 flex-shrink-0">
                    {article.image ? (
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Article Info */}
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 hidden lg:block">
                      {article.body && article.body.length > 50 
                        ? `${article.body.substring(0, 50)}...` 
                        : article.body || 'No content preview available'}
                    </p>
                  </div>

                  {/* Category - Hidden on small tablets */}
                  <div className="hidden md:block px-3 py-1 bg-gray-100 text-gray-700 text-xs lg:text-sm rounded mr-4 flex-shrink-0">
                    {article.category}
                  </div>

                  {/* Date */}
                  <div className="text-gray-500 text-xs lg:text-sm mr-4 w-20 lg:w-40 flex-shrink-0">
                    <span className="lg:hidden">{formatDateMobile(article.date)}</span>
                    <span className="hidden lg:block">{formatDate(article.date)}</span>
                  </div>

                  {/* Open Button */}
                  <button
                    onClick={() => handleOpenArticle(article._id)}
                    className="px-3 lg:px-4 py-1 text-primary hover:bg-blue-50 rounded text-xs lg:text-sm transition-colors flex-shrink-0"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>

            {/* Mobile View - Card Layout */}
            <div className="sm:hidden space-y-0">
              {filteredArticles.map((article, index) => (
                <div
                  key={article._id}
                  className={`p-4 ${
                    index !== filteredArticles.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  {/* Mobile Card Header */}
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedArticles.includes(article._id)}
                        onChange={(e) => handleArticleSelect(article._id, e.target.checked)}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Article Image */}
                    <div className="w-16 h-16 flex-shrink-0">
                      {article.image ? (
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 mb-1 pr-2">
                        {article.title}
                      </h3>
                      
                      {/* Category and Date */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {article.category}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatDateMobile(article.date)}
                        </span>
                      </div>

                      {/* Content Preview */}
                      {article.body && (
                        <p className="text-xs text-gray-500 mb-3">
                          {article.body.length > 60 
                            ? `${article.body.substring(0, 60)}...` 
                            : article.body}
                        </p>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() => handleOpenArticle(article._id)}
                        className="w-full px-3 py-2 text-primary border border-primary hover:bg-blue-50 rounded text-sm transition-colors"
                      >
                        Open Article
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesList;