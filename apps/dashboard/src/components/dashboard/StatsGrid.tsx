import { TimerIcon, UptrendIcon } from "../../assets/icons";
import { StatCardConfig } from "../../pages/dashboard/types";

const StatsGrid: React.FC<{ stats: StatCardConfig[] }> = ({ stats }) => (
  <div className="max-w-[calc(100vw-48px)]">
    <div className="gap-4 overflow-x-auto overflow-y-hidden flex flex-nowrap">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-white flex p-6 lg:p-4 rounded-lg justify-between grow-0 shrink-0 basis-auto w-[70%] md:w-1/2 lg:w-[calc(33.33%-10px)] shadow-[0px_4px_10px_0px_#00000008] "
        >
          <div>
            <div className="text-sm text-[#B3B3B3]">{s.label}</div>
            <div className="text-2xl font-bold my-3">{s.value}</div>
            <div className="text-xs ">
              {<UptrendIcon className="inline text-[#014CB1] w-4" />} {s.trend}
            </div>
          </div>
          <div className="text-[#014CB1] w-14 h-14 rounded-full bg-[#014CB11A] grid place-items-center self-center">
            <TimerIcon className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default StatsGrid;
