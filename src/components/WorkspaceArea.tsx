import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "./BlockList"; // Assuming BlockList exports BlockItemProps or similar

// Re-define BlockItem or import if BlockList exports it and its props
// For now, let's define a simplified version here for clarity
interface WorkspaceBlockItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
  // isCurrentlyDragging is now managed internally by useDraggable
}

const WorkspaceBlockItem = ({
  block,
  isSelected,
  onSelect,
}: WorkspaceBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    transform,
    isDragging, // isDragging state from useDraggable
  } = useDraggable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    // transition can be added here if needed, or handled globally
  };

  return (
    <div
      ref={draggableRef}
      style={style}
      className={`
        p-3 rounded cursor-move transition-all relative
        ${isDragging ? "opacity-50 z-50 shadow-lg" : "opacity-100"}
        ${isSelected ? "block-selected" : "block-base"}
      `}
      onClick={() => onSelect(block.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(block.id);
        }
      }}
      aria-selected={isSelected}
      {...attributes}
      {...listeners}
    >
      <div className="font-mono terminal-text">{block.name}</div>
    </div>
  );
};

interface WorkspaceAreaProps {
  workspace: (Block | null)[];
  maxBlocks: number;
  selectedBlockId: string | null;
  activeDroppableId: string | null;
  onSelectBlock: (blockId: string | null) => void;
}

interface PlaceholderProps {
  index: number;
  isActive: boolean;
}

const Placeholder = ({ index, isActive }: PlaceholderProps) => {
  const { setNodeRef } = useDroppable({
    id: `placeholder-${index}`,
  });
  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded cursor-move transition-all relative border-2 border-dashed ${
        isActive
          ? "border-green-400/50 bg-green-400/10"
          : "border-green-400/20 bg-transparent"
      }`}
    >
      <div className="font-mono terminal-text opacity-0">placeholder</div>
    </div>
  );
};

const WorkspaceArea = ({
  workspace,
  maxBlocks,
  selectedBlockId,
  activeDroppableId,
  onSelectBlock,
}: WorkspaceAreaProps) => {
  const { setNodeRef: workspaceDroppableRef } = useDroppable({
    id: "workspace",
  });

  return (
    <div ref={workspaceDroppableRef} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {Array.from({ length: maxBlocks }).map((_, index) => {
            const blockInSlot = workspace[index];
            if (blockInSlot) {
              return (
                <WorkspaceBlockItem
                  key={blockInSlot.id}
                  block={blockInSlot}
                  isSelected={blockInSlot.id === selectedBlockId}
                  onSelect={onSelectBlock}
                />
              );
            }
            return (
              <Placeholder
                key={`placeholder-${index}`}
                index={index}
                isActive={activeDroppableId === `placeholder-${index}`}
              />
            );
          })}
          {workspace.filter(Boolean).length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-terminal-green/20 text-lg pointer-events-none">
              Drop blocks here ({maxBlocks} max)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceArea;
