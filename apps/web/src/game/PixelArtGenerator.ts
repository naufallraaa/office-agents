import Phaser from 'phaser';

/**
 * Procedural Pixel Art Generator for KANTOR-AI
 * Generates all office tiles, furniture, custom desk props, and unique agent sprites in memory.
 */
export class PixelArtGenerator {
  public static generateAll(scene: Phaser.Scene) {
    this.generateFloors(scene);
    this.generateWalls(scene);
    this.generateFurniture(scene);
    this.generateOfficeEquipment(scene);
    this.generateCustomDeskProps(scene);
    this.generateAgentSprites(scene);
    this.generateEmotes(scene);
  }

  private static generateFloors(scene: Phaser.Scene) {
    // 1. Office Wood Parquet (Cubicle area) - 32x32
    if (!scene.textures.exists('floor_wood')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0xc29b68, 1); // warm wood base
      g.fillRect(0, 0, 32, 32);
      // plank lines
      g.fillStyle(0xa77f4e, 1);
      g.fillRect(0, 0, 32, 1);
      g.fillRect(0, 16, 32, 1);
      g.fillRect(16, 0, 1, 16);
      g.fillRect(8, 16, 1, 16);
      g.fillRect(24, 16, 1, 16);
      // wood grain highlights
      g.fillStyle(0xd5ad7a, 0.4);
      g.fillRect(2, 4, 12, 1);
      g.fillRect(18, 20, 10, 1);
      g.generateTexture('floor_wood', 32, 32);
      g.destroy();
    }

