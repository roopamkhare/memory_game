import { useState } from 'react';
import { usePigStore, PIG_COLORS } from './pigStore';

export function PigLobby() {
  const [names, setNames] = useState(['', '']);
  const { setupPlayers } = usePigStore();

  const handleStart = () => {
    if (!names[0].trim() || !names[1].trim()) {
      alert('Enter both player names!');
      return;
    }
    setupPlayers([names[0].trim(), names[1].trim()]);
  };

  return (
    <div className="pig-setup">
      <div className="pig-setup-header">
        <p className="pig-setup-desc">
          🐷 Roll dice to pile up points — but roll a 1 and lose your turn! First to {100} wins.
        </p>
      </div>

      <div className="pig-setup-players">
        {[0, 1].map((i) => (
          <div key={i} className="pig-setup-player" style={{ borderColor: PIG_COLORS[i] }}>
            <div className="pig-setup-avatar" style={{ background: PIG_COLORS[i] }}>
              {names[i] ? names[i].charAt(0).toUpperCase() : (i + 1)}
            </div>
            <div className="pig-setup-field">
              <label className="pig-setup-label" style={{ color: PIG_COLORS[i] }}>
                Player {i + 1}
              </label>
              <input
                className="pig-setup-input"
                type="text"
                placeholder={`Player ${i + 1} name`}
                value={names[i]}
                maxLength={18}
                onChange={(e) => {
                  const next = [...names];
                  next[i] = e.target.value;
                  setNames(next);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="pig-start-btn" onClick={handleStart}>
        Start Game!
      </button>
    </div>
  );
}
