# Rorz's style guide

Fundamental rules of styling:

## Tailwind is a must(!)

Always use Tailwind to the fullest extent possible, unless otherwise asked to.

### Class names and variables

Always use native Tailwind syntax for class names:

- ✅ `bg-zinc-200`
- ❌ `bg-[#eee2ee]`

If you _must_ use class names or CSS property values that are not supported natively, they must first be defined as custom `@theme` variables inside the relevant `styles.css` file...

- If you are creating a custom variable you must first ask yourself if this variable is likely to be reused. If it is not likely to be reused, then exercise caution and restraint and try to figure out a way to use native class names, or adjust another part of your workflow to accommodate it natively.
- If you intend to create custom variables for colors, fonts, or sizing you _must_ alert me (the human) first. Only create custom palettes if you have been expressly permitted to do so.

### `styles.css`

There should be only **one, single** `styles.css` file per project, app or module, i.e. per _consumer_ of Tailwind.

It is imperative that the `styles.css` file stays as small as possible, and is not bloated with overrides, workarounds, or shims.

The core function of the `styles.css` file is to:

1. Import Tailwind
2. Provide variable overrides under the `@theme` scope
3. Conveniently override or replace style values for wide-ranging site properties such as `prefers-color-scheme`,

The _only_ exception to the above rule is that you _are_ permitted to create elemental (tag-based) styles for markup when its rendering is abstract. I.e. if you need to create styles for prose that is dynamically generated or whose contents is not strictly known within the codebase.

In this case -- and in **all other cases** you _must_ use Tailwind variables inside the property values for these custom styles.

#### ✅ Good

```css
.markdown h1 {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
}
```

#### ❌ Bad

```css
.markdown h1 {
  font-family: Arial;
  font-size: 2rem;
}
```
