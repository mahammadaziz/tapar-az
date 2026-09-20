export default function ImageWatermark() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center select-none text-[clamp(1.5rem,5vw,3.5rem)] font-extrabold tracking-[.12em] text-white/20 mix-blend-screen drop-shadow-[0_1px_2px_rgba(0,0,0,.35)]"
    >
      tapar.az
    </span>
  );
}
