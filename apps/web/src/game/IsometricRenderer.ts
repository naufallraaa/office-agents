import Phaser from 'phaser';

/**
 * HD Isometric 2.5D Vector Renderer for KANTOR-AI
 * Generates The Sims-style isometric architecture, furniture, characters, and rotating Plumbobs.
 */
export class IsometricRenderer {
  // Tile dimensions for 2:1 isometric projection
  public static readonly TILE_W = 64;
  public static readonly TILE_H = 32;

  public static toScreen(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: (gridX - gridY) * (this.TILE_W / 2),
      y: (gridX + gridY) * (this.TILE_H / 2),
    };
  }

  public static generateAll(scene: Phaser.Scene) {
    this.generateFloors(scene);
    this.generateWallsAndStairs(scene);
    this.generateModernFurniture(scene);
    this.generateDecor(scene);
    this.generatePlumbobTextures(scene);
    this.generateCharacterSprites(scene);
  }

  // ==========================================
  // 1. ISOMETRIC FLOOR TILES (HD DIAMONDS)
  // ==========================================
  private static generateFloors(scene: Phaser.Scene) {
    const W = this.TILE_W;
    const H = this.TILE_H;

    // Floor 2: Scandinavian Light Oak Parquet (64x32 Diamond)
    if (!scene.textures.exists('iso_floor_oak')) {
      const g = scene.make.graphics({ add: false });
      // Base diamond
      g.fillStyle(0xd9b382, 1);
      g.beginPath();
      g.moveTo(W / 2, 0);
      g.lineTo(W, H / 2);
      g.lineTo(W / 2, H);
      g.lineTo(0, H / 2);
      g.closePath();
      g.fillPath();

      // Parquet plank lines
      g.lineStyle(1, 0xb88e5d, 0.7);
      g.beginPath();
      g.moveTo(W * 0.25, H * 0.25);
      g.lineTo(W * 0.75, H * 0.75);
      g.moveTo(W * 0.5, 0);
      g.lineTo(W * 0.5, H);
      g.strokePath();

      // Ambient border highlight
      g.lineStyle(1, 0xe8cca8, 0.4);
      g.strokePath();

      g.generateTexture('iso_floor_oak', W, H);
      g.destroy();
    }

    // Floor 1: Terrazzo White Marble (64x32 Diamond)
    if (!scene.textures.exists('iso_floor_marble')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0xf1f5f9, 1);
      g.beginPath();
      g.moveTo(W / 2, 0);
      g.lineTo(W, H / 2);
      g.lineTo(W / 2, H);
      g.lineTo(0, H / 2);
      g.closePath();
      g.fillPath();

      // Subtle marble vein texture
      g.fillStyle(0xcfd8dc, 0.5);
      g.fillRect(W * 0.3, H * 0.3, 4, 2);
      g.fillRect(W * 0.6, H * 0.6, 6, 2);
      g.fillRect(W * 0.4, H * 0.7, 5, 2);

      // Clean tile seam
      g.lineStyle(1, 0x94a3b8, 0.6);
      g.beginPath();
      g.moveTo(W / 2, 0);
      g.lineTo(W, H / 2);
      g.lineTo(W / 2, H);
      g.lineTo(0, H / 2);
      g.closePath();
      g.strokePath();

      g.generateTexture('iso_floor_marble', W, H);
      g.destroy();
    }

    // Floor 3: Executive Rooftop Dark Slate (64x32 Diamond)
    if (!scene.textures.exists('iso_floor_slate')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x1e293b, 1);
      g.beginPath();
      g.moveTo(W / 2, 0);
      g.lineTo(W, H / 2);
      g.lineTo(W / 2, H);
      g.lineTo(0, H / 2);
      g.closePath();
      g.fillPath();

      // Subtle reflective sheen
      g.fillStyle(0x334155, 0.7);
      g.beginPath();
      g.moveTo(W / 2, 2);
      g.lineTo(W - 4, H / 2);
      g.lineTo(W / 2, H - 2);
      g.lineTo(4, H / 2);
      g.closePath();
      g.fillPath();

      g.lineStyle(1, 0x475569, 0.8);
      g.strokePath();

      g.generateTexture('iso_floor_slate', W, H);
      g.destroy();
    }
  }

  // ==========================================
  // 2. ISOMETRIC WALLS, GLASS & ELEVATOR
  // ==========================================
  private static generateWallsAndStairs(scene: Phaser.Scene) {
    // Frosted Glass Partition (Isometric Left & Right Facing)
    if (!scene.textures.exists('iso_glass_wall_left')) {
      const g = scene.make.graphics({ add: false });
      // 32 wide, 60 tall
      g.fillStyle(0x38bdf8, 0.25);
      g.fillRect(0, 0, 32, 60);
      // Aluminum top & bottom frame
      g.fillStyle(0x64748b, 1);
      g.fillRect(0, 0, 32, 4);
      g.fillRect(0, 56, 32, 4);
      // Vertical glass reflection line
      g.fillStyle(0xffffff, 0.4);
      g.fillRect(8, 6, 2, 48);
      g.generateTexture('iso_glass_wall_left', 32, 60);
      g.destroy();
    }

    // Concrete Staircase with wooden handrail, side view ascending right (56x84)
    if (!scene.textures.exists('iso_stairs')) {
      const g = scene.make.graphics({ add: false });
      // Ground contact shadow
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(28, 78, 48, 8);
      // 6 steps ascending left -> right
      for (let i = 0; i < 6; i++) {
        const x0 = 4 + i * 8;
        const top = 68 - i * 8;
        const w = 52 - x0;
        g.fillStyle(0xb9c4d0, 1); // concrete riser body
        g.fillRect(x0, top, w, 8);
        g.fillStyle(0xf1f5f9, 1); // tread highlight
        g.fillRect(x0, top, w, 2);
        g.fillStyle(0x8b98a8, 1); // riser foot shadow
        g.fillRect(x0, top + 6, w, 2);
      }
      // Newel post at stair foot
      g.fillStyle(0x6b4423, 1);
      g.fillRect(2, 56, 4, 22);
      g.fillStyle(0x451a03, 1);
      g.fillCircle(4, 54, 3);
      // Steel baluster posts sitting on steps
      const posts = [
        { x: 9, base: 68 },
        { x: 25, base: 52 },
        { x: 41, base: 36 },
      ];
      g.fillStyle(0x475569, 1);
      posts.forEach(p => {
        g.fillRect(p.x, p.base - 18, 2, 18);
        g.fillCircle(p.x + 1, p.base - 18, 2);
      });
      // Wooden handrail with sheen, parallel to stair slope
      g.lineStyle(4, 0x6b4423, 1);
      g.lineBetween(4, 58, 52, 10);
      g.lineStyle(2, 0xa97a4a, 1);
      g.lineBetween(4, 57, 52, 9);
      g.generateTexture('iso_stairs', 56, 84);
      g.destroy();
    }
  }

  // ==========================================
  // 3. MODERN THE SIMS-STYLE FURNITURE
  // ==========================================
  private static generateModernFurniture(scene: Phaser.Scene) {
    // 1. Sleek White Minimalist Desk (56x36)
    if (!scene.textures.exists('iso_desk_modern')) {
      const g = scene.make.graphics({ add: false });
      // Soft ground drop shadow
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(28, 30, 24, 6);
      // Aluminum legs
      g.fillStyle(0x64748b, 1);
      g.fillRect(6, 16, 3, 16);
      g.fillRect(47, 16, 3, 16);
      // Pure white desk top surface with beveled edge
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(2, 8, 52, 14);
      g.fillStyle(0xffffff, 1);
      g.fillRect(2, 6, 52, 3);
      // Charcoal desk mat
      g.fillStyle(0x1e293b, 1);
      g.fillRect(12, 9, 32, 11);
      g.generateTexture('iso_desk_modern', 56, 36);
      g.destroy();
    }

    // 2. Herman Miller Aeron-style Ergonomic Chair (24x30)
    if (!scene.textures.exists('iso_chair_ergonomic')) {
      const g = scene.make.graphics({ add: false });
      // Base wheel star
      g.fillStyle(0x0f172a, 1);
      g.fillRect(8, 24, 8, 4);
      // Piston cylinder
      g.fillStyle(0x475569, 1);
      g.fillRect(11, 18, 2, 6);
      // Seat cushion (charcoal mesh)
      g.fillStyle(0x1e293b, 1);
      g.fillEllipse(12, 16, 9, 5);
      // Curved spine backrest
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(4, 4, 16, 12, 4);
      // Mesh ventilation center
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(6, 6, 12, 8, 2);
      g.generateTexture('iso_chair_ergonomic', 24, 30);
      g.destroy();
    }

    // 3. Cafe Espresso Bar Counter (Lantai 1) (64x44)
    if (!scene.textures.exists('iso_cafe_counter')) {
      const g = scene.make.graphics({ add: false });
      // Base walnut panel
      g.fillStyle(0x451a03, 1);
      g.fillRect(4, 14, 56, 26);
      // White Italian marble top
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(2, 8, 60, 8);
      g.fillStyle(0xe2e8f0, 1);
      g.fillRect(2, 14, 60, 2);
      // Chrome espresso machine
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(36, 0, 20, 14);
      g.fillStyle(0x0284c7, 1); // Pressure gauge
      g.fillRect(44, 4, 4, 4);
      // Coffee cups & steam
      g.fillStyle(0xffffff, 1);
      g.fillRect(16, 4, 4, 4);
      g.fillRect(24, 4, 4, 4);
      g.generateTexture('iso_cafe_counter', 64, 44);
      g.destroy();
    }

    // 4. Lounge Designer Modular Sofa (Lantai 1) (56x32)
    if (!scene.textures.exists('iso_lounge_sofa')) {
      const g = scene.make.graphics({ add: false });
      // Soft shadow
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(28, 28, 26, 6);
      // Warm modern teal cushions
      g.fillStyle(0x0f766e, 1);
      g.fillRoundedRect(4, 12, 48, 16, 6);
      g.fillStyle(0x14b8a6, 1); // soft seat highlight
      g.fillRoundedRect(6, 14, 44, 12, 4);
      // Backrest
      g.fillStyle(0x0d9488, 1);
      g.fillRoundedRect(4, 4, 48, 10, 4);
      g.generateTexture('iso_lounge_sofa', 56, 32);
      g.destroy();
    }

    // 5. Large Conference Boardroom Table (Lantai 3) (80x40)
    if (!scene.textures.exists('iso_boardroom_table')) {
      const g = scene.make.graphics({ add: false });
      // Soft drop shadow
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(40, 34, 38, 8);
      // Heavy pedestal legs
      g.fillStyle(0x1e293b, 1);
      g.fillRect(16, 20, 8, 14);
      g.fillRect(56, 20, 8, 14);
      // Frosted tinted glass top
      g.fillStyle(0x0284c7, 0.3);
      g.fillRoundedRect(2, 6, 76, 20, 8);
      g.lineStyle(2, 0x38bdf8, 0.8);
      g.strokeRoundedRect(2, 6, 76, 20, 8);
      // Center power/cable hub
      g.fillStyle(0x0f172a, 1);
      g.fillRect(28, 13, 24, 6);
      g.generateTexture('iso_boardroom_table', 80, 40);
      g.destroy();
    }

    // 6. Fiddle Leaf Fig / Monstera Plant in Ceramic Pot (28x40)
    if (!scene.textures.exists('iso_plant_monstera')) {
      const g = scene.make.graphics({ add: false });
      // Ceramic white pot
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(6, 24, 16, 14, 3);
      g.fillStyle(0x451a03, 1); // soil
      g.fillEllipse(14, 24, 7, 2);
      // Lush organic layered leaves
      g.fillStyle(0x15803d, 1);
      g.fillEllipse(8, 12, 8, 12);
      g.fillEllipse(20, 10, 8, 12);
      g.fillStyle(0x22c55e, 1);
      g.fillEllipse(14, 6, 10, 14);
      g.fillEllipse(11, 16, 6, 10);
      g.generateTexture('iso_plant_monstera', 28, 40);
      g.destroy();
    }

    // 7. DevOps Server Rack (Lantai 2 Glass Room) (32x56)
    if (!scene.textures.exists('iso_server_rack')) {
      const g = scene.make.graphics({ add: false });
      // Tower chassis
      g.fillStyle(0x020617, 1);
      g.fillRoundedRect(2, 2, 28, 52, 4);
      g.lineStyle(1, 0x334155, 1);
      g.strokeRoundedRect(2, 2, 28, 52, 4);
      // Blade servers
      for (let y = 6; y <= 44; y += 8) {
        g.fillStyle(0x0f172a, 1);
        g.fillRect(5, y, 22, 6);
        // Blinking LEDs
        g.fillStyle(0x22c55e, 1);
        g.fillRect(7, y + 2, 2, 2);
        g.fillStyle(0x38bdf8, 1);
        g.fillRect(11, y + 2, 2, 2);
        g.fillStyle(0xf59e0b, 1);
        g.fillRect(15, y + 2, 2, 2);
      }
      g.generateTexture('iso_server_rack', 32, 56);
      g.destroy();
    }
  }

  // ==========================================
  // 4. THE SIMS ICONIC PLUMBOB (ROTATING 3D DIAMOND)
  // ==========================================
  private static generatePlumbobTextures(scene: Phaser.Scene) {
    const states = [
      { key: 'plumbob_green', color: 0x22c55e, glow: 0x86efac }, // Working
      { key: 'plumbob_blue', color: 0x0ea5e9, glow: 0x7dd3fc },  // Thinking / Scoping
      { key: 'plumbob_gold', color: 0xf59e0b, glow: 0xfde68a },  // Break / Cafe
      { key: 'plumbob_red', color: 0xef4444, glow: 0xfca5a5 },   // Bug Alert
    ];

    states.forEach(st => {
      if (!scene.textures.exists(st.key)) {
        const g = scene.make.graphics({ add: false });
        const W = 20;
        const H = 28;

        // Outer soft glow
        g.fillStyle(st.glow, 0.4);
        g.fillEllipse(W / 2, H / 2, 10, 14);

        // Top pyramid facet
        g.fillStyle(st.color, 1);
        g.beginPath();
        g.moveTo(W / 2, 2);
        g.lineTo(W - 4, H / 2);
        g.lineTo(4, H / 2);
        g.closePath();
        g.fillPath();

        // Bottom pyramid facet
        g.fillStyle(st.color, 0.85);
        g.beginPath();
        g.moveTo(4, H / 2);
        g.lineTo(W - 4, H / 2);
        g.lineTo(W / 2, H - 2);
        g.closePath();
        g.fillPath();

        // Diamond center shine line
        g.lineStyle(1, 0xffffff, 0.9);
        g.beginPath();
        g.moveTo(W / 2, 2);
        g.lineTo(W / 2, H - 2);
        g.moveTo(4, H / 2);
        g.lineTo(W - 4, H / 2);
        g.strokePath();

        g.generateTexture(st.key, W, H);
        g.destroy();
      }
    });
  }

  // ==========================================
  // 5. HD SIMS-STYLE CHARACTERS (SMOOTH SILHOUETTES)
  // ==========================================
  private static generateCharacterSprites(scene: Phaser.Scene) {
    const characters = [
      {
        key: 'sim_pm', // SARAH: Long flowing wavy dark-wine hair, magenta blazer
        hair: 0x4a044e,
        skin: 0xfed7aa,
        shirt: 0xbe185d,
        accent: 0xfef3c7,
        longHair: true,
        ponytail: false,
        cap: false,
        glasses: false,
      },
      {
        key: 'sim_it_lead', // BUDI: Parted dark hair, glasses, navy oxford
        hair: 0x451a03,
        skin: 0xfbcfe8,
        shirt: 0x1e3a8a,
        accent: 0x93c5fd,
        longHair: false,
        ponytail: false,
        cap: false,
        glasses: true,
      },
      {
        key: 'sim_frontend', // FANI: High ponytail, teal tie, emerald hoodie, headphones
        hair: 0x1e293b,
        skin: 0xfed7aa,
        shirt: 0x059669,
        accent: 0x14b8a6,
        longHair: false,
        ponytail: true,
        cap: false,
        glasses: false,
      },
      {
        key: 'sim_backend', // BAGAS: Messy wavy hair, black 404 tee
        hair: 0x312e81,
        skin: 0xfde047,
        shirt: 0x18181b,
        accent: 0xa855f7,
        longHair: false,
        ponytail: false,
        cap: false,
        glasses: false,
      },
      {
        key: 'sim_devops', // DIMAS: Backward cap, orange utility vest, goatee
        hair: 0x334155,
        skin: 0xfbcfe8,
        shirt: 0xc2410c,
        accent: 0x1f2937,
        longHair: false,
        ponytail: false,
        cap: true,
        glasses: false,
      },
      {
        key: 'sim_qa', // QORI: Sporty honey bob with bangs, round glasses, yellow bomber
        hair: 0xca8a04,
        skin: 0xfef08a,
        shirt: 0xd97706,
        accent: 0x92400e,
        longHair: false,
        ponytail: false,
        cap: false,
        glasses: true,
      },
    ];

    characters.forEach(char => {
      if (scene.textures.exists(char.key)) return;

      const g = scene.make.graphics({ add: false });
      const W = 28;
      const H = 46;

      // Soft character contact shadow
      g.fillStyle(0x000000, 0.35);
      g.fillEllipse(W / 2, H - 4, 18, 6);

      // Shoes
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(7, H - 6, 6, 4, 2);
      g.fillRoundedRect(15, H - 6, 6, 4, 2);

      // Jeans / Legs
      g.fillStyle(0x1e293b, 1);
      g.fillRect(8, 28, 5, 12);
      g.fillRect(15, 28, 5, 12);

      // Upper Torso / Clothing
      g.fillStyle(char.shirt, 1);
      g.fillRoundedRect(6, 16, 16, 14, 4);

      // Accent collar / inner top / vest
      g.fillStyle(char.accent, 1);
      g.fillRect(12, 16, 4, 8);

      // Neck & Head
      g.fillStyle(char.skin, 1);
      g.fillRect(12, 13, 4, 4); // neck
      g.fillRoundedRect(8, 4, 12, 12, 5); // head

      // Eyes
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(11, 10, 1.5);
      g.fillCircle(17, 10, 1.5);

      // Glasses
      if (char.glasses) {
        g.lineStyle(1, 0x0f172a, 1);
        g.strokeCircle(11, 10, 3);
        g.strokeCircle(17, 10, 3);
        g.strokeLineShape(new Phaser.Geom.Line(14, 10, 15, 10));
      }

      // Hair Styles
      g.fillStyle(char.hair, 1);
      if (char.longHair) {
        // Sarah's long flowing hair past shoulders
        g.fillRoundedRect(6, 2, 16, 6, 3);
        g.fillRoundedRect(5, 4, 4, 20, 2);
        g.fillRoundedRect(19, 4, 4, 20, 2);
      } else if (char.ponytail) {
        // Fani's high ponytail
        g.fillRoundedRect(7, 2, 14, 5, 3);
        // Ponytail bundle
        g.fillStyle(char.hair, 1);
        g.fillEllipse(22, 5, 5, 8);
        g.fillStyle(0x14b8a6, 1); // teal tie
        g.fillCircle(20, 4, 2);
        // Headset around neck
        g.lineStyle(2, 0x0284c7, 1);
        g.strokeRoundedRect(7, 15, 14, 4, 2);
      } else if (char.cap) {
        // Dimas's backward cap
        g.fillStyle(0x334155, 1);
        g.fillRoundedRect(7, 2, 14, 6, 3);
        g.fillRect(3, 5, 5, 2); // backward visor
        // Goatee
        g.fillStyle(0x7c2d12, 1);
        g.fillRect(12, 13, 4, 2);
      } else {
        // Classic clean / wavy parted hair (Budi, Bagas, Qori)
        g.fillRoundedRect(7, 2, 14, 6, 3);
        g.fillRect(6, 5, 3, 5);
        g.fillRect(19, 5, 3, 5);
      }

      g.generateTexture(char.key, W, H);
      g.destroy();
    });
  }

  // ==========================================
  // 6. INDOOR DECOR SET (rugs, dining, lamps, shelves, boards)
  // ==========================================
  private static generateDecor(scene: Phaser.Scene) {
    // 1. Oval Lounge Rug (96x48) — warm terracotta rings
    if (!scene.textures.exists('iso_rug_oval')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(48, 26, 88, 40);
      g.fillStyle(0xc2703d, 1);
      g.fillEllipse(48, 24, 88, 40);
      g.fillStyle(0xe0a060, 1);
      g.fillEllipse(48, 24, 68, 30);
      g.fillStyle(0xf3cf9a, 1);
      g.fillEllipse(48, 24, 48, 20);
      g.fillStyle(0xc2703d, 1);
      g.fillEllipse(48, 24, 26, 11);
      g.generateTexture('iso_rug_oval', 96, 48);
      g.destroy();
    }

    // 2. Round Dining Set: table + 2 chairs + plates (72x56)
    if (!scene.textures.exists('iso_dining_set')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(36, 48, 44, 12);
      // Chairs (left & right)
      g.fillStyle(0x334155, 1);
      g.fillRoundedRect(2, 26, 14, 14, 4);
      g.fillRoundedRect(56, 26, 14, 14, 4);
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(4, 22, 10, 8, 3);
      g.fillRoundedRect(58, 22, 10, 8, 3);
      // Pedestal leg
      g.fillStyle(0x1e293b, 1);
      g.fillRect(32, 34, 8, 14);
      g.fillEllipse(36, 48, 20, 6);
      // Round walnut tabletop
      g.fillStyle(0x6b4423, 1);
      g.fillEllipse(36, 28, 44, 22);
      g.fillStyle(0x8b5e34, 1);
      g.fillEllipse(36, 26, 44, 22);
      // Plates + cups
      g.fillStyle(0xf8fafc, 1);
      g.fillEllipse(27, 25, 10, 6);
      g.fillEllipse(45, 25, 10, 6);
      g.fillStyle(0xef4444, 1);
      g.fillRect(25, 21, 4, 4);
      g.fillStyle(0x0284c7, 1);
      g.fillRect(43, 21, 4, 4);
      g.generateTexture('iso_dining_set', 72, 56);
      g.destroy();
    }

    // 3. Hanging Pendant Lamp with warm glow (24x52)
    if (!scene.textures.exists('iso_pendant')) {
      const g = scene.make.graphics({ add: false });
      // Cord
      g.fillStyle(0x0f172a, 1);
      g.fillRect(11, 0, 2, 20);
      // Warm halo
      g.fillStyle(0xfde68a, 0.25);
      g.fillEllipse(12, 40, 22, 12);
      // Shade (matte black dome)
      g.fillStyle(0x1e293b, 1);
      g.fillTriangle(4, 32, 20, 32, 12, 20);
      g.fillStyle(0x334155, 1);
      g.fillTriangle(7, 32, 17, 32, 12, 22);
      // Glowing bulb
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(12, 35, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(12, 35, 2);
      g.generateTexture('iso_pendant', 24, 52);
      g.destroy();
    }

    // 4. Reception Desk with logo panel (84x52)
    if (!scene.textures.exists('iso_reception')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(42, 46, 64, 12);
      // Curved walnut front
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(6, 20, 72, 26, 6);
      g.fillStyle(0x78350f, 1);
      g.fillRoundedRect(6, 20, 72, 8, { tl: 6, tr: 6, bl: 0, br: 0 });
      // White stone top
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(2, 14, 80, 10, 4);
      // Backlit logo panel
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(24, 26, 36, 14, 3);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(28, 30, 20, 3);
      g.fillRect(28, 34, 28, 2);
      // Desk bell + plant
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(14, 13, 3);
      g.fillStyle(0x22c55e, 1);
      g.fillRect(66, 6, 5, 8);
      g.generateTexture('iso_reception', 84, 52);
      g.destroy();
    }

    // 5. Bookshelf full of books (44x64)
    if (!scene.textures.exists('iso_bookshelf')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(22, 60, 36, 8);
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(2, 2, 40, 58, 3);
      const bookColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0x8b5cf6, 0x06b6d4];
      for (let shelf = 0; shelf < 3; shelf++) {
        const y = 8 + shelf * 17;
        g.fillStyle(0x1c0a00, 1);
        g.fillRect(5, y, 34, 13);
        let bx = 6;
        for (let b = 0; b < 6; b++) {
          g.fillStyle(bookColors[(shelf * 6 + b) % bookColors.length], 1);
          const bw = 3 + ((shelf + b) % 3);
          g.fillRect(bx, y + 1, bw, 11);
          bx += bw + 1;
        }
      }
      g.generateTexture('iso_bookshelf', 44, 64);
      g.destroy();
    }

    // 6a. Wall Art: mountain poster (30x40)
    if (!scene.textures.exists('iso_art_mountains')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x78350f, 1);
      g.fillRoundedRect(0, 0, 30, 40, 2);
      g.fillStyle(0xbae6fd, 1);
      g.fillRoundedRect(3, 3, 24, 34, 1);
      g.fillStyle(0x1e3a8a, 1);
      g.fillTriangle(3, 37, 15, 14, 27, 37);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(11, 21, 15, 14, 19, 21);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(22, 10, 3);
      g.generateTexture('iso_art_mountains', 30, 40);
      g.destroy();
    }

    // 6b. Wall Art: abstract sprint board (30x40)
    if (!scene.textures.exists('iso_art_sprint')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(0, 0, 30, 40, 2);
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(3, 3, 24, 34, 1);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(6, 6, 10, 8);
      g.fillStyle(0xec4899, 1);
      g.fillRect(17, 6, 7, 8);
      g.fillStyle(0x22c55e, 1);
      g.fillRect(6, 16, 18, 4);
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(6, 22, 12, 4);
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(6, 28, 18, 2);
      g.fillRect(6, 32, 14, 2);
      g.generateTexture('iso_art_sprint', 30, 40);
      g.destroy();
    }

    // 7. Low Coffee Table with magazines (48x26)
    if (!scene.textures.exists('iso_coffee_table')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(24, 22, 40, 8);
      g.fillStyle(0x334155, 1);
      g.fillRect(6, 14, 3, 8);
      g.fillRect(39, 14, 3, 8);
      g.fillStyle(0x8b5e34, 1);
      g.fillRoundedRect(2, 8, 44, 8, 3);
      g.fillStyle(0xa97a4a, 1);
      g.fillRoundedRect(2, 8, 44, 3, { tl: 3, tr: 3, bl: 0, br: 0 });
      // Magazines + mug
      g.fillStyle(0xec4899, 1);
      g.fillRect(8, 4, 8, 5);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(18, 4, 8, 5);
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(34, 3, 5, 6);
      g.generateTexture('iso_coffee_table', 48, 26);
      g.destroy();
    }

    // 8. Snack Rack / pantry shelf (36x58)
    if (!scene.textures.exists('iso_snack_rack')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(18, 54, 30, 7);
      g.fillStyle(0x475569, 1);
      g.fillRect(3, 2, 3, 52);
      g.fillRect(30, 2, 3, 52);
      const snackColors = [0xef4444, 0xf59e0b, 0x22c55e, 0x38bdf8];
      for (let s = 0; s < 4; s++) {
        const y = 6 + s * 12;
        g.fillStyle(0x1e293b, 1);
        g.fillRect(3, y + 8, 30, 2);
        for (let i = 0; i < 4; i++) {
          g.fillStyle(snackColors[(s + i) % snackColors.length], 1);
          g.fillRoundedRect(6 + i * 7, y, 5, 8, 1);
        }
      }
      g.generateTexture('iso_snack_rack', 36, 58);
      g.destroy();
    }

    // 9. Mobile Whiteboard with sprint notes (60x54)
    if (!scene.textures.exists('iso_whiteboard')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.22);
      g.fillEllipse(30, 50, 48, 8);
      // Stand legs + wheels
      g.fillStyle(0x475569, 1);
      g.fillRect(12, 40, 3, 10);
      g.fillRect(45, 40, 3, 10);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(13, 51, 2);
      g.fillCircle(46, 51, 2);
      // Board frame
      g.fillStyle(0x94a3b8, 1);
      g.fillRoundedRect(2, 2, 56, 40, 3);
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(4, 4, 52, 36, 2);
      // Sticky notes + marker lines
      g.fillStyle(0xfacc15, 1);
      g.fillRect(8, 8, 7, 7);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(18, 8, 7, 7);
      g.fillStyle(0x4ade80, 1);
      g.fillRect(28, 8, 7, 7);
      g.fillStyle(0xef4444, 0.8);
      g.fillRect(8, 22, 24, 2);
      g.fillStyle(0x0f172a, 0.7);
      g.fillRect(8, 27, 18, 2);
      g.fillStyle(0x0f172a, 0.5);
      g.fillRect(8, 32, 28, 2);
      g.generateTexture('iso_whiteboard', 60, 54);
      g.destroy();
    }

    // 10. Wall Presentation Screen (72x50)
    if (!scene.textures.exists('iso_screen')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x0f172a, 1);
      g.fillRoundedRect(2, 2, 68, 44, 4);
      // Slide: velocity chart
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(6, 6, 60, 36, 2);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(12, 30, 8, 8);
      g.fillRect(24, 24, 8, 14);
      g.fillRect(36, 18, 8, 20);
      g.fillStyle(0x22c55e, 1);
      g.fillRect(48, 14, 8, 24);
      g.fillStyle(0xffffff, 1);
      g.fillRect(10, 8, 30, 3);
      // Stand
      g.fillStyle(0x475569, 1);
      g.fillRect(34, 46, 4, 4);
      g.generateTexture('iso_screen', 72, 50);
      g.destroy();
    }

    // 11. Locker Row — 4 tall lockers (80x58)
    if (!scene.textures.exists('iso_lockers')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(40, 54, 70, 9);
      const doorColors = [0x0ea5e9, 0x10b981, 0xf59e0b, 0xec4899];
      for (let i = 0; i < 4; i++) {
        const x = 3 + i * 19;
        g.fillStyle(0x0f172a, 1);
        g.fillRoundedRect(x, 2, 18, 52, 2);
        g.fillStyle(doorColors[i], 1);
        g.fillRoundedRect(x + 2, 4, 14, 48, 2);
        // Vents + handle
        g.fillStyle(0x000000, 0.35);
        for (let v = 0; v < 3; v++) {
          g.fillRect(x + 5, 9 + v * 3, 8, 1);
        }
        g.fillStyle(0xf8fafc, 1);
        g.fillRect(x + 12, 28, 2, 6);
      }
      g.generateTexture('iso_lockers', 80, 58);
      g.destroy();
    }

    // 12. Credenza Sideboard with coffee + water (64x34)
    if (!scene.textures.exists('iso_sideboard')) {
      const g = scene.make.graphics({ add: false });
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(32, 30, 54, 8);
      g.fillStyle(0x334155, 1);
      g.fillRect(6, 26, 3, 6);
      g.fillRect(55, 26, 3, 6);
      // Walnut body
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(4, 10, 56, 18, 3);
      g.fillStyle(0x78350f, 1);
      g.fillRect(4, 10, 56, 3);
      // Cabinet split lines
      g.fillStyle(0x1c0a00, 1);
      g.fillRect(22, 12, 1, 14);
      g.fillRect(41, 12, 1, 14);
      // Coffee pot + cups on top
      g.fillStyle(0x0f172a, 1);
      g.fillRect(12, 2, 8, 8);
      g.fillStyle(0xf8fafc, 1);
      g.fillRect(30, 5, 4, 5);
      g.fillRect(37, 5, 4, 5);
      g.fillStyle(0x22c55e, 1);
      g.fillRect(48, 4, 5, 6);
      g.generateTexture('iso_sideboard', 64, 34);
      g.destroy();
    }
  }
}
