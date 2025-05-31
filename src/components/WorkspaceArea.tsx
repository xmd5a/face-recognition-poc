import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "./BlockList";
import type { BlockToMoveInfo, GhostTargetInfo } from "./Game";

interface WorkspaceBlockItemProps {
  block: Block;
  isSelected: boolean;
  isKeyboardHighlighted: boolean;
  isMarkedForMove: boolean;
  onSelect: (blockId: string | null) => void;
}

const WorkspaceBlockItem = ({
  block,
  isSelected,
  isKeyboardHighlighted,
  isMarkedForMove,
  onSelect,
}: WorkspaceBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  let blockClass = "block-base";
  if (isMarkedForMove) {
    blockClass = "block-marked-for-move";
  } else if (isKeyboardHighlighted) {
    blockClass = "block-selected";
  } else if (isSelected) {
    blockClass = "block-selected";
  }

  return (
    <div
      ref={draggableRef}
      style={style}
      className={`
        p-3 rounded cursor-move transition-all relative
        ${isDragging ? "opacity-50 z-50 shadow-lg" : "opacity-100"}
        ${blockClass}
      `}
      onClick={() => onSelect(block.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(block.id);
        }
      }}
      aria-selected={isSelected || isKeyboardHighlighted}
      {...attributes}
      {...listeners}
    >
      <div className="font-mono terminal-text">{block.name}</div>
    </div>
  );
};

interface PlaceholderProps {
  index: number;
  isActive: boolean;
  isGhostDropTarget: boolean;
}

const Placeholder = ({
  index,
  isActive,
  isGhostDropTarget,
}: PlaceholderProps) => {
  const { setNodeRef } = useDroppable({
    id: `placeholder-${index}`,
  });

  let borderColor = "border-green-400/20";
  let bgColor = "bg-transparent";

  if (isActive) {
    borderColor = "border-green-400/50";
    bgColor = "bg-green-400/10";
  }
  if (isGhostDropTarget) {
    borderColor = "border-yellow-400/70";
    bgColor = "bg-yellow-500/10";
  }

  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded cursor-move transition-all relative border-2 border-dashed ${borderColor} ${bgColor}`}
    >
      <div className="font-mono terminal-text opacity-0">placeholder</div>
    </div>
  );
};

interface WorkspaceAreaProps {
  workspace: (Block | null)[];
  maxBlocks: number;
  selectedBlockId: string | null;
  selectedIndex: number;
  isKeyboardModeActive: boolean;
  activeColumn: string;
  activeDroppableId: string | null;
  onSelectBlock: (blockId: string | null) => void;
  blockToMoveInfo: BlockToMoveInfo | null;
  ghostTargetInfo: GhostTargetInfo | null;
}

const WorkspaceArea = ({
  workspace,
  maxBlocks,
  selectedBlockId,
  selectedIndex,
  isKeyboardModeActive,
  activeColumn,
  activeDroppableId,
  onSelectBlock,
  blockToMoveInfo,
  ghostTargetInfo,
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

            const isCurrentSlotGhostTargetForPlaceholder =
              ghostTargetInfo?.targetColumn === "workspace" &&
              ghostTargetInfo?.targetIndex === index &&
              ghostTargetInfo?.isTargetPlaceholder;

            const isCurrentSlotGhostTargetForBlock =
              ghostTargetInfo?.targetColumn === "workspace" &&
              ghostTargetInfo?.targetIndex === index &&
              !ghostTargetInfo?.isTargetPlaceholder;

            if (isCurrentSlotGhostTargetForPlaceholder && blockToMoveInfo) {
              return (
                <div
                  key={`ghost-over-placeholder-${index}`}
                  className="relative m-1 p-3 rounded border-2 border-dashed border-yellow-400/70 bg-yellow-500/10 z-10 flex items-center justify-center"
                >
                  <div className="font-mono terminal-text opacity-70">
                    {blockToMoveInfo.sourceData.name}
                  </div>
                </div>
              );
            }

            if (blockInSlot) {
              const isSelected =
                blockInSlot.id === selectedBlockId && !blockToMoveInfo;
              const isKeyboardHighlighted =
                activeColumn === "workspace" &&
                isKeyboardModeActive &&
                index === selectedIndex &&
                !blockToMoveInfo;

              const isMarked =
                blockToMoveInfo?.id === blockInSlot.id &&
                blockToMoveInfo?.sourceColumn === "workspace" &&
                activeColumn === "workspace";

              return (
                <div key={blockInSlot.id} className="relative">
                  {isCurrentSlotGhostTargetForBlock && blockToMoveInfo && (
                    <div className="absolute inset-0 m-1 p-3 rounded border-2 border-dashed border-yellow-400/70 bg-yellow-500/10 z-20 flex items-center justify-center pointer-events-none">
                      <div className="font-mono terminal-text opacity-70">
                        {blockToMoveInfo.sourceData.name}
                      </div>
                    </div>
                  )}
                  <WorkspaceBlockItem
                    block={blockInSlot}
                    isSelected={isSelected && !isMarked}
                    isKeyboardHighlighted={isKeyboardHighlighted && !isMarked}
                    isMarkedForMove={isMarked}
                    onSelect={onSelectBlock}
                  />
                </div>
              );
            }
            return (
              <Placeholder
                key={`placeholder-${index}`}
                index={index}
                isActive={activeDroppableId === `placeholder-${index}`}
                isGhostDropTarget={
                  isCurrentSlotGhostTargetForPlaceholder ?? false
                }
              />
            );
          })}
          {workspace.filter(Boolean).length === 0 && !ghostTargetInfo && (
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
