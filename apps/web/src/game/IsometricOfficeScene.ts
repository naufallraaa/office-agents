import Phaser from 'phaser';
import { IsometricRenderer } from './IsometricRenderer';
import { useOfficeStore } from '../store/useOfficeStore';
import type { Agent, AgentState } from 'shared';

export interface IsometricSceneCallbacks {
  onAgentSelect?: (agent: Agent) => void;
}

export class IsometricOfficeScene extends Phaser.Scene {
  private agentContainers: Map<string, {
    container: Phaser.GameObjects.Container;
    sprite: Phaser.GameObjects.Sprite;
    plumbob: Phaser.GameObjects.Sprite;
    nameText: Phaser.GameObjects.Text;
    bubbleContainer: Phaser.GameObjects.Container;
    bubbleText: Phaser.GameObjects.Text;
    currentFloor: number;
    currentX: number;
    currentY: number;
    traversing: boolean;
  }> = new Map();

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private callbacks: IsometricSceneCallbacks = {};

  // Vertical Centers for each floor (for camera transitions)
  public static readonly FLOOR_CENTERS = {
    1: { x: 500, y: 700 },   // Floor 1: Cafe & Lounge
    2: { x: 500, y: -200 },  // Floor 2: Workspace (Default)
    3: { x: 500, y: -1100 }, // Floor 3: Rooftop Boardroom
  };

  // Spiral stairwell shaft: all floor stairs share x=500 (tile 1,1)
  private static readonly SHAFT_X = 500;
  private static readonly STAIR_Y: Record<number, number> = {
    1: 532,    // Floor 1 stair base (originY 500 + 32) — flights only UP
    2: -368,   // Floor 2 stair base (originY -400 + 32) — flights UP + DOWN
    3: -1268,  // Floor 3 stair base (originY -1300 + 32) — flights only DOWN
  };
  // One helix turn every 300px of height; agent path uses the same formula
  private static readonly HELIX_TURN_PX = 300;
  private static readonly HELIX_RADIUS = 26;
  private static readonly FLAT_SPEED = 0.3; // px per ms on flat floor
  private static readonly CLIMB_SPEED = 0.15; // px per ms on stairs (slow climb)

  /** Helix angle for a given world y (shared by renderer + walk path) */
  private static helixAngle(y: number): number {
    return ((y - IsometricOfficeScene.STAIR_Y[3]) / IsometricOfficeScene.HELIX_TURN_PX) * Math.PI * 2;
  }

  // Specific spot coordinates per floor (in grid coordinates)
  public static readonly SPOTS = {
    floor2_desks: {
      pm: { gx: 3, gy: 3 },
      it_lead: { gx: 6, gy: 3 },
      backend: { gx: 9, gy: 3 },
      frontend: { gx: 3, gy: 7 },
      qa: { gx: 6, gy: 7 },
      devops: { gx: 9, gy: 7 },
    },
    floor1_cafe: [
      { gx: 3, gy: 4 }, // Cafe counter
      { gx: 5, gy: 4 }, // Cafe table
      { gx: 7, gy: 5 }, // Dining table
      { gx: 3, gy: 8 }, // Lounge sofa
      { gx: 5, gy: 8 }, // Lounge table
      { gx: 8, gy: 8 }, // Snack bar
    ],
    floor3_boardroom: [
      { gx: 4, gy: 4 },
      { gx: 5, gy: 4 },
      { gx: 6, gy: 4 },
      { gx: 4, gy: 6 },
      { gx: 5, gy: 6 },
      { gx: 6, gy: 6 },
    ],
  };

  constructor() {
    super({ key: 'IsometricOfficeScene' });
  }

  public setCallbacks(callbacks: IsometricSceneCallbacks) {
    this.callbacks = callbacks;
  }

  create() {
    // 1. Generate all HD Isometric Textures & Characters
    IsometricRenderer.generateAll(this);

    // 2. Render 3 Floors
    this.renderFloor1Cafe();
    this.renderFloor2Workspace();
    this.renderFloor3Boardroom();

    // 2b. Continuous stairwell shaft linking all 3 floors
    this.renderStairShaft();

    // 3. Setup Camera & Controls
    this.setupCamera();

    // 4. Initial sync with Zustand store
    const initialAgents = useOfficeStore.getState().agents;
    this.syncAgents(initialAgents);

    const unsubscribe = useOfficeStore.subscribe((state) => {
      if (this.sys && this.sys.isActive()) {
        this.syncAgents(state.agents);
      }
    });

    this.events.once('shutdown', () => unsubscribe());
    this.events.once('destroy', () => unsubscribe());
  }

