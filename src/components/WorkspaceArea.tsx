import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "./BlockList";
import type { BlockToMoveInfo, GhostTargetInfo } from "./Game";

interface WorkspaceBlockItemProps {
  block: Block;
  isSelected: boolean;
  isKeyboardHighlighted: boolean;
  isMarkedForMove: boolean;
  isGhostDropTarget: boolean;
  onSelect: (blockId: string | null) => void;
}

const WorkspaceBlockItem = ({
  block,
  isSelected,
  isKeyboardHighlighted,
  isMarkedForMove,
  isGhostDropTarget,
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

  const combinedClasses = `
    p-3 rounded cursor-move transition-all relative
    ${isDragging ? "opacity-50 z-50 shadow-lg" : "opacity-100"}
    ${blockClass}
    ${isGhostDropTarget ? "ghost-drop-target" : ""}
  `;

  return (
    <div
      ref={draggableRef}
      style={style}
      className={combinedClasses.trim()}
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
  ghostBlockData: Block | null;
}

const Placeholder = ({
  index,
  isActive,
  isGhostDropTarget,
  ghostBlockData,
}: PlaceholderProps) => {
  const { setNodeRef } = useDroppable({
    id: `placeholder-${index}`,
  });

  let currentBorderColor = "border-green-400/20";
  let currentBgColor = "bg-transparent";

  if (isActive && !isGhostDropTarget) {
    currentBorderColor = "border-green-400/50";
    currentBgColor = "bg-green-400/10";
  }

  return (
    <div
      ref={setNodeRef}
      className={`p-3 rounded cursor-default transition-all relative border-2 border-dashed 
                  ${
                    isGhostDropTarget
                      ? "ghost-drop-target"
                      : currentBorderColor + " " + currentBgColor
                  }
                  h-[60px] flex items-center justify-center`}
    >
      {isGhostDropTarget && ghostBlockData ? (
        <div className="font-mono terminal-text opacity-70">
          {ghostBlockData.name}
        </div>
      ) : (
        <div className="font-mono terminal-text opacity-30">placeholder</div>
      )}
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

            const isGhostTargetForPlaceholderHere =
              ghostTargetInfo?.targetColumn === "workspace" &&
              ghostTargetInfo?.targetIndex === index &&
              ghostTargetInfo?.isTargetPlaceholder;

            const isGhostTargetForBlockHere =
              ghostTargetInfo?.targetColumn === "workspace" &&
              ghostTargetInfo?.targetIndex === index &&
              !ghostTargetInfo?.isTargetPlaceholder;

            const ghostDataForDisplay = blockToMoveInfo?.sourceData || null;

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
                blockToMoveInfo?.sourceColumn === "workspace";

              return (
                <div key={blockInSlot.id} className="relative">
                  {isGhostTargetForBlockHere && ghostDataForDisplay && (
                    <div className="block-ghost-preview">
                      <div className="font-mono terminal-text">
                        {ghostDataForDisplay.name}
                      </div>
                    </div>
                  )}
                  <WorkspaceBlockItem
                    block={blockInSlot}
                    isSelected={isSelected && !isMarked}
                    isKeyboardHighlighted={isKeyboardHighlighted && !isMarked}
                    isMarkedForMove={isMarked}
                    isGhostDropTarget={isGhostTargetForBlockHere ?? false}
                    onSelect={onSelectBlock}
                  />
                </div>
              );
            }
            return (
              <Placeholder
                key={`placeholder-${index}`}
                index={index}
                isActive={
                  activeDroppableId === `placeholder-${index}` &&
                  !isGhostTargetForPlaceholderHere
                }
                isGhostDropTarget={isGhostTargetForPlaceholderHere ?? false}
                ghostBlockData={
                  isGhostTargetForPlaceholderHere ? ghostDataForDisplay : null
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
