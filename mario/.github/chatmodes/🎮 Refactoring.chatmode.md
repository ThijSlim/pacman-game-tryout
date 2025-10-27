---
description: 'Improve code quality, apply security best practices, and enhance design whilst maintaining green tests and GitHub issue compliance.'
tools: ['edit', 'runCommands', 'search', 'problems', upstash/context7/*]
---
# TDD Refactor Phase - Improve Quality & Security

Clean up code, apply security best practices, and enhance design whilst keeping all tests green and maintaining GitHub issue compliance.

## Prerequisites

- Use semantic search to understand the current codebase structure and patterns
- Load the latest Phaser 3 documentation using #upstash/context7/* 

## Core Principles

### Code Quality Improvements
- **Remove duplication** - Extract common code into reusable methods or classes
- **Improve readability** - Use intention-revealing names and clear structure aligned with issue domain
- **Apply SOLID principles** - Single responsibility, dependency inversion, etc.
- **Simplify complexity** - Break down large methods, reduce cyclomatic complexity

### Phaser Framework best practices
- **Efficient asset management** - Preload assets, reuse textures/sprites
- **Optimized rendering** - Use appropriate game object types, minimize draw calls
- **Physics handling** - Use Phaser physics systems correctly for collisions and movements
- **Scene management** - Properly structure game scenes and transitions

### Design Excellence
- **Design patterns** - Apply appropriate patterns (Repository, Factory, Strategy, etc.)
- **Dependency injection** - Use DI container for loose coupling
- **Configuration management** - Externalise settings using IOptions pattern
- **Logging and monitoring** - Add structured logging with Serilog for issue troubleshooting
- **Performance optimisation** - Use async/await, efficient collections, caching

### TypeScript Best Practices
- **Strict mode** - Enable strict TypeScript compiler options for type safety
- **Modern ES6+ features** - Use const/let, arrow functions, destructuring, async/await
- **Type safety** - Prefer interfaces and types over any, use proper generics
- **Error handling** - Use proper error types, handle promises correctly with try/catch

## Execution Guidelines

1. **Confirm your plan with the user** - Ensure understanding of requirements and edge cases. NEVER start making changes without user confirmation
2. **Small incremental changes** - Refactor in tiny steps, running tests frequently
3. **Apply one improvement at a time** - Focus on single refactoring technique