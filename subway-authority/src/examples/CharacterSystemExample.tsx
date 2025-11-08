/**
 * Character System Usage Examples
 * Demonstrates various ways to use the Subway Authority character system
 */

import React, { useEffect, useState } from 'react';
import {
  CharacterSystem,
  createCharacter,
  useCharacterSystem,
  CharacterPositioning,
} from '../components/characters/CharacterSystem';
import {
  CharacterType,
  CharacterContext,
  CharacterMood,
  PortHealth,
  PortStatus,
} from '../types/character-types';

// ==================== Example 1: Basic Setup ====================

export function BasicCharacterExample() {
  const { characters, addCharacter } = useCharacterSystem();

  useEffect(() => {
    // Create a single character
    const conductor = createCharacter(CharacterType.TRANSIT_CONDUCTOR, {
      position: { x: 200, y: 200 },
      name: 'Express Conductor',
    });

    addCharacter(conductor);
  }, []);

  return (
    <div style={{ width: '800px', height: '600px', position: 'relative' }}>
      <h2>Basic Character Example</h2>
      <CharacterSystem characters={characters} />
    </div>
  );
}

// ==================== Example 2: Multiple Characters ====================

export function MultipleCharactersExample() {
  const { characters, addCharacter } = useCharacterSystem();

  useEffect(() => {
    // Create multiple characters in a grid
    const characterTypes = [
      CharacterType.TRANSIT_CONDUCTOR,
      CharacterType.STATION_MASTER,
      CharacterType.MAINTENANCE_CREW,
      CharacterType.TRACK_INSPECTOR,
      CharacterType.DISPATCHER,
      CharacterType.PLATFORM_MANAGER,
    ];

    characterTypes.forEach((type, index) => {
      const position = CharacterPositioning.grid(index, 3, 200);
      const character = createCharacter(type, { position });
      addCharacter(character);
    });
  }, []);

  return (
    <div style={{ width: '1000px', height: '800px', position: 'relative', background: '#f3f4f6' }}>
      <h2>Multiple Characters - All Types</h2>
      <CharacterSystem
        characters={characters}
        onCharacterUpdate={(char) => {
          console.log(`${char.name} updated:`, char.mood);
        }}
      />
    </div>
  );
}

// ==================== Example 3: Port Monitoring ====================

