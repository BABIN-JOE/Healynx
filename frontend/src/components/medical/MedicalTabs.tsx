import { useState } from "react";
import { Button } from "../ui/button";

interface Tab {
  key: string;
  label: string;
}

interface Props {
  tabs: Tab[];
  children: (activeKey: string) => React.ReactNode;
}

export default function MedicalTabs({ tabs, children }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key);

  return (
    <div className="bg-white border rounded-lg p-6">
      {/* TAB HEADERS */}
      <div className="flex flex-wrap gap-2 border-b pb-4 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div>{children(activeTab)}</div>
    </div>
  );
}
