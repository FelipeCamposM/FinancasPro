export function SilkBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    >
      <div className="absolute -top-32 -left-32 h-[560px] w-[560px] rounded-full bg-blue-600/[0.08] blur-[130px]" />
      <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-indigo-700/[0.06] blur-[110px]" />
    </div>
  );
}