  // ==========================================
  // BUILDING SHELL: indoor back-walls with windows + concrete slab skirt
  // ==========================================
  private renderBuildingShell(
    originX: number, originY: number, gridSize: number,
    wallBase: number, wallTrim: number, glassTint: number, panoramic: boolean,
  ) {
    const G = gridSize;
    const H = 68; // wall height
    const g = this.add.graphics().setDepth(1);
    const T = (gx: number, gy: number) => {
      const p = IsometricRenderer.toScreen(gx, gy);
      return { x: originX + p.x, y: originY + p.y };
    };

    // ---- Concrete slab skirt under the two front edges ----
    const fl = T(0, G - 1);
    const fr = T(G - 1, 0);
    const fc = T(G - 1, G - 1);
    const SK = 14;
    g.fillStyle(0x111827, 1);
    g.fillPoints([fl, fc, { x: fc.x, y: fc.y + SK }, { x: fl.x, y: fl.y + SK }], true);
    g.fillPoints([fr, fc, { x: fc.x, y: fc.y + SK }, { x: fr.x, y: fr.y + SK }], true);
    g.lineStyle(2, 0x475569, 0.9);
    g.strokePoints([fl, fc, fr], false);

    // ---- Back walls along the two rear edges ----
    const seg = (ax: number, ay: number, bx: number, by: number, withWindow: boolean) => {
      const A = { x: originX + ax, y: originY + ay };
      const B = { x: originX + bx, y: originY + by };
      const At = { x: A.x, y: A.y - H };
      const Bt = { x: B.x, y: B.y - H };
      g.fillStyle(wallBase, 1);
      g.fillPoints([A, B, Bt, At], true);
      if (withWindow) {
        const s = 0.2, b = 15, t = 13;
        const wAb = { x: A.x + (B.x - A.x) * s, y: A.y + (B.y - A.y) * s - b };
        const wBb = { x: A.x + (B.x - A.x) * (1 - s), y: A.y + (B.y - A.y) * (1 - s) - b };
        const wh = H - b - t;
        const wAt = { x: wAb.x, y: wAb.y - wh };
        const wBt = { x: wBb.x, y: wBb.y - wh };
        g.fillStyle(wallTrim, 1);
        g.fillPoints([wAb, wBb, wBt, wAt], true);
        g.fillStyle(glassTint, 0.85);
        g.fillPoints([
          { x: wAb.x + 2, y: wAb.y - 2 },
          { x: wBb.x - 2, y: wBb.y - 2 },
          { x: wBt.x - 2, y: wBt.y + 2 },
          { x: wAt.x + 2, y: wAt.y + 2 },
        ], true);
        // Window mullion cross
        g.lineStyle(1, wallTrim, 1);
        g.strokeLineShape(new Phaser.Geom.Line(
          (wAb.x + wBb.x) / 2, (wAb.y + wBb.y) / 2,
          (wAt.x + wBt.x) / 2, (wAt.y + wBt.y) / 2,
        ));
      }
    };

    for (let i = 0; i < G; i++) {
      const a = IsometricRenderer.toScreen(i, 0);
      const b = IsometricRenderer.toScreen(i + 1, 0);
      seg(a.x, a.y, b.x, b.y, panoramic ? i % 2 === 0 : i % 2 === 1);
    }
    for (let i = 0; i < G; i++) {
      const a = IsometricRenderer.toScreen(0, i);
      const b = IsometricRenderer.toScreen(0, i + 1);
      seg(a.x, a.y, b.x, b.y, panoramic ? i % 2 === 1 : i % 2 === 0);
    }

    // Top trim beam along both rear edges
    g.lineStyle(3, wallTrim, 1);
    const back = T(0, 0);
    const endL = T(G, 0);
    const endR = T(0, G);
    g.strokePoints([
      { x: endL.x, y: endL.y - H },
      { x: back.x, y: back.y - H },
      { x: endR.x, y: endR.y - H },
    ], false);
  }

