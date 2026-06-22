# Kanban Board System

A @dnd-kit-based kanban board with multi-column drag-and-drop, sortable columns and items, keyboard navigation, custom drag overlays, and accessibility announcements.

## Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @radix-ui/react-slot   # Used by asChild prop pattern
```

---

## Quick Start

```tsx
"use client";

import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanOverlay,
} from "@admin-template/ui/components/kanban";
import { Button } from "@admin-template/ui/components/button";

// 1. Define your data shape and store
type Task = { id: string; title: string; priority: string };
type Columns = Record<string, Task[]>;

// 2. Render the board with columns and items
export function MyKanbanBoard({
  columns,
  setColumns,
}: {
  columns: Columns;
  setColumns: (cols: Columns) => void;
}) {
  return (
    <Kanban value={columns} onValueChange={setColumns} getItemValue={(item) => item.id}>
      <KanbanBoard>
        {Object.entries(columns).map(([columnValue, tasks]) => (
          <KanbanColumn key={columnValue} value={columnValue} className="w-80">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{columnValue}</span>
              <KanbanColumnHandle asChild>
                <Button variant="ghost" size="icon">
                  <Icons.gripVertical className="h-4 w-4" />
                </Button>
              </KanbanColumnHandle>
            </div>
            {tasks.map((task) => (
              <KanbanItem key={task.id} value={task.id} asHandle>
                <div className="rounded-md border bg-card p-3 shadow-xs">
                  <span className="text-sm font-medium">{task.title}</span>
                </div>
              </KanbanItem>
            ))}
          </KanbanColumn>
        ))}
      </KanbanBoard>

      <KanbanOverlay>
        {({ value, variant }) => {
          if (variant === "column") {
            const tasks = columns[value] ?? [];
            return (
              <KanbanColumn value={value}>
                <div>Column overlay</div>
              </KanbanColumn>
            );
          }
          const task = Object.values(columns)
            .flat()
            .find((t) => t.id === value);
          if (!task) return null;
          return <div>{task.title}</div>;
        }}
      </KanbanOverlay>
    </Kanban>
  );
}
```

---

## Architecture

The kanban system lives in a single module (`kanban.tsx`) and exposes 7 components plus the root type:

```
components/
└── kanban.tsx    # All components and types

Re-exports from @admin-template/ui/components/kanban:
```

| Export               | Description                                      |
| -------------------- | ------------------------------------------------ |
| `Kanban`             | Root context provider wrapping `DndContext`      |
| `KanbanBoard`        | Sortable column container                        |
| `KanbanColumn`       | Sortable column with nested item SortableContext |
| `KanbanColumnHandle` | Drag handle for a column                         |
| `KanbanItem`         | Sortable item within a column                    |
| `KanbanItemHandle`   | Drag handle for an item                          |
| `KanbanOverlay`      | Portal-based `DragOverlay` with visual feedback  |
| `type KanbanProps`   | Props type for `Kanban` root                     |

---

## Component Reference

### `Kanban`

The root component. Wraps `DndContext` with collision detection, keyboard navigation, accessibility announcements, and shared context for all child components.

```tsx
import { Kanban } from "@admin-template/ui/components/kanban";

<Kanban
  value={columns}
  onValueChange={setColumns}
  onMove={(event) => console.log(event.activeIndex, event.overIndex)}
  getItemValue={(item) => item.id}
  strategy={verticalListSortingStrategy}
  orientation="horizontal"
  flatCursor={false}
  modifiers={[restrictToBoard]}
  autoScroll={false}
>
  {/* KanbanBoard + KanbanOverlay */}
