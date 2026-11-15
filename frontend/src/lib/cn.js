/** Join conditional class names without pulling in an extra dependency. */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ')
}
