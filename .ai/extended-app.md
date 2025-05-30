# Code Blocks - UI Architecture Planning Summary

<conversation_summary>

## Decisions

1. Przyjęcie architektury opartej na React + TypeScript z Vite jako bundlerem
2. Wykorzystanie Shadcn/ui jako podstawy komponentów UI
3. Implementacja systemu zarządzania stanem opartego na React Context
4. Podział aplikacji na dwa główne widoki: Game i Editor
5. Przyjęcie retro-terminalowej estetyki z zaawansowanymi efektami CRT
6. Implementacja podwójnego systemu sterowania (mysz + klawiatura)
7. Wykorzystanie dnd-kit dla operacji drag-and-drop
8. Zastosowanie Framer Motion dla animacji
9. Struktura katalogów zorientowana na komponenty
10. Brak zależności od backendu - wszystkie dane w URL

## Matched Recommendations

1. **Architektura komponentów**

   - Wykorzystanie funkcyjnych komponentów React z hookami
   - Ekstrakcja logiki do custom hooks

2. **Zarządzanie stanem**

   - Wykorzystanie React Context jako głównego rozwiązania
   - Implementacja useCallback dla event handlerów

3. **Struktura projektu**

   - Jasno zdefiniowana struktura katalogów
   - Separacja komponentów UI od logiki biznesowej
   - Modularny system bloków funkcyjnych
   - Izolacja efektów wizualnych w osobnych komponentach

4. **Praktyki kodowania**
   - Early returns dla lepszej czytelności
   - Użycie Tailwind dla stylowania
   - Opisowe nazwy zmiennych i funkcji
   - Implementacja funkcji dostępności

## UI Architecture Planning Summary

### Główne wymagania architektury UI

1. **Struktura widoków**

   - Edytor (70% wysokości ekranu)
     - Lewa kolumna: Dostępne bloki (30%)
     - Środkowa kolumna: Przestrzeń robocza (30%)
     - Prawa kolumna: Opis/podpowiedzi (30%)
   - Terminal (30% wysokości ekranu)

2. **System komponentów**

   ```
   src/
     components/
       blocks/
         Block.tsx
         BlockList.tsx
         BlockWorkspace.tsx
       terminal/
         Terminal.tsx
         CompilationAnimation.tsx
       layout/
         GameLayout.tsx
         EditorLayout.tsx
       ui/
         [shadcn-components]
   ```

3. **Zarządzanie stanem**

   ```typescript
   interface GameState {
     blocks: Block[];
     workspace: Block[];
     scenario: ScenarioConfig;
     isCompiling: boolean;
     errors: number;
   }

   interface ConfigState {
     availableBlocks: Block[];
     scenarioConfig: ScenarioConfig;
     terminalConfig: TerminalConfig;
   }
   ```

### Kluczowe widoki i przepływy

1. **Game View**

   - Wyświetlanie dostępnych bloków
   - Przestrzeń robocza z drag-and-drop
   - Terminal z animacjami kompilacji
   - System podpowiedzi

2. **Editor View**
   - Interfejs wyboru bloków
   - Konfiguracja parametrów poziomu
   - Generator linków do udostępniania
   - Podgląd scenariusza

### Strategia zarządzania stanem

1. **Context API**

   - GameContext dla stanu gry
   - ConfigContext dla konfiguracji
   - Brak zewnętrznych bibliotek zarządzania stanem

### Responsywność, dostępność i bezpieczeństwo

1. **Responsywność**

   - Wsparcie tylko dla przeglądarek desktopowych w MVP
   - Grid-based layout z procentowymi podziałami
   - Elastyczny system komponentów

2. **Bezpieczeństwo**
   - Brak przechowywania danych na serwerze
   - Kodowanie parametrów w URL (Base64)
   - Walidacja danych wejściowych

</conversation_summary>