</Kanban>;
```

| Prop            | Type                                                                         | Default                       | Description                                                                                                      |
| --------------- | ---------------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `value`         | `Record<UniqueIdentifier, T[]>`                                              | required                      | Kanban columns state — keys are column IDs, values are arrays of items per column                                |
| `onValueChange` | `(columns: Record<UniqueIdentifier, T[]>) => void`                           | —                             | Called when drag ends and items/columns have moved                                                               |
| `onMove`        | `(event: DragEndEvent & { activeIndex: number; overIndex: number }) => void` | —                             | Called instead of `onValueChange` when a **column** is reordered (column move only)                              |
| `getItemValue`  | `(item: T) => UniqueIdentifier`                                              | required when T is an object  | Extracts a unique ID from each item. Required when items are objects, not primitives                             |
| `strategy`      | `SortableContextProps["strategy"]`                                           | `verticalListSortingStrategy` | Fallback strategy for item sorting (columns use `horizontalListSortingStrategy` when `orientation='horizontal'`) |
| `orientation`   | `'horizontal' \| 'vertical'`                                                 | `'horizontal'`                | Board layout direction                                                                                           |
| `flatCursor`    | `boolean`                                                                    | `false`                       | Disable grab/grabbing cursor styles (for touch-first or custom cursor UIs)                                       |
| `modifiers`     | `DndContextProps["modifiers"]`                                               | —                             | @dnd-kit modifiers (e.g., `restrictToWindowEdge`, `snapCenterToCursor`, custom)                                  |

All other props are forwarded to `DndContext`. Common forwarding targets: `autoScroll`, `onDragStart`, `onDragEnd`, `onDragOver`, `onDragCancel`, `accessibility`, `measuring`.

#### How it works

1. **Collision detection** — two-phase: column-level via `closestCenter` when dragging a column; item-level via `pointerWithin` → `rectIntersection` fallback when dragging an item. Items snap to closest position within the target column.
2. **Keyboard navigation** — arrow keys move between columns and items using `closestCorners` with directional filtering. The custom `coordinateGetter` handles four-direction layout.
3. **Announcements** — screen reader announcements on drag start, over, end, and cancel with position and column context.
4. **Sensors** — `MouseSensor`, `TouchSensor`, and `KeyboardSensor` with custom `coordinateGetter`.

---

### `KanbanBoard`

The sortable container for columns. Must be a direct or indirect child of `<Kanban>`.

```tsx
import { KanbanBoard } from "@admin-template/ui/components/kanban";

<KanbanBoard asChild className="flex-row gap-4">
  {/* KanbanColumn children */}
</KanbanBoard>;
```

| Prop        | Type        | Default  | Description                                  |
| ----------- | ----------- | -------- | -------------------------------------------- |
| `asChild`   | `boolean`   | —        | Merge into the child element (Radix Slot)    |
| `children`  | `ReactNode` | required | Column components                            |
| `className` | `string`    | —        | Additional classes (appended to base styles) |

Base styles: `flex h-full w-full min-w-0 max-w-full gap-4 overflow-x-auto` with `flex-row` or `flex-col` based on `orientation`.

Renders a `<SortableContext>` with `horizontalListSortingStrategy` (horizontal orientation) or `verticalListSortingStrategy` (vertical orientation).

---

### `KanbanColumn`

A sortable column wrapper. Contains a nested `<SortableContext>` for its items.

```tsx
import { KanbanColumn } from "@admin-template/ui/components/kanban";

<KanbanColumn value="inProgress" asHandle={false} disabled={false} className="w-80">
  <div className="flex items-center gap-2">
    <span className="text-sm font-semibold">In Progress</span>
    <KanbanColumnHandle asChild>
      <Button variant="ghost" size="icon">
        <Icons.gripVertical className="h-4 w-4" />
      </Button>
    </KanbanColumnHandle>
  </div>
  {/* KanbanItem children */}
</KanbanColumn>;
```

| Prop        | Type               | Default  | Description                                                            |
| ----------- | ------------------ | -------- | ---------------------------------------------------------------------- |
| `value`     | `UniqueIdentifier` | required | Column ID that maps to a key in `Kanban.value`                         |
| `asChild`   | `boolean`          | —        | Merge into the child element (Radix Slot)                              |
| `asHandle`  | `boolean`          | —        | Entire column acts as drag handle (applies `attributes` + `listeners`) |
| `disabled`  | `boolean`          | —        | Prevent column from being dragged and all items from being sorted      |
| `children`  | `ReactNode`        | required | Column content (header + items)                                        |
| `className` | `string`           | —        | Additional classes                                                     |

Base styles: `flex size-full flex-col gap-2 rounded-lg border bg-zinc-100 p-2.5 dark:bg-zinc-900`.

When `asHandle` is true, the column is both a sortable target and its own activator: the `@dnd-kit` `attributes` and `listeners` spread onto the column root.

---

### `KanbanColumnHandle`

A button that activates column dragging. Must be inside a `<KanbanColumn>`.

```tsx
import { KanbanColumnHandle } from "@admin-template/ui/components/kanban";

