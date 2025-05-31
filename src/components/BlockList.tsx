import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

export interface Block {
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
  onSelect: (block: Block) => void;
  onDoubleClick?: (block: Block) => void;
}

const BlockItem = ({
  block,
  isSelected,
  isKeyboardHighlighted,
  isMouseHovered,
  isKeyboardModeActive,
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
  if (isKeyboardHighlighted) {
    blockClass = "block-selected";
  } else if (!isKeyboardModeActive) {
    if (isSelected || isMouseHovered) {
      blockClass = "block-selected";
    }
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
      aria-selected={isSelected}
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
        <div className="pl-6 text-terminal-green/70 text-base leading-relaxed">
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
}

const BlockList = ({
  blocks,
  selectedBlockId,
  selectedIndex,
  onBlockSelect,
  onBlockMove,
  isKeyboardModeActive,
  activeColumn,
}: BlockListProps) => {
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  const selectedBlock =
    blocks.find((block) => block.id === selectedBlockId) || null;

  const hoveredBlock = blocks.find((b) => b.id === hoveredBlockId) || null;

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

  const displayedBlock = isKeyboardModeActive
    ? selectedBlock
    : hoveredBlock || selectedBlock;

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
        {blocks.map((block, index) => (
          <div
            key={block.id}
            onMouseEnter={() => {
              if (!isKeyboardModeActive) {
                setHoveredBlockId(block.id);
                onBlockSelect(block);
              }
            }}
          >
            <BlockItem
              block={block}
              isSelected={
                activeColumn === "blocks" && block.id === selectedBlockId
              }
              isKeyboardHighlighted={
                activeColumn === "blocks" &&
                isKeyboardModeActive &&
                index === selectedIndex
              }
              isMouseHovered={
                activeColumn === "blocks" &&
                !isKeyboardModeActive &&
                hoveredBlockId === block.id
              }
              isKeyboardModeActive={isKeyboardModeActive}
              onSelect={onBlockSelect}
              onDoubleClick={handleBlockMove}
            />
          </div>
        ))}
      </div>
      <BlockDescription block={displayedBlock} />
    </div>
  );
};

export default BlockList;
