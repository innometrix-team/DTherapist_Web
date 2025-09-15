import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
 
  Camera,
  Plus
} from "lucide-react";
import { 
  createArticleApi, 
  uploadImageApi, 
  removeImageApi,
  IArticleCreateData 
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

const CreateArticle: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  // Word count
  const wordCount = body.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Check if user is admin
  const isAdmin = role === "admin";

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => uploadImageApi(file),
    onSuccess: (response) => {
      if (response?.data) {
        setFeaturedImage(response.data.imageUrl);
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
    },
    onError: (error) => {
      console.error("Failed to remove image:", error);
    },
  });

  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: (articleData: IArticleCreateData) => createArticleApi(articleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      navigate("/library");
    },
    onError: (error) => {
      console.error("Failed to create article:", error);
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

   const handleAddCustomCategory = () => {
     const trimmedCategory = customCategory.trim();
     
     if (!trimmedCategory) {
       return;
     }

     // Check if category already exists (case-insensitive)
     const categoryExists = selectedCategories.some(
       cat => cat.toLowerCase() === trimmedCategory.toLowerCase()
     ) || categories.some(
       cat => cat.toLowerCase() === trimmedCategory.toLowerCase()
     );

     if (categoryExists) {
       alert("This category is already selected or exists in the predefined list.");
       return;
     }

     // Add the custom category to selected categories
     setSelectedCategories(prev => [...prev, trimmedCategory]);
     setCustomCategory(""); // Clear the input
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

  // Handle publish
  const handlePublish = () => {
    if (!title.trim() || !body.trim() || selectedCategories.length === 0) {
      alert("Please fill in all required fields");
      return;
    }

    const articleData: IArticleCreateData = {
      title: title.trim(),
      body: body.trim(),
      category: selectedCategories[0], // Using first selected category
      image: featuredImage,
      status: "published"
    };

    createArticleMutation.mutate(articleData);
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
          <p className="text-yellow-500 text-xs mt-1">Admin access required to create articles</p>
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
          <h1 className="text-white text-3xl font-bold">Create Article</h1>
          <p className="text-white text-sm mt-1 opacity-90">
            {new Date().toLocaleDateString('en-US', {
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

                {/* Editor Toolbar */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    
                    
                   
                  </div>
                </div>

                {/* Editor Content */}
                <div className="p-6">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Start writing your article..."
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
                    onClick={handleBack}
                    className="flex-1 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={createArticleMutation.isPending || !title.trim() || !body.trim() || selectedCategories.length === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {createArticleMutation.isPending ? "Publishing..." : "Publish"}
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

                  {/* Custom Category Input */}
                  <div className="flex mt-2">
                    <input 
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    </div>
                    <button
                      onClick={handleAddCustomCategory}
                      disabled={!customCategory.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Category
                    </button>
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

export default CreateArticle;