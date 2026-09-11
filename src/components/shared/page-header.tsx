export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <span
          aria-hidden="true"
          className="mb-3 block h-1.5 w-16 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400"
        />
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-stone-600 dark:text-stone-300">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
