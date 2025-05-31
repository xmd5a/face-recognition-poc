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
    description: "Normalizuje dane do spójnego formatu.",
    command: "NORMALIZE",
  },
  {
    id: "10",
    name: "authenticateUser()",
    description: "Uwierzytelnia użytkownika.",
    command: "AUTH_USER",
  },
  {
    id: "11",
    name: "fetchData()",
    description: "Pobiera dane z zewnętrznego źródła.",
    command: "FETCH_DATA",
  },
  {
    id: "12",
    name: "processPayment()",
    description: "Przetwarza płatność.",
    command: "PAY_PROC",
  },
  {
    id: "13",
    name: "updateDatabase()",
    description: "Aktualizuje rekordy w bazie danych.",
    command: "DB_UPDATE",
  },
  {
    id: "14",
    name: "renderUI()",
    description: "Renderuje interfejs użytkownika.",
    command: "UI_RENDER",
  },
  {
    id: "15",
    name: "startTransaction()",
    description: "Rozpoczyna transakcję bazodanową.",
    command: "TX_BEGIN",
  },
  // Additional blocks 16-30
  {
    id: "16",
    name: "createBackup()",
    description: "Tworzy kopię zapasową danych",
    command: "BACKUP_CREATE",
  },
  {
    id: "17",
    name: "validateFormat()",
    description: "Sprawdza format pliku",
    command: "VALIDATE_FORMAT",
  },
  {
    id: "18",
    name: "compressData()",
    description: "Kompresuje dane",
    command: "COMPRESS",
  },
  {
    id: "19",
    name: "encryptData()",
    description: "Szyfruje dane",
    command: "ENCRYPT",
  },
  {
    id: "20",
    name: "sendNotification()",
    description: "Wysyła powiadomienie",
    command: "NOTIFY",
  },
  {
    id: "21",
    name: "generateReport()",
    description: "Generuje raport",
    command: "REPORT_GEN",
  },
  {
    id: "22",
    name: "cleanupTemp()",
    description: "Czyści pliki tymczasowe",
    command: "CLEANUP",
  },
  {
    id: "23",
    name: "optimizeMemory()",
    description: "Optymalizuje użycie pamięci",
    command: "MEM_OPT",
  },
  {
    id: "24",
    name: "verifyChecksum()",
    description: "Weryfikuje sumę kontrolną",
    command: "CHECKSUM",
  },
  {
    id: "25",
    name: "parseConfig()",
    description: "Parsuje plik konfiguracyjny",
    command: "CONFIG_PARSE",
  },
  {
    id: "26",
    name: "initDatabase()",
    description: "Inicjalizuje bazę danych",
    command: "DB_INIT",
  },
  {
    id: "27",
    name: "validatePermissions()",
    description: "Sprawdza uprawnienia",
    command: "PERM_VALIDATE",
  },
  {
    id: "28",
    name: "createIndex()",
    description: "Tworzy indeks",
    command: "INDEX_CREATE",
  },
  {
    id: "29",
    name: "optimizeQuery()",
    description: "Optymalizuje zapytanie",
    command: "QUERY_OPT",
  },
  {
    id: "30",
    name: "handleError()",
    description: "Obsługuje błędy",
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
    hint: `Arrange the functions in the correct order to perform the code analysis, then click the 'compile' button.\n\n# Simple Face ID Check\nThis task involves processing an image to verify an identity. Consider the typical stages: initial input, preparation, core analysis, and final output.`,
  },
  {
    sid: "data_integrity_check",
    name: "Data Integrity Check",
    availableBlockIds: ["11", "17", "24", "18", "7", "20"], // 6 available
    solution: ["11", "17", "24", "7"], // 4 required
    required: 4,
    hint: `Arrange the functions in the correct order to perform the code analysis, then click the 'compile' button.\n\n# Data Integrity Check\nThe goal is to ensure the data is correct and valid. Think about the sequence of operations needed from obtaining data to confirming its state.`,
  },
  {
    sid: "standard_db_maintenance",
    name: "Standard DB Maintenance",
    availableBlockIds: ["25", "15", "26", "27", "13", "7", "30", "29"],
    solution: ["25", "15", "26", "13", "7"],
    required: 5,
    hint: `Arrange the functions in the correct order to perform the code analysis, then click the 'compile' button.\n\n# Standard DB Maintenance\nThis scenario focuses on common database operations. What are the fundamental steps before and after modifying database records?`,
  },
];

