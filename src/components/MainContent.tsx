import React from "react";
import BlockList from "./BlockList";
import WorkspaceArea from "./WorkspaceArea";
import InfoPanel from "./InfoPanel";

const MainContent = () => {
  return (
    <main className="flex-grow flex h-full overflow-hidden">
      {/* Left Column: Available Blocks (33.3%) */}
      <div className="w-1/3 h-full">
        <BlockList />
      </div>

      {/* Middle Column: Workspace (33.3%) */}
      <div className="w-1/3 h-full">
        <WorkspaceArea />
      </div>

      {/* Right Column: Info Panel (33.3%) */}
      <div className="w-1/3 h-full">
        <InfoPanel />
      </div>
    </main>
  );
};

export default MainContent;
