import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
// Removed: import type { Block } from "./BlockList";
// Assuming BlockToMoveInfo and GhostTargetInfo types are available globally or imported
import type { BlockToMoveInfo, GhostTargetInfo } from "./Game";
// import { useDroppable } from '@dnd-kit/core'; // Removed as PlaceholderItem does not use it now

export interface Block {
  // This is the local declaration
  id: string;
  name: string;
  description: string;
  command: string;
}

// --- Placeholder Component (adapted from WorkspaceArea) ---
interface PlaceholderProps {
  slotIndex: number; // Renamed from index to avoid conflict
  // isActive: boolean; // Placeholder in BlockList might not need active drag-over state from dnd-kit like workspace
  isGhostDropTarget: boolean;
  ghostBlockData: Block | null;
  isDndDropTarget?: boolean; // Added for DND drag over highlighting
}

const PlaceholderItem = ({
  // Renamed to PlaceholderItem to avoid conflict if a global Placeholder exists
  slotIndex,
  isGhostDropTarget,
  ghostBlockData,
  isDndDropTarget, // Added
}: PlaceholderProps) => {
  // Placeholders in BlockList are now droppable targets
  const { setNodeRef } = useDroppable({
    id: `block-list-placeholder-${slotIndex}`,
    data: {
      // Pass data to identify the target
      type: "block-list-slot",
      accepts: ["workspace-block"], // Specify what it accepts
      slotIndex: slotIndex,
      isPlaceholder: true,
    },
  });

  return (
    <div
      ref={setNodeRef} // MODIFIED
      className={`p-3 rounded transition-all relative border-2 border-dashed 
                  ${
                    isGhostDropTarget
                      ? "ghost-drop-target" // Keyboard move targeting
                      : isDndDropTarget
                      ? "border-blue-500 bg-blue-500/10" // DND targeting
                      : "border-green-400/10"
                  }
                  h-[60px] flex items-center justify-center`} // Ensure consistent height
      data-slot-index={slotIndex} // Added data attribute for potential use or debugging
    >
      {isGhostDropTarget && ghostBlockData ? (
        <div className="font-mono terminal-text opacity-70">
          {ghostBlockData.name}
        </div>
      ) : (
        <div className="font-mono terminal-text opacity-30 text-sm">
          empty block
        </div>
      )}
    </div>
  );
};
// --- End Placeholder Component ---

interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  isKeyboardHighlighted: boolean;
  isKeyboardModeActive: boolean;
  isMarkedForMove: boolean;
  isGhostDropTarget: boolean;
  isDndDropTarget?: boolean;
  onBlockSelect: (block: Block | null) => void;
  onBlockDeselect: () => void;
}

