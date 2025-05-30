# Dokument wymagań produktu (PRD) - Code Blocks

## 1. Przegląd produktu

Code Blocks to edukacyjna gra logiczna inspirowana zasadami gry Mastermind, która symuluje koncepcje programistyczne poprzez interfejs oparty na blokach funkcyjnych. Gra łączy w sobie elementy programowania z mechaniką układania sekwencji, oferując unikalną retro-terminalową estetykę i nowoczesne wzorce interakcji.

### Cel produktu

- Stworzenie angażującej gry edukacyjnej, która uczy podstaw logiki programowania
- Zapewnienie intuicyjnego interfejsu do eksperymentowania z sekwencjami bloków funkcyjnych
- Umożliwienie tworzenia i udostępniania własnych poziomów bez konieczności przechowywania danych na serwerze

### Główne funkcje

- System 30 predefiniowanych bloków funkcyjnych
- Mechanika walidacji sekwencji bez podpowiedzi
- Edytor poziomów z generowaniem linków do udostępniania
- Podwójny system sterowania (mysz + klawiatura)
- Retro-terminalowy interfejs z efektami wizualnymi

## 2. Problem użytkownika

### Problemy

- Trudność w nauce podstaw logiki programowania
- Brak interaktywnych narzędzi do eksperymentowania z sekwencjami programistycznymi
- Potrzeba natychmiastowej informacji zwrotnej podczas nauki
- Ograniczony dostęp do spersonalizowanych materiałów edukacyjnych

### Rozwiązanie

- Intuicyjny interfejs blokowy eliminujący barierę wejścia związaną z syntaksem
- System natychmiastowej walidacji zachęcający do eksperymentowania
- Możliwość tworzenia własnych poziomów dostosowanych do potrzeb edukacyjnych
- Brak wymagań dotyczących instalacji czy konfiguracji (aplikacja działa w przeglądarce)

## 3. Wymagania funkcjonalne

### System bloków

- Pula 30 predefiniowanych bloków funkcyjnych
- Każdy blok reprezentuje konkretną operację programistyczną
- Jednokrotne użycie bloków w ramach poziomu
- Walidacja poprawności sekwencji

### Mechanika gry

- Konfigurowalny system poziomów (X bloków z puli Y)
- Parametryzacja poziomów przez URL
- System kompilacji z animowanym feedbackiem
- Brak bezpośrednich podpowiedzi przy błędach

### Interfejs użytkownika

- Podział ekranu na edytor (70%) i terminal (30%)
- Trzy kolumny w edytorze (dostępne bloki, przestrzeń robocza, opis/podpowiedzi)
- Retro-terminalowa estetyka z efektami CRT
- Responsywny układ dla przeglądarek desktopowych

### Edytor poziomów

- Interfejs do wyboru dostępnych bloków
- Definiowanie wymaganej liczby bloków
- Określanie poprawnej sekwencji
- Generowanie linków do udostępniania

## 4. Granice produktu

### W zakresie MVP

- Podstawowa mechanika gry oparta na zmodyfikowanej logice Mastermind
- Interfejs użytkownika zgodny ze specyfikacją
- Edytor poziomów z generowaniem linków
- Wsparcie dla przeglądarek desktopowych
- Działanie offline
- System podwójnego sterowania

### Poza zakresem MVP

- Wiele predefiniowanych poziomów
- System osiągnięć
- Efekty dźwiękowe
- Wsparcie dla urządzeń mobilnych
- System zapisywania postępów
- Tryb wieloosobowy
- Tutorial
- System punktacji
- Limity czasowe

## 5. Historyjki użytkowników

### Podstawowa rozgrywka

US-001: Przeglądanie dostępnych bloków

- Jako gracz, chcę przeglądać dostępne bloki funkcyjne
- Kryteria akceptacji:
  - Lista bloków wyświetla się w lewej kolumnie
  - Każdy blok pokazuje nazwę i krótki opis po zaznaczeniu tego bloku, opis pokazuje się w kolumnie prawej
  - Bloki są interaktywne (reagują na hover)
  - Nawigacja możliwa za pomocą myszy i klawiatury (↑/↓)

US-002: Układanie sekwencji

- Jako gracz, chcę układać bloki w sekwencję w przestrzeni roboczej
- Kryteria akceptacji:
  - Możliwość przeciągania bloków między kolumnami
  - Obsługa klawiatury (←/→ do zmiany kolumny, E do przeniesienia)
  - Bloki można użyć tylko raz (można wielokrotnie przenosić z lewej do prawej kolumny)
  - Wizualne oznaczenie wybranego bloku

US-003: Walidacja rozwiązania

- Jako gracz, chcę sprawdzić poprawność mojej sekwencji
- Kryteria akceptacji:
  - Przycisk kompilacji aktywny tylko gdy wszystkie wymagane bloki są użyte
  - Animacja procesu kompilacji w stylu Matrix
  - Informacja o liczbie błędów bez wskazania ich lokalizacji
  - Możliwość ponownych prób bez ograniczeń

### Tworzenie poziomów

US-004: Tworzenie własnego poziomu

- Jako twórca poziomów, chcę stworzyć własny poziom
- Kryteria akceptacji:
  - Interfejs do wyboru dostępnych bloków
  - Możliwość określenia wymaganej liczby bloków (min. 3)
  - Definiowanie poprawnej sekwencji
  - Wybór predefiniowanej podpowiedzi

US-005: Udostępnianie poziomu

- Jako twórca poziomów, chcę udostępnić stworzony poziom
- Kryteria akceptacji:
  - Generowanie unikalnego URL zawierającego parametry poziomu
  - URL zawiera wszystkie niezbędne informacje do odtworzenia poziomu
  - Możliwość skopiowania linku
  - Link działa bez konieczności rejestracji czy logowania

### Interfejs i sterowanie

US-006: Nawigacja interfejsem

- Jako gracz, chcę wygodnie nawigować po interfejsie
- Kryteria akceptacji:
  - Pełna obsługa myszy
  - Kompletny system skrótów klawiszowych
  - Widoczna legenda sterowania
  - Płynne przejścia między elementami

US-007: Wyświetlanie informacji

- Jako gracz, chcę widzieć istotne informacje o poziomie i blokach
- Kryteria akceptacji:
  - Wyświetlanie opisu wybranego bloku w kolumnie po prawej stronie
  - Podpowiedź do aktualnego poziomu
  - Status kompilacji w terminalu
  - Liczba wymaganych/użytych bloków
