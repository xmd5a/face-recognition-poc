import { type ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

export interface BlockProps {
  id: string;
  name: string;
  description: string;
  isSelected?: boolean;
  onSelect?: () => void;
  children?: ReactNode;
}

const BlockComponent = ({
  id,
  name,
  description,
  isSelected,
  onSelect,
}: BlockProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        p-4 mb-2 rounded-lg cursor-pointer
        border border-green-500/30
        ${isSelected ? "bg-green-500/20" : "bg-black/50"}
        hover:bg-green-500/10 transition-colors
        focus:outline-none focus:ring-2 focus:ring-green-500
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <div className="font-mono text-green-400">{name}</div>
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-green-300/70 mt-2"
        >
          {description}
        </motion.div>
      )}
    </motion.div>
  );
};

export default BlockComponent;