const BlockItem = ({
  block,
  isSelected,
  isKeyboardHighlighted,
  isKeyboardModeActive,
  isMarkedForMove,
  isGhostDropTarget,
  isDndDropTarget,
  onBlockSelect,
  onBlockDeselect,
}: BlockItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef: sortableSetNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: {
      type: "block-list-item",
      block: block,
    },
  });

  // Make BlockItem a droppable target as well
  const { setNodeRef: droppableSetNodeRef } = useDroppable({
    id: `block-list-item-drop-${block.id}`, // Unique ID for dropping ON this item
    data: {
      // Pass data to identify the target
      type: "block-list-slot",
      accepts: ["workspace-block"], // Specify what it accepts
      blockId: block.id, // To know which block is being targeted
      isPlaceholder: false,
      // We'll need to find the slotIndex for this block if we drop on it
      // This will be handled in onDragEnd by finding the block in blockSlots
    },
  });

  // Combine refs if necessary or decide which one takes precedence.
  // For now, sortableSetNodeRef is for the div that is being dragged.
  // droppableSetNodeRef would be for making the area droppable.
  // Let's wrap BlockItem with a droppable div or apply droppable to the same div.
  // Applying to the same div means we need a way to combine refs or use one.
  // Let's use sortableSetNodeRef for the draggable aspect and attach droppableSetNodeRef to the same node.
  // This is a common pattern: a single element can be both draggable and a drop target.

  const setCombinedNodeRef = (node: HTMLElement | null) => {
    sortableSetNodeRef(node);
    droppableSetNodeRef(node);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    ${
      isGhostDropTarget
        ? "ghost-drop-target" // Keyboard move targeting
        : isDndDropTarget
        ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-black/30" // DND targeting
        : ""
    }
  `;

  const handleMouseEnter = () => {
    if (!isKeyboardModeActive) {
      onBlockSelect(block);
    }
  };

  const handleMouseLeave = () => {
    if (!isKeyboardModeActive) {
      if (isSelected) {
        onBlockDeselect();
      }
    }
  };

  return (
    <div
      ref={setCombinedNodeRef} // MODIFIED
      style={style}
      className={combinedClasses.trim()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (!isKeyboardModeActive) onBlockSelect(block);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (isKeyboardModeActive) {
            onBlockSelect(block);
          }
        }
      }}
      aria-selected={isSelected || isKeyboardHighlighted}
      {...attributes}
      {...listeners}
      data-block-id={block.id}
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
  blockSlots: (Block | null)[]; // MODIFIED: from blocks: Block[]
  selectedBlockId: string | null;
  selectedIndex: number; // This is index in DENSE list of blocks
  onBlockSelect: (block: Block | null) => void;
  onBlockMove?: (block: Block) => void; // This might need re-evaluation for sparse list
  isKeyboardModeActive: boolean;
  activeColumn: string;
  blockToMoveInfo: BlockToMoveInfo | null;
  ghostTargetInfo: GhostTargetInfo | null;
  activeDroppableId?: string | null; // Added prop
}

const BlockList = ({
  blockSlots, // MODIFIED
  selectedBlockId,
  selectedIndex, // Index in DENSE list of actual blocks from this column
  onBlockSelect,
  onBlockMove,
  isKeyboardModeActive,
  activeColumn,
  blockToMoveInfo,
  ghostTargetInfo,
  activeDroppableId, // Consuming the prop
}: BlockListProps) => {
  const denseBlocks = blockSlots.filter(Boolean) as Block[];

  const selectedBlockDetails =
    denseBlocks.find((b) => b.id === selectedBlockId) || null;

  const blockMarkedForMoveInThisColumnData =
    blockToMoveInfo?.sourceColumn === "blocks"
      ? blockToMoveInfo.sourceData
      : null;

  // This might need adjustment if onBlockMove is triggered from a placeholder context
  const handleBlockMove = (block: Block) => {
    if (onBlockMove) {
      onBlockMove(block);
      // Find next block in DENSE list for selection after move
      const currentIndexInDense = denseBlocks.findIndex(
        (b) => b.id === block.id
      );
      if (currentIndexInDense !== -1) {
        const nextBlockInDense =
          denseBlocks[currentIndexInDense + 1] || denseBlocks[0];
        if (nextBlockInDense) {
          onBlockSelect(nextBlockInDense);
        }
      }
    }
  };

  const displayedBlockForDescription =
    blockMarkedForMoveInThisColumnData || // If a block from this list is marked for move, show its desc
    selectedBlockDetails; // Simplified: always use selectedBlockDetails for description

  // Get the actual block that is highlighted by keyboard (based on selectedIndex in dense list)
  const keyboardHighlightedBlock =
    isKeyboardModeActive &&
    selectedIndex >= 0 &&
    selectedIndex < denseBlocks.length
      ? denseBlocks[selectedIndex]
      : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 space-y-2 relative z-10">
        {blockSlots.map((slotItem, slotIndex) => {
          if (slotItem) {
            // It's a Block
            const block = slotItem;
            const isSelected =
              activeColumn === "blocks" &&
              block.id === selectedBlockId &&
              !blockToMoveInfo;
            const isKeyboardHighlighted =
              activeColumn === "blocks" &&
              isKeyboardModeActive &&
              keyboardHighlightedBlock?.id === block.id && // Compare with the actual highlighted block
              !blockToMoveInfo;
            const isMarkedForMove =
              blockToMoveInfo?.sourceColumn === "blocks" &&
              blockToMoveInfo?.id === block.id;

            const isThisBlockGhostTarget =
              ghostTargetInfo?.targetColumn === "blocks" &&
              ghostTargetInfo?.targetIndex === slotIndex && // slotIndex is the key here
              !ghostTargetInfo?.isTargetPlaceholder;

            return (
              <div
                key={block.id} // Use block.id for sortable item key
                className="relative"
              >
                {isThisBlockGhostTarget && blockToMoveInfo?.sourceData && (
                  <div className="block-ghost-preview">
                    <div className="font-mono terminal-text">
                      {blockToMoveInfo.sourceData.name}
                    </div>
                  </div>
                )}
                <BlockItem
                  block={block}
                  isSelected={isSelected && !isMarkedForMove}
                  isKeyboardHighlighted={
                    isKeyboardHighlighted && !isMarkedForMove
                  }
                  isKeyboardModeActive={isKeyboardModeActive}
                  isMarkedForMove={isMarkedForMove}
                  isGhostDropTarget={isThisBlockGhostTarget} // Pass this for styling
                  isDndDropTarget={
                    `block-list-item-drop-${block.id}` === activeDroppableId
                  } // Pass this for styling
                  onBlockSelect={onBlockSelect}
                  onBlockDeselect={() => onBlockSelect(null)}
                />
              </div>
            );
          } else {
            // It's a Placeholder slot
            const isThisPlaceholderGhostTarget =
              ghostTargetInfo?.targetColumn === "blocks" &&
              ghostTargetInfo?.targetIndex === slotIndex && // slotIndex is the key
              ghostTargetInfo?.isTargetPlaceholder;

            return (
              <PlaceholderItem
                key={`placeholder-${slotIndex}`}
                slotIndex={slotIndex}
                isGhostDropTarget={isThisPlaceholderGhostTarget}
                ghostBlockData={
                  isThisPlaceholderGhostTarget
                    ? blockToMoveInfo?.sourceData || null
                    : null
                }
                isDndDropTarget={
                  `block-list-placeholder-${slotIndex}` === activeDroppableId
                }
              />
            );
          }
        })}
      </div>
      <BlockDescription block={displayedBlockForDescription} />
    </div>
  );
};

export default BlockList;
