import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Plus, X, Users } from "lucide-react";
import { 
  editDAnonymousGroupApi,
  uploadDAnonymousGroupImageApi,
  IDAnonymousGroup,
  IDAnonymousGroupEditData 
} from "../../api/DAnonymous.api";

interface EditDAnonymousGroupModalProps {
  group: IDAnonymousGroup;
  onClose: () => void;
}

const EditDAnonymousGroupModal: React.FC<EditDAnonymousGroupModalProps> = ({ group, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [featuredImage, setFeaturedImage] = useState<string>(group.image || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Toast notification function
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
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
      showToast("Failed to upload image, but group was updated", 'error');
    },
  });

  // Edit group mutation
  const editGroupMutation = useMutation({
    mutationFn: ({ groupId, groupData }: { groupId: string; groupData: IDAnonymousGroupEditData }) => 
      editDAnonymousGroupApi(groupId, groupData),
    onSuccess: async () => {
      try {
        if (selectedFile) {
          // If we have a new image, upload it after group update
          await uploadImageMutation.mutateAsync({ 
            groupId: group._id, 
            file: selectedFile 
          });
          showToast("Group updated successfully with new image!");
        } else {
          showToast("Group updated successfully!");
        }
        
        queryClient.invalidateQueries({ queryKey: ["danonymous-groups"] });
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
        
      } catch (imageError) {
        console.error("Image upload failed, but group was updated:", imageError);
        showToast("Group updated, but image upload failed", 'error');
        
        // Still close modal even if image failed
        setTimeout(() => {
          onClose();
        }, 2000);
      } finally {
        setIsUpdating(false);
      }
    },
    onError: (error) => {
      console.error("Failed to update group:", error);
      showToast("Failed to update group", 'error');
      setIsUpdating(false);
    },
  });

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
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

  // Handle update group
  const handleUpdateGroup = () => {
    if (!name.trim() || !description.trim()) {
      showToast("Please fill in all required fields", 'error');
      return;
    }

    setIsUpdating(true);

    const groupData: IDAnonymousGroupEditData = {
      name: name.trim(),
      description: description.trim(),
    };

    editGroupMutation.mutate({ groupId: group._id, groupData });
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUpdating) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isUpdating]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Support Group</h2>
            <p className="text-sm text-gray-500 mt-1">Update group information and image</p>
          </div>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Main Form */}
            <div className="flex-1 space-y-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUpdating}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose and goals of this support group..."
                  rows={8}
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isUpdating}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Characters: {description.length}
                </p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 space-y-6">
              {/* Preview */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                  
                  <div className="p-3">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {name || "Group Name"}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {description || "Group description will appear here..."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Group Image */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Group Image</h3>
                
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
                        disabled={isUpdating}
                        className="flex-1 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUpdating}
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
                        isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
                      }`}
                      onClick={() => !isUpdating && fileInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                      <Plus className="w-6 h-6 text-gray-400" />
                      <p className="text-sm text-gray-500 mt-2">Click to add image</p>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={isUpdating}
                  className="hidden"
                />

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Image Guidelines</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Recommended size: 400x300px</li>
                    <li>• Max file size: 5MB</li>
                    <li>• Formats: JPG, PNG, WebP</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateGroup}
            disabled={isUpdating || !name.trim() || !description.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUpdating ? "Updating..." : "Update Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDAnonymousGroupModal;