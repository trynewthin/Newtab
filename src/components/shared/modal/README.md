# Modal Component

A highly flexible, heavily styled modal component built on top of `@base-ui/react/dialog`.

## Features

- **3-Layer Architecture**:
    1.  **Header (Layer 1)**: Floating, customizable header that sits above the content. Support for titles, custom actions, and close buttons.
    2.  **Content (Layer 2)**: Scrollable area with smart spacing handling.
    3.  **Background (Layer 3)**: Customizable background layer (gradients, images, blurs) with rounded corner clipping.

- **Design Details**:
    - Glassmorphism support (backdrop-blur).
    - Smooth animations (enter/exit transitions).
    - Top gradient shadow for depth.
    - Responsive styling.

## Components

### `BaseModal`

The main container component.

**Props:**

- `open` / `onOpenChange`: Control visibility state.
- `trigger`: (Optional) Element to trigger the modal open.
- `title`: (Optional) Modal title displayed in the default header.
- `showTitle`: (Default: `true`) Toggle title visibility.
- `showCloseButton`: (Default: `true`) Toggle default close button visibility.
- `actions`: (Optional) React node to display actions (buttons) in the header.
- `header`: (Optional) Complete override for the header layer.
- `background`: (Optional) Custom element for the background layer (Layer 3). Pass a div with `absolute inset-0` and your desired styles.
- `showGradientShadow`: (Default: `true`) Toggle the top decorative gradient shadow.
- `scrollable`: (Default: `true`) Toggle content scrollability. If `false`, content area is `overflow-hidden` with no padding, ideal for full-bleed custom layouts.
- `className`: Applies to the outer modal wrapper (useful for `max-w` sizing).
- `contentClassName`: Applies to the inner content container.

**Example:**

```tsx
<BaseModal
    open={isOpen}
    onOpenChange={setIsOpen}
    title="My Modal"
    className="sm:max-w-lg"
    actions={<Button>Save</Button>}
>
    <div className="space-y-4">
        <p>Modal content goes here...</p>
    </div>
</BaseModal>
```

### `ModalButton`

A unified button component designed specifically for this modal's aesthetic.

**Props:**

- `isIcon`: (Default: `true`)
    - `true`: Renders a circular button (w-9 h-9).
    - `false`: Renders a rounded-rectangular button (h-9).
- Accepts all standard `Button` props (variant, size, onClick, etc.).

**Example:**

```tsx
<ModalButton onClick={handleClose}>
    <CloseIcon />
</ModalButton>

<ModalButton isIcon={false} onClick={handleSave}>
    Save Changes
</ModalButton>
```
