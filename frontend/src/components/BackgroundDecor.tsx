// src/components/BackgroundDecor.tsx
import Image from "next/image";

export type BgItem = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;       // sizing/positioning via Tailwind
  priority?: boolean;
  behavior?: "fixed" | "scroll"; // fixed (default) stays pinned to viewport; scroll moves with page
  repeatY?: boolean;        // if true, uses a CSS background that repeats vertically
  bgSize?: string;          // e.g. 'contain', 'cover', 'auto 600px'
  bgPosition?: string;      // e.g. 'top left', 'center right'
};

export default function BackgroundDecor({ items }: { items: BgItem[] }) {
  const fixedItems = items.filter((i) => i.behavior !== "scroll");
  const scrollItems = items.filter((i) => i.behavior === "scroll");

  return (
    <>
      {/* FIXED layer (below everything, doesn't affect layout) */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(900px_300px_at_50%_-200px,rgba(255,255,255,0.06),transparent_70%)]" />
        {fixedItems.map((it, i) => (
          <div key={`f-${i}`} className={`absolute ${it.className ?? ""}`}>
            <Image
              src={it.src}
              alt={it.alt ?? "decor"}
              width={it.width ?? 800}
              height={it.height ?? 800}
              className="opacity-80 select-none"
              priority={it.priority}
            />
          </div>
        ))}
      </div>

      {/* SCROLL layer (absolute in document flow under content) */}
      {scrollItems.length > 0 && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          {scrollItems.map((it, i) => {
            if (it.repeatY) {
              // Use a DIV with CSS background so the SVG can tile vertically
              const style: React.CSSProperties = {
                backgroundImage: `url(${it.src})`,
                backgroundRepeat: "repeat-y",
                backgroundSize: it.bgSize ?? "auto",
                backgroundPosition: it.bgPosition ?? "top left",
              };
              return (
                <div
                  key={`s-bg-${i}`}
                  style={style}
                  className={`absolute ${it.className ?? "w-full h-[200vh]"}`}
                />
              );
            }
            // Non-repeating long art can still be an <Image> or <img>
            return (
              <div key={`s-${i}`} className={`absolute ${it.className ?? ""}`}>
                {/* For very tall SVGs you can also swap to <img> to avoid intrinsic sizing constraints */}
                <img src={it.src} alt={it.alt ?? "decor"} className="select-none" />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}