export function PortMonitoringExample() {
  const { characters, addCharacter, updateCharacter } = useCharacterSystem();
  const [portHealth, setPortHealth] = useState<PortHealth>(PortHealth.HEALTHY);

  useEffect(() => {
    // Create characters for different ports
    const ports = [3000, 8080, 5432, 27017];

    ports.forEach((port, index) => {
      const position = CharacterPositioning.circle(index, ports.length, 200, 400, 300);
      const character = createCharacter(CharacterType.MAINTENANCE_CREW, {
        position,
        assignedPort: port,
        name: `Port ${port} Monitor`,
      });
      addCharacter(character);
    });

    // Simulate port health changes
    const interval = setInterval(() => {
      const healthStates = [
        PortHealth.HEALTHY,
        PortHealth.WARNING,
        PortHealth.CRITICAL,
      ];
      const randomHealth = healthStates[Math.floor(Math.random() * healthStates.length)];
      setPortHealth(randomHealth);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '1000px', height: '700px', position: 'relative' }}>
      <h2>Port Monitoring Example</h2>
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        padding: '10px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}>
        <strong>Current Port Health:</strong> {portHealth}
      </div>
      <CharacterSystem
        characters={characters}
        onDialogueComplete={(charId) => {
          console.log(`Dialogue completed for ${charId}`);
        }}
      />
    </div>
  );
}

// ==================== Example 4: Interactive Dashboard ====================

export function InteractiveDashboard() {
  const { characters, addCharacter, removeCharacter } = useCharacterSystem();
  const [contexts, setContexts] = useState<Map<string, CharacterContext>>(new Map());

  useEffect(() => {
    // Initialize with conductor and station master
    const conductor = createCharacter(CharacterType.TRANSIT_CONDUCTOR, {
      position: { x: 150, y: 150 },
    });

    const stationMaster = createCharacter(CharacterType.STATION_MASTER, {
      position: { x: 350, y: 150 },
    });

    addCharacter(conductor);
    addCharacter(stationMaster);
  }, []);

  const simulateHealthyState = () => {
    const healthyContext: CharacterContext = {
      portHealth: PortHealth.HEALTHY,
      portStatus: PortStatus.ACTIVE,
      hasConflicts: false,
      hasVulnerabilities: false,
      routingWorking: true,
      configValid: true,
    };

    characters.forEach((char) => {
      setContexts((prev) => new Map(prev).set(char.id, healthyContext));
    });
  };

  const simulateCriticalState = () => {
    const criticalContext: CharacterContext = {
      portHealth: PortHealth.CRITICAL,
      portStatus: PortStatus.ERROR,
      hasConflicts: true,
      hasVulnerabilities: true,
      routingWorking: false,
      configValid: false,
    };

    characters.forEach((char) => {
      setContexts((prev) => new Map(prev).set(char.id, criticalContext));
    });
  };

  const addRandomCharacter = () => {
    const types = Object.values(CharacterType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const position = CharacterPositioning.random(50, 750, 50, 450);

    const character = createCharacter(randomType, { position });
    addCharacter(character);
  };

  return (
    <div style={{ width: '1200px', height: '800px', position: 'relative' }}>
      <h2>Interactive Dashboard</h2>

      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '10px',
        flexDirection: 'column',
      }}>
        <button
          onClick={simulateHealthyState}
          style={{
            padding: '10px 20px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Simulate Healthy
        </button>

        <button
          onClick={simulateCriticalState}
          style={{
            padding: '10px 20px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Simulate Critical
        </button>

        <button
          onClick={addRandomCharacter}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Add Random Character
        </button>

        <button
          onClick={() => {
            if (characters.length > 0) {
              removeCharacter(characters[0].id);
            }
          }}
          style={{
            padding: '10px 20px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Remove First Character
        </button>

        <div style={{
          padding: '10px',
          background: 'white',
          borderRadius: '6px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <strong>Active Characters:</strong> {characters.length}
        </div>
      </div>

      {/* Character System */}
      <div style={{
        marginTop: '60px',
        width: '100%',
        height: 'calc(100% - 60px)',
        position: 'relative',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
      }}>
        <CharacterSystem
          characters={characters}
          onCharacterUpdate={(char) => {
            console.log(`Character ${char.name} updated to mood: ${char.mood}`);
          }}
        />
      </div>
    </div>
  );
}

// ==================== Example 5: Circular Layout ====================

export function CircularLayoutExample() {
  const { characters, addCharacter } = useCharacterSystem();

  useEffect(() => {
    const characterTypes = [
      CharacterType.TRANSIT_CONDUCTOR,
      CharacterType.STATION_MASTER,
      CharacterType.MAINTENANCE_CREW,
      CharacterType.TRACK_INSPECTOR,
      CharacterType.DISPATCHER,
      CharacterType.PLATFORM_MANAGER,
    ];

    characterTypes.forEach((type, index) => {
      const position = CharacterPositioning.circle(
        index,
        characterTypes.length,
        250,
        500,
        350
      );

      const character = createCharacter(type, { position });
      addCharacter(character);
    });
  }, []);

  return (
    <div style={{ width: '1000px', height: '700px', position: 'relative', background: '#1f2937' }}>
      <h2 style={{ color: 'white', padding: '20px' }}>Circular Layout - All Character Types</h2>
      <CharacterSystem characters={characters} />
    </div>
  );
}

// ==================== Example 6: Port Assignment ====================

interface Port {
  number: number;
  name: string;
  health: PortHealth;
}

export function PortAssignmentExample() {
  const { characters, addCharacter } = useCharacterSystem();
  const [ports] = useState<Port[]>([
    { number: 3000, name: 'Web Server', health: PortHealth.HEALTHY },
    { number: 8080, name: 'API Server', health: PortHealth.WARNING },
    { number: 5432, name: 'Database', health: PortHealth.HEALTHY },
    { number: 27017, name: 'MongoDB', health: PortHealth.CRITICAL },
  ]);

  useEffect(() => {
    ports.forEach((port, index) => {
      const position = CharacterPositioning.grid(index, 2, 300);

      const character = createCharacter(CharacterType.MAINTENANCE_CREW, {
        position,
        assignedPort: port.number,
        name: `${port.name} Monitor`,
      });

      addCharacter(character);
    });
  }, []);

  return (
    <div style={{ width: '1200px', height: '800px', position: 'relative' }}>
      <h2>Port Assignment Example</h2>

      {/* Port Status Panel */}
      <div style={{
        position: 'absolute',
        top: 60,
        right: 20,
        width: '300px',
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}>
        <h3 style={{ marginTop: 0 }}>Port Status</h3>
        {ports.map((port) => (
          <div
            key={port.number}
            style={{
              padding: '10px',
              marginBottom: '10px',
              background: '#f3f4f6',
              borderRadius: '6px',
              borderLeft: `4px solid ${
                port.health === PortHealth.HEALTHY
                  ? '#10b981'
                  : port.health === PortHealth.WARNING
                  ? '#f59e0b'
                  : '#ef4444'
              }`,
            }}
          >
            <div style={{ fontWeight: 600 }}>{port.name}</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Port: {port.number}
            </div>
            <div style={{ fontSize: '12px', marginTop: '5px' }}>
              Status: {port.health}
            </div>
          </div>
        ))}
      </div>

      {/* Character System */}
      <div style={{
        width: 'calc(100% - 340px)',
        height: '100%',
        position: 'relative',
        background: '#f9fafb',
        borderRadius: '12px',
      }}>
        <CharacterSystem
          characters={characters}
          onCharacterUpdate={(char) => {
            if (char.assignedPort) {
              console.log(`Port ${char.assignedPort} status updated:`, char.mood);
            }
          }}
        />
      </div>
    </div>
  );
}

// ==================== Example 7: Real-time Context Updates ====================

export function RealtimeContextExample() {
  const { characters, addCharacter } = useCharacterSystem();
  const [currentContext, setCurrentContext] = useState<CharacterContext>({
    portHealth: PortHealth.HEALTHY,
    portStatus: PortStatus.ACTIVE,
    hasConflicts: false,
    hasVulnerabilities: false,
    routingWorking: true,
    configValid: true,
  });

  useEffect(() => {
    // Create a transit conductor
    const conductor = createCharacter(CharacterType.TRANSIT_CONDUCTOR, {
      position: { x: 400, y: 300 },
    });

    addCharacter(conductor);

    // Simulate real-time context changes
    const interval = setInterval(() => {
      // Randomly change context
      const contexts: CharacterContext[] = [
        {
          portHealth: PortHealth.HEALTHY,
          portStatus: PortStatus.ACTIVE,
          hasConflicts: false,
          hasVulnerabilities: false,
          routingWorking: true,
          configValid: true,
        },
        {
          portHealth: PortHealth.WARNING,
          portStatus: PortStatus.ACTIVE,
          hasConflicts: false,
          hasVulnerabilities: true,
          routingWorking: true,
          configValid: true,
        },
        {
          portHealth: PortHealth.CRITICAL,
          portStatus: PortStatus.ERROR,
          hasConflicts: true,
          hasVulnerabilities: true,
          routingWorking: false,
          configValid: false,
        },
      ];

      const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
      setCurrentContext(randomContext);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '800px', height: '600px', position: 'relative' }}>
      <h2>Real-time Context Updates</h2>

      {/* Context Display */}
      <div style={{
        position: 'absolute',
        top: 60,
        left: 20,
        padding: '15px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 1000,
        fontSize: '14px',
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Current Context</h4>
        <div><strong>Port Health:</strong> {currentContext.portHealth}</div>
        <div><strong>Port Status:</strong> {currentContext.portStatus}</div>
        <div><strong>Has Conflicts:</strong> {currentContext.hasConflicts ? 'Yes' : 'No'}</div>
        <div><strong>Has Vulnerabilities:</strong> {currentContext.hasVulnerabilities ? 'Yes' : 'No'}</div>
        <div><strong>Routing Working:</strong> {currentContext.routingWorking ? 'Yes' : 'No'}</div>
        <div><strong>Config Valid:</strong> {currentContext.configValid ? 'Yes' : 'No'}</div>
      </div>

      <div style={{
        width: '100%',
        height: '100%',
        background: '#e5e7eb',
        borderRadius: '12px',
      }}>
        <CharacterSystem characters={characters} />
      </div>
    </div>
  );
}

// ==================== Main Example Showcase ====================

export function CharacterSystemShowcase() {
  const [activeExample, setActiveExample] = useState<string>('basic');

  const examples = [
    { id: 'basic', name: 'Basic Setup', component: BasicCharacterExample },
    { id: 'multiple', name: 'Multiple Characters', component: MultipleCharactersExample },
    { id: 'monitoring', name: 'Port Monitoring', component: PortMonitoringExample },
    { id: 'interactive', name: 'Interactive Dashboard', component: InteractiveDashboard },
    { id: 'circular', name: 'Circular Layout', component: CircularLayoutExample },
    { id: 'assignment', name: 'Port Assignment', component: PortAssignmentExample },
    { id: 'realtime', name: 'Real-time Updates', component: RealtimeContextExample },
  ];

  const ActiveComponent = examples.find((ex) => ex.id === activeExample)?.component || BasicCharacterExample;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Character System Examples</h1>

      {/* Example Selector */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {examples.map((example) => (
          <button
            key={example.id}
            onClick={() => setActiveExample(example.id)}
            style={{
              padding: '10px 20px',
              background: activeExample === example.id ? '#3b82f6' : '#e5e7eb',
              color: activeExample === example.id ? 'white' : '#1f2937',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {example.name}
          </button>
        ))}
      </div>

      {/* Active Example */}
      <div style={{
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        background: 'white',
      }}>
        <ActiveComponent />
      </div>
    </div>
  );
}

export default CharacterSystemShowcase;
