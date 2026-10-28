export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-serif text-5xl leading-none tracking-[-0.015em] text-balance wrap-break-word sm:text-[64px]">
      {children}
    </h1>
  );
}
