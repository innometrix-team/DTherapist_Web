// /components/Settings/ProfileForm.tsx
import React, { useState } from "react";
import { ProfileDetails } from "../../types/settings.types";
import { genderOptions } from "../../constant/settings.constants";
import { FaTrash } from "react-icons/fa";
import { CameraIcon } from "../../assets/icons"

const ProfileForm: React.FC = () => {
  const [form, setForm] = useState<ProfileDetails>({
    fullName: "",
    email: "",
    profile: "",
    specialization: "",
    yearsOfExperience: 0,
    phoneNumber: "",
    country: "",
    gender: "Male",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Profile Details:", form);
    console.log("Profile Image:", profileImage);
  };

  const inputStyle = "w-full max-w-full md:max-w-md px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary";
  const formGroupStyle = "flex flex-col md:flex-row md:items-center gap-2 md:gap-4";
  const labelStyle = "w-full md:w-48 font-medium";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 md:p-6 space-y-6 w-full"
    >
      <h2 className="text-xl font-semibold text-gray-800">Profile Details</h2>

      <div className="space-y-2">
        <label className="block font-medium text-gray-700">Profile Image</label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
            {profileImage ? (
              <img
                src={URL.createObjectURL(profileImage)}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <CameraIcon className="text-gray-400 w-8 h-8" />
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="cursor-pointer text-blue-600 font-medium">
              Update Image
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {profileImage && (
              <button
                type="button"
                onClick={removeImage}
                className="text-red-600 font-medium inline-flex items-center gap-1"
              >
                <FaTrash className="w-4 h-4" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form fields */}
      {[
        { label: "Full Name", name: "fullName", type: "text" },
        { label: "Email", name: "email", type: "text" },
        { label: "Phone Number", name: "phoneNumber", type: "text" },
        { label: "Area of Specialization", name: "specialization", type: "text" },
        { label: "Years of Experience", name: "yearsOfExperience", type: "number" },
        { label: "Country", name: "country", type: "text" },
      ].map(({ label, name, type }) => (
        <div key={name} className={formGroupStyle}>
          <label htmlFor={name} className={labelStyle}>{label}</label>
          <input
            id={name}
            name={name}
            type={type}
            placeholder={`Enter ${label.toLowerCase()}`}
            value={form[name as keyof ProfileDetails]}
            onChange={handleChange}
            className={inputStyle}
          />
        </div>
      ))}

      <div className={formGroupStyle}>
        <label htmlFor="profile" className={labelStyle}>Profile</label>
        <textarea
          id="profile"
          name="profile"
          placeholder="Describe your profile"
          value={form.profile}
          onChange={handleChange}
          className={`${inputStyle} resize-none`}
          rows={4}
        />
      </div>

      <div className={formGroupStyle}>
        <label htmlFor="gender" className={labelStyle}>Gender</label>
        <select
          id="gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className={inputStyle}
        >
          {genderOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="bg-primary hover:bg-blue-700 text-white font-medium px-6 py-2 rounded w-full md:w-auto"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
