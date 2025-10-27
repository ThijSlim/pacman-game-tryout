---
mode: 'agent'
model: Claude Sonnet 4 (copilot)
tools: ['search']
---

# 🍄 Mario Bros 1-1 Feature Gap Analysis

## Your Mission
Analyze this repository to identify missing features needed to complete a faithful recreation of Super Mario Bros World 1-1.

## Analysis Process

### Step 1: Define Complete Feature Set
List ALL features present in the original Super Mario Bros World 1-1, including:

**Level Layout Elements:**
- Platform placements, heights, and gaps
- Block types (question blocks, brick blocks, hidden blocks, etc.)
- Pipe locations and types (including warp pipes)
- Underground sections and secret areas
- Flag pole and castle endpoint

**Game Mechanics:**
- Player movement (walk, run, jump, crouch)
- Power-up system (mushroom, fire flower, star)
- Block interactions (breaking, hitting from below, coin collection)
- Enemy behaviors and movement patterns
- Collision detection and physics
- Score and life system
- Sound effects and music timing

**Interactive Objects:**
- Question blocks (coin, power-up, 1-up)
- Brick blocks (breakable when big Mario)
- Enemies (Goomba, Koopa Troopa) with specific behaviors
- Items (coins, mushrooms, fire flowers, stars)
- Pipes (decorative and functional)
- Flag pole victory sequence

**Enemy Interactions:**
- Goomba: patrol patterns, stomp mechanics
- Koopa Troopa: shell mechanics after stomping
- Enemy collision with player and environment

### Step 2: Inventory Current Implementation
Investigate the existing codebase:
- Examine all source files in `src/`
- Review asset availability in `public/`
- Identify implemented mechanics and interactions
- Check Level.ts for level design accuracy
- Verify Mario.ts for player mechanics completeness
- Assess enemy implementations (Goomba.ts, GreenTurtle.ts)

### Step 3: Gap Analysis
Compare the complete feature set with current implementation:
- ✅ Fully implemented features
- ⚠️ Partially implemented features (describe what's missing)
- ❌ Missing features (not yet implemented)

### Step 4: Prioritized Missing Features List
Create a prioritized breakdown:
1. **Critical Gameplay Features** - Core mechanics needed for playability
2. **Level Design Elements** - Essential layout components
3. **Polish Features** - Nice-to-have improvements for authenticity

## Output Format
Write your analysis to `missing_features.md` with:
- Clear categorization of features
- Specific implementation details for each missing feature
- Priority levels (Critical, High, Medium, Low)
- Technical notes about implementation complexity where relevant

## Success Criteria
The output should enable a developer to understand:
- What's already working well
- What needs to be built next
- How to prioritize development work
- Specific technical requirements for missing features