  // ==========================================
  // SPIRAL STAIRWELL SHAFT (helix winding L3 <-> L2 <-> L1)
  // F3 landing: flights DOWN only | F2: UP + DOWN | F1: UP only
  // ==========================================
  private renderStairShaft() {
    const X = IsometricOfficeScene.SHAFT_X;
    const R = IsometricOfficeScene.HELIX_RADIUS;
    const top = -1380;
    const bottom = 620;
    const g = this.add.graphics().setDepth(2);

    // Glass enclosure walls (full height, suggests glass cylinder)
    g.fillStyle(0x7dd3fc, 0.10);
    g.fillRect(X - 42, top, 9, bottom - top);
    g.fillRect(X + 33, top, 9, bottom - top);
    g.lineStyle(2, 0x7dd3fc, 0.5);
    g.strokeRect(X - 42, top, 9, bottom - top);
    g.strokeRect(X + 33, top, 9, bottom - top);

    // Central newel column (full height spine of the spiral)
    g.fillStyle(0x3a4a63, 1);
    g.fillRect(X - 8, top, 16, bottom - top);
    g.fillStyle(0x5a6f8f, 1);
    g.fillRect(X - 8, top, 4, bottom - top);

    // Helical treads winding around the column (both gaps: F3->F2, F2->F1)
    const railPts: Array<{ x: number; y: number }> = [];
    for (let y = -1268; y <= 532; y += 10) {
      const a = IsometricOfficeScene.helixAngle(y);
      const cx = X + R * Math.cos(a);
      const front = Math.sin(a) > 0; // front half of the turn
      // Tread
      g.fillStyle(front ? 0xcbd5e1 : 0x64748b, 1);
      g.fillRect(cx - 11, y, 22, 4.5);
      g.fillStyle(front ? 0xffffff : 0x94a3b8, 1);
      g.fillRect(cx - 11, y, 22, 1.5);
      // Outer railing post every ~60px on the front half
      if (front && Math.round((y + 1268) % 60) < 10) {
        const px = X + (R + 8) * Math.cos(a);
        g.fillStyle(0x475569, 1);
        g.fillRect(px - 1, y - 16, 2, 16);
        railPts.push({ x: px, y: y - 16 });
      }
    }
    // Spiral handrail polyline through post tops
    if (railPts.length > 1) {
      g.lineStyle(2, 0xa97a4a, 1);
      g.strokePoints(railPts, false);
    }

    // Landings at each floor stair + floor plates
    const landings = [
      { y: -1268, label: '3F', color: '#c084fc' },
      { y: -368, label: '2F', color: '#38bdf8' },
      { y: 532, label: '1F', color: '#fbbf24' },
    ];
    landings.forEach(l => {
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(X - 42, l.y - 2, 84, 13, 3);
      g.fillStyle(0x94a3b8, 1);
      g.fillRoundedRect(X - 42, l.y - 2, 84, 4, { tl: 3, tr: 3, bl: 0, br: 0 });
      this.add.text(X + 50, l.y - 12, l.label, {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: l.color,
        backgroundColor: '#090d16cc',
        padding: { x: 4, y: 2 },
      }).setDepth(3);
    });
  }

  /** Hang a framed art on a rear wall segment */
  private placeWallArt(texture: string, originX: number, originY: number, edge: 'left' | 'right', segIndex: number) {
    const a = edge === 'left'
      ? IsometricRenderer.toScreen(segIndex, 0)
      : IsometricRenderer.toScreen(0, segIndex);
    const b = edge === 'left'
      ? IsometricRenderer.toScreen(segIndex + 1, 0)
      : IsometricRenderer.toScreen(0, segIndex + 1);
    const mx = originX + (a.x + b.x) / 2;
    const my = originY + (a.y + b.y) / 2 - 44;
    this.add.image(mx, my, texture).setDepth(3);
  }

  /** Hang a pendant lamp above a floor spot */
  private placePendant(originX: number, originY: number, gx: number, gy: number, drop = 66) {
    const p = IsometricRenderer.toScreen(gx, gy);
    this.add.image(originX + p.x, originY + p.y - drop, 'iso_pendant').setDepth(23);
  }

