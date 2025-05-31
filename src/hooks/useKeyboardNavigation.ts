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

      if (
        blockToMoveInfo &&
        activeColumn === blockToMoveInfo.sourceColumn &&
        (event.key === "ArrowUp" || event.key === "ArrowDown")
      ) {
        event.preventDefault();
        return;
      }

      if (
        blockToMoveInfo &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        event.preventDefault();
        return;
      }

      switch (event.key) {
        case "ArrowUp":
        case "ArrowDown":
          event.preventDefault();
          if (blockToMoveInfo && activeColumn === "workspace") {
            const currentTargetSlotIndex =
              ghostTargetInfo?.targetColumn === "workspace"
                ? ghostTargetInfo.targetIndex
                : 0;
            let newTargetSlotIndex = currentTargetSlotIndex;

            if (event.key === "ArrowUp") {
              newTargetSlotIndex =
                currentTargetSlotIndex > 0
                  ? currentTargetSlotIndex - 1
                  : maxBlocks - 1;
            } else {
              // ArrowDown
              newTargetSlotIndex =
                currentTargetSlotIndex < maxBlocks - 1
                  ? currentTargetSlotIndex + 1
                  : 0;
            }

            if (newTargetSlotIndex !== currentTargetSlotIndex) {
              const newTargetIsPlaceholder =
                workspace[newTargetSlotIndex] === null;
              const newTargetBlock = workspace[newTargetSlotIndex];

              setGhostTargetInfo({
                targetColumn: "workspace",
                targetIndex: newTargetSlotIndex,
                isTargetPlaceholder: newTargetIsPlaceholder,
                targetBlockId: newTargetIsPlaceholder
                  ? null
                  : newTargetBlock?.id || null,
              });
              // useEffect will handle onBlockSelect based on new ghostTargetInfo
            }
            return; // Handled special navigation for workspace in move mode
          } else if (blockToMoveInfo && activeColumn === "blocks") {
            // Navigation in 'blocks' (source or target) column during move mode - targets slots
            const currentTargetSlotIndex =
              ghostTargetInfo?.targetColumn === "blocks"
                ? ghostTargetInfo.targetIndex
                : indices.blocks; /*fallback to dense index if no ghost*/
            let newTargetSlotIndex = currentTargetSlotIndex;
            if (event.key === "ArrowUp") {
              newTargetSlotIndex =
                currentTargetSlotIndex > 0
                  ? currentTargetSlotIndex - 1
                  : maxAvailableSlots - 1;
            } else {
              newTargetSlotIndex =
                currentTargetSlotIndex < maxAvailableSlots - 1
                  ? currentTargetSlotIndex + 1
                  : 0;
            }
            if (
              newTargetSlotIndex !== currentTargetSlotIndex &&
              newTargetSlotIndex >= 0 &&
              newTargetSlotIndex < maxAvailableSlots
            ) {
              const newTargetIsPlaceholder =
                availableBlockSlots[newTargetSlotIndex] === null;
              const newTargetBlock = availableBlockSlots[newTargetSlotIndex];
              setGhostTargetInfo({
                targetColumn: "blocks",
                targetIndex: newTargetSlotIndex,
                isTargetPlaceholder: newTargetIsPlaceholder,
                targetBlockId: newTargetIsPlaceholder
                  ? null
                  : newTargetBlock?.id || null,
              });
            }
            return; // Handled special navigation for availableBlocks slots in move mode
          }

          if (denseCurrentList.length > 0) {
            if (event.key === "ArrowUp") {
              newDenseIndex =
                currentIndexInDenseList > 0
                  ? currentIndexInDenseList - 1
                  : maxDenseIndex;
            } else {
              // ArrowDown
              newDenseIndex =
                currentIndexInDenseList < maxDenseIndex
                  ? currentIndexInDenseList + 1
                  : 0;
            }
          }
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (!blockToMoveInfo && activeColumn === "workspace") {
            setActiveColumn("blocks");
          }
          break;
        case "ArrowRight":
          event.preventDefault();
          if (!blockToMoveInfo && activeColumn === "blocks") {
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
                // 'blocks' column
                // blockToInitiateMove is from dense list, find its index in raw availableBlockSlots
                rawSourceIndex = availableBlockSlots.findIndex(
                  (b) => b?.id === blockToInitiateMove.id
                );
              }

              if (rawSourceIndex === -1) {
                // Should not happen if blockToInitiateMove exists
                console.error(
                  "Error: Could not find block in raw source list to determine sourceIndex."
                );
                return;
              }

              setBlockToMoveInfo({
                id: blockToInitiateMove.id,
                sourceColumn: activeColumn,
                sourceData: blockToInitiateMove,
                sourceIndex: rawSourceIndex, // This is index in RAW list (availableBlockSlots or workspace)
              });
              const targetColumnForGhost =
                activeColumn === "blocks" ? "workspace" : "blocks";
              setActiveColumn(targetColumnForGhost);
            }
          } else {
            if (
              ghostTargetInfo &&
              activeColumn === ghostTargetInfo.targetColumn
            ) {
              const sourceBlockData = blockToMoveInfo.sourceData;
              const tempWorkspace = [...workspace];
              const tempAvailableBlockSlots = [...availableBlockSlots]; // MODIFIED

              if (ghostTargetInfo.targetColumn === "workspace") {
                if (ghostTargetInfo.isTargetPlaceholder) {
                  tempWorkspace[ghostTargetInfo.targetIndex] = sourceBlockData;
                  if (blockToMoveInfo.sourceColumn === "blocks") {
                    // Set source slot in availableBlockSlots to null
                    if (
                      blockToMoveInfo.sourceIndex <
                      tempAvailableBlockSlots.length
                    ) {
                      tempAvailableBlockSlots[blockToMoveInfo.sourceIndex] =
                        null;
                    }
                  } else {
                    tempWorkspace[blockToMoveInfo.sourceIndex] = null;
                  }
                } else {
                  const blockToSwapOut =
                    tempWorkspace[ghostTargetInfo.targetIndex];
                  tempWorkspace[ghostTargetInfo.targetIndex] = sourceBlockData;
                  if (blockToMoveInfo.sourceColumn === "blocks") {
                    // Replace source slot with blockToSwapOut or null
                    if (
                      blockToMoveInfo.sourceIndex <
                      tempAvailableBlockSlots.length
                    ) {
                      tempAvailableBlockSlots[blockToMoveInfo.sourceIndex] =
                        blockToSwapOut || null;
                    }
                  } else {
                    tempWorkspace[blockToMoveInfo.sourceIndex] = blockToSwapOut;
                  }
                }
                onWorkspaceChange(tempWorkspace);
                if (blockToMoveInfo.sourceColumn === "blocks") {
                  onAvailableBlocksChange(tempAvailableBlockSlots); // Pass modified sparse array
                }
              } else {
                // ghostTargetInfo.targetColumn === "blocks"
                if (blockToMoveInfo.sourceColumn !== "workspace") {
                  console.error(
                    "Invalid state: To move to Available Blocks, source must be Workspace."
                  );
                  setBlockToMoveInfo(null);
                  setGhostTargetInfo(null);
                  return;
                }
                tempWorkspace[blockToMoveInfo.sourceIndex] = null;
                onWorkspaceChange(tempWorkspace);

                // ghostTargetInfo.targetIndex is index in availableBlockSlots
                const targetSlotIndex = ghostTargetInfo.targetIndex;
                if (
                  targetSlotIndex >= 0 &&
                  targetSlotIndex < tempAvailableBlockSlots.length
                ) {
                  const blockToSwapOutFromAvailable =
                    tempAvailableBlockSlots[targetSlotIndex];
                  tempAvailableBlockSlots[targetSlotIndex] = sourceBlockData;
                  // If a block was swapped out from available, it needs to go to workspace (first empty, or error/ignore)
                  if (blockToSwapOutFromAvailable) {
                    const firstEmptyInWorkspace = tempWorkspace.findIndex(
                      (s) => s === null
                    );
                    if (firstEmptyInWorkspace !== -1) {
                      tempWorkspace[firstEmptyInWorkspace] =
                        blockToSwapOutFromAvailable;
                      onWorkspaceChange(tempWorkspace); // Update workspace again
                    } else {
                      console.warn(
                        "Workspace full, cannot move swapped block from available to workspace."
                      );
                    }
                  }
                } else {
                  console.error(
                    "Target index for availableBlockSlots out of bounds."
                  );
                }
                onAvailableBlocksChange(tempAvailableBlockSlots); // Pass modified sparse array
              }

              const nextActiveCol = blockToMoveInfo.sourceColumn;
              let nextSourceIndexAfterMove: number;

              let denseSourceListAfterMove: Block[];
              if (nextActiveCol === "blocks") {
                denseSourceListAfterMove = tempAvailableBlockSlots.filter(
                  Boolean
                ) as Block[]; // Use updated slots
                // Try to select the block that is now at the original raw source index, if any
                const blockAtOldRawIndex =
                  tempAvailableBlockSlots[blockToMoveInfo.sourceIndex];
                if (blockAtOldRawIndex) {
                  nextSourceIndexAfterMove = denseSourceListAfterMove.findIndex(
                    (b) => b.id === blockAtOldRawIndex.id
                  );
                  if (nextSourceIndexAfterMove === -1)
                    nextSourceIndexAfterMove = 0;
                } else {
                  // If slot is now empty, try to select based on original dense index or adjust
                  nextSourceIndexAfterMove = Math.min(
                    indices.blocks /*old dense index*/,
                    denseSourceListAfterMove.length - 1
                  );
                }
                if (
                  denseSourceListAfterMove.length === 0 ||
                  nextSourceIndexAfterMove < 0
                )
                  nextSourceIndexAfterMove = 0;
              } else {
                denseSourceListAfterMove = tempWorkspace.filter(
                  Boolean
                ) as Block[];
                const itemNowAtOriginalRawSourceIndex =
                  tempWorkspace[blockToMoveInfo.sourceIndex];
                if (itemNowAtOriginalRawSourceIndex) {
                  nextSourceIndexAfterMove = denseSourceListAfterMove.findIndex(
                    (b) => b.id === itemNowAtOriginalRawSourceIndex.id
                  );
                  if (nextSourceIndexAfterMove === -1)
                    nextSourceIndexAfterMove = 0;
                } else {
                  let potentialIndex = indices.workspace;
                  if (potentialIndex >= denseSourceListAfterMove.length) {
                    potentialIndex =
                      denseSourceListAfterMove.length > 0
                        ? denseSourceListAfterMove.length - 1
                        : 0;
                  }
                  nextSourceIndexAfterMove = potentialIndex;
                }
                if (
                  denseSourceListAfterMove.length === 0 ||
                  nextSourceIndexAfterMove < 0
                )
                  nextSourceIndexAfterMove = 0;
              }

              setBlockToMoveInfo(null);
              setGhostTargetInfo(null);
              setActiveColumn(nextActiveCol);
              setIndices((prev) => ({
                ...prev,
                [nextActiveCol]: nextSourceIndexAfterMove,
              }));

              if (
                denseSourceListAfterMove.length > 0 &&
                denseSourceListAfterMove[nextSourceIndexAfterMove]
              ) {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(
                  denseSourceListAfterMove[nextSourceIndexAfterMove]
                );
              } else {
                blockSelectionTriggeredByHook.current = true;
                onBlockSelect(null);
              }
            }
          }
          break;
        default:
          // No operation for other keys in the switch itself, but don't return prematurely.
          break;
      }

      // After the switch, if ArrowUp or ArrowDown was pressed and newDenseIndex is different,
      // update the state.
      if (
        (event.key === "ArrowUp" || event.key === "ArrowDown") &&
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
