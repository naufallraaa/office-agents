import Phaser from 'phaser';

/**
 * Procedural Pixel Art Generator for KANTOR-AI
 * Generates all office tiles, furniture, equipment, and agent sprites in memory.
 */
export class PixelArtGenerator {
  public static generateAll(scene: Phaser.Scene) {
    this.generateFloors(scene);
    this.generateWalls(scene);
    this.generateFurniture(scene);
    this.generateOfficeEquipment(scene);
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
      g.fillStyle(0x5c4033, 1); // dark walnut top
      g.fillRect(2, 6, 44, 24);
      g.fillStyle(0x7a5643, 1); // top edge bevel
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

  private static generateAgentSprites(scene: Phaser.Scene) {
    const roles = [
      { key: 'agent_pm', hair: 0x4a044e, shirt: 0xbe185d, skin: 0xfed7aa, accent: 0xfbcfe8 }, // Magenta blazer, dark wine hair, rose accent
      { key: 'agent_it_lead', hair: 0x451a03, shirt: 0x1e3a8a, skin: 0xfbcfe8, accent: 0x93c5fd }, // Navy Blazer, glasses
      { key: 'agent_frontend', hair: 0x1e293b, shirt: 0x059669, skin: 0xfed7aa, accent: 0xa7f3d0 }, // Green hoodie
      { key: 'agent_backend', hair: 0x312e81, shirt: 0x4c1d95, skin: 0xfde047, accent: 0xc4b5fd }, // Purple tee
      { key: 'agent_devops', hair: 0x7c2d12, shirt: 0xb91c1c, skin: 0xfbcfe8, accent: 0xfca5a5 }, // Red vest
      { key: 'agent_qa', hair: 0xca8a04, shirt: 0xd97706, skin: 0xfef08a, accent: 0xfde68a }, // Amber jacket
    ];

    roles.forEach(role => {
      if (!scene.textures.exists(role.key)) {
        const g = scene.make.graphics({ add: false });
        // Width: 20, Height: 28
        // Shadow on ground
        g.fillStyle(0x000000, 0.3);
        g.fillRect(4, 25, 12, 3);

        // Legs / Pants
        g.fillStyle(0x1e293b, 1); // dark jeans
        g.fillRect(6, 18, 3, 7);
        g.fillRect(11, 18, 3, 7);
        // Shoes
        g.fillStyle(0x0f172a, 1);
        g.fillRect(5, 24, 4, 3);
        g.fillRect(11, 24, 4, 3);

        // Torso / Shirt
        g.fillStyle(role.shirt, 1);
        g.fillRect(5, 10, 10, 9);
        // Collar / Accent
        g.fillStyle(role.accent, 1);
        g.fillRect(8, 10, 4, 3);

        // Head / Skin
        g.fillStyle(role.skin, 1);
        g.fillRect(6, 4, 8, 7);
        // Eyes
        g.fillStyle(0x0f172a, 1);
        g.fillRect(7, 7, 2, 2);
        g.fillRect(11, 7, 2, 2);

        // Hair
        g.fillStyle(role.hair, 1);
        g.fillRect(5, 2, 10, 4);
        g.fillRect(4, 4, 2, 3);
        g.fillRect(14, 4, 2, 3);

        g.generateTexture(role.key, 20, 28);
        g.destroy();
      }
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