  // ==========================================
  // FLOOR 1: CAFE, DINING & LOUNGE (Y: 500..900)
  // ==========================================
  private renderFloor1Cafe() {
    const originX = 500;
    const originY = 500;
    const GRID_SIZE = 12;

    // Diamond Marble Floor
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const p = IsometricRenderer.toScreen(x, y);
        this.add.image(originX + p.x, originY + p.y, 'iso_floor_marble').setDepth(0);
      }
    }

    // Indoor shell: warm cream walls + concrete slab
    this.renderBuildingShell(originX, originY, GRID_SIZE, 0xe6d9c2, 0xa8906f, 0x7dd3fc, false);

    // Staircase connecting floors (Top Corner)
    const stairPos = IsometricRenderer.toScreen(1, 1);
    this.add.image(originX + stairPos.x, originY + stairPos.y - 14, 'iso_stairs').setDepth(5);

    // Reception desk near entrance
    const recepPos = IsometricRenderer.toScreen(8, 2);
    this.add.image(originX + recepPos.x, originY + recepPos.y, 'iso_reception').setDepth(10);

    // Cafe Counter & Barista Area
    const cafePos = IsometricRenderer.toScreen(3, 3);
    this.add.image(originX + cafePos.x, originY + cafePos.y, 'iso_cafe_counter').setDepth(10);

    // Lounge rug + sectional sofa + coffee table
    const rugPos = IsometricRenderer.toScreen(5, 7);
    this.add.image(originX + rugPos.x, originY + rugPos.y, 'iso_rug_oval').setDepth(2);
    const sofaPos = IsometricRenderer.toScreen(5, 7);
    this.add.image(originX + sofaPos.x, originY + sofaPos.y, 'iso_lounge_sofa').setDepth(10);
    const coffeePos = IsometricRenderer.toScreen(4, 8);
    this.add.image(originX + coffeePos.x, originY + coffeePos.y, 'iso_coffee_table').setDepth(11);

    // Dining sets
    const dine1 = IsometricRenderer.toScreen(8, 5);
    this.add.image(originX + dine1.x, originY + dine1.y, 'iso_dining_set').setDepth(10);
    const dine2 = IsometricRenderer.toScreen(3, 9);
    this.add.image(originX + dine2.x, originY + dine2.y, 'iso_dining_set').setDepth(10);

    // Snack rack near wall
    const snackPos = IsometricRenderer.toScreen(10, 3);
    this.add.image(originX + snackPos.x, originY + snackPos.y, 'iso_snack_rack').setDepth(10);

    // Pendant lamps over walkways
    this.placePendant(originX, originY, 6, 2);
    this.placePendant(originX, originY, 4, 6);

    // Wall art on rear walls
    this.placeWallArt('iso_art_mountains', originX, originY, 'left', 6);
    this.placeWallArt('iso_art_sprint', originX, originY, 'right', 6);

    // Monstera Plants
    const plant1 = IsometricRenderer.toScreen(1, 9);
    const plant2 = IsometricRenderer.toScreen(9, 1);
    const plant3 = IsometricRenderer.toScreen(10, 9);
    this.add.image(originX + plant1.x, originY + plant1.y, 'iso_plant_monstera').setDepth(12);
    this.add.image(originX + plant2.x, originY + plant2.y, 'iso_plant_monstera').setDepth(12);
    this.add.image(originX + plant3.x, originY + plant3.y, 'iso_plant_monstera').setDepth(12);

    // Floor Sign Header
    this.add.text(originX - 100, originY - 60, '☕ 1F: CAFE & LOUNGE', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f59e0b',
      backgroundColor: '#090d16cc',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(20);
  }

  // ==========================================
  // FLOOR 2: TECH SQUAD WORKSPACE (Y: -400..0)
  // ==========================================
  private renderFloor2Workspace() {
    const originX = 500;
    const originY = -400;
    const GRID_SIZE = 13;

    // Diamond Scandinavian Oak Parquet Floor
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const p = IsometricRenderer.toScreen(x, y);
        this.add.image(originX + p.x, originY + p.y, 'iso_floor_oak').setDepth(0);
      }
    }

    // Indoor shell: light office walls + concrete slab
    this.renderBuildingShell(originX, originY, GRID_SIZE, 0xdde3ea, 0x8b98a8, 0x7dd3fc, false);

    // Staircase connecting floors (Top Corner)
    const stairPos = IsometricRenderer.toScreen(1, 1);
    this.add.image(originX + stairPos.x, originY + stairPos.y - 14, 'iso_stairs').setDepth(5);

    // Lockers row along right wall
    const lockerPos = IsometricRenderer.toScreen(11, 2);
    this.add.image(originX + lockerPos.x, originY + lockerPos.y, 'iso_lockers').setDepth(10);

    // Mobile whiteboard near Lead desk
    const wbPos = IsometricRenderer.toScreen(4, 1);
    this.add.image(originX + wbPos.x, originY + wbPos.y, 'iso_whiteboard').setDepth(10);

    // Bookshelf in quiet corner
    const shelfPos = IsometricRenderer.toScreen(1, 5);
    this.add.image(originX + shelfPos.x, originY + shelfPos.y, 'iso_bookshelf').setDepth(10);

    // Collaboration rug + extra plant corner
    const rugPos = IsometricRenderer.toScreen(2, 10);
    this.add.image(originX + rugPos.x, originY + rugPos.y, 'iso_rug_oval').setDepth(2);
    const plant2Pos = IsometricRenderer.toScreen(11, 10);
    this.add.image(originX + plant2Pos.x, originY + plant2Pos.y, 'iso_plant_monstera').setDepth(12);

    // Pendant lamps over aisles
    this.placePendant(originX, originY, 4, 5);
    this.placePendant(originX, originY, 8, 5);

    // Wall art on rear walls
    this.placeWallArt('iso_art_sprint', originX, originY, 'left', 7);
    this.placeWallArt('iso_art_mountains', originX, originY, 'right', 7);

    // 6 Workstations
    const desks = [
      { role: 'pm', name: 'Sarah (PM)', gx: 3, gy: 3, labelColor: '#ec4899' },
      { role: 'it_lead', name: 'Budi (Lead)', gx: 6, gy: 3, labelColor: '#3b82f6' },
      { role: 'backend', name: 'Bagas (BE)', gx: 9, gy: 3, labelColor: '#8b5cf6' },
      { role: 'frontend', name: 'Fani (FE)', gx: 3, gy: 7, labelColor: '#10b981' },
      { role: 'qa', name: 'Qori (QA)', gx: 6, gy: 7, labelColor: '#f59e0b' },
      { role: 'devops', name: 'Dimas (DevOps)', gx: 9, gy: 7, labelColor: '#ef4444' },
    ];

    desks.forEach(desk => {
      const p = IsometricRenderer.toScreen(desk.gx, desk.gy);
      // Desk
      this.add.image(originX + p.x, originY + p.y, 'iso_desk_modern').setDepth(8);
      // Chair
      this.add.image(originX + p.x, originY + p.y + 14, 'iso_chair_ergonomic').setDepth(9);
      // Nametag label
      this.add.text(originX + p.x, originY + p.y - 24, desk.name, {
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: desk.labelColor,
        backgroundColor: '#090d16cc',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5).setDepth(25);
    });

    // Server Room beside Dimas (DevOps)
    const serverPos = IsometricRenderer.toScreen(11, 7);
    this.add.image(originX + serverPos.x, originY + serverPos.y - 10, 'iso_server_rack').setDepth(10);
    this.add.image(originX + serverPos.x - 20, originY + serverPos.y, 'iso_glass_wall_left').setDepth(11);

    // Monstera Plants
    const plantPos = IsometricRenderer.toScreen(1, 8);
    this.add.image(originX + plantPos.x, originY + plantPos.y, 'iso_plant_monstera').setDepth(12);

    // Floor Sign Header
    this.add.text(originX - 100, originY - 60, '💻 2F: TECH SQUAD WORKSPACE', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#38bdf8',
      backgroundColor: '#090d16cc',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(20);
  }

  // ==========================================
  // FLOOR 3: ROOFTOP BOARDROOM (Y: -1300..-900)
  // ==========================================
  private renderFloor3Boardroom() {
    const originX = 500;
    const originY = -1300;
    const GRID_SIZE = 11;

    // Dark Slate Terrace Floor
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const p = IsometricRenderer.toScreen(x, y);
        this.add.image(originX + p.x, originY + p.y, 'iso_floor_slate').setDepth(0);
      }
    }

    // Indoor shell: panoramic glass boardroom walls + slab
    this.renderBuildingShell(originX, originY, GRID_SIZE, 0x273449, 0x64748b, 0x93c5fd, true);

    // Staircase connecting floors (Top Corner)
    const stairPos = IsometricRenderer.toScreen(1, 1);
    this.add.image(originX + stairPos.x, originY + stairPos.y - 14, 'iso_stairs').setDepth(5);

    // Presentation screen on far wall
    const screenPos = IsometricRenderer.toScreen(5, 1);
    this.add.image(originX + screenPos.x, originY + screenPos.y - 26, 'iso_screen').setDepth(10);

    // Rug under boardroom table
    const rugPos = IsometricRenderer.toScreen(5, 5);
    this.add.image(originX + rugPos.x, originY + rugPos.y, 'iso_rug_oval').setDepth(2);

    // Long Conference Table
    const tablePos = IsometricRenderer.toScreen(5, 5);
    this.add.image(originX + tablePos.x, originY + tablePos.y, 'iso_boardroom_table').setDepth(10);

    // Chandelier pendants above table
    this.placePendant(originX, originY, 4, 5, 74);
    this.placePendant(originX, originY, 6, 5, 74);

    // Credenza sideboard with refreshments
    const sidePos = IsometricRenderer.toScreen(8, 4);
    this.add.image(originX + sidePos.x, originY + sidePos.y, 'iso_sideboard').setDepth(10);

    // Wall art flanking the screen
    this.placeWallArt('iso_art_mountains', originX, originY, 'left', 4);
    this.placeWallArt('iso_art_sprint', originX, originY, 'right', 4);

    // 6 Boardroom Chairs around table
    const chairOffsets = [
      { dx: -24, dy: -12 }, { dx: 0, dy: -14 }, { dx: 24, dy: -12 },
      { dx: -24, dy: 14 }, { dx: 0, dy: 16 }, { dx: 24, dy: 14 },
    ];
    chairOffsets.forEach(ch => {
      this.add.image(originX + tablePos.x + ch.dx, originY + tablePos.y + ch.dy, 'iso_chair_ergonomic').setDepth(9);
    });

    // Plants on rooftop terrace
    const plant1 = IsometricRenderer.toScreen(1, 8);
    const plant2 = IsometricRenderer.toScreen(8, 1);
    this.add.image(originX + plant1.x, originY + plant1.y, 'iso_plant_monstera').setDepth(12);
    this.add.image(originX + plant2.x, originY + plant2.y, 'iso_plant_monstera').setDepth(12);

    // Floor Sign Header
    this.add.text(originX - 100, originY - 60, '🏢 3F: ROOFTOP BOARDROOM', {
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#a855f7',
      backgroundColor: '#090d16cc',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(20);
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(-400, -1800, 1800, 3200);
    cam.setZoom(1.0);
    // Start focused on Floor 2 (Workspace)
    cam.centerOn(IsometricOfficeScene.FLOOR_CENTERS[2].x, IsometricOfficeScene.FLOOR_CENTERS[2].y);

    // Drag / Pan Controls
    this.input.on('pointerdown', (pointer: Phaser.InputPointer) => {
      if (pointer.rightButtonDown() || pointer.leftButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.InputPointer) => {
      if (this.isDragging) {
        cam.scrollX -= (pointer.x - this.dragStartX) / cam.zoom;
        cam.scrollY -= (pointer.y - this.dragStartY) / cam.zoom;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // Zoom with mouse wheel
    this.input.on('wheel', (pointer: Phaser.InputPointer, gameObjects: any, deltaX: number, deltaY: number) => {
      const newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 0.6, 1.8);
      cam.setZoom(newZoom);
    });
  }

  public goToFloor(floor: 1 | 2 | 3) {
    const target = IsometricOfficeScene.FLOOR_CENTERS[floor];
    if (target) {
      this.cameras.main.pan(target.x, target.y, 800, 'Cubic.easeInOut');
    }
  }

  public focusOnAgent(agent: Agent) {
    // If agent is on a different floor, switch camera there
    this.goToFloor(agent.floor || 2);

    const entry = this.agentContainers.get(agent.id);
    if (entry) {
      this.time.delayedCall(300, () => {
        this.cameras.main.pan(entry.container.x, entry.container.y, 600, 'Power2');
        this.cameras.main.zoomTo(1.3, 600);
      });
    }
  }

  /**
   * Sync Agents into Isometric Game View with rotating Plumbob diamond
   */
  public syncAgents(agents: Agent[]) {
    agents.forEach((agent, index) => {
      let entry = this.agentContainers.get(agent.id);

      const floor = agent.floor || 2;
      const floorOriginY = floor === 1 ? 500 : floor === 3 ? -1300 : -400;
      const originX = 500;

      // Position mapping by floor and state
      let gx = 3;
      let gy = 3;

      if (floor === 2) {
        // Floor 2 desks
        const desk = IsometricOfficeScene.SPOTS.floor2_desks[agent.role];
        gx = desk?.gx || 3;
        gy = desk?.gy || 3;
      } else if (floor === 1) {
        // Floor 1 cafe spots
        const spot = IsometricOfficeScene.SPOTS.floor1_cafe[index % IsometricOfficeScene.SPOTS.floor1_cafe.length];
        gx = spot.gx;
        gy = spot.gy;
      } else if (floor === 3) {
        // Floor 3 boardroom spots
        const spot = IsometricOfficeScene.SPOTS.floor3_boardroom[index % IsometricOfficeScene.SPOTS.floor3_boardroom.length];
        gx = spot.gx;
        gy = spot.gy;
      }

      const p = IsometricRenderer.toScreen(gx, gy);
      const targetX = originX + p.x;
      const targetY = floorOriginY + p.y + 10;

      const plumbobKey = this.getPlumbobForState(agent.state);

      if (!entry) {
        // Container
        const container = this.add.container(targetX, targetY);
        container.setSize(32, 50);
        container.setInteractive({ useHandCursor: true });
        container.setDepth(20);

        // Character Sprite
        const sprite = this.add.sprite(0, 0, `sim_${agent.role}`);
        container.add(sprite);

        // Rotating Plumbob Crystal above head
        const plumbob = this.add.sprite(0, -32, plumbobKey);
        container.add(plumbob);

        // Plumbob 3D Rotation Animation (scaleX oscillation) & Gentle Float
        this.tweens.add({
          targets: plumbob,
          scaleX: -1,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        this.tweens.add({
          targets: plumbob,
          y: -36,
          duration: 1200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });

        // Name tag
        const nameText = this.add.text(0, 20, agent.name, {
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: agent.color,
          backgroundColor: '#090d16e6',
          padding: { x: 5, y: 2 },
        }).setOrigin(0.5);
        container.add(nameText);

        // Speech Bubble
        const bubbleContainer = this.add.container(0, -56);
        const bubbleText = this.add.text(0, 0, '', {
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '12px',
          color: '#ffffff',
          backgroundColor: '#090d16fa',
          padding: { x: 8, y: 4 },
          wordWrap: { width: 180 },
        }).setOrigin(0.5).setVisible(false);
        bubbleContainer.add(bubbleText);
        container.add(bubbleContainer);

        // Click selection
        container.on('pointerdown', (pointer: Phaser.InputPointer) => {
          if (pointer.leftButtonDown()) {
            this.callbacks.onAgentSelect?.(agent);
            // Plumbob bounce reaction
            this.tweens.add({
              targets: plumbob,
              y: -44,
              duration: 150,
              yoyo: true,
              ease: 'Back.easeOut',
            });
          }
        });

        entry = {
          container,
          sprite,
          plumbob,
          nameText,
          bubbleContainer,
          bubbleText,
          currentFloor: floor,
          currentX: targetX,
          currentY: targetY,
          traversing: false,
        };

        this.agentContainers.set(agent.id, entry);
      } else {
        // Update Plumbob color
        entry.plumbob.setTexture(plumbobKey);

        // Update Speech Bubble
        if (agent.bubble && Date.now() < agent.bubble.expiresAt) {
          entry.bubbleText.setText(agent.bubble.text).setVisible(true);
        } else {
          entry.bubbleText.setVisible(false);
        }

        // Mid-traversal: let the stair chain finish, only refresh plumbob.
        // Keep the transit bubble unless the server sent a fresher one.
        if (entry.traversing) {
          if (agent.bubble && Date.now() < agent.bubble.expiresAt) {
            entry.bubbleText.setText(agent.bubble.text).setVisible(true);
          }
          return;
        }

        // Floor changed -> walk via staircase: desk -> stair base -> shaft -> stair base -> dest
        if (entry.currentFloor !== floor) {
          this.traverseStaircase(agent, entry, floor, targetX, targetY, index);
          return;
        }

        // Same-floor move
        if (Math.hypot(entry.currentX - targetX, entry.currentY - targetY) > 5) {
          entry.currentX = targetX;
          entry.currentY = targetY;
          this.tweens.killTweensOf(entry.container);
          this.tweens.add({
            targets: entry.container,
            x: targetX,
            y: targetY,
            duration: 1600,
            ease: 'Power1',
          });
        }
      }
    });
  }

  /**
   * Walk an agent across floors through the stairwell shaft:
   * current spot -> stair base -> vertical shaft travel -> stair base -> destination.
   * Camera is NOT blocked; it glides ahead independently.
   */
  private traverseStaircase(
    agent: Agent,
    entry: {
      container: Phaser.GameObjects.Container;
      bubbleText: Phaser.GameObjects.Text;
      currentFloor: number;
      currentX: number;
      currentY: number;
      traversing: boolean;
    },
    floor: number,
    targetX: number,
    targetY: number,
    index: number,
  ) {
    const fromFloor = entry.currentFloor || 2;
    const C = IsometricOfficeScene;
    const yOf = (f: number) => C.STAIR_Y[f] ?? 0;
    const stairFrom = { x: C.SHAFT_X, y: yOf(fromFloor) + 10 };
    const stairTo = { x: C.SHAFT_X, y: yOf(floor) + 10 };

    entry.traversing = true;
    this.tweens.killTweensOf(entry.container);
    entry.bubbleText.setText(`Menuju L${floor} 🚶`).setVisible(true);

    // Legs: flat walk to stairs -> slow spiral climb -> flat walk to dest.
    // Spiral waypoints wind around the column with the same helix formula
    // as the rendered treads, so agents visibly circle the shaft.
    interface Leg { x: number; y: number; speed: number }
    const legs: Leg[] = [
      { ...stairFrom, speed: C.FLAT_SPEED },
    ];
    const yA = yOf(fromFloor);
    const yB = yOf(floor);
    const climbDist = Math.abs(yB - yA);
    const nHelix = Math.max(2, Math.ceil(climbDist / 60));
    for (let i = 1; i <= nHelix; i++) {
      const y = yA + ((yB - yA) * i) / nHelix;
      const a = C.helixAngle(y);
      legs.push({
        x: C.SHAFT_X + C.HELIX_RADIUS * Math.cos(a),
        y,
        speed: C.CLIMB_SPEED,
      });
    }
    legs.push({ x: stairTo.x, y: stairTo.y + 0, speed: C.CLIMB_SPEED });
    legs.push({ x: targetX, y: targetY, speed: C.FLAT_SPEED });

    const step = (i: number) => {
      if (i >= legs.length) {
        entry.currentX = targetX;
        entry.currentY = targetY;
        entry.currentFloor = floor;
        entry.traversing = false;
        // Refresh bubble from latest store state (or hide transit text)
        const latest = useOfficeStore.getState().agents.find(a => a.id === agent.id);
        if (latest?.bubble && Date.now() < latest.bubble.expiresAt) {
          entry.bubbleText.setText(latest.bubble.text).setVisible(true);
        } else {
          entry.bubbleText.setVisible(false);
        }
        return;
      }
      const leg = legs[i];
      const dist = Math.hypot(entry.container.x - leg.x, entry.container.y - leg.y);
      if (dist < 5) {
        step(i + 1);
        return;
      }
      const duration = Phaser.Math.Clamp(dist / leg.speed, 400, 12000);
      this.tweens.add({
        targets: entry.container,
        x: leg.x,
        y: leg.y,
        duration,
        ease: 'Power1',
        delay: i === 0 ? index * 150 : 0,
        onComplete: () => step(i + 1),
      });
    };
    step(0);
  }

  private getPlumbobForState(state: AgentState): string {
    switch (state) {
      case 'working': return 'plumbob_green';
      case 'thinking': return 'plumbob_blue';
      case 'break': return 'plumbob_gold';
      case 'meeting': return 'plumbob_blue';
      case 'idle':
      default:
        return 'plumbob_green';
    }
  }
}
