/**
 * Re-mounted on every top-level navigation (a template, not a layout),
 * so each section fades in as it opens. See `.page-enter`.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
