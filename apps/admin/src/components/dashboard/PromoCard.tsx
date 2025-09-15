import { useMemo } from "react";
import { PromoConfig } from "../../pages/Dashboard/types";
import { CounselorIcon } from "../../assets/icons";

const PromoCard: React.FC<PromoConfig> = ({ title, ctaLabel }) => {
  const formattedTitle = useMemo(() => {
    const wordsArray = title.trim().split(/\s+/);

    if (wordsArray.length < 2) {
      return <h2 className="text-xl lg:text-2xl font-bold">{title}</h2>;
    }
    const last = wordsArray.pop()!;
    const main = wordsArray.join(" ");

    return (
      <h2 className="text-xl lg:text-2xl leading-6 font-bold">
        {main} <span className="text-success">{last}</span>
      </h2>
    );
  }, [title]);

  return (
    <div className="bg-white rounded-lg flex justify-between items-center col-span-2 lg:pr-16">
      <div className="p-6">
        {formattedTitle}
        

        <button className="mt-3 text-[#716D6D] text-xs inline-flex bg-[#F7F7F8] px-4 py-3 rounded-lg">
          {ctaLabel} <CounselorIcon className="ml-2" />
        </button>
      </div>
      <div className="h-38 lg:h-full aspect-[140/154] relative">
        <img
          src="/images/promo-illustration1.png"
          alt=""
          className=" h-full object-fit-cover absolute left-7 top-0 opacity-100 hidden lg:block"
        />
       
      </div>
    </div>
  );
};

export default PromoCard;
