import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Camera,
  Plus
} from "lucide-react";
import { 
  getArticleApi,
  editArticleApi,
  deleteArticleApi,
  uploadImageApi, 
  removeImageApi,
  IArticleEditData 
} from "../../api/Articles.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const categories = [
  "Trauma",
  "Anxiety",
  "Depression", 
  "Relationships",
  "Self-Care",
  "Mental Health"
];

const EditArticle: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Word count
  const wordCount = body.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Check if user is admin
  const isAdmin = role === "admin";

  // Query to fetch article
  const {
    data: articleData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      if (!id) throw new Error("Article ID is required");
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await getArticleApi(id, { 
        signal: controller.signal 
      });
      
      if (!response?.data) {
        throw new Error("No article data received");
      }
      
      return response.data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    enabled: isAdmin && !!id,
  });

  // Set form data when article loads
  useEffect(() => {
    if (articleData) {
      setTitle(articleData.title || "");
      setBody(articleData.body || "");
      setSelectedCategories(articleData.category ? [articleData.category] : []);
      setFeaturedImage(articleData.image || "");
    }
  }, [articleData]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => uploadImageApi(file),
    onSuccess: (response) => {
      if (response?.data) {
        setFeaturedImage(response.data.imageUrl);
        // Refetch article to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ["article", id] });
      }
      setIsUploading(false);
    },
    onError: (error) => {
      console.error("Failed to upload image:", error);
      setIsUploading(false);
    },
  });

  // Remove image mutation
  const removeImageMutation = useMutation({
    mutationFn: (imageUrl: string) => removeImageApi(imageUrl),
    onSuccess: () => {
      setFeaturedImage("");
      // Refetch article to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["article", id] });
    },
    onError: (error) => {
      console.error("Failed to remove image:", error);
    },
  });

  // Edit article mutation
  const editArticleMutation = useMutation({
    mutationFn: ({ id, articleData }: { id: string, articleData: IArticleEditData }) => 
      editArticleApi(id, articleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["article", id] });
      navigate("/library");
    },
    onError: (error) => {
      console.error("Failed to update article:", error);
    },
  });

  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: (articleId: string) => deleteArticleApi(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      navigate("/library");
    },
    onError: (error) => {
      console.error("Failed to delete article:", error);
    },
  });

  // Handle category selection
  const handleCategoryChange = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category]);
    } else {
      setSelectedCategories(prev => prev.filter(cat => cat !== category));
    }
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      uploadImageMutation.mutate(file);
    }
  };

  // Handle image remove
  const handleImageRemove = () => {
    if (featuredImage) {
      removeImageMutation.mutate(featuredImage);
    }
  };

  // Handle publish/update
  const handlePublish = () => {
    if (!id || !title.trim() || !body.trim() || selectedCategories.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    const articleData: IArticleEditData = {
      title: title.trim(),
      body: body.trim(),
      category: selectedCategories[0], // Using first selected category
      status: "published",
      image: featuredImage // Include current image in update
    };

    editArticleMutation.mutate({ id, articleData });
  };

  // Handle delete
  const handleDelete = () => {
    if (!id) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this article? This action cannot be undone.");
    if (confirmed) {
      deleteArticleMutation.mutate(id);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/library");
  };

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">Admin access required to edit articles</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-40 bg-gray-200 animate-pulse"></div>
        <div className="p-6 -mt-6 relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-6">
              <div className="flex-1 bg-white rounded-lg p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-80 space-y-6">
                <div className="bg-white rounded-lg p-4">
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="space-y-3">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-sm">Failed to load article</p>
          <p className="text-red-500 text-xs mt-1">Please check the article ID and try again</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div 
        className="h-40 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 relative overflow-hidden"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23f97316;stop-opacity:1" /><stop offset="50%" style="stop-color:%23ef4444;stop-opacity:1" /><stop offset="100%" style="stop-color:%23ec4899;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="300" fill="url(%23grad)"/></svg>')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50 "></div>
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <h1 className="text-white text-3xl font-bold">Edit Article</h1>
          <p className="text-white text-sm mt-1 opacity-90">
            {articleData?.date ? new Date(articleData.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }) : new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric', 
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 -mt-6 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
            {/* Main Editor */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Title Section */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Title</h2>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter article title..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Editor Notice */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm text-gray-600">This is the classic editor</p>
                </div>

                {/* Editor Toolbar */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                      <option>H1</option>
                      <option>H2</option>
                      <option>H3</option>
                      <option>Paragraph</option>
                    </select>
                    
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Italic className="w-4 h-4" />
                    </button>
                    
                    <div className="w-px h-6 bg-gray-300 mx-2"></div>
                    
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="p-6">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Edit your article content..."
                    className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Word Count */}
                <div className="px-6 pb-6">
                  <p className="text-sm text-gray-500">Word count: {wordCount}</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80">
              {/* Action Buttons */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleteArticleMutation.isPending}
                    className="flex-1 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deleteArticleMutation.isPending ? "Deleting..." : "Delete Article"}
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={editArticleMutation.isPending || !title.trim() || !body.trim() || selectedCategories.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {editArticleMutation.isPending ? "Publishing..." : "Update"}
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => handleCategoryChange(category, e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
                
                {featuredImage ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={featuredImage}
                        alt="Featured"
                        className="w-full h-48 object-cover rounded-lg"
                        key={featuredImage} // Force re-render when image URL changes
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleImageRemove}
                        disabled={removeImageMutation.isPending}
                        className="flex-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                      >
                        {removeImageMutation.isPending ? "Removing..." : "Remove"}
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {isUploading ? "Updating..." : "Update"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div 
                      className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled
                        className="flex-1 px-3 py-2 text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed text-sm"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                      >
                        {isUploading ? "Uploading..." : "Add Image"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditArticle;