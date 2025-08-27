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

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">Admin access required to view articles</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gray-200 animate-pulse h-10 w-32 rounded"></div>
            <div className="bg-gray-200 animate-pulse h-10 w-80 rounded"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-200 animate-pulse h-6 w-24 rounded"></div>
            <div className="bg-gray-200 animate-pulse h-10 w-32 rounded"></div>
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
      <div className="p-6">
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Articles"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Articles Count */}
          <span className="text-gray-600 text-sm">
            Articles: <span className="font-semibold">{filteredArticles.length.toLocaleString()}</span>
          </span>

          {/* Create Article Button */}
          <button
            onClick={handleCreateArticle}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-800 transition-colors"
          >
            Create Article
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedArticles.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
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
      <div className="space-y-0 border border-gray-200 rounded-lg overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No articles found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search terms</p>
            )}
          </div>
        ) : (
          filteredArticles.map((article, index) => (
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
              <div className="w-16 h-16 mr-4 flex-shrink-0">
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
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {article.body && article.body.length > 50 
                    ? `${article.body.substring(0, 50)}...` 
                    : article.body || 'No content preview available'}
                </p>
              </div>

              {/* Category */}
              <div className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded mr-4">
                {article.category}
              </div>

              {/* Date */}
              <div className="text-gray-500 text-sm mr-4 w-40">
                {formatDate(article.date)}
              </div>

              {/* Open Button */}
              <button
                onClick={() => handleOpenArticle(article._id)}
                className="px-4 py-1 text-primary hover:bg-blue-50 rounded text-sm transition-colors"
              >
                Open
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ArticlesList;