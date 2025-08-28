// frontend/src/components/BackgroundDecor.tsx
import Image from "next/image";

type Item = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export default function BackgroundDecor({ items }: { items: Item[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(900px_300px_at_50%_-200px,rgba(255,255,255,0.06),transparent_70%)]" />
      {items.map((it, i) => (
        <div key={i} className={`absolute ${it.className ?? ""}`}>
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
  );
}