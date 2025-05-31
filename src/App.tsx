import Game from "./components/Game";
import type { Block } from "./components/BlockList";

const exampleBlocks: Block[] = [
  {
    id: "1",
    name: "loadImage()",
    description: "Loads an image from the source.",
  },
  {
    id: "2",
    name: "resizeImage()",
    description: "Resizes the image to a standard format.",
  },
  {
    id: "3",
    name: "detectFace()",
    description: "Detects faces in the image.",
  },
  {
    id: "4",
    name: "extractFeatures()",
    description: "Extracts facial features (embedding).",
  },
  {
    id: "5",
    name: "compareWithDatabase()",
    description: "Compares with known faces database.",
  },
  {
    id: "6",
    name: "getIdentity()",
    description: "Determines identity.",
  },
  {
    id: "7",
    name: "logResult()",
    description: "Logs the result.",
  },
  {
    id: "8",
    name: "displayResult()",
    description: "Displays identification result.",
  },
];

const hint = `
# Face Recognition Pipeline

Arrange the blocks to create a face recognition pipeline. The pipeline should:
1. Load and prepare the image
2. Detect and analyze faces
3. Compare with database
4. Handle results

**Tip:** Start with image loading and preprocessing before face detection.
`;

const App = () => {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-terminal-green crt">
      <Game availableBlocks={exampleBlocks} maxBlocks={5} hint={hint} />
    </div>
  );
};

export default App;
