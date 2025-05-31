import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "./BlockList";
import type { BlockToMoveInfo, GhostTargetInfo } from "./Game";

interface WorkspaceBlockItemProps {
  block: Block;
  slotIndex: number;
  isSelected: boolean;
  isKeyboardHighlighted: boolean;
  isKeyboardModeActive: boolean;
  isMarkedForMove: boolean;
  isGhostDropTarget: boolean;
  isDndDropTarget?: boolean;
  onSelect: (blockId: string | null) => void;
}

const WorkspaceBlockItem = ({
  block,
  slotIndex,
  isSelected,
  isKeyboardHighlighted,
  isKeyboardModeActive,
  isMarkedForMove,
  isGhostDropTarget,
  isDndDropTarget,
  onSelect,
}: WorkspaceBlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef: draggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `workspace-block-${block.id}-${slotIndex}`,
    data: {
      type: "workspace-block",
      block: block,
    },
  });

  const { setNodeRef: droppableRef, isOver } = useDroppable({
    id: `workspace-block-droptarget-${block.id}-${slotIndex}`,
    data: {
      type: "workspace-block-droppable",
      blockId: block.id,
      index: slotIndex,
    },
  });

  const setCombinedNodeRef = (node: HTMLElement | null) => {
    draggableRef(node);
    droppableRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  let blockClass = "block-base";
  if (isMarkedForMove) {
    blockClass = "block-marked-for-move";
  } else if (isKeyboardModeActive && isKeyboardHighlighted) {
    blockClass = "block-selected";
  } else if (!isKeyboardModeActive && isSelected) {
    blockClass = "block-selected";
  }

  const combinedClasses = `
    p-3 rounded cursor-move transition-all relative
    ${isDragging ? "opacity-50 z-50 shadow-lg" : "opacity-100"}
    ${blockClass}
    ${isGhostDropTarget ? "ghost-drop-target" : ""}
    ${
      isDndDropTarget || (isOver && !isDragging)
        ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-black/30"
        : ""
    }
  `;

  return (
    <div
      ref={setCombinedNodeRef}
      style={style}
      className={combinedClasses.trim()}
      onClick={() => {
        if (!isKeyboardModeActive) onSelect(block.id);
      }}
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

  const denseWorkspaceBlocks = workspace.filter(Boolean) as Block[];

  return (
    <div
      ref={workspaceDroppableRef}
      className="h-full flex flex-col"
      onMouseLeave={() => {
        if (!isKeyboardModeActive && activeColumn === "workspace") {
          if (workspace.find((b) => b?.id === selectedBlockId)) {
            // onSelectBlock(null); // Optionally deselect on leaving column, or let Game.tsx handle it.
          }
        }
      }}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {Array.from({ length: maxBlocks }).map((_, slotIndex) => {
            const blockInSlot = workspace[slotIndex];

            const isGhostTargetForPlaceholderHere =
              ghostTargetInfo?.targetColumn === "workspace" &&
              ghostTargetInfo?.targetIndex === slotIndex &&
              ghostTargetInfo?.isTargetPlaceholder;

            const isGhostTargetForBlockHere =
              ghostTargetInfo?.targetColumn === "workspace" &&
              ghostTargetInfo?.targetIndex === slotIndex &&
              !ghostTargetInfo?.isTargetPlaceholder;

            const ghostDataForDisplay = blockToMoveInfo?.sourceData || null;

            if (blockInSlot) {
              const isGloballySelected =
                blockInSlot.id === selectedBlockId && !blockToMoveInfo;

              let isHighlightedByKeyboard = false;
              if (
                activeColumn === "workspace" &&
                isKeyboardModeActive &&
                !blockToMoveInfo &&
                selectedIndex >= 0 &&
                selectedIndex < denseWorkspaceBlocks.length &&
                denseWorkspaceBlocks[selectedIndex]?.id === blockInSlot.id
              ) {
                isHighlightedByKeyboard = true;
              }

              const isMarked =
                blockToMoveInfo?.id === blockInSlot.id &&
                blockToMoveInfo?.sourceColumn === "workspace";

              return (
                <div
                  key={blockInSlot.id}
                  className="relative"
                  onMouseEnter={() => {
                    if (!isKeyboardModeActive && activeColumn === "workspace") {
                      onSelectBlock(blockInSlot.id);
                    }
                  }}
                >
                  {isGhostTargetForBlockHere && ghostDataForDisplay && (
                    <div className="block-ghost-preview">
                      <div className="font-mono terminal-text">
                        {ghostDataForDisplay.name}
                      </div>
                    </div>
                  )}
                  <WorkspaceBlockItem
                    block={blockInSlot}
                    slotIndex={slotIndex}
                    isSelected={isGloballySelected && !isMarked}
                    isKeyboardHighlighted={isHighlightedByKeyboard && !isMarked}
                    isKeyboardModeActive={isKeyboardModeActive}
                    isMarkedForMove={isMarked}
                    isGhostDropTarget={isGhostTargetForBlockHere ?? false}
                    isDndDropTarget={
                      activeDroppableId ===
                      `workspace-block-droptarget-${blockInSlot.id}-${slotIndex}`
                    }
                    onSelect={onSelectBlock}
                  />
                </div>
              );
            }
            return (
              <Placeholder
                key={`placeholder-${slotIndex}`}
                index={slotIndex}
                isActive={
                  activeDroppableId === `placeholder-${slotIndex}` &&
                  !isGhostTargetForPlaceholderHere
                }
                isGhostDropTarget={isGhostTargetForPlaceholderHere ?? false}
                ghostBlockData={
                  isGhostTargetForPlaceholderHere ? ghostDataForDisplay : null
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceArea;
