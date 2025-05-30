import { useState, useCallback } from "react";
import GameLayout from "./GameLayout";
import BlockList, { type Block } from "./BlockList";
import WorkspaceArea from "./WorkspaceArea";
import InfoPanel from "./InfoPanel";

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

  return (
    <GameLayout isCompiling={isCompiling}>
      <div className="h-full flex flex-col">
        <div className="flex-1 grid grid-cols-3 gap-4">
          {/* Available Blocks */}
          <BlockList
            blocks={availableBlocks}
            selectedBlockId={selectedBlock?.id ?? null}
            onBlockSelect={handleBlockSelect}
          />

          {/* Workspace */}
          <WorkspaceArea
            workspace={workspace}
            onWorkspaceChange={handleWorkspaceChange}
            maxBlocks={maxBlocks}
          />

          {/* Info Panel */}
          <InfoPanel selectedBlock={selectedBlock} hint={hint} />
        </div>

        {/* Compile Button */}
        <button
          onClick={handleCompile}
          disabled={workspace.length < maxBlocks || isCompiling}
          className={`
            mt-4 w-full py-3 px-6 rounded-lg font-mono
            ${
              workspace.length < maxBlocks || isCompiling
                ? "bg-black/30 text-green-500/50 cursor-not-allowed"
                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            }
            transition-colors
          `}
        >
          {isCompiling
            ? "Compiling..."
            : workspace.length < maxBlocks
            ? `Need ${maxBlocks - workspace.length} more blocks`
            : "Compile"}
        </button>
      </div>
    </GameLayout>
  );
};

export default Game;
