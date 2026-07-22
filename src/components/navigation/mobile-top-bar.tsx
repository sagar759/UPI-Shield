import { BrandMark } from "@/components/brand/brand-mark";

export function MobileTopBar() {
  return (
    <header className="flex min-[900px]:hidden h-14 items-center justify-between border-b border-border bg-surface px-4 sticky top-0 z-sticky">
      <BrandMark size="md" />
    </header>
  );
}
