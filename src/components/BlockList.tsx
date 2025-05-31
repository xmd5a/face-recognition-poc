import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";

export interface Block {
  id: string;
  name: string;
  description: string;
}

interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (block: Block) => void;
  onDoubleClick?: (block: Block) => void;
  onHover: (block: Block) => void;
}

const BlockItem = ({
  block,
  isSelected,
  isHighlighted,
  onSelect,
  onDoubleClick,
  onHover,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        p-3 rounded cursor-move transition-all relative
        ${isDragging ? "opacity-50 z-50 shadow-lg" : "opacity-100"}
        ${
          isSelected
            ? "block-selected"
            : isHighlighted
            ? "block-highlighted"
            : "block-base"
        }
      `}
      onClick={() => onSelect(block)}
      onDoubleClick={() => onDoubleClick?.(block)}
      onMouseEnter={() => onHover(block)}
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
}

const BlockList = ({
  blocks,
  selectedBlockId,
  selectedIndex,
  onBlockSelect,
  onBlockMove,
}: BlockListProps) => {
  const [hoveredBlock, setHoveredBlock] = useState<Block | null>(null);
  const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);
  const selectedBlock =
    blocks.find((block) => block.id === selectedBlockId) || null;

  useEffect(() => {
    const handleKeyDown = () => setIsUsingKeyboard(true);
    const handleMouseMove = () => setIsUsingKeyboard(false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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

  // Wybieramy blok do wyświetlenia w zależności od źródła interakcji
  const displayedBlock = isUsingKeyboard
    ? selectedBlock || hoveredBlock
    : hoveredBlock || selectedBlock;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 space-y-2 relative z-10">
        {blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            isSelected={block.id === selectedBlockId}
            isHighlighted={index === selectedIndex}
            onSelect={(block) => {
              setIsUsingKeyboard(true);
              onBlockSelect(block);
            }}
            onDoubleClick={handleBlockMove}
            onHover={setHoveredBlock}
          />
        ))}
        {blocks.length === 0 && (
          <div className="text-terminal-green/30 text-center py-4">
            No blocks available
          </div>
        )}
      </div>
      <BlockDescription block={displayedBlock} />
    </div>
  );
};

export default BlockList;
