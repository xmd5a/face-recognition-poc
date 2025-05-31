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
import {
  useKeyboardNavigation,
  type Column,
} from "../hooks/useKeyboardNavigation";
import type { Block } from "./BlockList";
import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef, useCallback } from "react";

interface GameProps {
  availableBlocks: Block[];
  maxBlocks: number;
  hint: string;
  solution: string[];
}

// Type definitions moved here for clarity, ensure Column is imported or defined
export interface BlockToMoveInfo {
  id: string;
  sourceColumn: Column;
  sourceData: Block;
  sourceIndex: number;
}

export interface GhostTargetInfo {
  targetColumn: Column;
  targetIndex: number;
  isTargetPlaceholder: boolean;
  targetBlockId?: string | null;
}

const Game = ({
  availableBlocks: initialBlocks,
  maxBlocks,
  hint,
  solution,
}: GameProps) => {
  const {
    workspace,
    selectedBlockId,
    isCompiling,
    errors,
    availableBlockSlots,
    currentBlocksCount,
    actions,
    canCompileAfterAttempt,
  } = useGameState({
    initialAvailableBlocks: initialBlocks,
    maxBlocks,
    hint,
    solution,
  });

  // Logowanie początkowej konfiguracji bloków
  useEffect(() => {
    console.log("Initial Game State - Correct Block Order & Solution:");

    const availableBlockIds = availableBlockSlots
      .map((block, index) =>
        block
          ? `Slot ${index}: ${block.id} (${block.name})`
          : `Slot ${index}: EMPTY`
      )
      .join("\n  ");
    console.log(
      "Available Blocks (src/hooks/useGameState -> initialAvailableBlocks -> initialBlocks prop):"
    );
    console.log(
      availableBlockSlots.length > 0 ? `  ${availableBlockIds}` : "  (empty)"
    );

    const workspaceBlockIds = workspace
      .map((block, index) =>
        block
          ? `Slot ${index}: ${block.id} (${block.name})`
          : `Slot ${index}: EMPTY`
      )
      .join("\n  ");
    console.log(
      "Workspace Blocks (src/hooks/useGameState -> initialWorkspace):"
    );
    console.log(workspace.length > 0 ? `  ${workspaceBlockIds}` : "  (empty)");

    // Log the solution
    console.log("Expected Solution (Block IDs in order):");
    if (solution && solution.length > 0) {
      const solutionBlockDetails = solution
        .map((id, index) => {
          const blockInAvailable = initialBlocks.find((b) => b.id === id);
          return `  Step ${index}: ${id}${
            blockInAvailable
              ? ` (${blockInAvailable.name})`
              : " (Name not found in initialBlocks)"
          }`;
        })
        .join("\n  ");
      console.log(solutionBlockDetails);
    } else {
      console.log("  (No solution provided or solution is empty)");
    }
  }, []); // Pusta tablica zależności, aby uruchomić tylko raz po zamontowaniu

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDroppableId, setActiveDroppableId] = useState<string | null>(
    null
  );
  const [isMouseCursorVisible, setIsMouseCursorVisible] = useState(true);
  const prevIsMouseCursorVisibleRef = useRef<boolean>(true);
  const [blockToMoveInfo, setBlockToMoveInfo] =
    useState<BlockToMoveInfo | null>(null);
  const [ghostTargetInfo, setGhostTargetInfo] =
    useState<GhostTargetInfo | null>(null);
  const [justDraggedBlockId, setJustDraggedBlockId] = useState<string | null>(
    null
  );

  const handleAvailableSlotsChange = useCallback(
    (newSlots: (Block | null)[]) => {
      actions.setAvailableBlockSlots(newSlots);
    },
    [actions]
  );

  const { activeColumn, setActiveColumn, indices } = useKeyboardNavigation({
    availableBlockSlots: availableBlockSlots,
    workspace: workspace,
    selectedBlockId: selectedBlockId,
    onBlockSelect: (block) => actions.selectBlock(block ? block.id : null),
    onWorkspaceChange: useCallback(
      (newBlocks) => {
        const newSparseWorkspace = new Array(maxBlocks).fill(null);
        newBlocks.forEach((b, i) => {
          if (i < maxBlocks) newSparseWorkspace[i] = b;
        });
        actions.setWorkspace(newSparseWorkspace);
      },
      [actions, maxBlocks]
    ),
    onAvailableBlocksChange: handleAvailableSlotsChange,
    onCompile: actions.compile,
    blockToMoveInfo,
    setBlockToMoveInfo,
    ghostTargetInfo,
    setGhostTargetInfo,
    maxBlocks,
    isDraggingDnd: !!activeId,
    justDraggedBlockId,
    setJustDraggedBlockId,
  });

  // Effect to handle active column changes
  useEffect(() => {
    if (
      activeColumn !== "blocks" &&
      selectedBlockId &&
      availableBlockSlots.find((b) => b?.id === selectedBlockId)
    ) {
      actions.selectBlock(null);
    }
    // If workspace is active and no block there is selected, but one was selected in availableBlocks,
    // and that block is now in workspace, select it.
    // This might be too specific or need refinement depending on exact desired UX when switching to workspace
    // with a previously selected block that just moved there.
  }, [activeColumn, selectedBlockId, actions, availableBlockSlots, workspace]);

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
      // Only hide cursor if not actively dragging with mouse (activeId from dnd-kit)
      if (!activeId) {
        setIsMouseCursorVisible(false);
      }
    };

    const handleMouseMove = () => {
      // Zawsze pokazuj kursor myszy, gdy się rusza
      if (!isMouseCursorVisible) {
        // Ustaw tylko jeśli faktycznie się zmienia
        setIsMouseCursorVisible(true);
      }

      // Jeśli byliśmy w trybie przenoszenia bloków klawiaturą (blockToMoveInfo istnieje)
      // i mysz została ruszona, anuluj ten tryb.
      if (blockToMoveInfo) {
        setBlockToMoveInfo(null);
        setGhostTargetInfo(null);
        // Nie ustawiaj tutaj activeColumn ani selectedBlockId.
        // useKeyboardNavigation powinien sam "zauważyć", że blockToMoveInfo zniknęło
        // i odpowiednio zareagować.
        // Ustawienie isMouseCursorVisible na true powinno wyłączyć tryb klawiatury,
        // co jest sygnałem dla useKeyboardNavigation.
      }
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
      document.body.classList.remove("keyboard-mode-active");
    };
  }, [
    activeId, // To prevent hiding cursor during dnd drag
    // Zależności zredukowane do tych faktycznie używanych przez uproszczony handleMouseMove i handleKeyDown
    isMouseCursorVisible, // Używane w handleMouseMove
    blockToMoveInfo, // Używane w handleMouseMove
    setBlockToMoveInfo, // Używane w handleMouseMove
    setGhostTargetInfo, // Używane w handleMouseMove
    // setActiveColumn, // Już nie używane bezpośrednio w tym efekcie po zmianie
    // actions, // Już nie używane bezpośrednio w tym efekcie po zmianie
    // availableBlockSlots // Już nie używane bezpośrednio w tym efekcie po zmianie
  ]);

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

    if (
      prevIsMouseCursorVisibleRef.current === false &&
      isMouseCursorVisible === true
    ) {
      actions.selectBlock(null);
    }
    prevIsMouseCursorVisibleRef.current = isMouseCursorVisible;

    return () => {
      const existingStyleTag = document.getElementById(styleTagId);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
      document.body.style.cursor = "auto";
    };
  }, [isMouseCursorVisible, actions]);

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

    if (!active || !over) {
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    let draggedBlock: Block | null = null;
    let sourceType: "available" | "workspace" | null = null;

    if (activeData?.type === "workspace-block" && activeData.block) {
      draggedBlock = activeData.block as Block;
      sourceType = "workspace";
    } else if (activeData?.type === "block-list-item" && activeData.block) {
      draggedBlock = activeData.block as Block;
      sourceType = "available";
    } else {
      // Fallback jeśli type nie jest ustawiony, próbujemy po active.id (mniej pewne)
      const blockW = workspace.find((b) => b?.id === active.id);
      if (blockW) {
        draggedBlock = blockW;
        sourceType = "workspace";
      } else {
        const blockA = availableBlockSlots.find((b) => b?.id === active.id);
        if (blockA) {
          draggedBlock = blockA;
          sourceType = "available";
        }
      }
    }

    if (!draggedBlock || !sourceType) {
      console.warn(
        "handleDragEnd: Could not reliably identify dragged block or source type.",
        { active, over }
      );
      return;
    }

    // === SCENARIUSZ 1: Sortowanie wewnątrz BlockList (availableBlockSlots) ===
    if (
      sourceType === "available" &&
      (overData?.type === "block-list-item" ||
        overData?.type === "block-list-placeholder" ||
        (typeof over.id === "string" &&
          over.id.startsWith("block-list-item-drop-")) ||
        (typeof over.id === "string" &&
          over.id.startsWith("block-list-placeholder-"))) &&
      active.id !== over.id
    ) {
      const oldIndex = availableBlockSlots.findIndex(
        (b) => b?.id === String(active.id)
      );
      let newIndex = -1;

      if (
        overData?.type === "block-list-placeholder" &&
        typeof overData.slotIndex === "number"
      ) {
        newIndex = overData.slotIndex;
      } else if (overData?.type === "block-list-item" && overData.blockId) {
        newIndex = availableBlockSlots.findIndex(
          (b) => b?.id === overData.blockId
        );
      } else {
        const overIdStr = String(over.id);
        const overBlockIndex = availableBlockSlots.findIndex(
          (b) => b?.id === overIdStr
        );
        if (overBlockIndex !== -1) newIndex = overBlockIndex;
      }

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newSlots = [...availableBlockSlots];
        const [movedItem] = newSlots.splice(oldIndex, 1);
        newSlots.splice(newIndex, 0, movedItem);
        actions.setAvailableBlockSlots(newSlots);
        if (movedItem) {
          actions.selectBlock(movedItem.id);
          setJustDraggedBlockId(movedItem.id);
        }
      }
      return; // Zakończono obsługę
    }

    // === SCENARIUSZ 2: Przenoszenie z Workspace do BlockList ===
    if (
      sourceType === "workspace" &&
      (overData?.type === "block-list-slot" ||
        String(over.id) === "available-sortable" ||
        (typeof over.id === "string" &&
          over.id.startsWith("block-list-placeholder-")) ||
        (typeof over.id === "string" &&
          over.id.startsWith("block-list-item-drop-")))
    ) {
      let targetSlotIndex: number = -1;

      if (
        overData?.type === "block-list-slot" &&
        overData.isPlaceholder &&
        typeof overData.slotIndex === "number"
      ) {
        targetSlotIndex = overData.slotIndex;
      } else if (
        overData?.type === "block-list-slot" &&
        !overData.isPlaceholder &&
        overData.blockId
      ) {
        targetSlotIndex = availableBlockSlots.findIndex(
          (b) => b?.id === overData.blockId
        );
      } else if (String(over.id) === "available-sortable") {
        // Upuszczono na główny kontener listy
        targetSlotIndex = availableBlockSlots.findIndex(
          (slot) => slot === null
        ); // Pierwszy wolny slot
        if (targetSlotIndex === -1) {
          // Opcjonalnie: jeśli lista może rosnąć i nie jest pełna, można dodać na koniec.
          // Na razie, jeśli nie ma pustego, nic nie rób.
          console.warn("No empty slot in BlockList to drop workspace block.");
          return;
        }
      } else if (
        typeof over.id === "string" &&
        over.id.startsWith("block-list-placeholder-")
      ) {
        try {
          targetSlotIndex = parseInt(
            String(over.id).split("-").pop() || "-1",
            10
          );
        } catch {
          targetSlotIndex = -1;
        }
      } else if (
        typeof over.id === "string" &&
        over.id.startsWith("block-list-item-drop-")
      ) {
        const targetBlockId = String(over.id).replace(
          "block-list-item-drop-",
          ""
        );
        targetSlotIndex = availableBlockSlots.findIndex(
          (b) => b?.id === targetBlockId
        );
      }

      if (
        targetSlotIndex !== -1 &&
        targetSlotIndex < availableBlockSlots.length
      ) {
        const newAvailableSlots = [...availableBlockSlots];
        newAvailableSlots[targetSlotIndex] = draggedBlock;
        actions.setAvailableBlockSlots(newAvailableSlots);

        const newWorkspace = workspace.map((b) =>
          b?.id === draggedBlock.id ? null : b
        );
        actions.setWorkspace(newWorkspace);
        actions.selectBlock(draggedBlock.id);
        setJustDraggedBlockId(draggedBlock.id);
      } else {
        console.warn(
          "Could not determine valid target slot in BlockList for workspace block.",
          { targetSlotIndex, draggedBlock }
        );
      }
      return; // Zakończono obsługę
    }

    // === SCENARIUSZ 3: Przenoszenie z BlockList do Workspace LUB Sortowanie/Przenoszenie wewnątrz Workspace ===
    const overIdAsString = String(over.id);
    const isOverPlaceholder =
      typeof over.id === "string" && over.id.startsWith("placeholder-");
    const isOverWorkspaceContainer = overIdAsString === "workspace";
    const isOverWorkspaceBlockDroppable =
      overData?.type === "workspace-block-droppable";

    if (
      (sourceType === "available" &&
        (isOverPlaceholder ||
          isOverWorkspaceContainer ||
          isOverWorkspaceBlockDroppable)) ||
      (sourceType === "workspace" &&
        (isOverPlaceholder ||
          isOverWorkspaceContainer ||
          isOverWorkspaceBlockDroppable))
    ) {
      let targetIndexInWorkspace = -1;

      if (isOverPlaceholder) {
        try {
          targetIndexInWorkspace = parseInt(
            overIdAsString.split("-").pop() || "-1",
            10
          );
        } catch {
          targetIndexInWorkspace = -1;
        }
      } else if (isOverWorkspaceContainer) {
        targetIndexInWorkspace = workspace.findIndex((slot) => slot === null);
      } else if (
        isOverWorkspaceBlockDroppable &&
        typeof overData.index === "number"
      ) {
        targetIndexInWorkspace = overData.index;
      }

      if (targetIndexInWorkspace !== -1 && targetIndexInWorkspace < maxBlocks) {
        const newWorkspace = [...workspace];
        const oldIndexInWorkspace =
          sourceType === "workspace"
            ? newWorkspace.findIndex((b) => b?.id === draggedBlock.id)
            : -1;

        if (
          sourceType === "workspace" &&
          oldIndexInWorkspace !== -1 &&
          oldIndexInWorkspace !== targetIndexInWorkspace
        ) {
          // Sortowanie wewnątrz workspace
          // Prosta zamiana miejscami, jeśli oba sloty były zajęte lub jeden pusty
          // Ta logika wymaga doprecyzowania dla rzadkich tablic i zachowania nulli
          const itemAtOld = newWorkspace[oldIndexInWorkspace];
          const itemAtNew = newWorkspace[targetIndexInWorkspace];
          newWorkspace[oldIndexInWorkspace] = itemAtNew;
          newWorkspace[targetIndexInWorkspace] = itemAtOld;
          actions.setWorkspace(newWorkspace); // setWorkspace dba o finalną strukturę
        } else {
          // Przenoszenie z available lub na inne (puste) miejsce w workspace
          if (sourceType === "workspace" && oldIndexInWorkspace !== -1) {
            newWorkspace[oldIndexInWorkspace] = null;
          }
          // TODO: Co jeśli w newWorkspace[targetIndexInWorkspace] jest inny blok (nie podczas sortowania)? Na razie nadpisujemy.
          newWorkspace[targetIndexInWorkspace] = draggedBlock;
          actions.setWorkspace(newWorkspace);
        }

        if (sourceType === "available") {
          const newAvailable = availableBlockSlots.map((b) =>
            b?.id === draggedBlock.id ? null : b
          );
          actions.setAvailableBlockSlots(newAvailable);
        }

        actions.selectBlock(draggedBlock.id);
        setJustDraggedBlockId(draggedBlock.id);
      } else {
        console.warn("Could not determine valid target slot in Workspace.", {
          targetIndexInWorkspace,
          draggedBlock,
        });
      }
      return;
    }

    console.log("handleDragEnd: No specific D&D scenario matched.", {
      active,
      over,
      sourceType,
      draggedBlock,
    });
  };

  const getActiveBlock = () => {
    if (!activeId) return null;
    // Combine initialBlocks (as a fallback for blocks not yet in slots) and blocks from both slot types
    const allPossibleBlocks = [
      ...initialBlocks, // Might be redundant if initialBlocks are all in availableBlockSlots at start
      ...(availableBlockSlots.filter(Boolean) as Block[]),
      ...(workspace.filter(Boolean) as Block[]),
    ];
    // Deduplicate, prioritizing blocks from slots, then initialBlocks
    const uniqueBlocks = Array.from(
      new Map(allPossibleBlocks.map((b) => [b.id, b])).values()
    );
    return uniqueBlocks.find((block) => block.id === activeId);
  };

  return (
    <GameLayout isCompiling={isCompiling}>
      <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
        <Header
          levelInfo={{
            title: "Face Recognition v0.1",
            requiredBlocks: maxBlocks,
            currentBlocks: currentBlocksCount,
          }}
        />

        <div className="flex-1 grid grid-cols-3">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              id="available"
              data-droppable="available"
              className={`bg-black/20 transition-colors ${
                activeColumn === "blocks" ? "column-active" : "column-inactive"
              } relative`}
              onMouseEnter={() => {
                setActiveColumn("blocks");
              }}
            >
              <SortableContext
                id="available-sortable"
                // items must be stable IDs; use slot index if block is null
                items={availableBlockSlots.map(
                  (block, index) => block?.id || `slot-${index}`
                )}
                strategy={verticalListSortingStrategy}
              >
                <BlockList
                  blockSlots={availableBlockSlots}
                  selectedBlockId={selectedBlockId}
                  selectedIndex={
                    activeColumn === "blocks" ? indices.blocks : -1
                  }
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
                  activeColumn={activeColumn}
                  blockToMoveInfo={blockToMoveInfo}
                  ghostTargetInfo={ghostTargetInfo}
                />
              </SortableContext>
            </div>

            <div
              id="workspace"
              data-droppable="workspace"
              className={`bg-black/20transition-colors ${
                activeColumn === "workspace"
                  ? "column-active"
                  : "column-inactive"
              } relative`}
              onMouseEnter={() => setActiveColumn("workspace")}
            >
              <WorkspaceArea
                workspace={workspace}
                maxBlocks={maxBlocks}
                selectedBlockId={selectedBlockId}
                selectedIndex={
                  activeColumn === "workspace" ? indices.workspace : -1
                }
                isKeyboardModeActive={isKeyboardModeActive}
                activeColumn={activeColumn}
                activeDroppableId={activeDroppableId}
                onSelectBlock={(blockId) => actions.selectBlock(blockId)}
                blockToMoveInfo={blockToMoveInfo}
                ghostTargetInfo={ghostTargetInfo}
              />
            </div>

            <div className="bg-black/20 transition-colors pointer-events-none">
              <div className="p-4">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{hint}</ReactMarkdown>
                  <div className="mt-4 mb-4 controls">
                    <h3>controls</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded">
                      ↑/↓
                    </kbd>
                    <span className="text-xs opacity-70">Move</span>

                    <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded ml-4">
                      ←/→
                    </kbd>
                    <span className="text-xs opacity-70">Move</span>

                    <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded ml-4">
                      Enter
                    </kbd>
                    <span className="text-xs opacity-70">Compile</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded">
                      E
                    </kbd>
                    <span className="text-xs opacity-70">
                      Pick up / Place block
                    </span>
                    <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded ml-4">
                      Esc
                    </kbd>
                    <span className="text-xs opacity-70">Cancel selection</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <kbd className="px-2 py-1 text-xs bg-terminal-green/10 border border-terminal-green/20 rounded">
                      Mouse
                    </kbd>
                    <span className="text-xs opacity-70">
                      Drag & Drop to move blocks
                    </span>
                  </div>
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

        <div className="h-[25vh] mt-4">
          <Terminal
            isCompiling={isCompiling}
            errors={errors}
            onReset={actions.reset}
            onCompile={actions.compile}
            currentBlocksCount={currentBlocksCount}
            maxBlocks={maxBlocks}
            canCompileAfterAttempt={canCompileAfterAttempt}
          />
        </div>
      </div>
    </GameLayout>
  );
};

export default Game;
