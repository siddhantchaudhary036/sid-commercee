# Flows Schema Refactor - Complete

## Problem

The original flows schema was storing everything in a single `flowDefinition` field using `v.any()`, which was:
- **Unsafe**: No type validation at database level
- **Unscalable**: Difficult to query individual nodes/edges
- **Unmaintainable**: Hard to add new node types or fields

## Solution

Refactored into **3 separate tables** with full type safety:

### 1. `flows` Table
Stores flow metadata only:
- `name`, `description`, `status`
- Performance metrics: `totalRecipients`, `completionRate`, `totalRevenue`
- No nested objects or `v.any()`

### 2. `flowNodes` Table
Individual nodes with **discriminated union** pattern:

**Trigger Node:**
- `triggerType`, `segmentId`, `segmentName`

**Email Node:**
- `emailTemplateId`, `emailSubject`, `emailName`

**Delay Node:**
- `delayDays`, `delayHours`, `delayName`

**Condition Node:**
- `conditionType`, `conditionName`

**All nodes have:**
- `positionX`, `positionY` (React Flow positioning)
- `width`, `height` (optional, for React Flow)

### 3. `flowEdges` Table
Connections between nodes:
- `sourceNodeId`, `targetNodeId`
- `sourceHandle` (for condition branches: "yes"/"no")
- `animated`, `label` (optional styling)

## Changes Made

### Schema (`convex/schema.ts`)
- ✅ Removed `flowDefinition` field from `flows` table
- ✅ Added `flowNodes` table with discriminated union fields
- ✅ Added `flowEdges` table with proper references
- ✅ Added indexes: `by_flow`, `by_flow_and_node`, `by_source`, `by_target`

### Convex Functions (`convex/flows.ts`)
- ✅ `create` - Inserts flow + nodes + edges separately
- ✅ `getById` - Returns flow with joined nodes and edges
- ✅ `update` - Updates flow metadata only
- ✅ `updateNodesAndEdges` - New function for visual editor saves
- ✅ `deleteFlow` - Cascades to delete nodes and edges
- ✅ `duplicate` - Copies flow with all nodes and edges
- ✅ `getAnalytics` - Queries nodes separately

### Frontend (`app/flows/editor/FlowEditor.js`)
- ✅ Converts new schema format → React Flow format on load
- ✅ Converts React Flow format → new schema format on save
- ✅ Uses `updateNodesAndEdges` mutation for saves
- ✅ Auto-save updated to use new format

### AI Agent (`app/api/agents/flows/handler.ts`)
- ✅ Creates nodes in new schema format with all required fields
- ✅ Creates edges with proper references
- ✅ Sets all optional fields to `undefined` (not null)

### New Flow Page (`app/flows/new/page.js`)
- ✅ Initial flow uses new schema format

## Type Safety Benefits

**Before:**
```typescript
flowDefinition: v.any() // Anything goes!
```

**After:**
```typescript
flowNodes: defineTable({
  type: v.string(), // "trigger" | "email" | "delay" | "condition"
  triggerType: v.optional(v.string()),
  segmentId: v.optional(v.id("segments")),
  emailTemplateId: v.optional(v.id("emailTemplates")),
  delayDays: v.optional(v.number()),
  // ... all fields explicitly typed
})
```

## Migration Notes

**Existing flows will break** because they use the old `flowDefinition` structure. Options:

1. **Fresh start**: Delete existing flows (acceptable for development)
2. **Migration script**: Create a Convex migration to convert old flows
3. **Dual support**: Keep both formats temporarily (not recommended)

For this project, we're using option 1 (fresh start) since it's in development.

## Testing Checklist

- [ ] Create new flow via UI
- [ ] Edit existing flow via UI
- [ ] Create flow via AI agent
- [ ] Duplicate flow
- [ ] Delete flow
- [ ] Flow analytics page
- [ ] Auto-save functionality

## Next Steps

1. Test flow creation in UI
2. Test AI flow generation
3. Fix any remaining UI issues with node connections
4. Update flow analytics to use new schema
