<!-- PROJECT LOGO -->
<div align="center">
  <a href="https://github.com/spacecupcake1/momentse">
    <img src="resources/icon.png" alt="Logo" width="200" height="200">
  </a>
</div>

# 📝 Über das Projekt

Moments ist eine moderne Tagebuch-App, die es Nutzern ermöglicht, ihre persönlichen Erlebnisse und Gedanken in verschiedenen Medienformaten festzuhalten. Die App wurde entwickelt, um das traditionelle Tagebuchschreiben in das digitale Zeitalter zu bringen.

## 🎯 Hauptfunktionen

- **Multimediale Einträge**: Text, Fotos und Audioaufnahmen
- **Automatische Standorterfassung**: Speichert den Ort jedes Eintrags
- **Filterbare Übersicht**: Nach Datum und Standort durchsuchbar
- **Dark Mode**: Für angenehmes Schreiben bei Tag und Nacht
- **Erinnerungen**: Personalisierbare Benachrichtigungen

## 🛠️ Entwickelt mit

- [Ionic Framework](https://ionicframework.com/) - UI-Komponenten und App-Entwicklung
- [Angular](https://angular.io/) - Frontend Framework
- [Capacitor](https://capacitorjs.com/) - Native App-Funktionen
- [Supabase](https://supabase.com/) - Backend und Datenbank

## 📱 Genutzte Geräteschnittstellen

- Kamera für Fotoaufnahmen
- Mikrofon für Sprachnotizen
- GPS für Standorterfassung
- Push-Benachrichtigungen

---

## 🚀 Installation & Setup

### Voraussetzungen

- Node.js (Version 16 oder höher)
- npm (Version 8 oder höher)
- Ionic CLI
  ```bash
  npm install -g @ionic/cli
  ```
- Android Studio (für Android-Entwicklung)
- Xcode (für iOS-Entwicklung, nur macOS)

### Installation

1. Repository klonen:
   ```bash
   git clone https://github.com/spacecupcake1/moments.git
   ```

2. In das Projektverzeichnis wechseln:
   ```bash
   cd moments
   ```

3. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

4. Entwicklungsserver starten:
   ```bash
   ionic serve
   ```

### Build-Prozess

#### Android

```bash
ionic build
npx cap add android
npx cap sync
npx cap open android
```

#### iOS (nur macOS)

```bash
ionic build
npx cap add ios
npx cap sync
npx cap open ios
```

---

## 📱 App-Struktur

### Tabs

1. **Einträge**: Liste aller Tagebucheinträge
2. **Statistik**: Übersicht und Analysen
3. **Einstellungen**: App-Konfiguration

### Pages

1. **Neuer Eintrag**: Erstellen von Einträgen
2. **Eintrag Details**: Anzeige einzelner Einträge
3. **Eintrag Bearbeiten**: Modifikation bestehender Einträge

---

## 🔒 Datenschutz & Sicherheit

- Lokale Speicherung sensibler Daten
- Verschlüsselte Übertragung
- Keine Weitergabe an Dritte
