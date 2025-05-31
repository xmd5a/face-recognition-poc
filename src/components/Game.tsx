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
  arrayMove as dndKitArrayMove,
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

// Helper function for reordering arrays
const arrayMove = <T,>(array: T[], from: number, to: number): T[] => {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedBlockData, setDraggedBlockData] = useState<Block | null>(null);
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
    // Populate draggedBlockData for the overlay
    if (active.data.current?.block) {
      setDraggedBlockData(active.data.current.block as Block);
    } else {
      // Fallback to looking it up, though ideally block data is on active.data.current
      const foundBlock =
        initialBlocks.find((b) => b.id === active.id) ||
        availableBlockSlots.find((b) => b?.id === active.id) ||
        workspace.find((b) => b?.id === active.id);
      setDraggedBlockData(foundBlock || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setActiveDroppableId(null);
      return;
    }
    const overId = String(over.id);

    // Check for workspace placeholders or workspace block drop targets
    if (
      overId.startsWith("placeholder-") ||
      overId.startsWith("workspace-block-droptarget-")
    ) {
      setActiveDroppableId(overId);
    }
    // Check for BlockList placeholders or items
    else if (
      overId.startsWith("block-list-placeholder-") ||
      overId.startsWith("block-list-item-drop-")
    ) {
      setActiveDroppableId(overId);
    } else {
      setActiveDroppableId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedBlockData(null);
    setActiveDroppableId(null);

    // Ensure both active and over are defined before proceeding
    if (!active || !over) {
      return;
    }

    // If dropped on itself (same ID and same source type), do nothing for reordering.
    if (
      active.id === over.id &&
      active.data.current?.type === over.data.current?.type
    ) {
      return;
    }
    // At this point, 'over' is guaranteed to be non-null.

    const activeData = active.data.current;
    const overData = over.data.current; // Safe to access over.data

    // Determine sourceType more reliably from activeData if possible
    let sourceType: "available" | "workspace" | null = null;
    let draggedBlock: Block | null = (activeData?.block as Block) || null;

    if (activeData?.type === "workspace-block") {
      sourceType = "workspace";
    } else if (activeData?.type === "block-list-item") {
      sourceType = "available";
    } else {
      // Fallback if type not in data
      if (workspace.find((b) => b?.id === active.id)) sourceType = "workspace";
      else if (availableBlockSlots.find((b) => b?.id === active.id))
        sourceType = "available";
    }
    if (!draggedBlock) {
      // If not on activeData, try to find it using the activeId and sourceType
      if (sourceType === "workspace")
        draggedBlock = workspace.find((b) => b?.id === active.id) || null;
      else if (sourceType === "available")
        draggedBlock =
          availableBlockSlots.find((b) => b?.id === active.id) || null;
    }

    if (!draggedBlock || !sourceType) {
      console.warn(
        "handleDragEnd: Could not identify dragged block or source type."
      );
      return;
    }

    // SCENARIO 1: Reordering within AvailableBlocks (BlockList)
    if (
      sourceType === "available" &&
      (String(over.id).startsWith("block-list-item-drop-") ||
        String(over.id).startsWith("block-list-placeholder-") ||
        overData?.type === "block-list-item" ||
        overData?.type === "block-list-slot" ||
        String(over.id) === "available-sortable")
    ) {
      const oldIndex = availableBlockSlots.findIndex(
        (b) => b?.id === active.id
      );
      let newIndex = -1;

      if (overData?.type === "block-list-item" && overData.blockId) {
        newIndex = availableBlockSlots.findIndex(
          (b) => b?.id === overData.blockId
        );
      } else if (
        overData?.type === "block-list-slot" &&
        typeof overData.slotIndex === "number"
      ) {
        newIndex = overData.slotIndex;
      } else if (String(over.id).startsWith("block-list-placeholder-")) {
        try {
          newIndex = parseInt(String(over.id).split("-").pop() || "-1", 10);
        } catch {
          /* ignore */
        }
      } else if (String(over.id).startsWith("block-list-item-drop-")) {
        // Dropping on another item
        const targetId = String(over.id).replace("block-list-item-drop-", "");
        newIndex = availableBlockSlots.findIndex((b) => b?.id === targetId);
      } else if (String(over.id) === "available-sortable") {
        // Dropping on container (append)
        newIndex =
          availableBlockSlots.length -
          availableBlockSlots.filter((s) => s === null).length; // Add to end of actual items
      }

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        // Ensure newIndex is within bounds for insertion
        if (newIndex > oldIndex && newIndex >= availableBlockSlots.length)
          newIndex = availableBlockSlots.length - 1;
        else if (newIndex < oldIndex && newIndex < 0) newIndex = 0;
        // If newIndex is on a null slot, treat it as a direct move if possible or adjust. Max capacity matters.

        const reorderedSlots = arrayMove(
          [...availableBlockSlots],
          oldIndex,
          newIndex
        );
        actions.setAvailableBlockSlots(reorderedSlots);
        actions.selectBlock(draggedBlock.id);
        setJustDraggedBlockId(draggedBlock.id);
      }
      return;
    }

    // SCENARIO 2: Reordering within Workspace
    if (
      sourceType === "workspace" &&
      (String(over.id).startsWith("placeholder-") || // Dropping on a workspace placeholder
        overData?.type === "workspace-block-droppable" || // Dropping ON another workspace block (which is now droppable)
        String(over.id) === "workspace")
    ) {
      // Dropping on workspace container (fallback)

      // oldIndex is the current position of the DRAGGED block
      // active.data.current.block should be the dragged block data
      const draggedBlockActualId = active.data.current?.block?.id;
      const oldIndex = workspace.findIndex(
        (b) => b?.id === draggedBlockActualId
      );

      let newIndex = -1;
      let isTargetAnExistingBlock = false;

      if (String(over.id).startsWith("placeholder-")) {
        try {
          newIndex = parseInt(String(over.id).split("-").pop() || "-1", 10);
        } catch {
          /* ignore */
        }
        isTargetAnExistingBlock =
          workspace[newIndex] !== null && workspace[newIndex] !== undefined;
      } else if (
        overData?.type === "workspace-block-droppable" &&
        typeof overData.index === "number"
      ) {
        // This is when we drop ON another WorkspaceBlockItem
        newIndex = overData.index; // This is the slotIndex of the block being dropped ON
        // The target is by definition an existing block in this case, unless something went wrong.
        isTargetAnExistingBlock =
          workspace[newIndex] !== null && workspace[newIndex] !== undefined;
      } else if (String(over.id) === "workspace") {
        // Dropping on workspace container itself
        const firstNull = workspace.findIndex((s) => s === null);
        newIndex =
          firstNull !== -1
            ? firstNull
            : Math.min(workspace.filter(Boolean).length, maxBlocks - 1);
        isTargetAnExistingBlock = false;
      }

      console.log("[DragEnd - Workspace Reorder]", {
        activeId: active.id, // e.g., workspace-block-XYZ-0
        draggedBlockActualId, // XYZ
        overId: over.id, // e.g., placeholder-1 OR workspace-block-droptarget-ABC-1
        overData,
        sourceType,
        draggedBlock,
        oldIndex,
        newIndex,
        isTargetAnExistingBlock,
        currentWorkspace: [...workspace],
      });

      if (
        oldIndex !== -1 &&
        newIndex !== -1 &&
        oldIndex !== newIndex &&
        newIndex < maxBlocks
      ) {
        let finalWorkspaceItems: (Block | null)[];

        if (
          isTargetAnExistingBlock &&
          workspace[oldIndex] &&
          workspace[newIndex] &&
          workspace[oldIndex]?.id !== workspace[newIndex]?.id
        ) {
          console.log("[DragEnd - Workspace Reorder] Performing SWAP.");
          const swappedWorkspace = [...workspace];
          const temp = swappedWorkspace[newIndex];
          swappedWorkspace[newIndex] = swappedWorkspace[oldIndex];
          swappedWorkspace[oldIndex] = temp;
          finalWorkspaceItems = swappedWorkspace;
        } else {
          console.log(
            "[DragEnd - Workspace Reorder] Performing arrayMove (insert/shift)."
          );
          // Ensure dragged item is correctly identified for arrayMove if oldIndex was based on its content id
          const itemToMove = workspace[oldIndex];
          if (itemToMove) {
            //Should always be true if oldIndex is valid
            const tempWorkspace = [...workspace];
            tempWorkspace.splice(oldIndex, 1); // Remove item from old spot
            tempWorkspace.splice(newIndex, 0, itemToMove); // Insert item at new spot
            finalWorkspaceItems = tempWorkspace.slice(0, maxBlocks); // Ensure length
            // Pad with nulls if necessary - setWorkspace will do this too
            while (finalWorkspaceItems.length < maxBlocks)
              finalWorkspaceItems.push(null);
          } else {
            finalWorkspaceItems = [...workspace]; // Fallback, should not happen
            console.error(
              "[DragEnd - Workspace Reorder] Error: Could not find item to move for arrayMove variant."
            );
          }
        }

        console.log("[DragEnd - Workspace Reorder] After operation:", {
          finalWorkspaceItems: [...finalWorkspaceItems],
        });
        actions.setWorkspace(finalWorkspaceItems);
        actions.selectBlock(draggedBlockActualId); // Select the MOVED block by its actual ID
        setJustDraggedBlockId(draggedBlockActualId);
      } else {
        console.log(
          "[DragEnd - Workspace Reorder] Condition not met for move:",
          {
            oldIndex,
            newIndex,
            maxBlocks,
            isTargetAnExistingBlock,
            condition:
              oldIndex !== -1 &&
              newIndex !== -1 &&
              oldIndex !== newIndex &&
              newIndex < maxBlocks,
          }
        );
      }
      return;
    }

    // SCENARIO 3: Moving from Workspace to AvailableBlocks
    if (
      sourceType === "workspace" &&
      (String(over.id).startsWith("block-list-item-drop-") ||
        String(over.id).startsWith("block-list-placeholder-") ||
        overData?.type === "block-list-item" ||
        overData?.type === "block-list-slot" ||
        String(over.id) === "available-sortable")
    ) {
      let targetSlotIndexAvailable: number = -1;
      // Determine targetSlotIndexAvailable (similar to SCENARIO 1's newIndex logic)
      if (overData?.type === "block-list-item" && overData.blockId) {
        targetSlotIndexAvailable = availableBlockSlots.findIndex(
          (b) => b?.id === overData.blockId
        );
      } else if (
        overData?.type === "block-list-slot" &&
        typeof overData.slotIndex === "number"
      ) {
        targetSlotIndexAvailable = overData.slotIndex;
      } else if (String(over.id).startsWith("block-list-placeholder-")) {
        try {
          targetSlotIndexAvailable = parseInt(
            String(over.id).split("-").pop() || "-1",
            10
          );
        } catch {
          /* ignore */
        }
      } else if (String(over.id) === "available-sortable") {
        targetSlotIndexAvailable = availableBlockSlots.findIndex(
          (s) => s === null
        ); // First empty slot
        if (targetSlotIndexAvailable === -1)
          targetSlotIndexAvailable = availableBlockSlots.length; // Append if no empty slot (if list can grow)
      }
      // Ensure targetSlotIndexAvailable is valid for availableBlockSlots, considering it might not be fixed size
      if (targetSlotIndexAvailable === -1) {
        // Fallback: try to append if no specific slot found
        targetSlotIndexAvailable = availableBlockSlots.length;
      }

      const newAvailableSlots = [...availableBlockSlots];
      // Logic to place: if slot is empty or replacing, or inserting
      if (
        targetSlotIndexAvailable < newAvailableSlots.length &&
        newAvailableSlots[targetSlotIndexAvailable] === null
      ) {
        newAvailableSlots[targetSlotIndexAvailable] = draggedBlock;
      } else {
        newAvailableSlots.splice(targetSlotIndexAvailable, 0, draggedBlock);
      }
      // Ensure availableBlockSlots doesn't exceed its own capacity if it has one.

      actions.setAvailableBlockSlots(newAvailableSlots);
      const newWorkspace = workspace.map((b) =>
        b?.id === draggedBlock.id ? null : b
      );
      actions.setWorkspace(newWorkspace);
      actions.selectBlock(draggedBlock.id);
      setJustDraggedBlockId(draggedBlock.id);
      return;
    }

    // SCENARIO 4: Moving from AvailableBlocks to Workspace
    if (
      sourceType === "available" &&
      (String(over.id).startsWith("placeholder-") ||
        overData?.type === "workspace-block-droppable" ||
        overData?.type === "workspace-block" ||
        String(over.id) === "workspace")
    ) {
      let targetIndexInWorkspace: number = -1;
      // Determine targetIndexInWorkspace (similar to SCENARIO 2's newIndex logic)
      if (String(over.id).startsWith("placeholder-")) {
        try {
          targetIndexInWorkspace = parseInt(
            String(over.id).split("-").pop() || "-1",
            10
          );
        } catch {
          /* ignore */
        }
      } else if (
        overData?.type === "workspace-block-droppable" &&
        typeof overData.index === "number"
      ) {
        targetIndexInWorkspace = overData.index;
      } else if (String(over.id) === "workspace") {
        targetIndexInWorkspace = workspace.findIndex((s) => s === null);
        if (
          targetIndexInWorkspace === -1 &&
          workspace.filter(Boolean).length < maxBlocks
        ) {
          targetIndexInWorkspace = workspace.filter(Boolean).length; // Append if space
        }
      }

      if (targetIndexInWorkspace !== -1 && targetIndexInWorkspace < maxBlocks) {
        const newWorkspace = [...workspace];
        // If target is occupied, and it's not the same block moving to same spot, this implies overwriting or needing shift
        // For now, simple placement. If newWorkspace[targetIndexInWorkspace] is not null, it will be overwritten.
        // A more robust solution might shift items if not dropping on a placeholder.
        newWorkspace[targetIndexInWorkspace] = draggedBlock;
        actions.setWorkspace(newWorkspace);

        const newAvailable = availableBlockSlots.map((b) =>
          b?.id === draggedBlock.id ? null : b
        );
        actions.setAvailableBlockSlots(newAvailable);
        actions.selectBlock(draggedBlock.id);
        setJustDraggedBlockId(draggedBlock.id);
      } else {
        console.warn(
          "Could not determine valid target slot in Workspace or workspace full."
        );
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
                  activeDroppableId={activeDroppableId}
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
              <SortableContext
                id="workspace-sortable"
                items={workspace.map(
                  (block, index) => block?.id || `ws-slot-${index}`
                )}
                strategy={verticalListSortingStrategy}
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
              </SortableContext>
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
              {activeId && draggedBlockData ? (
                <div className="p-3 rounded cursor-move bg-green-500/20 border border-green-500/30">
                  <div className="font-mono terminal-text">
                    {draggedBlockData.name}
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
