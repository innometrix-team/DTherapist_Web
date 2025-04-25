// /components/Settings/ProfileForm.tsx
import React, { useState } from "react";
import { ProfileDetails } from "../../types/settings.types";
import { genderOptions } from "../../constant/settings.constants";
import { FaCloudUploadAlt, FaTrash } from "react-icons/fa";

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
  

  const inputStyle = "max-w-md w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none";
  const formGroupStyle = "flex items-center gap-4";
  const labelStyle = "w-48 font-medium ";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-2 space-y-6"
    >
      <h2 className="text-xl font-semibold">Profile Details</h2>

      <div className="space-y-2">
        <label className="block font-medium">Profile Image</label>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
            {profileImage ? (
              <img
                src={URL.createObjectURL(profileImage)}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaCloudUploadAlt className="text-gray-400 w-8 h-8" />
            )}
          </div>
          <div className="space-x-2">
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
            value={(form as any)[name]}
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
            <option key={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="bg-Dblue hover:bg-blue-700 text-white font-medium px-6 py-2 rounded"
        >
          Update
        </button>
      </div>
    </form>
  );
};
export default ProfileForm;