<KanbanColumnHandle asChild disabled={false} className="cursor-grab">
  <Button variant="ghost" size="icon">
    <Icons.gripVertical className="h-4 w-4" />
  </Button>
</KanbanColumnHandle>;
```

| Prop        | Type      | Default | Description                         |
| ----------- | --------- | ------- | ----------------------------------- |
| `asChild`   | `boolean` | —       | Merge into the child element (Slot) |
| `disabled`  | `boolean` | —       | Inherits `KanbanColumn.disabled`    |
| `className` | `string`  | —       | Additional classes                  |

All other props are forwarded to `<button>` (`type="button"` set automatically).

- Applies `aria-controls` linking to the column's id.
- Dragging cursor style: `cursor-grab` → `cursor-grabbing` (unless `flatCursor` on root).

---

### `KanbanItem`

A sortable item within a column. Must be inside a `<KanbanColumn>` or `<KanbanOverlay>`.

```tsx
import { KanbanItem } from "@admin-template/ui/components/kanban";

<KanbanItem
  value="task-1"
  asHandle
  disabled={false}
  className="bg-card rounded-md border p-3 shadow-xs"
>
  <div className="flex flex-col gap-2">
    <span className="text-sm font-medium">{task.title}</span>
    <Badge variant="secondary">{task.priority}</Badge>
  </div>
</KanbanItem>;
```

| Prop        | Type               | Default  | Description                                                          |
| ----------- | ------------------ | -------- | -------------------------------------------------------------------- |
| `value`     | `UniqueIdentifier` | required | Item ID — must match `getItemValue` returned value                   |
| `asHandle`  | `boolean`          | —        | Entire item acts as drag handle (applies `attributes` + `listeners`) |
| `asChild`   | `boolean`          | —        | Merge into the child element (Radix Slot)                            |
| `disabled`  | `boolean`          | —        | Prevent this item from being dragged                                 |
| `className` | `string`           | —        | Additional classes                                                   |

- Focus-visible ring styles applied automatically.
- Dragging cursor style: `cursor-grab` → `cursor-grabbing` (unless `flatCursor` on root).

---

### `KanbanItemHandle`

A button that activates item dragging. Must be inside a `<KanbanItem>`.

```tsx
import { KanbanItemHandle } from "@admin-template/ui/components/kanban";

<KanbanItemHandle asChild disabled={false}>
  <Button variant="ghost" size="icon" className="size-6">
    <Icons.gripHorizontal className="h-3 w-3" />
  </Button>
</KanbanItemHandle>;
```

| Prop        | Type      | Default | Description                         |
| ----------- | --------- | ------- | ----------------------------------- |
| `asChild`   | `boolean` | —       | Merge into the child element (Slot) |
| `disabled`  | `boolean` | —       | Inherits `KanbanItem.disabled`      |
| `className` | `string`  | —       | Additional classes                  |

All other props forwarded to `<button>` (`type="button"` set automatically).

---

### `KanbanOverlay`

Portal-based drag overlay that renders while dragging. Provides visual continuity by rendering a snapshot of the dragged element under the cursor/pointer.

```tsx
import { KanbanOverlay } from "@admin-template/ui/components/kanban";

<KanbanOverlay container={document.getElementById("portal-root")}>
  {({ value, variant }) => {
    if (variant === "column") {
      const tasks = columns[value] ?? [];
      return <TaskColumn value={value} tasks={tasks} />;
    }
    const task = Object.values(columns)
      .flat()
      .find((t) => t.id === value);
    if (!task) return null;
    return <TaskCard task={task} />;
  }}
