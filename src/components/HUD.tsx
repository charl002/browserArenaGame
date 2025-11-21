import { useGameStore } from '../store/gameStore';
import { Classes } from '../game/classes';
import { useState, useEffect } from 'react';

export function HUD() {
    const { player, targetId, currentClass, cooldowns } = useGameStore();
    const casting = useGameStore(state => state.casting);
    const enemies = useGameStore(state => state.enemies);
    const abilities = Classes[currentClass as keyof typeof Classes].abilities;

    // Force re-render for cooldowns
    const [, setTick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', padding: '20px', fontFamily: 'sans-serif', zIndex: 1000 }}>
            {/* Player Frame */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px', color: 'white' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{currentClass}</div>

                {/* Class Selector Removed */}

                <div style={{ width: '200px', height: '20px', background: '#333', marginTop: '5px' }}>
                    <div style={{ width: `${(player.health / player.maxHealth) * 100}%`, height: '100%', background: 'green' }} />
                </div>
                <div style={{ width: '200px', height: '10px', background: '#333', marginTop: '2px' }}>
                    <div style={{ width: `${(player.resource / player.maxResource) * 100}%`, height: '100%', background: 'blue' }} />
                </div>
            </div>

            {/* Target Frame */}
            {targetId && enemies[targetId] && (
                <div style={{ position: 'absolute', top: '20px', left: '250px', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '5px', color: 'white' }}>
                    <div style={{ fontWeight: 'bold' }}>Target: {targetId}</div>
                    <div style={{ width: '200px', height: '20px', background: '#333', marginTop: '5px' }}>
                        <div style={{ width: `${(enemies[targetId].health / enemies[targetId].maxHealth) * 100}%`, height: '100%', background: 'red', transition: 'width 0.2s' }} />
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px' }}>
                {[1, 2, 3, 4, 5].map((i) => {
                    const key = `action${i}` as keyof typeof abilities;
                    const ability = abilities[key];
                    const readyAt = cooldowns[ability.id] || 0;
                    const now = Date.now();
                    const onCooldown = now < readyAt;
                    const timeLeft = onCooldown ? ((readyAt - now) / 1000).toFixed(1) : null;

                    return (
                        <div key={i} style={{ width: '60px', height: '60px', background: onCooldown ? 'rgba(50,0,0,0.7)' : 'rgba(0,0,0,0.7)', border: '1px solid #555', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '12px', position: 'relative' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{i}</div>
                            <div style={{ textAlign: 'center' }}>{ability.name}</div>
                            {onCooldown && (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', fontWeight: 'bold', color: 'white', textShadow: '1px 1px 2px black' }}>
                                    {timeLeft}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Cast Bar */}
            {casting && (
                <div style={{ position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '20px', background: '#222', border: '1px solid #555', borderRadius: '5px' }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'yellow',
                        animation: `cast ${casting.duration}s linear forwards`,
                        transformOrigin: 'left'
                    }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'black', fontSize: '12px', fontWeight: 'bold' }}>
                        {casting.abilityName}
                    </div>
                    <style>{`
                        @keyframes cast {
                            from { width: 0%; }
                            to { width: 100%; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
