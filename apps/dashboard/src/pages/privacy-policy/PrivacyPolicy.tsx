import { policyContent } from "../../constants/policies.constants";

const PrivacyPolicy: React.FC = () => {

   const { updatedAt, headerImage, sections } = policyContent;

  return (
    <div className="p-4 md:p-8 w-full">
      {/* Header */}
      <div className="relative w-full h-40 md:h-52 rounded-xl overflow-hidden mb-6">
        <img
          src={headerImage}
          alt="Privacy Banner"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6 md:px-10 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-sm md:text-base text-gray-200 mt-1">Last Updated: {updatedAt}</p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white shadow rounded-xl p-4 md:p-8 space-y-6">
        {sections.map((section, index) => (
          <div key={index}>
            <h2 className="text-lg md:text-xl font-semibold mb-2">{section.title}</h2>
            <p className="text-gray-700 leading-7 text-sm md:text-base whitespace-pre-line">
              {section.body.trim()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
