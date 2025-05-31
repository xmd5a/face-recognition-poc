import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
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

interface GameProps {
  availableBlocks: Block[];
  maxBlocks: number;
  hint: string;
}

const Game = ({ availableBlocks, maxBlocks, hint }: GameProps) => {
  const {
    workspace,
    selectedBlockId,
    isCompiling,
    errors,
    availableBlocks: filteredBlocks,
    actions,
  } = useGameState({ availableBlocks, maxBlocks });

  const { activeColumn, setActiveColumn, indices } = useKeyboardNavigation({
    availableBlocks: filteredBlocks,
    workspace,
    onBlockSelect: actions.selectBlock,
    onWorkspaceChange: (blocks) => {
      workspace.forEach((block) => actions.removeBlock(block.id));
      blocks.forEach((block) => actions.addBlock(block));
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log("Drag started:", active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const sourceBlock = [...filteredBlocks, ...workspace].find(
      (block) => block.id === active.id
    );
    if (!sourceBlock) return;

    // Jeśli przeciągamy do workspace (prawa kolumna)
    if (
      over.id === "workspace" ||
      over.data?.current?.sortable?.containerId === "workspace"
    ) {
      if (filteredBlocks.find((b) => b.id === active.id)) {
        actions.addBlock(sourceBlock);
      }
    }
    // Jeśli przeciągamy do available (lewa kolumna)
    else if (
      over.id === "available" ||
      over.data?.current?.sortable?.containerId === "available"
    ) {
      if (workspace.find((b) => b.id === active.id)) {
        actions.removeBlock(sourceBlock.id);
      }
    }
  };

  return (
    <GameLayout isCompiling={isCompiling}>
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        <Header
          levelInfo={{
            title: "Face Recognition Pipeline",
            requiredBlocks: maxBlocks,
            currentBlocks: workspace.length,
          }}
        />

        <div className="flex-1 grid grid-cols-3 gap-4 mb-8">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              id="available"
              data-droppable="available"
              className={`
                bg-black/20 rounded-lg transition-colors
                ${
                  activeColumn === "blocks"
                    ? "column-active"
                    : "column-inactive"
                }
                relative
              `}
              onMouseEnter={() => setActiveColumn("blocks")}
            >
              <SortableContext
                id="available"
                items={filteredBlocks}
                strategy={verticalListSortingStrategy}
              >
                <BlockList
                  blocks={filteredBlocks}
                  selectedBlockId={
                    activeColumn === "blocks" ? selectedBlockId : null
                  }
                  selectedIndex={indices.blocks}
                  onBlockSelect={actions.selectBlock}
                  onBlockMove={(block) => {
                    if (!workspace.find((b) => b.id === block.id)) {
                      actions.addBlock(block);
                    }
                  }}
                />
              </SortableContext>
            </div>

            <div
              id="workspace"
              data-droppable="workspace"
              className={`
                bg-black/20 rounded-lg transition-colors
                ${
                  activeColumn === "workspace"
                    ? "column-active"
                    : "column-inactive"
                }
                relative
              `}
              onMouseEnter={() => setActiveColumn("workspace")}
            >
              <SortableContext
                id="workspace"
                items={workspace}
                strategy={verticalListSortingStrategy}
              >
                <WorkspaceArea
                  workspace={workspace}
                  onWorkspaceChange={(blocks) => {
                    workspace.forEach((block) => actions.removeBlock(block.id));
                    blocks.forEach((block) => actions.addBlock(block));
                  }}
                  maxBlocks={maxBlocks}
                  selectedBlockId={
                    activeColumn === "workspace" ? selectedBlockId : null
                  }
                  selectedIndex={indices.workspace}
                />
              </SortableContext>
            </div>

            <div
              className={`
                bg-black/20 rounded-lg transition-colors
                ${activeColumn === "info" ? "column-active" : "column-inactive"}
              `}
              onMouseEnter={() => setActiveColumn("info")}
            >
              <div className="p-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{hint}</ReactMarkdown>
                </div>
              </div>
            </div>

            <DragOverlay>
              {/* Możemy tutaj dodać komponent pokazujący przeciągany element */}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={actions.compile}
            disabled={workspace.length !== maxBlocks || isCompiling}
            className={`
              w-full py-3 rounded font-mono text-lg transition-colors
              ${
                workspace.length !== maxBlocks || isCompiling
                  ? "block-base cursor-not-allowed text-opacity-50"
                  : "block-highlighted hover:block-selected"
              }
            `}
          >
            {isCompiling
              ? "Compiling..."
              : workspace.length === maxBlocks
              ? "Compile"
              : `Need ${maxBlocks - workspace.length} more block${
                  maxBlocks - workspace.length !== 1 ? "s" : ""
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