    // 2. Meeting Room Carpet - 32x32
    if (!scene.textures.exists('floor_meeting')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x1e293b, 1); // dark slate blue
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x334155, 1);
      g.fillRect(1, 1, 30, 30);
      // subtle grid weave
      g.fillStyle(0x475569, 0.5);
      g.fillRect(0, 0, 32, 1);
      g.fillRect(0, 0, 1, 32);
      g.fillRect(8, 8, 16, 16);
      g.generateTexture('floor_meeting', 32, 32);
      g.destroy();
    }

    // 3. Pantry Checkered Tile - 32x32
    if (!scene.textures.exists('floor_pantry')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x334155, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0xe2e8f0, 1); // cream checker
      g.fillRect(0, 0, 16, 16);
      g.fillRect(16, 16, 16, 16);
      g.fillStyle(0x94a3b8, 1); // darker checker
      g.fillRect(16, 0, 16, 16);
      g.fillRect(0, 16, 16, 16);
      // grout lines
      g.fillStyle(0x1e293b, 0.6);
      g.fillRect(0, 15, 32, 1);
      g.fillRect(15, 0, 1, 32);
      g.generateTexture('floor_pantry', 32, 32);
      g.destroy();
    }
  }

  private static generateWalls(scene: Phaser.Scene) {
    // Partition Cubicle Wall - 32x32
    if (!scene.textures.exists('wall_partition')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x475569, 1); // frame
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x64748b, 1); // top trim
      g.fillRect(0, 0, 32, 4);
      g.fillStyle(0x94a3b8, 1); // acoustic fabric panel
      g.fillRect(2, 6, 28, 24);
      // pin-board texture details
      g.fillStyle(0xcbd5e1, 0.4);
      g.fillRect(6, 10, 4, 4);
      g.fillRect(18, 14, 6, 6);
      g.generateTexture('wall_partition', 32, 32);
      g.destroy();
    }

    // Concrete Outer Wall - 32x32
    if (!scene.textures.exists('wall_outer')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x0f172a, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(0, 4, 32, 28);
      g.fillStyle(0x334155, 1);
      g.fillRect(0, 0, 32, 4); // ceiling edge highlight
      g.generateTexture('wall_outer', 32, 32);
      g.destroy();
    }
  }

  private static generateFurniture(scene: Phaser.Scene) {
    // 1. Office Desk - 48x32
    if (!scene.textures.exists('furniture_desk')) {
      const g = scene.make.graphics({ add: false });
      // Desk surface
      g.fillStyle(0x473327, 1); // dark walnut top
      g.fillRect(2, 6, 44, 24);
      g.fillStyle(0x694a38, 1); // top edge bevel
      g.fillRect(2, 6, 44, 3);
      // Metal legs
      g.fillStyle(0x334155, 1);
      g.fillRect(4, 28, 4, 4);
      g.fillRect(40, 28, 4, 4);
      // Desk mat / mousepad
      g.fillStyle(0x1e293b, 1);
      g.fillRect(12, 10, 24, 16);
      // Keyboard
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(16, 20, 16, 4);
      g.generateTexture('furniture_desk', 48, 32);
      g.destroy();
    }

    // 2. Swivel Chair - 24x24
    if (!scene.textures.exists('furniture_chair')) {
      const g = scene.make.graphics({ add: false });
      // Wheel star base
      g.fillStyle(0x0f172a, 1);
      g.fillRect(8, 18, 8, 4);
      // Cushion (leather)
      g.fillStyle(0x1e293b, 1);
      g.fillRect(4, 6, 16, 12);
      // Backrest
      g.fillStyle(0x334155, 1);
      g.fillRect(4, 2, 16, 5);
      g.fillStyle(0x475569, 1);
      g.fillRect(6, 3, 12, 3);
      g.generateTexture('furniture_chair', 24, 24);
      g.destroy();
    }

    // 3. Meeting Table (Segment) - 32x32
    if (!scene.textures.exists('furniture_meeting_table')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x27272a, 1);
      g.fillRect(0, 4, 32, 24);
      g.fillStyle(0x3f3f46, 1); // frosted glass stripe
      g.fillRect(4, 8, 24, 16);
      g.fillStyle(0x52525b, 1);
      g.fillRect(0, 4, 32, 2);
      g.generateTexture('furniture_meeting_table', 32, 32);
      g.destroy();
    }

    // 4. Whiteboard - 32x32
    if (!scene.textures.exists('furniture_whiteboard')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x94a3b8, 1); // frame
      g.fillRect(2, 2, 28, 28);
      g.fillStyle(0xf8fafc, 1); // board surface
      g.fillRect(4, 4, 24, 24);
      // sticky notes
      g.fillStyle(0xfacc15, 1); // yellow post-it
      g.fillRect(6, 6, 4, 4);
      g.fillStyle(0x38bdf8, 1); // blue post-it
      g.fillRect(12, 6, 4, 4);
      g.fillStyle(0x4ade80, 1); // green post-it
      g.fillRect(18, 6, 4, 4);
      // marker lines
      g.fillStyle(0xef4444, 0.7);
      g.fillRect(6, 14, 16, 1);
      g.fillStyle(0x0f172a, 0.7);
      g.fillRect(6, 18, 12, 1);
      g.generateTexture('furniture_whiteboard', 32, 32);
      g.destroy();
    }
  }

  private static generateOfficeEquipment(scene: Phaser.Scene) {
    // 1. Dual Monitor Display - 32x20
    if (!scene.textures.exists('equip_dual_monitor')) {
      const g = scene.make.graphics({ add: false });
      // Stand
      g.fillStyle(0x334155, 1);
      g.fillRect(14, 14, 4, 6);
      g.fillRect(10, 18, 12, 2);
      // Left Monitor
      g.fillStyle(0x0f172a, 1);
      g.fillRect(2, 2, 13, 12);
      g.fillStyle(0x0284c7, 1); // Blue screen code lines
      g.fillRect(4, 4, 9, 8);
      g.fillStyle(0xe0f2fe, 1);
      g.fillRect(5, 6, 6, 1);
      g.fillRect(5, 8, 4, 1);
      // Right Monitor
      g.fillStyle(0x0f172a, 1);
      g.fillRect(17, 2, 13, 12);
      g.fillStyle(0x15803d, 1); // Green terminal screen
      g.fillRect(19, 4, 9, 8);
      g.fillStyle(0xdcfce7, 1);
      g.fillRect(20, 6, 5, 1);
      g.fillRect(20, 8, 7, 1);
      g.generateTexture('equip_dual_monitor', 32, 20);
      g.destroy();
    }

    // 2. DevOps Server Rack (with blinking LED) - 32x48
    if (!scene.textures.exists('equip_server_rack')) {
      const g = scene.make.graphics({ add: false });
      // Rack chassis
      g.fillStyle(0x090d16, 1);
      g.fillRect(2, 0, 28, 48);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(4, 2, 24, 44);
      // Server units (shelves)
      for (let y = 6; y <= 40; y += 8) {
        g.fillStyle(0x0f172a, 1);
        g.fillRect(6, y, 20, 6);
        // LEDs
        g.fillStyle(0x22c55e, 1); // green power LED
        g.fillRect(8, y + 2, 2, 2);
        g.fillStyle(0x38bdf8, 1); // blue network LED
        g.fillRect(12, y + 2, 2, 2);
        g.fillStyle(0xf59e0b, 1); // amber disk LED
        g.fillRect(16, y + 2, 2, 2);
      }
      g.generateTexture('equip_server_rack', 32, 48);
      g.destroy();
    }

    // 3. Espresso Coffee Machine - 24x24
    if (!scene.textures.exists('equip_coffee_machine')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0xc084fc, 1);
      g.fillRect(4, 2, 16, 20);
      g.fillStyle(0x581c87, 1);
      g.fillRect(6, 6, 12, 10);
      // spout & coffee cup
      g.fillStyle(0xf1f5f9, 1);
      g.fillRect(10, 14, 4, 4);
      // Steam
      g.fillStyle(0xffffff, 0.6);
      g.fillRect(11, 10, 2, 2);
      g.generateTexture('equip_coffee_machine', 24, 24);
      g.destroy();
    }

    // 4. Water Cooler - 16x32
    if (!scene.textures.exists('equip_water_cooler')) {
      const g = scene.make.graphics({ add: false });
      // Blue bottle on top
      g.fillStyle(0x38bdf8, 0.9);
      g.fillRect(3, 2, 10, 12);
      g.fillStyle(0xbae6fd, 1);
      g.fillRect(4, 4, 3, 8);
      // White dispenser body
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(2, 14, 12, 16);
      // Red & blue taps
      g.fillStyle(0xef4444, 1);
      g.fillRect(4, 18, 2, 2);
      g.fillStyle(0x3b82f6, 1);
      g.fillRect(8, 18, 2, 2);
      g.generateTexture('equip_water_cooler', 16, 32);
      g.destroy();
    }

    // 5. Office Plant - 24x32
    if (!scene.textures.exists('equip_plant')) {
      const g = scene.make.graphics({ add: false });
      // Terracotta pot
      g.fillStyle(0xc2410c, 1);
      g.fillRect(6, 20, 12, 10);
      g.fillStyle(0x9a3412, 1);
      g.fillRect(4, 18, 16, 3);
      // Leaves (layered greens)
      g.fillStyle(0x15803d, 1);
      g.fillRect(10, 6, 4, 12);
      g.fillRect(6, 8, 4, 8);
      g.fillRect(14, 10, 4, 8);
      g.fillStyle(0x22c55e, 1);
      g.fillRect(8, 2, 6, 6);
      g.fillRect(4, 6, 3, 4);
      g.fillRect(16, 7, 3, 4);
      g.generateTexture('equip_plant', 24, 32);
      g.destroy();
    }
  }

  /**
   * 6 Unique Desk Props Sets for each Specialist
   */
  private static generateCustomDeskProps(scene: Phaser.Scene) {
    // 1. SARAH (PM): Sleek laptop + leather planner + pink tumbler (44x16)
    if (!scene.textures.exists('prop_desk_pm')) {
      const g = scene.make.graphics({ add: false });
      // Slim silver laptop (center)
      g.fillStyle(0x0f172a, 1);
      g.fillRect(14, 2, 16, 10);
      g.fillStyle(0xec4899, 0.9); // Product KPI chart screen
      g.fillRect(15, 3, 14, 8);
      g.fillStyle(0xffffff, 1);
      g.fillRect(16, 5, 8, 1);
      g.fillRect(16, 7, 11, 1);
      // Leather planner notebook (left)
      g.fillStyle(0x78350f, 1);
      g.fillRect(3, 4, 8, 10);
      g.fillStyle(0xfef08a, 1); // bookmark ribbon
      g.fillRect(6, 3, 2, 12);
      // Pink Tumbler (right)
      g.fillStyle(0xf472b6, 1);
      g.fillRect(34, 4, 5, 10);
      g.fillStyle(0xe2e8f0, 1); // metallic lid
      g.fillRect(34, 2, 5, 2);
      g.generateTexture('prop_desk_pm', 44, 16);
      g.destroy();
    }

    // 2. BUDI (IT LEAD): Laptop stand + vertical code monitor + book stack (44x18)
    if (!scene.textures.exists('prop_desk_it_lead')) {
      const g = scene.make.graphics({ add: false });
      // Vertical monitor (left)
      g.fillStyle(0x0f172a, 1);
      g.fillRect(4, 1, 10, 16);
      g.fillStyle(0x0284c7, 1);
      g.fillRect(5, 2, 8, 14);
      g.fillStyle(0xe0f2fe, 1);
      for (let y = 4; y <= 13; y += 3) {
        g.fillRect(6, y, 6, 1);
      }
      // Laptop on stand (center)
      g.fillStyle(0x334155, 1);
      g.fillRect(17, 3, 14, 10);
      g.fillStyle(0x3b82f6, 1);
      g.fillRect(18, 4, 12, 8);
      // Book stack (right)
      g.fillStyle(0x1e3a8a, 1); // Blue book
      g.fillRect(33, 10, 9, 3);
      g.fillStyle(0x047857, 1); // Green book
      g.fillRect(33, 7, 8, 3);
      g.fillStyle(0xb91c1c, 1); // Red book
      g.fillRect(34, 4, 7, 3);
      g.generateTexture('prop_desk_it_lead', 44, 18);
      g.destroy();
    }

    // 3. FANI (FRONTEND): Curved UI display + drawing tablet + mini cactus (44x16)
    if (!scene.textures.exists('prop_desk_frontend')) {
      const g = scene.make.graphics({ add: false });
      // Curved widescreen UI display
      g.fillStyle(0x0f172a, 1);
      g.fillRect(10, 1, 24, 11);
      g.fillStyle(0x06b6d4, 1); // UI components preview
      g.fillRect(12, 3, 7, 7);
      g.fillStyle(0xec4899, 1);
      g.fillRect(20, 3, 6, 7);
      g.fillStyle(0x10b981, 1);
      g.fillRect(27, 3, 5, 7);
      // Drawing tablet with stylus (left)
      g.fillStyle(0x1e293b, 1);
      g.fillRect(2, 6, 7, 9);
      g.fillStyle(0x14b8a6, 1); // stylus
      g.fillRect(8, 5, 1, 8);
      // Mini succulent cactus pot (right)
      g.fillStyle(0xc2410c, 1);
      g.fillRect(37, 9, 5, 6);
      g.fillStyle(0x22c55e, 1);
      g.fillRect(38, 5, 3, 4);
      g.generateTexture('prop_desk_frontend', 44, 16);
      g.destroy();
    }

    // 4. BAGAS (BACKEND): Matrix dark terminal + large coffee thermos + rubber duck (44x16)
    if (!scene.textures.exists('prop_desk_backend')) {
      const g = scene.make.graphics({ add: false });
      // Dark Matrix terminal
      g.fillStyle(0x022c22, 1);
      g.fillRect(11, 1, 20, 12);
      g.fillStyle(0x22c55e, 1); // green SQL code lines
      g.fillRect(13, 3, 8, 1);
      g.fillRect(13, 6, 14, 1);
      g.fillRect(13, 9, 10, 1);
      // Coffee Thermos jug (left)
      g.fillStyle(0x475569, 1);
      g.fillRect(3, 4, 6, 11);
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(4, 2, 4, 2);
      // Rubber Duck (right)
      g.fillStyle(0xfacc15, 1); // Yellow body
      g.fillRect(34, 8, 7, 6);
      g.fillRect(37, 5, 4, 4); // Duck head
      g.fillStyle(0xea580c, 1); // Orange beak
      g.fillRect(41, 6, 2, 2);
      g.generateTexture('prop_desk_backend', 44, 16);
      g.destroy();
    }

    // 5. DIMAS (DEVOPS): Monitoring latency curves + telemetry gadget (44x16)
    if (!scene.textures.exists('prop_desk_devops')) {
      const g = scene.make.graphics({ add: false });
      // Grafana monitor
      g.fillStyle(0x0f172a, 1);
      g.fillRect(12, 1, 20, 12);
      g.fillStyle(0x18181b, 1);
      g.fillRect(13, 2, 18, 10);
      // Orange latency wave line
      g.fillStyle(0xf97316, 1);
      g.fillRect(15, 8, 3, 2);
      g.fillRect(18, 5, 3, 2);
      g.fillRect(21, 7, 3, 2);
      g.fillRect(24, 4, 3, 2);
      g.fillRect(27, 8, 3, 2);
      // Cable coil & gadget (left)
      g.fillStyle(0x3b82f6, 1);
      g.fillRect(4, 8, 5, 6);
      g.fillStyle(0xef4444, 1);
      g.fillRect(5, 5, 1, 3); // antenna
      // Multimeter (right)
      g.fillStyle(0xd97706, 1);
      g.fillRect(35, 6, 6, 9);
      g.fillStyle(0x0f172a, 1);
      g.fillRect(36, 8, 4, 3);
      g.generateTexture('prop_desk_devops', 44, 16);
      g.destroy();
    }

    // 6. QORI (QA): Test checklist display + clipboard + magnifying glass (44x16)
    if (!scene.textures.exists('prop_desk_qa')) {
      const g = scene.make.graphics({ add: false });
      // Test checklist monitor
      g.fillStyle(0x0f172a, 1);
      g.fillRect(12, 1, 20, 12);
      g.fillStyle(0x1e293b, 1);
      g.fillRect(13, 2, 18, 10);
      // Green checks & red crosses
      g.fillStyle(0x22c55e, 1); // check 1
      g.fillRect(15, 4, 3, 2);
      g.fillStyle(0xef4444, 1); // cross 1
      g.fillRect(23, 4, 3, 2);
      g.fillStyle(0x22c55e, 1); // check 2
      g.fillRect(15, 8, 3, 2);
      g.fillStyle(0x22c55e, 1); // check 3
      g.fillRect(23, 8, 3, 2);
      // Clipboard paper (left)
      g.fillStyle(0x78350f, 1);
      g.fillRect(3, 4, 7, 11);
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(4, 5, 5, 9);
      // Magnifying glass (right)
      g.fillStyle(0x38bdf8, 1); // glass lens
      g.fillRect(35, 4, 5, 5);
      g.fillStyle(0x94a3b8, 1); // handle
      g.fillRect(39, 9, 3, 5);
      g.generateTexture('prop_desk_qa', 44, 16);
      g.destroy();
    }
  }

  /**
   * Generates Unique Character Silhouettes (Distinct Hairstyles, Outfits, Accessories)
   */
  private static generateAgentSprites(scene: Phaser.Scene) {
    const roles = ['pm', 'it_lead', 'frontend', 'backend', 'devops', 'qa'];

    roles.forEach(role => {
      const spriteKey = `agent_${role}`;
      if (scene.textures.exists(spriteKey)) return;

      const g = scene.make.graphics({ add: false });

      // Ground Shadow
      g.fillStyle(0x000000, 0.35);
      g.fillRect(3, 26, 16, 4);

      // Shoes
      g.fillStyle(0x0f172a, 1);
      g.fillRect(5, 25, 4, 3);
      g.fillRect(13, 25, 4, 3);

      // Pants / Legs
      g.fillStyle(0x1e293b, 1);
      g.fillRect(6, 19, 3, 7);
      g.fillRect(13, 19, 3, 7);

      // ==================== ROLE SPECIFIC BODIES & HAIRSTYLES ====================
      if (role === 'pm') {
        // SARAH: Long flowing wavy hair down past shoulders (dark wine) + chic magenta blazer
        // Torso / Blazer
        g.fillStyle(0xbe185d, 1); // Magenta blazer
        g.fillRect(5, 11, 12, 9);
        g.fillStyle(0xfef3c7, 1); // Cream inner top
        g.fillRect(9, 11, 4, 5);

        // Head / Skin
        g.fillStyle(0xfed7aa, 1);
        g.fillRect(7, 4, 8, 7);
        // Eyes
        g.fillStyle(0x0f172a, 1);
        g.fillRect(8, 7, 2, 2);
        g.fillRect(12, 7, 2, 2);

        // Long flowing dark wine hair (flows down past shoulders!)
        g.fillStyle(0x4a044e, 1);
        g.fillRect(6, 2, 10, 4); // Top dome
        g.fillRect(4, 3, 3, 16); // Left flowing hair down to waist
        g.fillRect(15, 3, 3, 16); // Right flowing hair down to waist
        g.fillRect(5, 17, 2, 2); // hair curl bottom left
        g.fillRect(15, 17, 2, 2); // hair curl bottom right

      } else if (role === 'it_lead') {
        // BUDI: Combed side-part dark hair, glasses, navy oxford shirt
        g.fillStyle(0x1e3a8a, 1); // Navy oxford
        g.fillRect(5, 11, 12, 9);
        g.fillStyle(0x93c5fd, 1); // Light blue tie & collar
        g.fillRect(10, 11, 2, 8);

        // Head / Skin
        g.fillStyle(0xfbcfe8, 1);
        g.fillRect(7, 4, 8, 7);

        // Glasses frames across face
        g.fillStyle(0x0f172a, 1);
        g.fillRect(7, 7, 3, 2);
        g.fillRect(12, 7, 3, 2);
        g.fillRect(10, 7, 2, 1); // bridge

        // Clean side-part dark brown hair
        g.fillStyle(0x451a03, 1);
        g.fillRect(6, 2, 10, 4);
        g.fillRect(5, 4, 2, 4); // left sideburn
        g.fillRect(15, 3, 2, 4); // right sideburn

      } else if (role === 'frontend') {
        // FANI: High ponytail with teal tie, studio headphones, emerald oversized hoodie
        // Torso / Emerald Hoodie
        g.fillStyle(0x059669, 1);
        g.fillRect(4, 11, 14, 9);
        g.fillStyle(0x047857, 1); // kangaroo pocket line
        g.fillRect(7, 16, 8, 3);

        // Studio Headphones around neck
        g.fillStyle(0x0284c7, 1);
        g.fillRect(5, 10, 3, 3); // Left earpad
        g.fillRect(14, 10, 3, 3); // Right earpad
        g.fillRect(6, 11, 10, 1); // headband loop

        // Head / Skin
        g.fillStyle(0xfed7aa, 1);
        g.fillRect(7, 4, 8, 7);
        // Eyes
        g.fillStyle(0x0f172a, 1);
        g.fillRect(8, 7, 2, 2);
        g.fillRect(12, 7, 2, 2);

        // Hair with HIGH PONYTAIL on top-right
        g.fillStyle(0x1e293b, 1);
        g.fillRect(6, 2, 10, 4);
        g.fillRect(5, 4, 2, 4);
        // Bright teal hair scrunchie
        g.fillStyle(0x14b8a6, 1);
        g.fillRect(15, 2, 3, 2);
        // Ponytail bundle sticking up & swooping right
        g.fillStyle(0x1e293b, 1);
        g.fillRect(16, 0, 3, 3);
        g.fillRect(17, 3, 3, 5);

      } else if (role === 'backend') {
        // BAGAS: Messy spiky hair, dark 404 graphic tee
        g.fillStyle(0x18181b, 1); // Black tee
        g.fillRect(5, 11, 12, 9);
        g.fillStyle(0xa855f7, 1); // Purple "404" print
        g.fillRect(8, 14, 6, 2);

        // Head / Skin
        g.fillStyle(0xfde047, 1);
        g.fillRect(7, 4, 8, 7);
        // Eyes
        g.fillStyle(0x0f172a, 1);
        g.fillRect(8, 7, 2, 2);
        g.fillRect(12, 7, 2, 2);

        // Messy spiky wavy hair on top
        g.fillStyle(0x312e81, 1);
        g.fillRect(6, 2, 10, 4);
        g.fillRect(5, 1, 3, 2); // left spike
        g.fillRect(10, 0, 3, 2); // center spike
        g.fillRect(14, 1, 3, 2); // right spike
        g.fillRect(5, 4, 2, 4);
        g.fillRect(15, 4, 2, 4);

      } else if (role === 'devops') {
        // DIMAS: Backward baseball cap, tech utility vest, goatee/stubble
        // Shirt & Utility Vest
        g.fillStyle(0x1f2937, 1); // dark long-sleeve
        g.fillRect(5, 11, 12, 9);
        g.fillStyle(0xc2410c, 1); // Orange-red utility vest
        g.fillRect(5, 11, 4, 8);
        g.fillRect(13, 11, 4, 8);

        // Head / Skin
        g.fillStyle(0xfbcfe8, 1);
        g.fillRect(7, 4, 8, 7);
        // Stubble / Goatee shadow on chin
        g.fillStyle(0x7c2d12, 1);
        g.fillRect(9, 10, 4, 2);

        // Eyes
        g.fillStyle(0x0f172a, 1);
        g.fillRect(8, 7, 2, 2);
        g.fillRect(12, 7, 2, 2);

        // Backward baseball cap
        g.fillStyle(0x334155, 1);
        g.fillRect(6, 2, 10, 4); // Cap dome
        // Visor sticking out backward on the left
        g.fillStyle(0x1e293b, 1);
        g.fillRect(2, 4, 4, 2);

      } else if (role === 'qa') {
        // QORI: Sporty bob cut with bangs, round glasses, yellow mustard bomber jacket
        g.fillStyle(0xd97706, 1); // Mustard bomber
        g.fillRect(5, 11, 12, 9);
        g.fillStyle(0x92400e, 1); // Center zipper
        g.fillRect(10, 11, 2, 9);

        // Head / Skin
        g.fillStyle(0xfef08a, 1);
        g.fillRect(7, 4, 8, 7);

        // Round golden reading glasses
        g.fillStyle(0xeab308, 1);
        g.fillRect(7, 7, 3, 2);
        g.fillRect(12, 7, 3, 2);
        g.fillRect(10, 7, 2, 1);

        // Rounded bob cut with bangs framing face
        g.fillStyle(0xca8a04, 1);
        g.fillRect(6, 2, 10, 4); // Top dome
        g.fillRect(6, 5, 10, 2); // Bangs across forehead
        g.fillRect(4, 4, 3, 7); // Left bob curve at cheek
        g.fillRect(15, 4, 3, 7); // Right bob curve at cheek
      }

      g.generateTexture(spriteKey, 22, 30);
      g.destroy();
    });
  }

  private static generateEmotes(scene: Phaser.Scene) {
    const emotes = [
      { key: 'emote_working', bg: 0x3b82f6, icon: '💻' },
      { key: 'emote_thinking', bg: 0xa855f7, icon: '💡' },
      { key: 'emote_break', bg: 0xeab308, icon: '☕' },
      { key: 'emote_meeting', bg: 0x10b981, icon: '📋' },
      { key: 'emote_bug', bg: 0xef4444, icon: '🐞' },
    ];

    emotes.forEach(e => {
      if (!scene.textures.exists(e.key)) {
        const g = scene.make.graphics({ add: false });
        // Bubble pill background (24x20)
        g.fillStyle(0x0f172a, 0.9);
        g.fillRect(0, 0, 24, 18);
        g.fillStyle(e.bg, 1);
        g.fillRect(1, 1, 22, 16);
        // Pointer tip pointing down to head
        g.fillStyle(0x0f172a, 0.9);
        g.fillRect(10, 18, 4, 2);
        g.generateTexture(e.key, 24, 20);
        g.destroy();
      }
    });
  }
}
