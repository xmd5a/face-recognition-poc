import { useState, useEffect } from "react";
import Game from "./components/Game";
import type { Block } from "./components/BlockList";

// --- Master Block List ---
const allGameBlocksMaster: Block[] = [
  // Original 8 blocks (with commands)
  {
    id: "1",
    name: "loadImage()",
    description: "Loads an image from the source.",
    command: "LOAD",
  },
  {
    id: "2",
    name: "resizeImage()",
    description: "Resizes the image to a standard format.",
    command: "RESIZE",
  },
  {
    id: "3",
    name: "detectFace()",
    description: "Detects faces in the image.",
    command: "DETECT",
  },
  {
    id: "4",
    name: "extractFeatures()",
    description: "Extracts facial features (embedding).",
    command: "EXTRACT",
  },
  {
    id: "5",
    name: "compareWithDatabase()",
    description: "Compares with known faces database.",
    command: "COMPARE",
  },
  {
    id: "6",
    name: "getIdentity()",
    description: "Determines identity.",
    command: "IDENTIFY",
  },
  {
    id: "7",
    name: "logResult()",
    description: "Logs the result.",
    command: "LOG",
  },
  {
    id: "8",
    name: "displayResult()",
    description: "Displays identification result.",
    command: "DISPLAY",
  },
  // Suggested blocks 9-15
  {
    id: "9",
    name: "normalizeData()",
    description: "Normalizes data to a consistent format",
    command: "NORMALIZE",
  },
  {
    id: "10",
    name: "authenticateUser()",
    description: "Authenticates the user",
    command: "AUTH_USER",
  },
  {
    id: "11",
    name: "fetchData()",
    description: "Fetches data from external source",
    command: "FETCH_DATA",
  },
  {
    id: "12",
    name: "processPayment()",
    description: "Processes the payment",
    command: "PAY_PROC",
  },
  {
    id: "13",
    name: "updateDatabase()",
    description: "Updates records in the database",
    command: "DB_UPDATE",
  },
  {
    id: "14",
    name: "renderUI()",
    description: "Renders the user interface",
    command: "UI_RENDER",
  },
  {
    id: "15",
    name: "startTransaction()",
    description: "Starts a database transaction",
    command: "TX_BEGIN",
  },
  // Additional blocks 16-30
  {
    id: "16",
    name: "createBackup()",
    description: "Creates a data backup",
    command: "BACKUP_CREATE",
  },
  {
    id: "17",
    name: "validateFormat()",
    description: "Checks file format",
    command: "VALIDATE_FORMAT",
  },
  {
    id: "18",
    name: "compressData()",
    description: "Compresses data",
    command: "COMPRESS",
  },
  {
    id: "19",
    name: "encryptData()",
    description: "Encrypts data",
    command: "ENCRYPT",
  },
  {
    id: "20",
    name: "sendNotification()",
    description: "Sends notification",
    command: "NOTIFY",
  },
  {
    id: "21",
    name: "generateReport()",
    description: "Generates report",
    command: "REPORT_GEN",
  },
  {
    id: "22",
    name: "cleanupTemp()",
    description: "Cleans temporary files",
    command: "CLEANUP",
  },
  {
    id: "23",
    name: "optimizeMemory()",
    description: "Optimizes memory usage",
    command: "MEM_OPT",
  },
  {
    id: "24",
    name: "verifyChecksum()",
    description: "Verifies checksum",
    command: "CHECKSUM",
  },
  {
    id: "25",
    name: "parseConfig()",
    description: "Parses configuration file",
    command: "CONFIG_PARSE",
  },
  {
    id: "26",
    name: "initDatabase()",
    description: "Initializes database",
    command: "DB_INIT",
  },
  {
    id: "27",
    name: "validatePermissions()",
    description: "Validates permissions",
    command: "PERM_VALIDATE",
  },
  {
    id: "28",
    name: "createIndex()",
    description: "Creates index",
    command: "INDEX_CREATE",
  },
  {
    id: "29",
    name: "optimizeQuery()",
    description: "Optimizes query",
    command: "QUERY_OPT",
  },
  {
    id: "30",
    name: "handleError()",
    description: "Handles errors",
    command: "ERROR_HANDLE",
  },
];

