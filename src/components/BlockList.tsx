import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
// Removed: import type { Block } from "./BlockList";
// Assuming BlockToMoveInfo and GhostTargetInfo types are available globally or imported
import type { BlockToMoveInfo, GhostTargetInfo } from "./Game";

export interface Block {
  // This is the local declaration
  id: string;
  name: string;
  description: string;
  command: string;
}

interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  isKeyboardHighlighted: boolean;
  isMouseHovered: boolean;
  isKeyboardModeActive: boolean;
  isMarkedForMove: boolean;
  onSelect: (block: Block) => void;
  onDoubleClick?: (block: Block) => void;
}

const BlockItem = ({
  block,
  isSelected,
  isKeyboardHighlighted,
  isMouseHovered,
  isKeyboardModeActive,
  isMarkedForMove,
  onSelect,
  onDoubleClick,
}: BlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let blockClass = "block-base";
  if (isMarkedForMove) {
    blockClass = "block-marked-for-move";
  } else if (isKeyboardHighlighted) {
    blockClass = "block-selected";
  } else if (!isKeyboardModeActive && (isSelected || isMouseHovered)) {
    blockClass = "block-selected";
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        p-3 rounded cursor-move transition-all relative
        ${isDragging ? "opacity-50 z-50 shadow-lg" : "opacity-100"}
        ${blockClass}
      `}
      onClick={() => onSelect(block)}
      onDoubleClick={() => onDoubleClick?.(block)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(block);
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

interface BlockDescriptionProps {
  block: Block | null;
}

const BlockDescription = ({ block }: BlockDescriptionProps) => {
  if (!block) return null;
  return (
    <div className="block-description relative mt-auto">
      <div className="p-6 font-mono">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-terminal-green/50">$</span>
          <span className="text-xl text-terminal-green font-bold terminal-text">
            {block.name}
          </span>
          <span className="text-terminal-green/30 animate-pulse">_</span>
        </div>
        <div className="text-terminal-green/70 text-base leading-relaxed">
          <span className="text-terminal-green/50">&gt;</span>{" "}
          {block.description}
        </div>
      </div>
    </div>
  );
};

interface BlockListProps {
  blocks: Block[];
  selectedBlockId: string | null;
  selectedIndex: number;
  onBlockSelect: (block: Block) => void;
  onBlockMove?: (block: Block) => void;
  isKeyboardModeActive: boolean;
  activeColumn: string;
  blockToMoveInfo: BlockToMoveInfo | null;
  ghostTargetInfo: GhostTargetInfo | null;
}

const BlockList = ({
  blocks,
  selectedBlockId,
  selectedIndex,
  onBlockSelect,
  onBlockMove,
  isKeyboardModeActive,
  activeColumn,
  blockToMoveInfo, // Now used
  ghostTargetInfo, // Now used
}: BlockListProps) => {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const selectedBlockDetails =
    blocks.find((block) => block.id === selectedBlockId) || null;
  const hoveredBlockDetails =
    blocks.find((b) => b.id === hoveredBlockId) || null;

  const blockMarkedForMoveInThisColumn =
    blockToMoveInfo && blockToMoveInfo.sourceColumn === "blocks"
      ? blockToMoveInfo.sourceData
      : null;

  const handleBlockMove = (block: Block) => {
    if (onBlockMove) {
      onBlockMove(block);
      const currentIndex = blocks.findIndex((b) => b.id === block.id);
      const nextBlock = blocks[currentIndex + 1] || blocks[0];
      if (nextBlock) {
        onBlockSelect(nextBlock);
      }
    }
  };

  const displayedBlockForDescription =
    blockMarkedForMoveInThisColumn ||
    (isKeyboardModeActive
      ? selectedBlockDetails
      : hoveredBlockDetails || selectedBlockDetails);

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex-1 p-4 space-y-2 relative z-10"
        onMouseLeave={() => {
          if (!isKeyboardModeActive) {
            setHoveredBlockId(null);
          }
        }}
      >
        {blocks.map((block, index) => {
          const isSelected =
            activeColumn === "blocks" &&
            block.id === selectedBlockId &&
            !blockToMoveInfo; // Don't show as normally selected if a move is active
          const isKeyboardHighlighted =
            activeColumn === "blocks" &&
            isKeyboardModeActive &&
            index === selectedIndex &&
            !blockToMoveInfo;
          const isMouseHovered =
            !isKeyboardModeActive &&
            hoveredBlockId === block.id &&
            activeColumn === "blocks" &&
            !blockToMoveInfo;

          // A block is marked for move if it's the source block of an active move operation and we are in its original column.
          const isMarked =
            blockToMoveInfo?.id === block.id &&
            blockToMoveInfo?.sourceColumn === "blocks";

          // A ghost of blockToMoveInfo.sourceData should appear over this item if this item is the ghostTarget
          const isGhostTargetHere =
            ghostTargetInfo?.targetColumn === "blocks" &&
            ghostTargetInfo?.targetIndex === index &&
            !ghostTargetInfo?.isTargetPlaceholder; // In BlockList, target is always an existing block for swap

          return (
            <div
              key={block.id}
              className="relative" // Added relative for positioning ghost
              onMouseEnter={() => {
                if (!isKeyboardModeActive && activeColumn === "blocks") {
                  setHoveredBlockId(block.id);
                  if (!blockToMoveInfo) onBlockSelect(block);
                }
              }}
            >
              {isGhostTargetHere && blockToMoveInfo && (
                <div
                  className="absolute inset-0 m-1 p-3 rounded border-2 border-dashed border-yellow-400/70 bg-yellow-500/10 z-20 flex items-center justify-center pointer-events-none"
                  // Style for ghost block preview
                >
                  <div className="font-mono terminal-text opacity-70">
                    {blockToMoveInfo.sourceData.name}
                  </div>
                </div>
              )}
              <BlockItem
                block={block}
                isSelected={isSelected && !isMarked} // Don't apply .block-selected if it's marked for move
                isKeyboardHighlighted={isKeyboardHighlighted && !isMarked}
                isMouseHovered={isMouseHovered && !isMarked}
                isKeyboardModeActive={isKeyboardModeActive}
                isMarkedForMove={isMarked}
                onSelect={onBlockSelect}
                onDoubleClick={handleBlockMove}
              />
            </div>
          );
        })}
      </div>
      <BlockDescription block={displayedBlockForDescription} />
    </div>
  );
};

export default BlockList;
