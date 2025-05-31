import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Block } from "./BlockList"; // Assuming BlockList exports BlockItemProps or similar

// Re-define BlockItem or import if BlockList exports it and its props
// For now, let's define a simplified version here for clarity
interface WorkspaceBlockItemProps {
  block: Block;
  isSelected: boolean;
  isKeyboardHighlighted: boolean;
  isKeyboardModeActive: boolean;
  onSelect: (blockId: string | null) => void;
}

const WorkspaceBlockItem = ({
  block,
  isSelected,
  isKeyboardHighlighted,
  isKeyboardModeActive,
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
  if (isKeyboardHighlighted) {
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

interface WorkspaceAreaProps {
  workspace: (Block | null)[];
  maxBlocks: number;
  selectedBlockId: string | null;
  selectedIndex: number;
  isKeyboardModeActive: boolean;
  activeColumn: string;
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
  selectedIndex,
  isKeyboardModeActive,
  activeColumn,
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
              const isCurrentBlockSelected = blockInSlot.id === selectedBlockId;
              const isCurrentBlockKeyboardHighlighted =
                activeColumn === "workspace" &&
                isKeyboardModeActive &&
                index === selectedIndex;

              return (
                <WorkspaceBlockItem
                  key={blockInSlot.id}
                  block={blockInSlot}
                  isSelected={isCurrentBlockSelected}
                  isKeyboardHighlighted={isCurrentBlockKeyboardHighlighted}
                  isKeyboardModeActive={isKeyboardModeActive}
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
