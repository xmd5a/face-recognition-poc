import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import GameLayout from "./GameLayout";
import Header from "./Header";
import BlockList from "./BlockList";
import WorkspaceArea from "./WorkspaceArea";
import Terminal from "./Terminal";
import useGameState from "../hooks/useGameState";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import type { Block } from "./BlockList";
import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";

interface GameProps {
  availableBlocks: Block[];
  maxBlocks: number;
  hint: string;
}

const Game = ({
  availableBlocks: initialBlocks,
  maxBlocks,
  hint,
}: GameProps) => {
  const {
    workspace,
    selectedBlockId,
    isCompiling,
    errors,
    availableBlocks,
    currentBlocksCount,
    actions,
  } = useGameState({ initialAvailableBlocks: initialBlocks, maxBlocks, hint });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(
    null
  );
  const [isMouseCursorVisible, setIsMouseCursorVisible] = useState(true);

  const { activeColumn, setActiveColumn, indices } = useKeyboardNavigation({
    availableBlocks: availableBlocks,
    workspace: workspace.filter(Boolean) as Block[],
    onBlockSelect: (block) => actions.selectBlock(block.id),
    onWorkspaceChange: (newBlocks) => {
      const newSparseWorkspace = new Array(maxBlocks).fill(null);
      newBlocks.forEach((b, i) => {
        if (i < maxBlocks) newSparseWorkspace[i] = b;
      });
      actions.setWorkspace(newSparseWorkspace);
    },
    onCompile: actions.compile,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const isKeyboardModeActive = !isMouseCursorVisible;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
        return;
      }
      setIsMouseCursorVisible(false);
    };

    const handleMouseMove = () => {
      setIsMouseCursorVisible(true);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("mousemove", handleMouseMove, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("mousemove", handleMouseMove, true);
      const existingStyleTag = document.getElementById("custom-cursor-style");
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
      document.body.style.cursor = "auto";
    };
  }, []);

  useEffect(() => {
    const styleTagId = "custom-cursor-style";
    let styleTag = document.getElementById(
      styleTagId
    ) as HTMLStyleElement | null;

    if (isMouseCursorVisible) {
      if (styleTag) {
        styleTag.remove();
      }
      document.body.style.cursor = "auto";
    } else {
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleTagId;
        styleTag.innerHTML = `
          body,
          body *,
          [data-dndkit-draggable],
          [data-dndkit-draggable] * {
            cursor: none !important;
          }
        `;
        document.head.appendChild(styleTag);
      }
      document.body.style.cursor = "none";
    }

    return () => {
      const existingStyleTag = document.getElementById(styleTagId);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
      document.body.style.cursor = "auto";
    };
  }, [isMouseCursorVisible]);

  useEffect(() => {
    if (isKeyboardModeActive) {
      document.body.classList.add("keyboard-mode-active");
    } else {
      document.body.classList.remove("keyboard-mode-active");
    }
    return () => {
      document.body.classList.remove("keyboard-mode-active");
    };
  }, [isKeyboardModeActive]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    actions.selectBlock(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setActiveDroppableId(null);
      return;
    }
    if (over.id.toString().startsWith("placeholder-")) {
      setActiveDroppableId(over.id as string);
    } else {
      setActiveDroppableId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDroppableId(null);

    if (!over || !active) return;

    const draggedBlock = [
      ...initialBlocks,
      ...(workspace.filter(Boolean) as Block[]),
    ].find((b) => b.id === active.id);

    if (!draggedBlock) return;

    const newWorkspace = [...workspace];

    const currentIndexInWorkspace = workspace.findIndex(
      (b) => b?.id === active.id
    );
    if (currentIndexInWorkspace !== -1) {
      newWorkspace[currentIndexInWorkspace] = null;
    }

    if (over.id === "available") {
      // Block dragged back to available list.
      // Its removal from newWorkspace (by setting its slot to null earlier)
      // and the subsequent call to actions.setWorkspace(newWorkspace)
      // will make useGameState update the availableBlocks list correctly.
      // No explicit action needed here beyond what actions.setWorkspace does.
    } else if (over.id.toString().startsWith("placeholder-")) {
      const targetIndex = parseInt(over.id.toString().split("-")[1]);

      if (
        newWorkspace[targetIndex] &&
        newWorkspace[targetIndex]!.id !== active.id
      ) {
        newWorkspace[targetIndex] = null;
      }
      newWorkspace[targetIndex] = draggedBlock;
    } else if (
      over.id === "workspace" &&
      workspace.filter(Boolean).length < maxBlocks
    ) {
      const firstEmptyIndex = newWorkspace.findIndex((slot) => slot === null);
      if (firstEmptyIndex !== -1) {
        newWorkspace[firstEmptyIndex] = draggedBlock;
      }
    }
    actions.setWorkspace(newWorkspace);
  };

  const getActiveBlock = () => {
    if (!activeId) return null;
    return [...initialBlocks, ...(workspace.filter(Boolean) as Block[])].find(
      (block) => block.id === activeId
    );
  };

  return (
    <GameLayout isCompiling={isCompiling}>
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        <Header
          levelInfo={{
            title: "Face Recognition Pipeline",
            requiredBlocks: maxBlocks,
            currentBlocks: currentBlocksCount,
          }}
        />

        <div className="flex-1 grid grid-cols-3 gap-4 mb-8">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              id="available"
              data-droppable="available"
              className={`bg-black/20 rounded-lg transition-colors ${
                activeColumn === "blocks" ? "column-active" : "column-inactive"
              } relative`}
              onMouseEnter={() => {
                setActiveColumn("blocks");
              }}
            >
              <SortableContext
                id="available-sortable"
                items={availableBlocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                <BlockList
                  blocks={availableBlocks}
                  selectedBlockId={
                    activeColumn === "blocks" ? selectedBlockId : null
                  }
                  selectedIndex={indices.blocks}
                  onBlockSelect={(block) => actions.selectBlock(block.id)}
                  onBlockMove={(blockMoved) => {
                    const newWs = [...workspace];
                    const firstEmptyIdx = newWs.findIndex((b) => b === null);
                    if (
                      firstEmptyIdx !== -1 &&
                      newWs.filter(Boolean).length < maxBlocks
                    ) {
                      newWs[firstEmptyIdx] = blockMoved;
                      actions.setWorkspace(newWs);
                    }
                  }}
                  isKeyboardModeActive={isKeyboardModeActive}
                />
              </SortableContext>
            </div>

            <div
              id="workspace"
              data-droppable="workspace"
              className={`bg-black/20 rounded-lg transition-colors ${
                activeColumn === "workspace"
                  ? "column-active"
                  : "column-inactive"
              } relative`}
              onMouseEnter={() => setActiveColumn("workspace")}
            >
              <WorkspaceArea
                workspace={workspace}
                maxBlocks={maxBlocks}
                selectedBlockId={
                  activeColumn === "workspace" ? selectedBlockId : null
                }
                activeDroppableId={activeDroppableId}
                onSelectBlock={actions.selectBlock}
              />
            </div>

            <div className="bg-black/20 rounded-lg transition-colors pointer-events-none">
              <div className="p-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{hint}</ReactMarkdown>
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeId ? (
                <div className="p-3 rounded cursor-move bg-green-500/20 border border-green-500/30">
                  <div className="font-mono terminal-text">
                    {getActiveBlock()?.name}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={actions.compile}
            disabled={currentBlocksCount !== maxBlocks || isCompiling}
            className={`w-full py-3 rounded font-mono text-lg transition-colors ${
              currentBlocksCount !== maxBlocks || isCompiling
                ? "block-base cursor-not-allowed text-opacity-50"
                : "block-highlighted hover:block-selected"
            }`}
          >
            {isCompiling
              ? "Compiling..."
              : currentBlocksCount === maxBlocks
              ? "Compile"
              : `Need ${maxBlocks - currentBlocksCount} more block${
                  maxBlocks - currentBlocksCount !== 1 ? "s" : ""
                }`}
          </button>

          <div className="h-[25vh]">
            <Terminal
              isCompiling={isCompiling}
              errors={errors}
              onReset={actions.reset}
              onCompile={actions.compile}
            />
          </div>
        </div>
      </div>
    </GameLayout>
  );
};

export default Game;
