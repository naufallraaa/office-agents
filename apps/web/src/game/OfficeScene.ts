import Phaser from 'phaser';
import { PixelArtGenerator } from './PixelArtGenerator';
import { useOfficeStore } from '../store/useOfficeStore';
import type { Agent, AgentState } from 'shared';

export interface OfficeSceneCallbacks {
  onAgentSelect?: (agent: Agent) => void;
}

export class OfficeScene extends Phaser.Scene {
  private agentSprites: Map<string, {
    container: Phaser.GameObjects.Container;
    sprite: Phaser.GameObjects.Sprite;
    nameText: Phaser.GameObjects.Text;
    bubbleContainer: Phaser.GameObjects.Container;
    bubbleText: Phaser.GameObjects.Text;
    emoteIcon: Phaser.GameObjects.Text;
    currentX: number;
    currentY: number;
  }> = new Map();

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private callbacks: OfficeSceneCallbacks = {};
  private nightOverlay?: Phaser.GameObjects.Rectangle;

  // Preset location coordinates (in pixels)
  public static readonly LOCATIONS = {
    workstations: {
      pm: { x: 160, y: 220 },
      it_lead: { x: 360, y: 220 },
      backend: { x: 560, y: 220 },
      frontend: { x: 160, y: 380 },
      qa: { x: 360, y: 380 },
      devops: { x: 560, y: 380 },
    },
    meetingSeats: [
      { x: 800, y: 280 },
      { x: 860, y: 280 },
      { x: 920, y: 280 },
      { x: 800, y: 360 },
      { x: 860, y: 360 },
      { x: 920, y: 360 },
    ],
    pantry: [
      { x: 160, y: 680 }, // Coffee machine
      { x: 220, y: 680 }, // Water cooler
      { x: 280, y: 680 }, // Tea station
      { x: 340, y: 700 }, // Snack table
      { x: 400, y: 700 }, // Lounge chair 1
      { x: 450, y: 680 }, // Lounge chair 2
    ]
  };

  constructor() {
    super({ key: 'OfficeScene' });
  }

  public setCallbacks(callbacks: OfficeSceneCallbacks) {
    this.callbacks = callbacks;
  }

  create() {
    // 1. Generate all procedural pixel textures
    PixelArtGenerator.generateAll(this);

    // 2. Render Office Layout
    this.renderFloorPlan();
    this.renderFurniture();

    // 3. Setup Camera Controls (Pan & Zoom)
    this.setupCamera();

    // 4. Ambient Server Blink Effect (DevOps area)
    this.setupDevOpsBlink();

    // 5. Initial sync with Zustand store & reactive subscription
    const initialAgents = useOfficeStore.getState().agents;
    this.syncAgents(initialAgents);

    const unsubscribe = useOfficeStore.subscribe((state) => {
      if (this.sys && this.sys.isActive()) {
        this.syncAgents(state.agents);
      }
    });

    this.events.once('shutdown', () => unsubscribe());
    this.events.once('destroy', () => unsubscribe());

    // 6. Ambient Night Lighting Overlay
    this.nightOverlay = this.add.rectangle(0, 0, 36 * 32, 26 * 32, 0x050c1e, 0.45)
      .setOrigin(0, 0)
      .setDepth(15)
      .setVisible(false);
  }