// --- Level and Scenario Definitions ---
interface LevelData {
  availableBlocks: Block[];
  solution: string[];
  required: number;
  hint: string;
}

interface ScenarioDetails {
  sid: string;
  name: string;
  availableBlockIds: string[];
  solution: string[];
  required: number;
  hint: string;
}

// MODIFIED predefinedScenarios
const predefinedScenarios: ScenarioDetails[] = [
  {
    sid: "face_recognition_simple",
    name: "Simple Face ID Check",
    availableBlockIds: ["1", "17", "2", "3", "9", "4", "5", "6", "8"], // 9 available
    solution: ["1", "17", "2", "3", "4", "5", "6"], // 7 required
    required: 7,
    hint: `Arrange the functions in the right order, then to analyze the code and compile click the "compile" button.\n\n---\n### Simple Face ID Check\nThis task involves processing an image to **verify an identity** against a database. The typical flow includes:\n\n1.  *Loading* the input image.\n2.  *Detecting* faces within it.\n3.  *Aligning* the detected faces for consistency.\n4.  *Extracting* unique features (embeddings) from the aligned faces.\n5.  *Matching* these features against a known database.`,
  },
  {
    sid: "data_integrity_check",
    name: "Data Integrity Check",
    availableBlockIds: ["11", "17", "24", "18", "7", "20"], // 6 available
    solution: ["11", "17", "24", "7"], // 4 required
    required: 4,
    hint: `Arrange the functions in the right order, then to analyze the code and compile click the "compile" button.\n\n---\n### Data Integrity Check\nThe goal is to ensure the data is **correct and valid**. This often involves:\n\n1.  *Reading* the dataset.\n2.  *Validating* its structure (schema).\n3.  *Checking* for internal consistency or contradictions.\n4.  *Generating a report* of findings.\n5.  *Logging* any errors or inconsistencies found.`,
  },
  {
    sid: "standard_db_maintenance",
    name: "Standard DB Maintenance",
    availableBlockIds: ["25", "15", "26", "27", "13", "7", "30", "29"],
    solution: ["25", "15", "26", "13", "7"],
    required: 5,
    hint: `Arrange the functions in the right order, then to analyze the code and compile click the "compile" button.\n\n---\n### Standard DB Maintenance\nThis scenario focuses on common **database operations**.\n\n- You might need to first **connect** to the database.\n- **Backing up** is usually a critical first step.\n- Then, performing checks like **index validation** or **table optimization** makes sense.\n- Don't forget to **verify** your backup.\n- Finally, **close the connection**.`,
  },
];

// --- Validation Helper ---
const validateLevelData = (data: LevelData): boolean => {
  if (data.required <= 0) return false;
  if (data.required > 7) return false;
  if (data.availableBlocks.length <= data.required) return false;
  if (data.availableBlocks.length < data.required + 2) return false;
  if (data.solution.length !== data.required) return false;
  // Check if all solution blocks are in available blocks
  for (const solId of data.solution) {
    if (!data.availableBlocks.some((ab) => ab.id === solId)) {
      return false;
    }
  }
  return true;
};

// --- URL Encoding/Decoding Helpers ---
const encodeLevelDataToQueryString = (data: LevelData): string => {
  try {
    const params = new URLSearchParams();
    params.set(
      "blocks",
      btoa(JSON.stringify(data.availableBlocks.map((b) => b.id)))
    );
    params.set("solution", btoa(JSON.stringify(data.solution)));
    params.set("required", data.required.toString());
    params.set("hint", btoa(data.hint));
    return params.toString();
  } catch (e) {
    return "";
  }
};

