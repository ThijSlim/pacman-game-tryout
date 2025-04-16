# Missing Features in Mario Bros 1-1 Recreation

This document outlines features from the original Super Mario Bros World 1-1 that are currently missing in our implementation.

## 1. Enemy Features

### Koopa Troopas (Green Turtles)
- **Status**: Partially implemented in `src_green_turtle` folder but not integrated into main game
- **Description**: Green turtles that walk horizontally and can be stomped to become shells
- **Implementation Notes**: 
  - The `GreenTurtle` class exists with proper mechanics (shell transformation, player collision)
  - Need to integrate into the main game's Level class similar to Goombas
  - Currently they throw hammers which isn't in the original game (that's a feature of Hammer Bros, a different enemy)

### Piranha Plants
- **Status**: Not implemented
- **Description**: Plants that emerge from pipes at regular intervals
- **Implementation Notes**:
  - Need to create a `PiranhaPlant` class with up/down movement
  - Should be attached to specific pipes in the level
  - Should pause movement if Mario is standing on the pipe

## 2. Power-up System

### Complete Power-up Types
- **Status**: Partially implemented (simple power-up that makes Mario bigger)
- **Description**: The original game has three main power-ups:
  - Super Mushroom: Makes Mario larger and able to break bricks
  - Fire Flower: Allows Mario to throw fireballs
  - Starman: Temporary invincibility with visual effects
- **Implementation Notes**:
  - Need proper sprites for each power-up type
  - Need to implement power-up state tracking in Mario class
  - Need to implement fireball throwing mechanics
  - Need to implement invincibility state with visual effects and enemy damage

### Power-up Transformation Animation
- **Status**: Simple scaling animation implemented
- **Description**: In the original, there's a more complex animation when Mario transforms
- **Implementation Notes**:
  - Need blinking transition effect
  - Need to implement proper sprite change

## 3. Game Mechanics

### Time Limit
- **Status**: Not implemented
- **Description**: Original game has countdown timer that kills Mario when it reaches zero
- **Implementation Notes**:
  - Add countdown timer display
  - Add game over when timer reaches zero
  - Standard time for World 1-1 is 400 seconds

### Lives System
- **Status**: Not implemented
- **Description**: Player starts with 3 lives and can gain more through 1-Up mushrooms
- **Implementation Notes**:
  - Add lives counter display
  - Add 1-Up mushroom collectible
  - Implement game over with restart when lives run out

### Coin Collection Counter
- **Status**: Partially implemented (coins can be collected but not counted)
- **Description**: Game tracks collected coins in a counter; every 100 coins grants an extra life
- **Implementation Notes**:
  - Add coin counter display
  - Implement 1-Up when reaching 100 coins

### Secret Areas and Warp Pipes
- **Status**: Not implemented
- **Description**: Some pipes can be entered to access secret underground areas with coins
- **Implementation Notes**:
  - Implement pipe entrance detection when pressing down
  - Create underground area with rewards
  - Implement pipe exit mechanics

### Brick Breaking Mechanics
- **Status**: Partially implemented (bricks can be broken regardless of Mario's state)
- **Description**: Only Super Mario can break bricks; Small Mario just bumps them
- **Implementation Notes**:
  - Check Mario's power-up state before breaking bricks
  - Add block bumping animation for Small Mario

## 4. Audio and Visual Elements

### Sound Effects
- **Status**: Not implemented
- **Description**: The original game has iconic sound effects for various actions:
  - Jump sound
  - Coin collection sound
  - Power-up collection sound
  - Block breaking sound
  - Enemy stomp sound
  - Death sound
  - Level completion sound
- **Implementation Notes**:
  - Add sound files
  - Implement sound triggers for relevant actions

### Background Music
- **Status**: Not implemented
- **Description**: The iconic background theme music
- **Implementation Notes**:
  - Add music file
  - Implement music playback with looping
  - Implement special music for star power-up

### Enhanced Animations
- **Status**: Basic animations implemented
- **Description**: Original game had more detailed animations:
  - Mario running animation with multiple frames
  - Flag descending animation
  - Death animation (falling off screen)
  - More detailed enemy animations
- **Implementation Notes**:
  - Improve sprite animations with more frames
  - Add specialized animations for various game states

## 5. Level Details

### Precise Level Layout
- **Status**: Partially implemented
- **Description**: The exact block placement, enemy locations, and secret areas of World 1-1
- **Implementation Notes**:
  - Fine-tune positions of all elements
  - Add hidden blocks with power-ups
  - Add end-of-level flagpole with sliding animation

## Priority Implementation Recommendations

Based on importance and complexity, here are the recommended implementation priorities:

1. **Koopa Troopas**: Already partially implemented, just need integration
2. **Piranha Plants**: Essential enemy type for World 1-1
3. **Time Limit**: Core gameplay mechanic that adds challenge
4. **Complete Power-up System**: Enhances gameplay depth
5. **Sound Effects**: Significantly improves game feel with minimal effort