type Tab = string;

type TabsNavProps = {
  tabs: Tab[];
  className?: string;
  onClick: (name: Tab, index: number) => void;
  activeTabIndex?: number;
};

export default function TabsNav({ tabs, className, onClick, activeTabIndex }: TabsNavProps) {
  return (
    <nav className={`noprint tw-flex tw-w-full sm:tw-space-x-4 ${className} tw-border-b tw-border-main tw-border-opacity-20`} aria-label="Tabs">
      {tabs.map((tab, index) => (
        <button
          type="button"
          key={tab}
          onClick={() => {
            onClick(tab, index);
          }}
          className={[
            activeTabIndex === index ? 'tw-bg-main/10 tw-text-black' : 'tw-hover:text-gray-700 tw-text-main',
            'tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-font-medium',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-current={activeTabIndex ? 'page' : undefined}>
          {tab}
        </button>
      ))}
    </nav>
  );
}
