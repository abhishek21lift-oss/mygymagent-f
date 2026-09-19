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
    <div className="skeuo-plate skeuo-screws flex flex-col gap-4 rounded-[14px] border border-[#6b5d42] px-5 py-4 shadow-[inset_0_1px_0_#fff,0_10px_24px_rgba(0,0,0,0.4)] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {/* engraved brass nameplate */}
        <span
          aria-hidden="true"
          className="mb-2 inline-block rounded-[6px] border border-[#4a360f] bg-gradient-to-b from-[#3a2c1a] to-[#1c140b] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-[#e8c25e] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8),0_1px_0_rgba(255,250,235,0.6)]"
          style={{ textShadow: "0 -1px 0 #000" }}
        >
          &bull; Filed &bull;
        </span>
        <h1
          className="text-2xl font-black tracking-tight text-[#2e2313] sm:text-3xl dark:text-[#f3e7c6]"
          style={{ textShadow: "0 1px 0 rgba(255,250,235,0.9), 0 -1px 1px rgba(60,40,20,0.4)" }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm font-medium leading-6 text-[#5c4f38] dark:text-[#c9b586]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 [&>*]:min-h-10">{actions}</div>}
    </div>
  );
}
