type Tab = string;

type TabsNavProps = {
  tabs: Tab[];
  className?: string;
  onClick: (name: Tab, index: number) => void;
  activeTabIndex?: number;
  renderTab?: (name: Tab) => React.ReactNode;
};

export default function TabsNav({ tabs, className, onClick, activeTabIndex, renderTab = (caption) => caption }: TabsNavProps) {
  return (
    <nav className="noprint tw-flex tw-w-full" aria-label="Tabs">
      <ul className={`tw-flex tw-w-full tw-list-none sm:tw-space-x-4 ${className} tw-border-b tw-border-main tw-border-opacity-20`}>
        {tabs.map((tab, index) => (
          <li key={tab}>
            <button
              type="button"
              onClick={() => {
                onClick(tab, index);
              }}
              className={[
                activeTabIndex === index ? "tw-bg-main/10 tw-text-black" : "tw-hover:text-gray-700 tw-text-main",
                "tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-font-medium",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={activeTabIndex ? "page" : undefined}
            >
              {renderTab(tab)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
