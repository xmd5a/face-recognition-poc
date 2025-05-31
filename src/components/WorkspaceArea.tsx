import BlockList from "./BlockList";
import type { Block } from "./BlockList";

interface WorkspaceAreaProps {
  workspace: Block[];
  onWorkspaceChange: (blocks: Block[]) => void;
  maxBlocks: number;
  selectedBlockId: string | null;
  selectedIndex: number;
}

const WorkspaceArea = ({
  workspace,
  onWorkspaceChange,
  maxBlocks,
  selectedBlockId,
  selectedIndex,
}: WorkspaceAreaProps) => {
  return (
    <div className="h-full relative">
      {workspace.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-terminal-green/20 text-lg pointer-events-none">
          Drop blocks here ({maxBlocks} max)
        </div>
      )}
      <BlockList
        blocks={workspace}
        selectedBlockId={selectedBlockId}
        selectedIndex={selectedIndex}
        onBlockSelect={() => {}}
        onBlockMove={(block) => {
          onWorkspaceChange(workspace.filter((b) => b.id !== block.id));
        }}
      />
    </div>
  );
};

export default WorkspaceArea;
