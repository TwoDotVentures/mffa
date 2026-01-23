# UI Components

Reusable UI components built on shadcn/ui and Radix primitives.

## Base Components (shadcn/ui)

These components are based on shadcn/ui and provide consistent styling:

| Component | File | Description |
|-----------|------|-------------|
| Accordion | `accordion.tsx` | Expandable content sections |
| Alert | `alert.tsx` | Informational banners |
| AlertDialog | `alert-dialog.tsx` | Confirmation dialogs |
| Avatar | `avatar.tsx` | User profile images |
| Badge | `badge.tsx` | Status and category labels |
| Button | `button.tsx` | Clickable buttons with variants |
| Card | `card.tsx` | Content containers |
| Checkbox | `checkbox.tsx` | Toggle inputs |
| Command | `command.tsx` | Command palette |
| Dialog | `dialog.tsx` | Modal dialogs |
| DropdownMenu | `dropdown-menu.tsx` | Contextual menus |
| Form | `form.tsx` | Form with react-hook-form |
| Input | `input.tsx` | Text input fields |
| Label | `label.tsx` | Form labels |
| Popover | `popover.tsx` | Floating content |
| Progress | `progress.tsx` | Progress bars |
| RadioGroup | `radio-group.tsx` | Radio button groups |
| ScrollArea | `scroll-area.tsx` | Custom scrollbars |
| Select | `select.tsx` | Dropdown selects |
| Separator | `separator.tsx` | Visual dividers |
| Sheet | `sheet.tsx` | Slide-out panels |
| Sidebar | `sidebar.tsx` | Navigation sidebar |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Switch | `switch.tsx` | Toggle switches |
| Table | `table.tsx` | Data tables |
| Tabs | `tabs.tsx` | Tabbed interfaces |
| Textarea | `textarea.tsx` | Multi-line text input |
| Tooltip | `tooltip.tsx` | Hover tooltips |

## Custom Components

### ConfirmDialog
`confirm-dialog.tsx`

Reusable confirmation dialog for destructive actions.

**Props:**
- `open: boolean` - Visibility state
- `onOpenChange: (open: boolean) => void` - State callback
- `title: string` - Dialog title
- `description: string` - Confirmation message
- `onConfirm: () => void` - Confirm action
- `confirmText?: string` - Button text (default: "Confirm")
- `variant?: 'default' | 'destructive'` - Button variant

### PageContainer
`page-container.tsx`

Consistent page layout wrapper with header.

**Props:**
- `title: string` - Page title
- `description?: string` - Page description
- `actions?: ReactNode` - Header action buttons
- `children: ReactNode` - Page content

### StatCard
`stat-card.tsx`

Card for displaying statistics with icons.

**Props:**
- `title: string` - Stat label
- `value: string | number` - The value
- `icon?: ReactNode` - Optional icon
- `trend?: { value: number; isPositive: boolean }` - Trend indicator
- `description?: string` - Additional context

### DataTable
`data-table.tsx`

Enhanced table with sorting, filtering, and pagination.

**Props:**
- `columns: ColumnDef[]` - Column definitions
- `data: T[]` - Table data
- `searchKey?: string` - Column to search
- `pageSize?: number` - Items per page

### FormDialog
`form-dialog.tsx`

Dialog wrapper for forms with consistent layout.

**Props:**
- `open: boolean` - Visibility
- `onOpenChange: (open: boolean) => void` - State callback
- `title: string` - Dialog title
- `description?: string` - Description text
- `children: ReactNode` - Form content
- `onSubmit: () => void` - Form submission
- `isLoading?: boolean` - Loading state

### EmptyState
`empty-state.tsx`

Placeholder for empty lists/sections.

**Props:**
- `icon?: ReactNode` - Display icon
- `title: string` - Empty state title
- `description?: string` - Helper text
- `action?: ReactNode` - CTA button

## Usage

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';

export function Dashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <StatCard title="Total" value="$1,234" />
        <Button>Action</Button>
      </CardContent>
    </Card>
  );
}
```

## Styling

All components use Tailwind CSS and support:
- Dark mode via `dark:` variants
- Customisation via `className` prop
- CSS variables for theming

## Related

- `/lib/utils.ts` - `cn()` utility for class merging
- shadcn/ui documentation: https://ui.shadcn.com
