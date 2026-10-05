import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { OfficeScene } from './game/OfficeScene';
import { RetroHUD } from './components/RetroHUD';
import { useOfficeStore } from './store/useOfficeStore';
import type { Agent } from 'shared';

export const App: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGame = useRef<Phaser.Game | null>(null);
  const officeScene = useRef<OfficeScene | null>(null);

  const { setSelectedAgent, connectSSE } = useOfficeStore();

  useEffect(() => {
    // Connect to Backend SSE
    const cleanupSSE = connectSSE();

    // Initialize Phaser 3 Game
    if (gameRef.current && !phaserGame.current) {
      const scene = new OfficeScene();
      officeScene.current = scene;

      scene.setCallbacks({
        onAgentSelect: (agent: Agent) => {
          setSelectedAgent(agent);
        },
      });

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: window.innerWidth,
        height: window.innerHeight,
        pixelArt: true,
        backgroundColor: '#0b0f19',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [scene],
      };

      phaserGame.current = new Phaser.Game(config);
    }

    return () => {
      cleanupSSE();
      if (phaserGame.current) {
        phaserGame.current.destroy(true);
        phaserGame.current = null;
        officeScene.current = null;
      }
    };
  }, []);

  const handleFocusAgent = (agent: Agent) => {
    officeScene.current?.focusOnAgent(agent);
  };

  const handleToggleNightMode = (isNight: boolean) => {
    officeScene.current?.setNightMode(isNight);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Phaser Canvas Container */}
      <div ref={gameRef} style={{ width: '100%', height: '100%' }} />

      {/* Retro 16-Bit HUD Overlay */}
      <RetroHUD onFocusAgent={handleFocusAgent} onToggleNightMode={handleToggleNightMode} />
    </div>
  );
};
