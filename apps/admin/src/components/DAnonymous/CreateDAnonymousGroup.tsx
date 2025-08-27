import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Camera,
  Plus,
  Users
} from "lucide-react";
import { 
  createDAnonymousGroupApi,
  uploadDAnonymousGroupImageApi,
  IDAnonymousGroupCreateData 
} from "../../api/DAnonymous.api";
import { useAuthStore } from "../../Store/auth/useAuthStore";

const CreateDAnonymousGroup: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string>(""); // For preview
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For API upload
  const [isCreating, setIsCreating] = useState(false);

  // Check if user is admin
  const isAdmin = role === "admin";

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: ({ groupId, file }: { groupId: string; file: File }) => 
      uploadDAnonymousGroupImageApi(groupId, file),
    onError: (error) => {
      console.error("Failed to upload image:", error);
      showToast("Failed to upload image, but group was created", 'error');
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (groupData: IDAnonymousGroupCreateData) => createDAnonymousGroupApi(groupData),
    onSuccess: async (response) => {
      try {
        if (response?.data && selectedFile) {
          // If we have an image, upload it after group creation
          await uploadImageMutation.mutateAsync({ 
            groupId: response.data._id, 
            file: selectedFile 
          });
          showToast("Group created successfully with image!");
        } else {
          showToast("Group created successfully!");
        }
        
        queryClient.invalidateQueries({ queryKey: ["danonymous-groups"] });
        
        // Navigate back to groups list after a short delay
        setTimeout(() => {
          navigate("/danonymous");
        }, 1500);
        
      } catch (imageError) {
        console.error("Image upload failed, but group was created:", imageError);
        showToast("Group created, but image upload failed", 'error');
        
        // Still navigate back even if image failed
        setTimeout(() => {
          navigate("/danonymous");
        }, 2000);
      } finally {
        setIsCreating(false);
      }
    },
    onError: (error) => {
      console.error("Failed to create group:", error);
      showToast("Failed to create group", 'error');
      setIsCreating(false);
    },
  });

  // Handle image selection - Store both preview and file
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Store the file for upload
      setSelectedFile(file);
      
      // Create preview using FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFeaturedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image remove
  const handleImageRemove = () => {
    setFeaturedImage("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle create group
  const handleCreateGroup = () => {
    if (!name.trim() || !description.trim()) {
      showToast("Please fill in all required fields", 'error');
      return;
    }

    setIsCreating(true);

    // Create group data without image - image will be uploaded separately if provided
    const groupData: IDAnonymousGroupCreateData = {
      name: name.trim(),
      description: description.trim(),
      // Don't include image in create data since it will be uploaded separately
    };

    createGroupMutation.mutate(groupData);
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/danonymous");
  };

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-yellow-600 text-sm">Access Denied</p>
          <p className="text-yellow-500 text-xs mt-1">Admin access required to create groups</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div 
        className="h-40 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 relative overflow-hidden"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23a855f7;stop-opacity:1" /><stop offset="50%" style="stop-color:%23ec4899;stop-opacity:1" /><stop offset="100%" style="stop-color:%23ef4444;stop-opacity:1" /></linearGradient></defs><rect width="1200" height="300" fill="url(%23grad)"/></svg>')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col justify-center h-full px-6">
          <h1 className="text-white text-3xl font-bold">Create Support Group</h1>
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
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-6">
            {/* Main Form */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Group Name Section */}
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold mb-4">Group Name *</h2>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description Section */}
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Description *</h2>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the purpose and goals of this support group..."
                    rows={8}
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Characters: {description.length}
                  </p>
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
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={isCreating || !name.trim() || !description.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </div>

              {/* Group Preview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Preview</h3>
                
                {/* Preview Card */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Preview Image */}
                  <div className="relative h-32">
                    {featuredImage ? (
                      <img
                        src={featuredImage}
                        alt="Group preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                        <Users className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Preview Info */}
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {name || "Group Name"}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {description || "Group description will appear here..."}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Users className="w-4 h-4 mr-1" />
                      <span>0 members</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Image */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4">Group Image</h3>
                
                {featuredImage ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={featuredImage}
                        alt="Group image"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleImageRemove}
                        disabled={isCreating}
                        className="flex-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCreating}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div 
                      className={`w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center transition-colors ${
                        isCreating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
                      }`}
                      onClick={() => !isCreating && fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                      <Plus className="w-6 h-6 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Click to add image</p>
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
                        disabled={isCreating}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Image
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
                  disabled={isCreating}
                  className="hidden"
                />

                {/* Image Guidelines */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Image Guidelines</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Recommended size: 400x300px</li>
                    <li>• Max file size: 5MB</li>
                    <li>• Formats: JPG, PNG, WebP</li>
                    <li>• Choose welcoming, supportive imagery</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDAnonymousGroup;