import { Classes } from '../game/classes';
import { useGameStore } from '../store/gameStore';

export function ClassSelection() {
    const { setClass, setGameState } = useGameStore();

    const handleSelect = (className: string) => {
        setClass(className);
        setGameState('playing');
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000,
            color: 'white',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Select Your Class</h1>
            <div style={{ display: 'flex', gap: '2rem' }}>
                {Object.keys(Classes).map((className) => (
                    <button
                        key={className}
                        onClick={() => handleSelect(className)}
                        style={{
                            padding: '20px',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '2px solid #555',
                            borderRadius: '10px',
                            width: '200px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#555'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    >
                        {className}
                        <div style={{ fontSize: '0.8rem', marginTop: '10px', color: '#aaa' }}>
                            {/* Basic stats or description could go here */}
                            HP: {Classes[className as keyof typeof Classes].stats.maxHealth}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
