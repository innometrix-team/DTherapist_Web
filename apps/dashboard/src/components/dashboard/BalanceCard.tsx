import { BalanceConfig } from "../../pages/dashboard/types";
import { TopUpIcon, WithdrawIcon, TimerIcon } from "../../assets/icons";

const BalanceCard: React.FC<BalanceConfig> = ({ amount, actions }) => (
  <div className="bg-primary px-6 py-7 rounded-lg text-white bg-[url(/src/assets/images/bg-balance.png)] relative">
    <div className="space-y-3">
      <div className=" font-light">Current Balance</div>
      <div className="text-2xl font-bold">{amount}</div>

      <div className="space-x-4">
        {actions.includes("topUp") && (
          <button className="bg-success border border-success px-5 py-2 rounded-lg text-xs inline-flex items-center space-x-2 font-bold">
            <TopUpIcon />
            <span>Top-up</span>
          </button>
        )}
        {actions.includes("withdraw") && (
          <button className="border border-white px-5 py-2 rounded-lg text-xs inline-flex items-center space-x-2 font-bold">
            <WithdrawIcon />
            <span>Withdraw</span>
          </button>
        )}
      </div>
    </div>
    <div className="absolute top-1/2 transform -translate-y-1/2 right-4 w-12 h-12 bg-[#E2EBF61A] grid place-items-center rounded-full">
      <TimerIcon className="h-6 w-6" />
    </div>
  </div>
);

export default BalanceCard;
