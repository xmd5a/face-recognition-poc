import { useCallback, useEffect, useState, useRef } from "react";
import { type Block } from "../components/BlockList";
import { type BlockToMoveInfo, type GhostTargetInfo } from "../components/Game";

export type Column = "blocks" | "workspace";

interface UseKeyboardNavigationProps {
  availableBlockSlots: (Block | null)[];
  workspace: (Block | null)[];
  selectedBlockId: string | null;
  onBlockSelect: (block: Block | null) => void;
  onWorkspaceChange: (blocks: (Block | null)[]) => void;
  onAvailableBlocksChange: (slots: (Block | null)[]) => void;
  onCompile: () => void;
  blockToMoveInfo: BlockToMoveInfo | null;
  setBlockToMoveInfo: React.Dispatch<
    React.SetStateAction<BlockToMoveInfo | null>
  >;
  ghostTargetInfo: GhostTargetInfo | null;
  setGhostTargetInfo: React.Dispatch<
    React.SetStateAction<GhostTargetInfo | null>
  >;
  maxBlocks: number;
  isDraggingDnd: boolean;
  justDraggedBlockId: string | null;
  setJustDraggedBlockId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useKeyboardNavigation = ({
  availableBlockSlots,
  workspace,
  selectedBlockId,
  onBlockSelect,
  onWorkspaceChange,
  onAvailableBlocksChange,
  onCompile,
  blockToMoveInfo,
  setBlockToMoveInfo,
  ghostTargetInfo,
  setGhostTargetInfo,
  maxBlocks,
  isDraggingDnd,
  justDraggedBlockId,
  setJustDraggedBlockId,
}: UseKeyboardNavigationProps) => {
  const [activeColumn, setActiveColumn] = useState<Column>("blocks");
  const [indices, setIndices] = useState({
    blocks: 0,
    workspace: 0,
  });
  const [keyboardNavJustActivated, setKeyboardNavJustActivated] =
    useState(false);

  const blockSelectionTriggeredByHook = useRef(false);

  useEffect(() => {
    if (isDraggingDnd) {
      return;
    }

    if (justDraggedBlockId && justDraggedBlockId === selectedBlockId) {
      let columnOfDraggedBlock: Column | null = null;
      let indexInDenseListOfColumn = -1;

      const availableDense = availableBlockSlots.filter(Boolean) as Block[];
      const workspaceDense = workspace.filter(Boolean) as Block[];

      const foundInAvailable = availableDense.find(
        (b) => b.id === justDraggedBlockId
      );
      if (foundInAvailable) {
        columnOfDraggedBlock = "blocks";
        indexInDenseListOfColumn = availableDense.findIndex(
          (b) => b.id === justDraggedBlockId
        );
      } else {
        const foundInWorkspace = workspaceDense.find(
          (b) => b.id === justDraggedBlockId
        );
        if (foundInWorkspace) {
          columnOfDraggedBlock = "workspace";
          indexInDenseListOfColumn = workspaceDense.findIndex(
            (b) => b.id === justDraggedBlockId
          );
        }
      }

      if (columnOfDraggedBlock && indexInDenseListOfColumn !== -1) {
        if (activeColumn !== columnOfDraggedBlock) {
          setActiveColumn(columnOfDraggedBlock);
        }
        if (indices[columnOfDraggedBlock] !== indexInDenseListOfColumn) {
          setIndices((prev) => ({
            ...prev,
            [columnOfDraggedBlock!]: indexInDenseListOfColumn,
          }));
        }
      } else {
        console.warn(
          "useKeyboardNavigation: justDraggedBlockId was set, but block not found or mismatch with selectedBlockId.",
          { justDraggedBlockId, selectedBlockId, activeColumn }
        );
      }
      setJustDraggedBlockId(null);
      return;
    }
    if (justDraggedBlockId) {
      setJustDraggedBlockId(null);
    }

    if (!blockSelectionTriggeredByHook.current && selectedBlockId) {
      const listForSync =
        activeColumn === "blocks"
          ? (availableBlockSlots.filter(Boolean) as Block[])
          : (workspace.filter(Boolean) as Block[]);
      const selectedIdxInList = listForSync.findIndex(
        (b) => b.id === selectedBlockId
      );

      if (selectedIdxInList !== -1) {
        if (indices[activeColumn] !== selectedIdxInList) {
          setIndices((prev) => ({
            ...prev,
            [activeColumn]: selectedIdxInList,
          }));
        }
        return;
      }
    }

    if (blockSelectionTriggeredByHook.current) {
      blockSelectionTriggeredByHook.current = false;
      const listForSync =
        activeColumn === "blocks"
          ? (availableBlockSlots.filter(Boolean) as Block[])
          : (workspace.filter(Boolean) as Block[]);
      const selectedIdx = listForSync.findIndex(
        (b) => b.id === selectedBlockId
      );
      if (selectedIdx !== -1 && indices[activeColumn] !== selectedIdx) {
        setIndices((prev) => ({ ...prev, [activeColumn]: selectedIdx }));
      }
      return;
    }

    if (
      blockToMoveInfo &&
      activeColumn ===
        (blockToMoveInfo.sourceColumn === "blocks" ? "workspace" : "blocks")
    ) {
      if (ghostTargetInfo && ghostTargetInfo.targetColumn === activeColumn) {
        if (
          !ghostTargetInfo.isTargetPlaceholder &&
          ghostTargetInfo.targetBlockId
        ) {
          const denseList =
            activeColumn === "workspace"
              ? (workspace.filter(Boolean) as Block[])
              : (availableBlockSlots.filter(Boolean) as Block[]);
          const blockToSelect = denseList.find(
            (b) => b.id === ghostTargetInfo.targetBlockId
          );
          if (selectedBlockId !== (blockToSelect?.id || null)) {
            blockSelectionTriggeredByHook.current = true;
            onBlockSelect(blockToSelect || null);
          }
        } else if (ghostTargetInfo.isTargetPlaceholder) {
          if (selectedBlockId !== null) {
            blockSelectionTriggeredByHook.current = true;
            onBlockSelect(null);
          }
        }
      } else {
        const denseTargetListForSelection =
          activeColumn === "workspace"
            ? (workspace.filter(Boolean) as Block[])
            : (availableBlockSlots.filter(Boolean) as Block[]);

        let foundTargetIndex = -1;
        let isPlaceholderTarget = false;
        let targetBlockEntityId: string | null = null;

        if (activeColumn === "workspace") {
          const firstEmptyPlaceholderIndex = workspace
            .slice(0, maxBlocks)
            .findIndex((slot) => slot === null);

          if (firstEmptyPlaceholderIndex !== -1) {
            foundTargetIndex = firstEmptyPlaceholderIndex;
            isPlaceholderTarget = true;
          } else {
            const denseWorkspace = workspace.filter(Boolean) as Block[];
            if (denseWorkspace.length > 0) {
              let currentDenseIndex = indices.workspace;
              if (
                currentDenseIndex >= denseWorkspace.length ||
                currentDenseIndex < 0
              ) {
                currentDenseIndex = 0;
              }
              const targetedBlock = denseWorkspace[currentDenseIndex];
              if (targetedBlock) {
                targetBlockEntityId = targetedBlock.id;
                const rawIndex = workspace.findIndex(
                  (b) => b?.id === targetedBlock.id
                );
                if (rawIndex !== -1) {
                  foundTargetIndex = rawIndex;
                } else {
                  foundTargetIndex = -1;
                }
              } else {
                foundTargetIndex = -1;
              }
              isPlaceholderTarget = false;
            }
          }
        } else {
          const firstEmptySlotInAvailable = availableBlockSlots.findIndex(
            (slot) => slot === null
          );
          if (firstEmptySlotInAvailable !== -1) {
            foundTargetIndex = firstEmptySlotInAvailable;
            isPlaceholderTarget = true;
          } else {
            const denseAvailableBlocks = availableBlockSlots.filter(
              Boolean
            ) as Block[];
            if (denseAvailableBlocks.length > 0) {
              let currentBlocksDenseIndex = indices.blocks;
              if (
                currentBlocksDenseIndex >= denseAvailableBlocks.length ||
                currentBlocksDenseIndex < 0
              ) {
                currentBlocksDenseIndex = 0;
              }
              const targetedBlock =
                denseAvailableBlocks[currentBlocksDenseIndex];
              if (targetedBlock) {
                targetBlockEntityId = targetedBlock.id;
                const rawIndex = availableBlockSlots.findIndex(
                  (b) => b?.id === targetedBlock.id
                );
                if (rawIndex !== -1) foundTargetIndex = rawIndex;
                else foundTargetIndex = -1;
              } else foundTargetIndex = -1;
              isPlaceholderTarget = false;
            }
          }
        }

        if (foundTargetIndex !== -1) {
          setGhostTargetInfo({
            targetColumn: activeColumn,
            targetIndex: foundTargetIndex,
            isTargetPlaceholder: isPlaceholderTarget,
            targetBlockId: targetBlockEntityId,
          });
          blockSelectionTriggeredByHook.current = true;
          if (!isPlaceholderTarget && targetBlockEntityId) {
            const blockToSelect = denseTargetListForSelection.find(
              (b) => b.id === targetBlockEntityId
            );
            onBlockSelect(blockToSelect || null);
          } else if (isPlaceholderTarget) {
            onBlockSelect(null);
          }
        } else {
          setGhostTargetInfo(null);
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(null);
        }
      }
      return;
    }

    if (blockToMoveInfo && activeColumn === blockToMoveInfo.sourceColumn) {
      if (selectedBlockId !== blockToMoveInfo.id) {
        blockSelectionTriggeredByHook.current = true;
        onBlockSelect(blockToMoveInfo.sourceData);
      }
      return;
    }

    const currentDenseList =
      activeColumn === "blocks"
        ? (availableBlockSlots.filter(Boolean) as Block[])
        : (workspace.filter(Boolean) as Block[]);
    let newIndexToSelect = indices[activeColumn];

    const globalSelectedBlockInCurrentDenseList = currentDenseList.find(
      (b) => b.id === selectedBlockId
    );

    if (globalSelectedBlockInCurrentDenseList) {
      const idxOfGlobalSelection = currentDenseList.findIndex(
        (b) => b.id === selectedBlockId
      );
      if (
        idxOfGlobalSelection !== -1 &&
        indices[activeColumn] !== idxOfGlobalSelection
      ) {
        setIndices((prev) => ({
          ...prev,
          [activeColumn]: idxOfGlobalSelection,
        }));
      }
    } else {
      if (currentDenseList.length > 0) {
        if (
          newIndexToSelect >= currentDenseList.length ||
          newIndexToSelect < 0
        ) {
          newIndexToSelect = 0;
        }
        setIndices((prev) => ({ ...prev, [activeColumn]: newIndexToSelect }));
        if (currentDenseList[newIndexToSelect]) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(currentDenseList[newIndexToSelect]);
        } else {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(null);
        }
      } else {
        setIndices((prev) => ({ ...prev, [activeColumn]: 0 }));
        if (selectedBlockId !== null) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(null);
        }
      }
    }
  }, [
    activeColumn,
    availableBlockSlots,
    workspace,
    selectedBlockId,
    onBlockSelect,
    indices,
    blockToMoveInfo,
    setGhostTargetInfo,
    maxBlocks,
    onAvailableBlocksChange,
    isDraggingDnd,
    justDraggedBlockId,
    setJustDraggedBlockId,
  ]);

  useEffect(() => {
    const down = () => setKeyboardNavJustActivated(true);
    window.addEventListener("keydown", down, { once: true, capture: true });
    return () => window.removeEventListener("keydown", down, true);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const denseCurrentList =
        activeColumn === "blocks"
          ? (availableBlockSlots.filter(Boolean) as Block[])
          : (workspace.filter(Boolean) as Block[]);

      let currentIndexInDenseList = indices[activeColumn];

      if (
        currentIndexInDenseList >= denseCurrentList.length &&
        denseCurrentList.length > 0
      ) {
        currentIndexInDenseList = denseCurrentList.length - 1;
      }
      if (
        denseCurrentList.length === 0 &&
        activeColumn === "blocks" &&
        !blockToMoveInfo
      ) {
        // If available blocks list is empty (all placeholders) and not in move mode, no arrow key navigation
      } else if (
        denseCurrentList.length === 0 &&
        activeColumn === "workspace" &&
        !blockToMoveInfo
      ) {
        currentIndexInDenseList = 0;
      } else if (
        denseCurrentList.length === 0 &&
        blockToMoveInfo &&
        activeColumn === "blocks"
      ) {
        // Allow navigation for ghost if target is blocks column and it is all placeholders
      }

      if (keyboardNavJustActivated && selectedBlockId) {
        const indexFromSelection = denseCurrentList.findIndex(
          (b) => b.id === selectedBlockId
        );
        if (indexFromSelection !== -1) {
          currentIndexInDenseList = indexFromSelection;
        }
        setKeyboardNavJustActivated(false);
      }

      let newDenseIndex = currentIndexInDenseList;
      const maxDenseIndex =
        denseCurrentList.length > 0 ? denseCurrentList.length - 1 : 0;
      const maxAvailableSlots = availableBlockSlots.length;
      const maxWorkspaceSlots = maxBlocks;

      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
          event.preventDefault();
          if (blockToMoveInfo) {
            const targetCol = ghostTargetInfo?.targetColumn || activeColumn;
            let currentTargetSlotIndex = ghostTargetInfo?.targetIndex;

            if (typeof currentTargetSlotIndex !== "number") {
              const listForInitialTarget =
                targetCol === "workspace" ? workspace : availableBlockSlots;
              const currentSelectedInActiveColDenseList = (
                activeColumn === "blocks"
                  ? (availableBlockSlots.filter(Boolean) as Block[])
                  : (workspace.filter(Boolean) as Block[])
              ).find((b) => b.id === selectedBlockId);

              if (currentSelectedInActiveColDenseList) {
                currentTargetSlotIndex = listForInitialTarget.findIndex(
                  (b) => b?.id === currentSelectedInActiveColDenseList.id
                );
                if (currentTargetSlotIndex === -1) currentTargetSlotIndex = 0;
              } else {
                currentTargetSlotIndex = 0;
              }
            }

            let newTargetSlotIndex = currentTargetSlotIndex;
            const listToNavigate =
              targetCol === "workspace" ? workspace : availableBlockSlots;
            const slotLimit =
              targetCol === "workspace" ? maxWorkspaceSlots : maxAvailableSlots;

            if (event.key === "ArrowUp") {
              newTargetSlotIndex =
                currentTargetSlotIndex > 0
                  ? currentTargetSlotIndex - 1
                  : slotLimit - 1;
            } else {
              newTargetSlotIndex =
                currentTargetSlotIndex < slotLimit - 1
                  ? currentTargetSlotIndex + 1
                  : 0;
            }

            if (
              newTargetSlotIndex !== currentTargetSlotIndex &&
              newTargetSlotIndex >= 0 &&
              newTargetSlotIndex < slotLimit
            ) {
              const newTargetIsPlaceholder =
                listToNavigate[newTargetSlotIndex] === null;
              const newTargetBlock = listToNavigate[newTargetSlotIndex];
              setGhostTargetInfo({
                targetColumn: targetCol,
                targetIndex: newTargetSlotIndex,
                isTargetPlaceholder: newTargetIsPlaceholder,
                targetBlockId: newTargetIsPlaceholder
                  ? null
                  : newTargetBlock?.id || null,
              });
            }
          } else {
            if (denseCurrentList.length > 0) {
              if (event.key === "ArrowUp") {
                newDenseIndex =
                  currentIndexInDenseList > 0
                    ? currentIndexInDenseList - 1
                    : maxDenseIndex;
              } else {
                newDenseIndex =
                  currentIndexInDenseList < maxDenseIndex
                    ? currentIndexInDenseList + 1
                    : 0;
              }
            }
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (blockToMoveInfo) {
            if (activeColumn === "workspace") {
              setActiveColumn("blocks");
              const firstAvailableSlotIsEmpty = availableBlockSlots[0] === null;
              setGhostTargetInfo({
                targetColumn: "blocks",
                targetIndex: 0,
                isTargetPlaceholder: firstAvailableSlotIsEmpty,
                targetBlockId: firstAvailableSlotIsEmpty
                  ? null
                  : availableBlockSlots[0]?.id || null,
              });
            }
          } else if (activeColumn === "workspace") {
            setActiveColumn("blocks");
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (blockToMoveInfo) {
            if (activeColumn === "blocks") {
              setActiveColumn("workspace");
              const firstWorkspaceSlotIsEmpty = workspace[0] === null;
              setGhostTargetInfo({
                targetColumn: "workspace",
                targetIndex: 0,
                isTargetPlaceholder: firstWorkspaceSlotIsEmpty,
                targetBlockId: firstWorkspaceSlotIsEmpty
                  ? null
                  : workspace[0]?.id || null,
              });
            }
          } else if (activeColumn === "blocks") {
            setActiveColumn("workspace");
          }
          break;
        case "Escape":
          if (blockToMoveInfo) {
            event.preventDefault();
            const originalSourceColumn = blockToMoveInfo.sourceColumn;
            const originalBlockToSelect = blockToMoveInfo.sourceData;
            setBlockToMoveInfo(null);
            setGhostTargetInfo(null);
            setActiveColumn(originalSourceColumn);
            blockSelectionTriggeredByHook.current = true;
            onBlockSelect(originalBlockToSelect);
            const sourceListForIndex =
              originalSourceColumn === "blocks"
                ? (availableBlockSlots.filter(Boolean) as Block[])
                : (workspace.filter(Boolean) as Block[]);
            const originalBlockIndex = sourceListForIndex.findIndex(
              (b) => b.id === originalBlockToSelect.id
            );
            if (originalBlockIndex !== -1) {
              setIndices((prev) => ({
                ...prev,
                [originalSourceColumn]: originalBlockIndex,
              }));
            }
          }
          break;
        case "e":
        case "E":
          event.preventDefault();
          if (!blockToMoveInfo) {
            const blockToInitiateMove =
              denseCurrentList[currentIndexInDenseList];
            if (blockToInitiateMove) {
              let rawSourceIndex = -1;
              if (activeColumn === "workspace") {
                rawSourceIndex = workspace.findIndex(
                  (b) => b?.id === blockToInitiateMove.id
                );
              } else {
                rawSourceIndex = availableBlockSlots.findIndex(
                  (b) => b?.id === blockToInitiateMove.id
                );
              }
              if (rawSourceIndex === -1) return;

              const initiatingColumn = activeColumn;

              setBlockToMoveInfo({
                id: blockToInitiateMove.id,
                sourceColumn: initiatingColumn,
                sourceData: blockToInitiateMove,
                sourceIndex: rawSourceIndex,
              });

              let columnForGhostTarget: Column;
              let initialTargetSlotIndexForGhost: number;
              let initialTargetIsPlaceholderForGhost: boolean;
              let initialTargetBlockIdForGhost: string | null;

              if (initiatingColumn === "workspace") {
                columnForGhostTarget = "workspace";
                initialTargetSlotIndexForGhost = rawSourceIndex;
                const blockAtSource = workspace[rawSourceIndex];
                initialTargetIsPlaceholderForGhost = blockAtSource === null;
                initialTargetBlockIdForGhost = blockAtSource
                  ? blockAtSource.id
                  : null;
              } else {
                columnForGhostTarget = "workspace";
                initialTargetSlotIndexForGhost = 0;
                const targetListForGhost = workspace;
                initialTargetIsPlaceholderForGhost =
                  targetListForGhost.length === 0 ||
                  targetListForGhost[0] === null;
                initialTargetBlockIdForGhost =
                  initialTargetIsPlaceholderForGhost || !targetListForGhost[0]
                    ? null
                    : targetListForGhost[0]?.id || null;
              }

              setActiveColumn(columnForGhostTarget);

              setGhostTargetInfo({
                targetColumn: columnForGhostTarget,
                targetIndex: initialTargetSlotIndexForGhost,
                isTargetPlaceholder: initialTargetIsPlaceholderForGhost,
                targetBlockId: initialTargetBlockIdForGhost,
              });
            }
          } else {
            if (
              ghostTargetInfo &&
              activeColumn === ghostTargetInfo.targetColumn
            ) {
              const sourceData = blockToMoveInfo.sourceData;
              const sourceCol = blockToMoveInfo.sourceColumn;
              const sourceIdx = blockToMoveInfo.sourceIndex;

              const targetCol = ghostTargetInfo.targetColumn;
              const targetIdx = ghostTargetInfo.targetIndex;

              const newWorkspace = [...workspace];
              const newAvailable = [...availableBlockSlots];

              if (sourceCol === "workspace") {
                newWorkspace[sourceIdx] = null;
              } else {
                newAvailable[sourceIdx] = null;
              }

              if (targetCol === "workspace") {
                const blockBeingReplacedInWorkspace = newWorkspace[targetIdx];
                newWorkspace[targetIdx] = sourceData;
                if (blockBeingReplacedInWorkspace && sourceCol === "blocks") {
                  if (newAvailable[sourceIdx] === null) {
                    newAvailable[sourceIdx] = blockBeingReplacedInWorkspace;
                  } else {
                    const firstEmptyInA = newAvailable.findIndex(
                      (s) => s === null
                    );
                    if (firstEmptyInA !== -1)
                      newAvailable[firstEmptyInA] =
                        blockBeingReplacedInWorkspace;
                  }
                } else if (
                  blockBeingReplacedInWorkspace &&
                  sourceCol === "workspace" &&
                  sourceIdx !== targetIdx
                ) {
                  if (newWorkspace[sourceIdx] === null)
                    newWorkspace[sourceIdx] = blockBeingReplacedInWorkspace;
                }
              } else {
                const blockBeingReplacedInAvailable = newAvailable[targetIdx];
                newAvailable[targetIdx] = sourceData;
                if (
                  blockBeingReplacedInAvailable &&
                  sourceCol === "workspace"
                ) {
                  if (newWorkspace[sourceIdx] === null) {
                    newWorkspace[sourceIdx] = blockBeingReplacedInAvailable;
                  } else {
                    const firstEmptyInW = newWorkspace.findIndex(
                      (s) => s === null
                    );
                    if (firstEmptyInW !== -1)
                      newWorkspace[firstEmptyInW] =
                        blockBeingReplacedInAvailable;
                  }
                } else if (
                  blockBeingReplacedInAvailable &&
                  sourceCol === "blocks" &&
                  sourceIdx !== targetIdx
                ) {
                  if (newAvailable[sourceIdx] === null)
                    newAvailable[sourceIdx] = blockBeingReplacedInAvailable;
                }
              }

              onWorkspaceChange(newWorkspace);
              onAvailableBlocksChange(newAvailable);

              setBlockToMoveInfo(null);
              setGhostTargetInfo(null);
              setActiveColumn(targetCol);

              const denseListOfTargetCol = (
                targetCol === "workspace" ? newWorkspace : newAvailable
              ).filter(Boolean) as Block[];
              const newDenseIdxOfMovedBlock = denseListOfTargetCol.findIndex(
                (b) => b.id === sourceData.id
              );

              setIndices((prev) => ({
                ...prev,
                [targetCol]:
                  newDenseIdxOfMovedBlock !== -1 ? newDenseIdxOfMovedBlock : 0,
              }));
              blockSelectionTriggeredByHook.current = true;
              onBlockSelect(sourceData);
            }
          }
          break;
        default:
          // No operation for other keys in the switch itself, but don't return prematurely.
          break;
      }

      if (
        (event.key === "ArrowUp" || event.key === "ArrowDown") &&
        !blockToMoveInfo &&
        denseCurrentList.length > 0 &&
        newDenseIndex !== currentIndexInDenseList
      ) {
        setIndices((prev) => ({ ...prev, [activeColumn]: newDenseIndex }));
        if (denseCurrentList[newDenseIndex]) {
          blockSelectionTriggeredByHook.current = true;
          onBlockSelect(denseCurrentList[newDenseIndex]);
        }
      }
    },
    [
      activeColumn,
      indices,
      availableBlockSlots,
      workspace,
      selectedBlockId,
      onBlockSelect,
      onWorkspaceChange,
      onAvailableBlocksChange,
      onCompile,
      keyboardNavJustActivated,
      blockToMoveInfo,
      setBlockToMoveInfo,
      ghostTargetInfo,
      setGhostTargetInfo,
      maxBlocks,
      isDraggingDnd,
      justDraggedBlockId,
      setJustDraggedBlockId,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    activeColumn,
    setActiveColumn,
    indices,
  };
};
