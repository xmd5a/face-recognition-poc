import { useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { type Block } from "./BlockList";
import BlockComponent from "./BlockComponent";

interface WorkspaceAreaProps {
  workspace: Block[];
  onWorkspaceChange: (blocks: Block[]) => void;
  maxBlocks: number;
}

const WorkspaceArea = ({
  workspace,
  onWorkspaceChange,
  maxBlocks,
}: WorkspaceAreaProps) => {
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    // Handle drag start logic if needed
    console.log("Drag started:", active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = workspace.findIndex((block) => block.id === active.id);
        const newIndex = workspace.findIndex((block) => block.id === over.id);

        const newWorkspace = [...workspace];
        const [movedBlock] = newWorkspace.splice(oldIndex, 1);
        newWorkspace.splice(newIndex, 0, movedBlock);

        onWorkspaceChange(newWorkspace);
      }
    },
    [workspace, onWorkspaceChange]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 px-4 py-2 bg-black/30 rounded-lg">
        <span className="text-green-400">
          Blocks: {workspace.length} / {maxBlocks}
        </span>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-y-auto p-4 bg-black/30 rounded-lg">
          <AnimatePresence>
            {workspace.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center text-green-500/50"
              >
                Drag blocks here
              </motion.div>
            ) : (
              <SortableContext
                items={workspace}
                strategy={verticalListSortingStrategy}
              >
                {workspace.map((block) => (
                  <BlockComponent
                    key={block.id}
                    {...block}
                    isSelected={false}
                  />
                ))}
              </SortableContext>
            )}
          </AnimatePresence>
        </div>

        <DragOverlay>{/* Optional drag overlay component */}</DragOverlay>
      </DndContext>
    </div>
  );
};

export default WorkspaceArea;