</KanbanOverlay>;
```

| Prop        | Type                                                                                                   | Default       | Description                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| `container` | `Element \| DocumentFragment \| null`                                                                  | document.body | Portal target element. Falls back to `null` before mount (SSR)                              |
| `children`  | `ReactNode \| ((params: { value: UniqueIdentifier; variant: 'column' \| 'item' }) => React.ReactNode)` | —             | Render function or static content. `variant` tells you if the active id is a column or item |

The overlay fades the original element to 40% opacity via `dropAnimation`.

---

## Usage Patterns

### Data Store (Zustand)

The kanban board is controlled — you provide the columns object and an `onValueChange` callback. A typical store:

```ts
import { create } from "zustand";

type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  description?: string;
  assignee?: string;
  dueDate?: string;
};

type KanbanState = {
  columns: Record<string, Task[]>;
  setColumns: (columns: Record<string, Task[]>) => void;
  addTask: (title: string, description?: string) => void;
};

export const useTaskStore = create<KanbanState>((set) => ({
  columns: {
    backlog: [{ id: "1", title: "Research", priority: "low" }],
    inProgress: [],
    done: [],
  },
  setColumns: (columns) => set({ columns }),
  addTask: (title, description) =>
    set((state) => ({
      columns: {
        ...state.columns,
        backlog: [
          ...state.columns.backlog,
          { id: crypto.randomUUID(), title, priority: "medium", description },
        ],
      },
    })),
}));
```

### Full Page Layout

```tsx
// kanban-view-page.tsx
import { KanbanBoard } from "./kanban-board";
import { NewTaskDialog } from "./new-task-dialog";

export default function KanbanViewPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban</h1>
        <NewTaskDialog />
      </div>
      <KanbanBoard />
    </div>
  );
}
```

### Task Card with Priority Badge

```tsx
function TaskCard({ task }: { task: Task }) {
  return (
    <KanbanItem value={task.id} asHandle>
      <div className="bg-card rounded-md border p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="line-clamp-1 text-sm font-medium">{task.title}</span>
          <Badge
            variant={
              task.priority === "high"
                ? "destructive"
                : task.priority === "medium"
                  ? "default"
                  : "secondary"
            }
            className="pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize"
          >
            {task.priority}
          </Badge>
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <div className="bg-primary/20 size-2 rounded-full" />
              <span className="line-clamp-1">{task.assignee}</span>
            </div>
          )}
          {task.dueDate && <time className="text-[10px] tabular-nums">{task.dueDate}</time>}
        </div>
      </div>
    </KanbanItem>
  );
}
```

### Restrict Drag Within Board

Use a `@dnd-kit` `Modifier` factory to constrain dragging to the board container:

```ts
import type { Modifier } from "@dnd-kit/core";

export function createRestrictToContainer(getElement: () => HTMLElement | null): Modifier {
  return ({ transform, draggingNodeRect }) => {
    const container = getElement();
    if (!draggingNodeRect || !container) return transform;

    const rect = container.getBoundingClientRect();
    const minX = rect.left - draggingNodeRect.left;
    const maxX = rect.right - draggingNodeRect.right;
    const minY = rect.top - draggingNodeRect.top;
    const maxY = rect.bottom - draggingNodeRect.bottom;

    return {
      ...transform,
      x: Math.min(Math.max(transform.x, minX), maxX),
      y: Math.min(Math.max(transform.y, minY), maxY),
    };
  };
}
```

```tsx
// Usage
const containerRef = useRef<HTMLDivElement>(null);
const restrictToBoard = useCallback(
  createRestrictToContainer(() => containerRef.current),
  [],
);

<div ref={containerRef}>
  <Kanban value={columns} onValueChange={setColumns} modifiers={[restrictToBoard]}>
    {/* ... */}
  </Kanban>
