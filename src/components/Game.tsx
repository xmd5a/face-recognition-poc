import { useState, useCallback } from "react";
import GameLayout from "./GameLayout";
import BlockList, { type Block } from "./BlockList";
import WorkspaceArea from "./WorkspaceArea";
import InfoPanel from "./InfoPanel";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";

interface GameProps {
  availableBlocks: Block[];
  maxBlocks: number;
  hint: string;
}

const Game = ({ availableBlocks, maxBlocks, hint }: GameProps) => {
  const [workspace, setWorkspace] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  const handleBlockSelect = useCallback((block: Block) => {
    setSelectedBlock(block);
  }, []);

  const handleWorkspaceChange = useCallback((newWorkspace: Block[]) => {
    setWorkspace(newWorkspace);
  }, []);

  const handleCompile = useCallback(() => {
    if (workspace.length < maxBlocks) return;

    setIsCompiling(true);
    // Simulate compilation process
    setTimeout(() => {
      setIsCompiling(false);
    }, 3000);
  }, [workspace.length, maxBlocks]);

  const { activeColumn, selectedIndex } = useKeyboardNavigation({
    availableBlocks,
    workspace,
    onBlockSelect: handleBlockSelect,
    onWorkspaceChange: handleWorkspaceChange,
    onCompile: handleCompile,
  });

  return (
    <GameLayout isCompiling={isCompiling}>
      <div className="h-full flex flex-col">
        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-12 gap-6 p-6">
          {/* Available Blocks - Left Column (30%) */}
          <div className="col-span-4">
            <BlockList
              blocks={availableBlocks}
              selectedBlockId={
                activeColumn === "blocks"
                  ? availableBlocks[selectedIndex]?.id ?? null
                  : selectedBlock?.id ?? null
              }
              onBlockSelect={handleBlockSelect}
            />
          </div>

          {/* Workspace - Middle Column (30%) */}
          <div className="col-span-4">
            <WorkspaceArea
              workspace={workspace}
              onWorkspaceChange={handleWorkspaceChange}
              maxBlocks={maxBlocks}
              activeIndex={activeColumn === "workspace" ? selectedIndex : -1}
            />
          </div>

          {/* Info Panel - Right Column (30%) */}
          <div className="col-span-4">
            <InfoPanel
              selectedBlock={
                activeColumn === "blocks"
                  ? availableBlocks[selectedIndex] ?? null
                  : activeColumn === "workspace"
                  ? workspace[selectedIndex] ?? null
                  : selectedBlock
              }
              hint={hint}
            />
          </div>
        </div>

        {/* Compile Button */}
        <div className="px-6 pb-6">
          <button
            onClick={handleCompile}
            disabled={workspace.length < maxBlocks || isCompiling}
            className={`
              w-full py-4 px-6 rounded-lg font-mono text-lg
              border-2 transition-all duration-200
              ${
                workspace.length < maxBlocks || isCompiling
                  ? "bg-black/30 text-green-500/50 border-green-500/20 cursor-not-allowed"
                  : "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30 hover:border-green-500/60 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              }
            `}
          >
            {isCompiling
              ? "Compiling..."
              : workspace.length < maxBlocks
              ? `Need ${maxBlocks - workspace.length} more blocks`
              : "Compile"}
          </button>
        </div>
      </div>
    </GameLayout>
  );
};

export default Game;
