import React, { useState, useCallback, useMemo } from "react";
import { Card, fetchCardDataStandalone } from "./data/CardImporter";
import { ManualConnection } from "./data/ManualConnection";
import { CanvasEllipse } from "./canvas/CanvasEllipse";
import { Position } from "./canvas/ForceLayout";
import Canvas from "./canvas/Canvas";
import CardDescription from "./panel/DetailsPanel";
import { detectSynergies, buildRoleMap, detectLorcanaSynergies, buildLorRoleMap, detectYgoSynergies, buildYgoRoleMap, SynergyConnection } from "./data/SynergyEngine";
import { resetLabelColors } from "./canvas/labelToColor";
import { runForceLayout } from "./canvas/ForceLayout";
import { LEGEND_MARGIN, canvasWidth, canvasHeight } from "./canvas/canvasUtils";
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

  // ── Add card UI state ────────────────────────────────────────────────────────
  const [addCardName,    setAddCardName]    = useState<string>("");
  const [colorWarning,   setColorWarning]   = useState<string | null>(null);
  const [addCardLoading, setAddCardLoading] = useState<boolean>(false);
  const [addCardError,   setAddCardError]   = useState<string | null>(null);

  // ── Saves ───────────────────────────────────────────────────────────────────
  const [saves, setSaves] = useState<DeckSave[]>(() => loadAllSaves());

  // ── Deck update (called by CardImporter on full import) ─────────────────────
  const updateDeck = useCallback((list: Card[], gameStr: string, rawText: string) => {
    resetLabelColors();
    const synergies = gameStr === "LOR"
      ? detectLorcanaSynergies(list)
      : gameStr === "YGO"
      ? detectYgoSynergies(list)
      : detectSynergies(list, gameStr);
    const roleMap   = gameStr === "LOR"
      ? buildLorRoleMap(list)
      : gameStr === "YGO"
      ? buildYgoRoleMap(list)
      : buildRoleMap(list);
    const positions = runForceLayout(list, synergies, LEGEND_MARGIN, roleMap);
    setDeck(list);
    setGame(gameStr);
    setDecklistText(rawText);
    setSynergyConnections(synergies);
    setPositionMap(positions);
    setManualConnections([]);
    setDisabledCards(new Set());
    setPrintingOverrides({});
    setEllipses([]);
    setAddCardError(null);

    // Warn if Lorcana deck uses more than 2 ink colors
    if (gameStr === "LOR") {
      const colors = new Set(
        list.flatMap(c => c.info.map(f => f.inkColor).filter(Boolean))
      );
      if (colors.size > 2) {
        setColorWarning(`This deck uses ${colors.size} ink colors (${Array.from(colors).join(", ")}). Lorcana decks are limited to 2.`);
      } else {
        setColorWarning(null);
      }
    } else {
      setColorWarning(null);
    }
  }, []);

  // ── Add a single card by name ────────────────────────────────────────────────
  // Fetches just the one card from the API, appends it to the existing deck,
  // re-runs synergy detection, and places it near the canvas center.
  // The existing position map and manual connections are preserved.
  const handleAddCard = useCallback(async () => {
    const name = addCardName.trim();
    if (!name || !deck) return;
    setAddCardLoading(true);
    setAddCardError(null);

    try {
      // Reuse the existing standalone fetch with a single-line decklist
      const fetched = await fetchCardDataStandalone(`1 ${name}`, game);
      const newCard = fetched[0];

      if (!newCard || !newCard.info || newCard.info.length === 0) {
        setAddCardError(`"${name}" not found.`);
        setAddCardLoading(false);
        return;
      }

      // If card is already in the deck, just increment quantity instead
      const existing = deck.find(
        c => c.cardname.toLowerCase() === newCard.cardname.toLowerCase()
      );
      let nextDeck: Card[];
      if (existing) {
        nextDeck = deck.map(c =>
          c.cardname.toLowerCase() === newCard.cardname.toLowerCase()
            ? { ...c, quantity: String(parseInt(c.quantity) + 1) }
            : c
        );
      } else {
        // Place near canvas center
        const cx = canvasWidth  / 2 - 20;
        const cy = canvasHeight / 2 - 33;
        nextDeck = [...deck, { ...newCard, x: cx, y: cy }];
      }

      const synergies = game === "LOR"
        ? detectLorcanaSynergies(nextDeck)
        : game === "YGO"
        ? detectYgoSynergies(nextDeck)
        : detectSynergies(nextDeck, game);

      // Build updated decklist text so saves stay accurate
      const nextText = nextDeck
        .map(c => `${c.quantity}x ${c.cardname}`)
        .join("\n");

      setSynergyConnections(synergies);
      setDeck(nextDeck);
      setDecklistText(nextText);

      // Place the new card in the position map near center; existing positions untouched
      if (!existing) {
        const cx = canvasWidth  / 2 - 20;
        const cy = canvasHeight / 2 - 33;
        setPositionMap(prev => ({
          ...prev,
          [newCard.cardname]: { x: cx, y: cy },
        }));
      }

      setAddCardName("");
    } catch (err) {
      setAddCardError("Failed to fetch card. Check your connection.");
    }

    setAddCardLoading(false);
  }, [addCardName, deck, game]);

  // ── Remove a single card by name ─────────────────────────────────────────────
  // Removes the card entirely from the deck regardless of quantity.
  // Cleans up its position, any manual connections it's part of, and
  // any disabled/override state.
  const handleRemoveCard = useCallback((cardname: string) => {
    if (!deck) return;
    const nextDeck = deck.filter(c => c.cardname !== cardname);
    const synergies = game === "LOR"
      ? detectLorcanaSynergies(nextDeck)
      : game === "YGO"
      ? detectYgoSynergies(nextDeck)
      : detectSynergies(nextDeck, game);
    const nextText  = nextDeck.map(c => `${c.quantity}x ${c.cardname}`).join("\n");

    setDeck(nextDeck);
    setSynergyConnections(synergies);
    setDecklistText(nextText);
    setPositionMap(prev => {
      const next = { ...prev };
      delete next[cardname];
      return next;
    });
    setManualConnections(prev =>
      prev.filter(c => c.from !== cardname && c.to !== cardname)
    );
    setDisabledCards(prev => {
      const next = new Set(prev);
      next.delete(cardname);
      return next;
    });
    setPrintingOverrides(prev => {
      const next = { ...prev };
      delete next[cardname];
      return next;
    });
    if (previewCard?.cardname === cardname) setPreviewCard(null);
    if (selectCard?.cardname  === cardname) setSelectCard(null);
  }, [deck, game, previewCard, selectCard]);

  // ── Card interactions ───────────────────────────────────────────────────────
  const onClickCard = useCallback((card: Card) => {
    setSelectCard(card);
    setPreviewCard(card);
  }, []);

  const onMouseOver  = useCallback((card: Card) => { setPreviewCard(card); }, []);
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
      synergyConnections,
    };
    const updated = saveSlot(save);
    setSaves(updated);
  }, [game, decklistText, positionMap, manualConnections, disabledCards, printingOverrides, ellipses, synergyConnections]);

  // ── Load ────────────────────────────────────────────────────────────────────
  const handleLoad = useCallback((save: DeckSave) => {
    import("./data/CardImporter").then(({ fetchCardDataStandalone }) => {
      fetchCardDataStandalone(save.decklistText, save.game).then((cards: Card[]) => {
        resetLabelColors();
        const synergies = save.game === "LOR"
          ? detectLorcanaSynergies(cards)
          : save.game === "YGO"
          ? detectYgoSynergies(cards)
          : detectSynergies(cards, save.game);
        setDeck(cards);
        setGame(save.game);
        setDecklistText(save.decklistText);
        setSynergyConnections(synergies);
        setPositionMap(save.positions);
        setManualConnections(save.manualConnections);
        setDisabledCards(new Set(save.disabledCards ?? []));
        setPrintingOverrides(save.printingOverrides ?? {});
        setEllipses(save.ellipses ?? []);
        if (save.synergyConnections) {
          const solidKeys = new Set(
            save.synergyConnections
              .filter((c: any) => c.solid)
              .map((c: any) => c.label + "|" + c.from + "|" + c.to)
          );
          setSynergyConnections(synergies.map(c =>
            solidKeys.has(c.label + "|" + c.from + "|" + c.to)
              ? { ...c, solid: true } : c
          ));
        }
        setAddCardError(null);
      });
    });
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((name: string) => {
    setSaves(deleteSlot(name));
  }, []);

  // ── Export / Import ─────────────────────────────────────────────────────────
  const handleExportSingle = useCallback((save: DeckSave) => { exportSingleSave(save); }, []);
  const handleExportAll    = useCallback(() => { exportSavesToJson(saves); }, [saves]);
  const handleImport = useCallback(async (file: File) => {
    const result = await importSavesFromJson(file);
    if (result.ok) setSaves(result.merged);
    else alert(result.error);
  }, []);

  // ── Apply printing overrides ────────────────────────────────────────────────
  const displayDeck = useMemo(() => {
    if (!deck || Object.keys(printingOverrides).length === 0) return deck;
    return deck.map(card => {
      const override = printingOverrides[card.cardname];
      if (!override) return card;
      return {
        ...card,
        info: card.info.map((face, i) =>
          i === 0 ? { ...face, imageUrl: override } : face
        ),
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
        onToggleDisabled={(name: string) => setDisabledCards(prev => {
          const next = new Set(prev);
          next.has(name) ? next.delete(name) : next.add(name);
          return next;
        })}
        onRemoveCard={handleRemoveCard}
        colorWarning={colorWarning}
        onDismissColorWarning={() => setColorWarning(null)}
        // ── Add card controls ───────────────────────────────────────────────
        addCardName={addCardName}
        addCardLoading={addCardLoading}
        addCardError={addCardError}
        onAddCardNameChange={setAddCardName}
        onAddCard={handleAddCard}
      />
    </div>
  );
};

export default Comp_Manager;