const decodeLevelDataFromParams = (
  params: URLSearchParams
): LevelData | null => {
  try {
    const availableBlockIds = JSON.parse(
      atob(params.get("blocks") || "")
    ) as string[];
    const availableBlocks = availableBlockIds.map((id) => {
      const block = allGameBlocksMaster.find((b) => b.id === id);
      if (!block)
        throw new Error(`Block with id ${id} not found in master list`);
      return block;
    });
    const solution = JSON.parse(atob(params.get("solution") || "")) as string[];
    const required = parseInt(params.get("required") || "0", 10);
    const hint = atob(params.get("hint") || "");

    // Basic check for presence of data
    if (
      !availableBlockIds.length ||
      !solution.length ||
      required <= 0 ||
      !hint
    ) {
      return null;
    }

    const decodedData: LevelData = {
      availableBlocks,
      solution,
      required,
      hint,
    };

    // Apply new validation rules
    if (!validateLevelData(decodedData)) {
      return null;
    }

    return decodedData;
  } catch (e) {
    return null;
  }
};

const getLevelDataFromScenario = (
  scenario: ScenarioDetails
): LevelData | null => {
  try {
    const availableBlocks = scenario.availableBlockIds.map((id) => {
      const block = allGameBlocksMaster.find((b) => b.id === id);
      if (!block)
        throw new Error(
          `Block with id ${id} for scenario ${scenario.sid} not found in master list`
        );
      return block;
    });
    const scenarioLevelData: LevelData = { ...scenario, availableBlocks };

    // Validate scenario data as well
    if (!validateLevelData(scenarioLevelData)) {
      return null;
    }
    return scenarioLevelData;
  } catch (e) {
    return null;
  }
};

const App = () => {
  const [currentLevelData, setCurrentLevelData] = useState<LevelData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let levelToLoad: LevelData | null = null;
    let newQueryString: string | null = null;
    let redirectToDefault = false;

    const scenarioId = params.get("sid");

    if (scenarioId) {
      const scenario = predefinedScenarios.find((s) => s.sid === scenarioId);
      if (scenario) {
        levelToLoad = getLevelDataFromScenario(scenario);
        if (levelToLoad) {
          newQueryString = encodeLevelDataToQueryString(levelToLoad);
        } else {
          redirectToDefault = true;
        }
      } else {
        redirectToDefault = true;
      }
    } else if (
      params.has("blocks") &&
      params.has("solution") &&
      params.has("required") &&
      params.has("hint")
    ) {
      levelToLoad = decodeLevelDataFromParams(params);
      if (!levelToLoad) {
        redirectToDefault = true;
      }
    } else {
      redirectToDefault = true;
    }

    if (levelToLoad && !redirectToDefault) {
      setCurrentLevelData(levelToLoad);
      if (newQueryString && newQueryString !== params.toString()) {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}?${newQueryString}`
        );
      }
    } else {
      let validDefaultLevel: LevelData | null = null;
      for (const sc of predefinedScenarios) {
        validDefaultLevel = getLevelDataFromScenario(sc);
        if (validDefaultLevel) break;
      }

      if (!validDefaultLevel) {
        setIsLoading(false);
        setCurrentLevelData(null);
        return;
      }

      const encodedDefault = encodeLevelDataToQueryString(validDefaultLevel);
      if (
        `${window.location.pathname}?${encodedDefault}` !== window.location.href
      ) {
        window.location.replace(
          `${window.location.pathname}?${encodedDefault}`
        );
        return;
      }
      setCurrentLevelData(validDefaultLevel);
    }

    setIsLoading(false);
  }, []);

  if (isLoading || !currentLevelData) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-terminal-green crt flex items-center justify-center">
        <p>Loading level...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-terminal-green crt">
      <Game
        availableBlocks={currentLevelData.availableBlocks}
        maxBlocks={currentLevelData.required}
        hint={currentLevelData.hint}
        solution={currentLevelData.solution}
      />
    </div>
  );
};

export default App;