  private renderFloorPlan() {
    const TILE = 32;
    const COLS = 36;
    const ROWS = 26;

    // Floor rendering
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        let floorType = 'floor_wood';
        
        // Right side (Meeting room)
        if (c >= 22 && r <= 14) {
          floorType = 'floor_meeting';
        }
        // Bottom left (Pantry & Lounge)
        else if (c <= 15 && r >= 17) {
          floorType = 'floor_pantry';
        }

        this.add.image(c * TILE + 16, r * TILE + 16, floorType);
      }
    }

    // Outer Perimeter Walls
    for (let c = 0; c < COLS; c++) {
      this.add.image(c * TILE + 16, 16, 'wall_outer');
      this.add.image(c * TILE + 16, (ROWS - 1) * TILE + 16, 'wall_outer');
    }
    for (let r = 0; r < ROWS; r++) {
      this.add.image(16, r * TILE + 16, 'wall_outer');
      this.add.image((COLS - 1) * TILE + 16, r * TILE + 16, 'wall_outer');
    }

    // Meeting Room Glass/Partition Wall
    for (let r = 1; r <= 14; r++) {
      // Leave a 2-tile door opening at r = 7 and 8
      if (r !== 7 && r !== 8) {
        this.add.image(22 * TILE + 16, r * TILE + 16, 'wall_partition');
      }
    }
    for (let c = 22; c < COLS - 1; c++) {
      this.add.image(c * TILE + 16, 14 * TILE + 16, 'wall_partition');
    }

    // Pantry Divider Wall
    for (let c = 1; c <= 15; c++) {
      // Door gap at c = 9 and 10
      if (c !== 9 && c !== 10) {
        this.add.image(c * TILE + 16, 17 * TILE + 16, 'wall_partition');
      }
    }
  }

  private renderFurniture() {
    // ==================== CUBICLES (6 SQUAD MEMBERS) ====================
    const cubicles = [
      { role: 'pm', x: 160, y: 200, label: '📊 PROJECT MGR' },
      { role: 'it_lead', x: 360, y: 200, label: '👔 IT LEAD' },
      { role: 'backend', x: 560, y: 200, label: '⚙️ BACKEND' },
      { role: 'frontend', x: 160, y: 360, label: '🎨 FRONTEND' },
      { role: 'qa', x: 360, y: 360, label: '🔍 QA ENGINEER' },
      { role: 'devops', x: 560, y: 360, label: '🚀 DEVOPS' },
    ];

    cubicles.forEach(cb => {
      // Desk
      this.add.image(cb.x, cb.y, 'furniture_desk');
      // Custom Props for each specialist's desk
      const propKey = `prop_desk_${cb.role}`;
      if (this.textures.exists(propKey)) {
        this.add.image(cb.x, cb.y - 8, propKey);
      } else {
        this.add.image(cb.x, cb.y - 12, 'equip_dual_monitor');
      }
      // Chair behind desk
      this.add.image(cb.x, cb.y + 24, 'furniture_chair');
      // Cubicle partitions
      this.add.image(cb.x - 32, cb.y, 'wall_partition').setScale(0.8, 1);
      this.add.image(cb.x + 32, cb.y, 'wall_partition').setScale(0.8, 1);
      // Desk Nametag label
      this.add.text(cb.x, cb.y - 30, cb.label, {
        fontFamily: '"VT323", monospace',
        fontSize: '18px',
        color: '#e2e8f0',
        stroke: '#000000',
        strokeThickness: 3,
        resolution: 2,
      }).setOrigin(0.5);
    });

    // Special equipment for Lead: Whiteboard
    this.add.image(80, 200, 'furniture_whiteboard');

    // Special equipment for DevOps: Glowing Server Rack
    const server = this.add.image(640, 360, 'equip_server_rack');
    server.setName('devops_server');

    // Plants for office vibe
    this.add.image(70, 70, 'equip_plant');
    this.add.image(680, 70, 'equip_plant');
    this.add.image(680, 480, 'equip_plant');

    // ==================== MEETING ROOM ====================
    // Meeting Table
    for (let i = 0; i < 4; i++) {
      this.add.image(800 + i * 32, 320, 'furniture_meeting_table');
    }
    // Meeting Chairs
    OfficeScene.LOCATIONS.meetingSeats.forEach(seat => {
      this.add.image(seat.x, seat.y, 'furniture_chair');
    });
    // Big Presentation Whiteboard
    this.add.image(860, 100, 'furniture_whiteboard').setScale(1.5);
    this.add.text(860, 60, '📋 SPRINT SYNC ROOM', {
      fontFamily: '"VT323", monospace',
      fontSize: '20px',
      color: '#38bdf8',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    }).setOrigin(0.5);

    // ==================== PANTRY / COFFEE BAR ====================
    this.add.image(120, 680, 'equip_coffee_machine');
    this.add.image(160, 680, 'equip_water_cooler');
    this.add.image(300, 700, 'furniture_meeting_table').setScale(0.8);
    this.add.image(70, 760, 'equip_plant');
    this.add.text(180, 610, '☕ PANTRY & BREAKROOM', {
      fontFamily: '"VT323", monospace',
      fontSize: '20px',
      color: '#f59e0b',
      stroke: '#000000',
      strokeThickness: 3,
      resolution: 2,
    }).setOrigin(0.5);
  }

  private setupDevOpsBlink() {
    // Animate LED pulsing on server rack
    const server = this.children.getByName('devops_server') as Phaser.GameObjects.Image;
    if (server) {
      this.tweens.add({
        targets: server,
        alpha: 0.85,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, 36 * 32, 26 * 32);
    cam.setZoom(1.1);
    cam.centerOn(500, 400);

    // Pan with drag
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
      const newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 0.7, 1.8);
      cam.setZoom(newZoom);
    });
  }

  /**
   * Sync Agents data from Zustand Store into Phaser sprites & animations
   */
  public syncAgents(agents: Agent[]) {
    agents.forEach((agent, index) => {
      let agentEntry = this.agentSprites.get(agent.id);

      // Target position calculation based on state
      let targetX = OfficeScene.LOCATIONS.workstations[agent.role]?.x || 200;
      let targetY = OfficeScene.LOCATIONS.workstations[agent.role]?.y + 20;

      if (agent.state === 'meeting') {
        const seat = OfficeScene.LOCATIONS.meetingSeats[index % OfficeScene.LOCATIONS.meetingSeats.length];
        targetX = seat.x;
        targetY = seat.y;
      } else if (agent.state === 'break') {
        const pantrySpot = OfficeScene.LOCATIONS.pantry[index % OfficeScene.LOCATIONS.pantry.length];
        targetX = pantrySpot.x;
        targetY = pantrySpot.y;
      }

      if (!agentEntry) {
        // Create new agent container
        const container = this.add.container(targetX, targetY);
        container.setSize(32, 40);
        container.setInteractive({ useHandCursor: true });

        // Sprite
        const spriteKey = `agent_${agent.role}`;
        const sprite = this.add.sprite(0, 0, spriteKey);
        container.add(sprite);

        // Name tag
        const nameText = this.add.text(0, 18, agent.name, {
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
          color: agent.color,
          backgroundColor: '#090d16f0',
          stroke: '#000000',
          strokeThickness: 2,
          resolution: 2,
          padding: { x: 5, y: 1 }
        }).setOrigin(0.5);
        container.add(nameText);

        // Bubble Container (Speech / Emote)
        const bubbleContainer = this.add.container(0, -32);
        
        // Emote Icon
        const emoteIcon = this.add.text(0, 0, this.getEmoteForState(agent.state), {
          fontSize: '18px',
        }).setOrigin(0.5);
        bubbleContainer.add(emoteIcon);

        // Speech Text
        const bubbleText = this.add.text(0, -22, '', {
          fontFamily: '"VT323", monospace',
          fontSize: '18px',
          color: '#ffffff',
          backgroundColor: '#090d16f8',
          stroke: '#000000',
          strokeThickness: 2,
          resolution: 2,
          padding: { x: 8, y: 3 },
          wordWrap: { width: 180 }
        }).setOrigin(0.5).setVisible(false);
        bubbleContainer.add(bubbleText);

        container.add(bubbleContainer);

        // Floating idle tween for natural breathing movement
        this.tweens.add({
          targets: sprite,
          y: -2,
          duration: 900 + index * 100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // Click Handler
        container.on('pointerdown', (pointer: Phaser.InputPointer) => {
          if (pointer.leftButtonDown()) {
            this.callbacks.onAgentSelect?.(agent);
            // Flash highlight
            this.tweens.add({
              targets: container,
              scale: 1.25,
              duration: 150,
              yoyo: true,
              ease: 'Back.easeOut'
            });
          }
        });

        agentEntry = {
          container,
          sprite,
          nameText,
          bubbleContainer,
          bubbleText,
          emoteIcon,
          currentX: targetX,
          currentY: targetY,
        };

        this.agentSprites.set(agent.id, agentEntry);
      } else {
        // Update Emote & Speech
        agentEntry.emoteIcon.setText(this.getEmoteForState(agent.state));

        if (agent.bubble && Date.now() < agent.bubble.expiresAt) {
          agentEntry.bubbleText.setText(agent.bubble.text).setVisible(true);
        } else {
          agentEntry.bubbleText.setVisible(false);
        }

        // Animate movement if position changed
        if (Math.hypot(agentEntry.currentX - targetX, agentEntry.currentY - targetY) > 5) {
          agentEntry.currentX = targetX;
          agentEntry.currentY = targetY;

          this.tweens.add({
            targets: agentEntry.container,
            x: targetX,
            y: targetY,
            duration: 1800,
            ease: 'Power1',
            onStart: () => {
              agentEntry.emoteIcon.setText('🚶');
            },
            onComplete: () => {
              agentEntry.emoteIcon.setText(this.getEmoteForState(agent.state));
            }
          });
        }
      }
    });
  }

  public focusOnAgent(agent: Agent) {
    const entry = this.agentSprites.get(agent.id);
    if (entry) {
      this.cameras.main.pan(entry.container.x, entry.container.y, 800, 'Power2');
      this.cameras.main.zoomTo(1.4, 800);
    }
  }

  public setNightMode(isNight: boolean) {
    if (this.nightOverlay) {
      this.nightOverlay.setVisible(isNight);
    }
  }

  private getEmoteForState(state: AgentState): string {
    switch (state) {
      case 'working': return '💻';
      case 'thinking': return '💡';
      case 'break': return '☕';
      case 'meeting': return '📋';
      case 'walking': return '🚶';
      case 'idle':
      default:
        return '💤';
    }
  }
}