// --- Validation Helper ---
const validateLevelData = (data: LevelData): boolean => {
  if (data.required <= 0) return false;
  if (data.required > 7) {
    console.warn(
      `Validation Error: Required blocks (${data.required}) cannot exceed 7.`
    );
    return false;
  }
  if (data.availableBlocks.length <= data.required) {
    console.warn(
      `Validation Error: Available blocks (${data.availableBlocks.length}) must be strictly greater than required blocks (${data.required}).`
    );
    return false;
  }
  if (data.availableBlocks.length < data.required + 2) {
    console.warn(
      `Validation Error: Available blocks (${
        data.availableBlocks.length
      }) must be at least 2 more than required blocks (${
        data.required
      }). Required: ${data.required + 2}.`
    );
    return false;
  }
  if (data.solution.length !== data.required) {
    console.warn(
      `Validation Error: Solution length (${data.solution.length}) must match required blocks (${data.required}).`
    );
    return false;
  }
  // Check if all solution blocks are in available blocks
  for (const solId of data.solution) {
    if (!data.availableBlocks.some((ab) => ab.id === solId)) {
      console.warn(
        `Validation Error: Solution block ID "${solId}" not found in available blocks.`
      );
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
    console.error("Error encoding level data:", e);
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
      console.warn("Decoding failed: Missing essential data from URL params.");
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
      console.warn("Decoded level data failed validation rules.");
      return null;
    }

    return decodedData;
  } catch (e) {
    console.error("Error decoding level data from full params:", e);
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
      console.warn(
        `Predefined scenario "${scenario.sid}" failed validation rules.`
      );
      return null; // This scenario is invalid
    }
    return scenarioLevelData;
  } catch (e) {
    console.error(`Error processing scenario ${scenario.sid}:`, e);
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
        console.log(`Loading predefined scenario: ${scenarioId}`);
        levelToLoad = getLevelDataFromScenario(scenario);
        if (levelToLoad) {
          newQueryString = encodeLevelDataToQueryString(levelToLoad);
        } else {
          // Predefined scenario itself is invalid
          console.warn(
            `Predefined scenario "${scenarioId}" is invalid. Falling back to default.`
          );
          redirectToDefault = true;
        }
      } else {
        console.warn(
          `Scenario ID "${scenarioId}" not found. Falling back to default.`
        );
        redirectToDefault = true;
      }
    } else if (
      params.has("blocks") &&
      params.has("solution") &&
      params.has("required") &&
      params.has("hint")
    ) {
      console.log("Attempting to load level from full URL parameters.");
      levelToLoad = decodeLevelDataFromParams(params);
      if (!levelToLoad) {
        console.warn(
          "Invalid/failed validation for full parameters in URL. Falling back to default."
        );
        redirectToDefault = true;
      }
    } else {
      // Neither sid nor full params are present
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
      // Load default scenario and redirect
      console.log("Redirecting to a valid default scenario.");
      // Attempt to find a valid default scenario from the predefined list
      let validDefaultLevel: LevelData | null = null;
      for (const sc of predefinedScenarios) {
        validDefaultLevel = getLevelDataFromScenario(sc);
        if (validDefaultLevel) break; // Found a valid one
      }

      if (!validDefaultLevel) {
        // Critical error: No valid predefined scenarios to fall back to.
        // This shouldn't happen if predefinedScenarios are defined correctly.
        console.error(
          "CRITICAL: No valid default scenarios available! Check predefinedScenarios definitions and validation logic."
        );
        setIsLoading(false); // Stop loading, show error or blank page
        // Optionally render an error message component here
        setCurrentLevelData(null); // Ensure no game renders
        return;
      }

      const encodedDefault = encodeLevelDataToQueryString(validDefaultLevel);
      // Prevent redirect loop if already on the default and it somehow was invalid initially
      if (
        `${window.location.pathname}?${encodedDefault}` !== window.location.href
      ) {
        window.location.replace(
          `${window.location.pathname}?${encodedDefault}`
        );
        return; // Exit useEffect early due to redirect
      }
      // If we are already at the default URL (e.g. after a redirect), set the data
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
