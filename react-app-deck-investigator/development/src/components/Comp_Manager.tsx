import React, { useState, useCallback } from "react";
import { Card } from "./data/CardImporter";
import { ManualConnection } from "./data/ManualConnection";
import { Position } from "./canvas/ForceLayout";
import Canvas from "./canvas/Canvas";
import CardDescription from "./panel/DetailsPanel";
import { detectSynergies, SynergyConnection } from "./data/SynergyEngine";
import {
  DeckSave,
  loadAllSaves,
  saveSlot,
  deleteSlot,
  exportSingleSave,
  exportSavesToJson,
  importSavesFromJson,
} from "./data/SaveManager";

const Comp_Manager: React.FC = () => {
  // ── Deck state ──────────────────────────────────────────────────────────────
  const [deck,               setDeck]               = useState<Card[] | null>(null);
  const [game,               setGame]               = useState<string>("MTG");
  const [decklistText,       setDecklistText]       = useState<string>("");
  const [synergyConnections, setSynergyConnections] = useState<SynergyConnection[]>([]);

  // ── Lifted canvas state ─────────────────────────────────────────────────────
  const [positionMap,       setPositionMap]       = useState<Record<string, Position>>({});
  const [manualConnections, setManualConnections] = useState<ManualConnection[]>([]);

  // ── Preview / select ────────────────────────────────────────────────────────
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [selectCard,  setSelectCard]  = useState<Card | null>(null);

  // ── Saves ───────────────────────────────────────────────────────────────────
  const [saves, setSaves] = useState<DeckSave[]>(() => loadAllSaves());

  // ── Deck update (called by CardImporter) ────────────────────────────────────
  const updateDeck = useCallback((list: Card[], gameStr: string, rawText: string) => {
    const synergies = detectSynergies(list, gameStr);
    setDeck(list);
    setGame(gameStr);
    setDecklistText(rawText);
    setSynergyConnections(synergies);
    // Clear canvas state when a new deck is loaded
    setPositionMap({});
    setManualConnections([]);
  }, []);

  // ── Card interactions ───────────────────────────────────────────────────────
  const onClickCard = useCallback((card: Card) => {
    setSelectCard(card);
    setPreviewCard(card);
  }, []);

  const onMouseOver = useCallback((card: Card) => {
    setPreviewCard(card);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (selectCard != null) setPreviewCard(selectCard);
  }, [selectCard]);

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = useCallback((name: string) => {
    const save: DeckSave = {
      name,
      savedAt: Date.now(),
      game,
      decklistText,
      positions: positionMap,
      manualConnections,
    };
    const updated = saveSlot(save);
    setSaves(updated);
  }, [game, decklistText, positionMap, manualConnections]);

  // ── Load ────────────────────────────────────────────────────────────────────
  const handleLoad = useCallback((save: DeckSave) => {
    import("./data/CardImporter").then(({ fetchCardDataStandalone }) => {
      fetchCardDataStandalone(save.decklistText, save.game).then((cards: Card[]) => {
        const synergies = detectSynergies(cards, save.game);
        setDeck(cards);
        setGame(save.game);
        setDecklistText(save.decklistText);
        setSynergyConnections(synergies);
        setPositionMap(save.positions);
        setManualConnections(save.manualConnections);
      });
    });
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((name: string) => {
    const updated = deleteSlot(name);
    setSaves(updated);
  }, []);

  // ── Export single ───────────────────────────────────────────────────────────
  const handleExportSingle = useCallback((save: DeckSave) => {
    exportSingleSave(save);
  }, []);

  // ── Export all ──────────────────────────────────────────────────────────────
  const handleExportAll = useCallback(() => {
    exportSavesToJson(saves);
  }, [saves]);

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = useCallback(async (file: File) => {
    const result = await importSavesFromJson(file);
    if (result.ok) {
      setSaves(result.merged);
    } else {
      alert(result.error);
    }
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <Canvas
        cards={deck}
        synergyConnections={synergyConnections}
        positionMap={positionMap}
        manualConnections={manualConnections}
        onPositionMapChange={setPositionMap}
        onManualConnectionsChange={setManualConnections}
        onClickCard={onClickCard}
        onMouseOver={onMouseOver}
        onMouseLeave={onMouseLeave}
      />
      <CardDescription
        selectedCard={previewCard}
        onDeckUpdate={updateDeck}
        saves={saves}
        currentDecklistText={decklistText}
        onSave={handleSave}
        onLoad={handleLoad}
        onDelete={handleDelete}
        onExportSingle={handleExportSingle}
        onExportAll={handleExportAll}
        onImport={handleImport}
      />
    </div>
  );
};

export default Comp_Manager;