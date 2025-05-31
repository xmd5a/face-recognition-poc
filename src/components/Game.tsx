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

  // useRef to keep track of the last block ID hovered by mouse to avoid redundant selections
  const lastHoveredBlockIdByMouse = useRef<string | null>(null);

  const handleAvailableSlotsChange = useCallback(
    (newSlots: (Block | null)[]) => {
      actions.setAvailableBlockSlots(newSlots);
    },
    [actions]
  );

  const memoizedOnBlockSelect = useCallback(
    (block: Block | null) => {
      actions.selectBlock(block ? block.id : null);
    },
    [actions]
  );

  const memoizedOnWorkspaceChange = useCallback(
    (newBlocks: (Block | null)[]) => {
      const newSparseWorkspace = new Array(maxBlocks).fill(null);
      newBlocks.forEach((b, i) => {
        if (i < maxBlocks) newSparseWorkspace[i] = b;
      });
      actions.setWorkspace(newSparseWorkspace);
    },
    [actions, maxBlocks]
  );

  const { activeColumn, setActiveColumn, indices } = useKeyboardNavigation({
    availableBlockSlots: availableBlockSlots,
    workspace: workspace,
    selectedBlockId: selectedBlockId,
    onBlockSelect: memoizedOnBlockSelect,
    onWorkspaceChange: memoizedOnWorkspaceChange,
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
    currentBlocksCount,
    isCompiling,
    canCompileAfterAttempt,
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
      if (!activeId) {
        // Not during D&D drag
        if (isMouseCursorVisible) {
          setIsMouseCursorVisible(false); // Switch to keyboard mode
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseCursorVisible) {
        // If currently in keyboard mode
        setIsMouseCursorVisible(true); // Switch to mouse mode
      }

      // If in mouse mode, handle block selection by hover
      if (isMouseCursorVisible && !activeId) {
        // Ensure mouse mode is truly active and not D&D dragging
        let currentlyHoveredBlockId: string | null = null;
        const targetElement = event.target as HTMLElement;

        // Check if hovering over a BlockItem in AvailableBlocks
        const availableBlockElement = targetElement.closest("[data-block-id]");
        if (availableBlockElement && activeColumn === "blocks") {
          // Ensure we are in the "blocks" column context
          currentlyHoveredBlockId =
            availableBlockElement.getAttribute("data-block-id");
        } else {
          // Check if hovering over a WorkspaceBlockItem
          // WorkspaceBlockItem already calls onSelectBlock on its own mouseEnter,
          // so we might not need explicit handling here unless that proves insufficient.
          // For now, let's focus on AvailableBlocks consistency.
        }

        // Only update if the hovered block has changed
        if (lastHoveredBlockIdByMouse.current !== currentlyHoveredBlockId) {
          if (currentlyHoveredBlockId) {
            actions.selectBlock(currentlyHoveredBlockId);
          } else {
            // If mouse is not over any specific block in the active column,
            // but still in a column region, deselect.
            // More precise deselection might be on column MouseLeave in GameLayout or here.
            if (activeColumn === "blocks" && !availableBlockElement) {
              actions.selectBlock(null);
            }
            // Similar logic could be added for workspace if its items don't self-manage hover well enough
          }
          lastHoveredBlockIdByMouse.current = currentlyHoveredBlockId;
        }
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
    activeId,
    isMouseCursorVisible,
    actions,
    activeColumn, // Added activeColumn dependency
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

    const prevModeMouse = prevIsMouseCursorVisibleRef.current;
    const currentModeMouse = isMouseCursorVisible;

    if (prevModeMouse !== undefined && prevModeMouse !== currentModeMouse) {
      actions.selectBlock(null);
      lastHoveredBlockIdByMouse.current = null; // Reset last hovered ID on mode switch
      if (currentModeMouse === true && blockToMoveInfo) {
        setBlockToMoveInfo(null);
        setGhostTargetInfo(null);
      }
    }
    prevIsMouseCursorVisibleRef.current = currentModeMouse;

    return () => {
      const existingStyleTag = document.getElementById(styleTagId);
      if (existingStyleTag) {
        existingStyleTag.remove();
      }
      document.body.style.cursor = "auto";
    };
  }, [
    isMouseCursorVisible,
    actions,
    blockToMoveInfo,
    setBlockToMoveInfo,
    setGhostTargetInfo,
  ]);

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
      const overIdStr = String(over.id);

      // Prioritize specific ID patterns first
      if (overIdStr.startsWith("block-list-item-drop-")) {
        // Dropping on BlockItem's specific droppable ID
        const targetBlockIdInAvailable = overIdStr.replace(
          "block-list-item-drop-",
          ""
        );
        targetSlotIndexAvailable = availableBlockSlots.findIndex(
          (b) => b?.id === targetBlockIdInAvailable
        );
      } else if (overIdStr.startsWith("block-list-placeholder-")) {
        // Dropping on PlaceholderItem's direct ID
        try {
          targetSlotIndexAvailable = parseInt(
            overIdStr.split("-").pop() || "-1",
            10
          );
        } catch {
          /* ignore */
        }
      }
      // Then check overData types
      else if (overData?.type === "block-list-slot") {
        // Data from useDroppable of PlaceholderItem OR BlockItem
        if (overData.isPlaceholder && typeof overData.slotIndex === "number") {
          // It's a PlaceholderItem
          targetSlotIndexAvailable = overData.slotIndex;
        } else if (!overData.isPlaceholder && overData.blockId) {
          // It's a BlockItem's droppable area
          targetSlotIndexAvailable = availableBlockSlots.findIndex(
            (b) => b?.id === overData.blockId
          );
        }
      } else if (overData?.type === "block-list-item" && overData.block?.id) {
        // Data from useSortable of BlockItem (less ideal target, but fallback)
        targetSlotIndexAvailable = availableBlockSlots.findIndex(
          (b) => b?.id === overData.block.id
        );
      } else if (overIdStr === "available-sortable") {
        // Dropping on container
        targetSlotIndexAvailable = availableBlockSlots.findIndex(
          (s) => s === null
        );
        if (targetSlotIndexAvailable === -1)
          targetSlotIndexAvailable = availableBlockSlots.length;
      }

      if (targetSlotIndexAvailable === -1) {
        console.warn(
          "[DragEnd - Ws to Avail] Could not determine target slot in AvailableBlocks."
        );
        return;
      }

      const newAvailableSlots = [...availableBlockSlots];
      const newWorkspace = [...workspace];
      const originalIndexInWorkspace = newWorkspace.findIndex(
        (b) => b?.id === draggedBlock.id
      );

      if (originalIndexInWorkspace === -1) {
        console.error(
          "[DragEnd - Ws to Avail] Dragged block not found in workspace for removal."
        );
        return;
      }

      const blockAtTargetInAvailable =
        newAvailableSlots[targetSlotIndexAvailable];

      console.log("[DragEnd - Ws to Avail] Pre-decision:", {
        targetSlotIndexAvailable,
        blockAtTargetInAvailableId: blockAtTargetInAvailable?.id,
        isTargetSlotInBounds:
          targetSlotIndexAvailable < newAvailableSlots.length,
        draggedBlockId: draggedBlock.id,
        originalIndexInWorkspace,
      });

      if (
        blockAtTargetInAvailable &&
        targetSlotIndexAvailable < newAvailableSlots.length
      ) {
        // SWAP scenario
        console.log(
          "[DragEnd - Ws to Avail] Performing SWAP with Available Block."
        );
        newAvailableSlots[targetSlotIndexAvailable] = draggedBlock; // Place workspace block in available slot
        newWorkspace[originalIndexInWorkspace] = blockAtTargetInAvailable; // Place available block in workspace slot
      } else {
        // MOVE to empty/placeholder in AvailableBlocks, or append
        console.log(
          "[DragEnd - Ws to Avail] Moving to empty/placeholder or appending in Available."
        );
        if (
          targetSlotIndexAvailable < newAvailableSlots.length &&
          newAvailableSlots[targetSlotIndexAvailable] === null
        ) {
          newAvailableSlots[targetSlotIndexAvailable] = draggedBlock; // Place in empty slot
        } else {
          // This case handles appending or inserting if targetSlotIndexAvailable is at the end or beyond current items
          // Ensure not to exceed any max capacity if availableBlockSlots has one.
          // For now, we assume it can grow or targetSlotIndexAvailable is valid for splice.
          newAvailableSlots.splice(targetSlotIndexAvailable, 0, draggedBlock);
        }
        newWorkspace[originalIndexInWorkspace] = null; // Clear original workspace slot
      }

      actions.setAvailableBlockSlots(newAvailableSlots);
      actions.setWorkspace(newWorkspace);
      actions.selectBlock(draggedBlock.id);
      setJustDraggedBlockId(draggedBlock.id);
      return;
    }

    // SCENARIO 4: Moving from AvailableBlocks to Workspace
    if (
      sourceType === "available" &&
      (String(over.id).startsWith("placeholder-") ||
        overData?.type === "workspace-block-droppable" || // Dropping ON another workspace block
        String(over.id) === "workspace")
    ) {
      // Dropping on workspace container

      let targetIndexInWorkspace: number = -1;
      const overIdStr = String(over.id);

      if (overIdStr.startsWith("placeholder-")) {
        try {
          targetIndexInWorkspace = parseInt(
            overIdStr.split("-").pop() || "-1",
            10
          );
        } catch {
          /* ignore */
        }
      } else if (
        overData?.type === "workspace-block-droppable" &&
        typeof overData.index === "number"
      ) {
        // This is when we drop ON another WorkspaceBlockItem which is a droppable target
        targetIndexInWorkspace = overData.index; // This is the slotIndex of the block being dropped ON
      } else if (String(over.id) === "workspace") {
        // Dropping on workspace container itself
        targetIndexInWorkspace = workspace.findIndex((s) => s === null); // Find first empty slot
        if (
          targetIndexInWorkspace === -1 &&
          workspace.filter(Boolean).length < maxBlocks
        ) {
          targetIndexInWorkspace = workspace.filter(Boolean).length; // Append if space available
        }
      }

      if (
        targetIndexInWorkspace === -1 ||
        targetIndexInWorkspace >= maxBlocks
      ) {
        console.warn(
          "[DragEnd - Avail to Ws] Could not determine valid target slot in Workspace or workspace full/invalid index.",
          { targetIndexInWorkspace, maxBlocks }
        );
        return;
      }

      const newWorkspace = [...workspace];
      const newAvailable = [...availableBlockSlots];
      const originalIndexInAvailable = newAvailable.findIndex(
        (b) => b?.id === draggedBlock.id
      );

      if (originalIndexInAvailable === -1) {
        console.error(
          "[DragEnd - Avail to Ws] Dragged block not found in availableBlockSlots for removal."
        );
        return;
      }

      const blockToSwapFromWorkspace = newWorkspace[targetIndexInWorkspace];

      console.log("[DragEnd - Avail to Ws] Pre-decision:", {
        targetIndexInWorkspace,
        blockToSwapFromWorkspaceId: blockToSwapFromWorkspace?.id,
        draggedBlockId: draggedBlock.id,
        originalIndexInAvailable,
      });

      if (blockToSwapFromWorkspace) {
        // SWAP scenario: Target in workspace is an existing block
        console.log(
          "[DragEnd - Avail to Ws] Performing SWAP with Workspace Block."
        );
        newWorkspace[targetIndexInWorkspace] = draggedBlock; // Place available block in workspace slot
        newAvailable[originalIndexInAvailable] = blockToSwapFromWorkspace; // Place workspace block in available slot
      } else {
        // MOVE to empty/placeholder in Workspace
        console.log(
          "[DragEnd - Avail to Ws] Moving to empty/placeholder in Workspace."
        );
        newWorkspace[targetIndexInWorkspace] = draggedBlock;
        newAvailable[originalIndexInAvailable] = null; // Clear original available slot
      }

      actions.setWorkspace(newWorkspace);
      actions.setAvailableBlockSlots(newAvailable);
      actions.selectBlock(draggedBlock.id);
      setJustDraggedBlockId(draggedBlock.id);
      return;
    }

    console.log("handleDragEnd: No specific D&D scenario matched.", {
      active,
      over,
      sourceType,
      draggedBlock,
    });
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

        <div className="grid grid-cols-3 bg-black/20" id="tabs">
          <div
            className={`border  p-2 px-4 border-b-0 w-38 cursor-pointer transition-colors
                        ${
                          activeColumn === "blocks"
                            ? "text-terminal-green font-semibold relative bg-green-900/30 border border-[rgba(0,255,0,0.5)] after:h-1 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-[-4px] after:bg-[#17210F] after:z-10"
                            : "border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30"
                        }`}
            onClick={() => setActiveColumn("blocks")}
          >
            functions.3gd
          </div>
          <div
            className={`border  p-2 px-4 border-b-0 w-34 cursor-pointer transition-colors
                        ${
                          activeColumn === "workspace"
                            ? "text-terminal-green font-semibold relative bg-green-900/30 border border-[rgba(0,255,0,0.5)] after:h-1 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-[-4px] after:bg-[#17210F] after:z-10"
                            : "border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30"
                        }`}
            onClick={() => setActiveColumn("workspace")}
          >
            workflow.3gd
          </div>
          <div
            className={
              `border border-neutral-700 p-2 px-4 w-30 border-b-0 transition-colors
                        ${"text-neutral-400"}` // readme.md is not interactive for now
            }
          >
            readme.md
          </div>
        </div>

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
                  onBlockSelect={(block) =>
                    actions.selectBlock(block ? block.id : null)
                  }
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

            <div className="bg-black/20 transition-colors pointer-events-none border border-neutral-700">
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