</div>;
```

### New Task Dialog

```tsx
function NewTaskDialog() {
  const addTask = useTaskStore((state) => state.addTask);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const { title, description } = Object.fromEntries(formData);
    if (typeof title !== "string" || typeof description !== "string") return;
    addTask(title, description);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          + Add New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>What do you want to get done today?</DialogDescription>
        </DialogHeader>
        <form id="task-form" className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <Input id="title" name="title" placeholder="Task title..." className="col-span-4" />
          <Textarea
            id="description"
            name="description"
            placeholder="Description..."
            className="col-span-4"
          />
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type="submit" size="sm" form="task-form">
              Add Task
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Accessibility

The kanban provides screen reader announcements via `@dnd-kit`'s `Announcements` API:

| Event          | Announcement                                                                              |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------- |
| `onDragStart`  | `"Picked up {column                                                                       | item} at position {N} of {total}"` |
| `onDragOver`   | `"{item} is now at position {N} of {total}"` (adds column name on cross-column move)      |
| `onDragEnd`    | `"{item} was dropped at position {N} of {total}"` (adds column name on cross-column drop) |
| `onDragCancel` | `"Dragging was cancelled. {item} was dropped."`                                           |

Screen reader instructions are set to:

> To pick up a kanban item or column, press space or enter. While dragging, use the arrow keys to move the item. Press space or enter again to drop the item in its new position, or press escape to cancel.

### Keyboard Navigation

Arrow keys navigate via a custom `KeyboardCoordinateGetter` that:

- Filters droppable containers by direction (Up/Down/Left/Right)
- Uses `closestCorners` to find the nearest target in the pressed direction
- Handles placeholder positioning for grid-like layouts
- Offsets column targets by 20px horizontally and 74px vertically for natural feel

---

## Exports

### From `@admin-template/ui/components/kanban`

| Export               | Description                                 |
| -------------------- | ------------------------------------------- |
| `Kanban`             | Root context + DndContext wrapper           |
| `KanbanBoard`        | Sortable column container                   |
| `KanbanColumn`       | Sortable column with nested SortableContext |
| `KanbanColumnHandle` | Button drag handle for a column             |
| `KanbanItem`         | Sortable item within a column               |
| `KanbanItemHandle`   | Button drag handle for an item              |
| `KanbanOverlay`      | Portal-based drag overlay                   |
| `type KanbanProps`   | Kanban root component props type            |

---

## Common Pitfalls

1. **`getItemValue` is required for object items**: If your items are objects (not strings/numbers), you must provide a `getItemValue` callback. Missing it throws an error.

2. **Column `value` cannot be an empty string**: An empty string will throw during render. Use a non-empty key for every column.

3. **`KanbanColumn` and `KanbanItem` must be within a `KanbanBoard` or `KanbanOverlay`**: Each throws a descriptive error if rendered outside the expected parent.

4. **Kanban is fully controlled**: You must supply `value` and `onValueChange`. The component does not maintain internal state for the columns object — it only tracks `activeId` for overlay rendering.

5. **`onMove` vs `onValueChange`**: `onMove` fires only when **columns** are reordered (not items). When `onMove` is set, column reordering calls `onMove` instead of `onValueChange`; item moves always call `onValueChange`. Use `onMove` when column and item moves need different handlers.

6. **Modifiers apply to both drag gestures and the overlay**: The `modifiers` prop is forwarded to both `DndContext` (affects drag behavior) and `KanbanOverlay`'s `DragOverlay` (affects overlay positioning). A boundary modifier like `restrictToBoard` constrains both the ghost drag position and the overlay rendering.

7. **SSR safety**: `KanbanOverlay` uses `useLayoutEffect` + `globalThis.document?.body` to avoid rendering on the server. The overlay only renders after mount.

8. **`asHandle` vs separate handle components**: Use `asHandle` on `KanbanColumn` or `KanbanItem` when the entire element should be draggable. Use `KanbanColumnHandle` / `KanbanItemHandle` when you want a dedicated drag handle button. Setting `asHandle` on the column/item and also rendering a handle component is redundant — pick one.

9. **Disabled state propagation**: Setting `disabled` on a `KanbanColumn` disables both column dragging and all item sorting within it. Setting `disabled` on a `KanbanItem` prevents only that item from being dragged.

10. **Kanban `onDragStart` / `onDragEnd` / `onDragOver` / `onDragCancel`**: These forward to the underlying `DndContext` but should be used for side effects only (analytics, custom behavior). The kanban system already handles state updates — do not duplicate `onValueChange` calls in these handlers, or risk double-state issues.
