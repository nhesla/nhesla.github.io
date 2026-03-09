import React, { useState, useCallback, useMemo } from "react";
import { Card } from "./data/CardImporter";
import { ManualConnection } from "./data/ManualConnection";
import { CanvasEllipse } from "./canvas/CanvasEllipse";
import { Position } from "./canvas/ForceLayout";
import Canvas from "./canvas/Canvas";
import CardDescription from "./panel/DetailsPanel";
import { detectSynergies, SynergyConnection } from "./data/SynergyEngine";
import { resetLabelColors } from "./canvas/labelToColor";
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
  const [disabledCards,     setDisabledCards]     = useState<Set<string>>(new Set());
  const [printingOverrides, setPrintingOverrides] = useState<Record<string, string>>({});
  const [ellipses,          setEllipses]          = useState<CanvasEllipse[]>([]);

  // ── Preview / select ────────────────────────────────────────────────────────
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [selectCard,  setSelectCard]  = useState<Card | null>(null);

  // ── Saves ───────────────────────────────────────────────────────────────────
  const [saves, setSaves] = useState<DeckSave[]>(() => loadAllSaves());

  // ── Deck update (called by CardImporter) ────────────────────────────────────
  const updateDeck = useCallback((list: Card[], gameStr: string, rawText: string) => {
    resetLabelColors(); // reset before detecting so palette assigns from scratch
    const synergies = detectSynergies(list, gameStr);
    setDeck(list);
    setGame(gameStr);
    setDecklistText(rawText);
    setSynergyConnections(synergies);
    // Clear canvas state when a new deck is loaded
    setPositionMap({});
    setManualConnections([]);
    setDisabledCards(new Set());
    setPrintingOverrides({});
    setEllipses([]);
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
      disabledCards: Array.from(disabledCards),
      printingOverrides,
      ellipses,
      synergyConnections: synergyConnections,
    };
    const updated = saveSlot(save);
    setSaves(updated);
  }, [game, decklistText, positionMap, manualConnections, disabledCards, printingOverrides, ellipses, synergyConnections]);

  // ── Load ────────────────────────────────────────────────────────────────────
  const handleLoad = useCallback((save: DeckSave) => {
    import("./data/CardImporter").then(({ fetchCardDataStandalone }) => {
      fetchCardDataStandalone(save.decklistText, save.game).then((cards: Card[]) => {
        resetLabelColors();
        const synergies = detectSynergies(cards, save.game);
        setDeck(cards);
        setGame(save.game);
        setDecklistText(save.decklistText);
        setSynergyConnections(synergies);
        setPositionMap(save.positions);
        setManualConnections(save.manualConnections);
        setDisabledCards(new Set(save.disabledCards ?? []));
        setPrintingOverrides(save.printingOverrides ?? {});
        setEllipses(save.ellipses ?? []);
        // Restore solid flags from saved synergies onto freshly detected ones
        if (save.synergyConnections) {
          const solidKeys = new Set(
            save.synergyConnections
              .filter((c: any) => c.solid)
              .map((c: any) => c.label + "|" + c.from + "|" + c.to)
          );
          setSynergyConnections(synergies.map(c =>
            solidKeys.has(c.label + "|" + c.from + "|" + c.to) ? { ...c, solid: true } : c
          ));
        }
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

  // ── Apply printing overrides ────────────────────────────────────────────────
  const displayDeck = useMemo(() => {
    if (!deck || Object.keys(printingOverrides).length === 0) return deck;
    return deck.map(card => {
      const override = printingOverrides[card.cardname];
      if (!override) return card;
      return {
        ...card,
        info: card.info.map((face, i) => i === 0 ? { ...face, imageUrl: override } : face),
      };
    });
  }, [deck, printingOverrides]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <Canvas
        cards={displayDeck}
        synergyConnections={synergyConnections}
        positionMap={positionMap}
        manualConnections={manualConnections}
        onPositionMapChange={setPositionMap}
        onManualConnectionsChange={setManualConnections}
        onSynergyConnectionsChange={setSynergyConnections}
        ellipses={ellipses}
        onEllipsesChange={setEllipses}
        disabledCards={disabledCards}
        onToggleDisabled={(name) => setDisabledCards(prev => {
          const next = new Set(prev);
          next.has(name) ? next.delete(name) : next.add(name);
          return next;
        })}
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
        game={game}
        disabledCards={disabledCards}
        printingOverrides={printingOverrides}
        onChangePrinting={(cardname, imageUrl) =>
          setPrintingOverrides(prev => ({ ...prev, [cardname]: imageUrl }))
        }
        onToggleDisabled={(name) => setDisabledCards(prev => {
          const next = new Set(prev);
          next.has(name) ? next.delete(name) : next.add(name);
          return next;
        })}
      />
    </div>
  );
};

export default Comp_Manager;
