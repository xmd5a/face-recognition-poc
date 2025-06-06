import { useState, useEffect } from "react";
import Game from "./components/Game";
import type { Block } from "./components/BlockList";

// --- Master Block List ---
const allGameBlocksMaster: Block[] = [
  {
    id: "1",
    name: "loadImage()",
    description: "Wczytuje obraz z podanego źródła, np. z pliku lub URL.",
    command: "LOAD",
  },
  {
    id: "2",
    name: "resizeImage()",
    description: "Zmienia rozmiar obrazu na ustandaryzowany, pasujący do dalszego przetwarzania.",
    command: "RESIZE",
  },
  {
    id: "3",
    name: "detectFace()",
    description: "Wykrywa twarze na obrazie, zaznaczając je do analizy.",
    command: "DETECT",
  },
  {
    id: "4",
    name: "extractFeatures()",
    description: "Wydobywa charakterystyczne cechy twarzy w celu porównania lub identyfikacji.",
    command: "EXTRACT",
  },
  {
    id: "5",
    name: "compareWithDatabase()",
    description: "Porównuje uzyskane cechy z zapisanymi w bazie znanych twarzy.",
    command: "COMPARE",
  },
  {
    id: "6",
    name: "getIdentity()",
    description: "Określa tożsamość osoby na podstawie najlepszego dopasowania w bazie.",
    command: "IDENTIFY",
  },
  {
    id: "7",
    name: "logResult()",
    description: "Zapisuje wynik procesu (np. identyfikacji) do dziennika lub rejestru.",
    command: "LOG",
  },
  {
    id: "8",
    name: "displayResult()",
    description: "Prezentuje użytkownikowi końcowy wynik operacji, np. tożsamość.",
    command: "DISPLAY",
  },
  {
    id: "9",
    name: "normalizeData()",
    description: "Przekształca dane do jednolitego formatu, eliminując różnice techniczne.",
    command: "NORMALIZE",
  },
  {
    id: "10",
    name: "authenticateUser()",
    description: "Sprawdza, czy użytkownik ma prawo dostępu do systemu lub zasobów.",
    command: "AUTH_USER",
  },
  {
    id: "11",
    name: "fetchData()",
    description: "Pobiera dane z zewnętrznego źródła, np. API lub innej bazy danych.",
    command: "FETCH_DATA",
  },
  {
    id: "12",
    name: "processPayment()",
    description: "Realizuje transakcję finansową, w tym obciążenie i weryfikację.",
    command: "PAY_PROC",
  },
  {
    id: "13",
    name: "updateDatabase()",
    description: "Wprowadza zmiany lub aktualizacje w bazie danych.",
    command: "DB_UPDATE",
  },
  {
    id: "14",
    name: "renderUI()",
    description: "Tworzy i wyświetla graficzny interfejs użytkownika.",
    command: "UI_RENDER",
  },
  {
    id: "15",
    name: "startTransaction()",
    description: "Rozpoczyna transakcję bazodanową, umożliwiając grupowanie operacji.",
    command: "TX_BEGIN",
  },
  {
    id: "16",
    name: "createBackup()",
    description: "Tworzy kopię zapasową danych przed wykonaniem operacji.",
    command: "BACKUP_CREATE",
  },
  {
    id: "17",
    name: "validateFormat()",
    description: "Sprawdza, czy plik ma oczekiwany format i strukturę.",
    command: "VALIDATE_FORMAT",
  },
  {
    id: "18",
    name: "compressData()",
    description: "Zmniejsza rozmiar danych poprzez kompresję.",
    command: "COMPRESS",
  },
  {
    id: "19",
    name: "encryptData()",
    description: "Szyfruje dane w celu zapewnienia poufności.",
    command: "ENCRYPT",
  },
  {
    id: "20",
    name: "sendNotification()",
    description: "Wysyła powiadomienie do użytkownika lub systemu zewnętrznego.",
    command: "NOTIFY",
  },
  {
    id: "21",
    name: "generateReport()",
    description: "Tworzy raport na podstawie zebranych danych lub wyników.",
    command: "REPORT_GEN",
  },
  {
    id: "22",
    name: "cleanupTemp()",
    description: "Usuwa tymczasowe pliki i niepotrzebne dane.",
    command: "CLEANUP",
  },
  {
    id: "23",
    name: "optimizeMemory()",
    description: "Poprawia zarządzanie pamięcią w systemie.",
    command: "MEM_OPT",
  },
  {
    id: "24",
    name: "verifyChecksum()",
    description: "Porównuje sumy kontrolne, aby wykryć ewentualne błędy w danych.",
    command: "CHECKSUM",
  },
  {
    id: "25",
    name: "parseConfig()",
    description: "Odczytuje i interpretuje plik konfiguracyjny.",
    command: "CONFIG_PARSE",
  },
  {
    id: "26",
    name: "initDatabase()",
    description: "Inicjuje bazę danych przed jej dalszym użyciem.",
    command: "DB_INIT",
  },
  {
    id: "27",
    name: "validatePermissions()",
    description: "Sprawdza, czy użytkownik ma odpowiednie uprawnienia.",
    command: "PERM_VALIDATE",
  },
  {
    id: "28",
    name: "createIndex()",
    description: "Tworzy indeksy w bazie danych, przyspieszające zapytania.",
    command: "INDEX_CREATE",
  },
  {
    id: "29",
    name: "optimizeQuery()",
    description: "Usprawnia zapytania do bazy danych, poprawiając wydajność.",
    command: "QUERY_OPT",
  },
  {
    id: "30",
    name: "handleError()",
    description: "Obsługuje błędy — zapisuje, raportuje lub naprawia problemy.",
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
    hint: `Ułóż funkcje we właściwej kolejności, a następnie kliknij przycisk „kompiluj”, aby przeanalizować i uruchomić kod.\n\n---\nTwoim celem jest identyfikacja osoby na podstawie obrazu. Przemyśl, jakie etapy są niezbędne, by przeanalizować twarz i porównać ją z zapisanymi wzorcami. Zastanów się, które funkcje przygotowują obraz, a które przeprowadzają właściwe rozpoznanie.`
  },
  {
    sid: "data_integrity_check",
    name: "Data Integrity Check",
    availableBlockIds: ["11", "17", "24", "7"], // 4 available
    solution: ["11", "17", "24"],  // 3 required
    required: 3,
    hint: `Ułóż funkcje we właściwej kolejności, a następnie kliknij przycisk „kompiluj”, aby przeanalizować i uruchomić kod.\n\n---\nW tym scenariuszu musisz upewnić się, że dane pochodzące z zewnętrznego źródła są wiarygodne. Skup się na krokach pozwalających ocenić spójność i strukturę danych oraz sposobie ich dokumentowania.`
  },
  {
    sid: "standard_db_maintenance",
    name: "Standard DB Maintenance",
    availableBlockIds: ["25", "15", "26", "27", "13", "7", "30", "29"], // 8 available
    solution: ["25", "15", "26", "13", "7"], // 5 required
    required: 5,
    hint: `Ułóż funkcje we właściwej kolejności, a następnie kliknij przycisk „kompiluj”, aby przeanalizować i uruchomić kod.\n\n---\nZajmujesz się utrzymaniem bazy danych. Zastanów się, jakie czynności powinny zostać wykonane od momentu rozpoczęcia operacji aż po ich zapisanie. Pomocne może być rozważenie kolejności: przygotowanie — modyfikacja — zapis.`
  },
];

// --- Validation Helper ---
const validateLevelData = (data: LevelData): boolean => {
  if (data.required <= 0) return false;
  if (data.required > 7) return false;
  if (data.availableBlocks.length <= data.required) return false;
  if (data.availableBlocks.length < data.required + 1) return false;
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
