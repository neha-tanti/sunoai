# Composition Over Render Props

Never accept a prop whose purpose is to inject what a component renders. Use
`children` or named `ReactNode` slots when variants share structure; split into
per-mode components when they don't.

**Review only** — there is no lint rule. Reject props typed as render callbacks
(`(...) => ReactNode`) or component references (`ComponentType` / `FC` /
`ElementType`) at review. Event-handler props (`on*`) are exempt; they return
data, not JSX.

Third-party APIs that mandate the shape are exempt; give the reason in the PR.
