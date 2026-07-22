export default function Loading() {
  return (
    <div className="p-page-gutter max-w-content-max mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center" aria-live="polite" aria-busy="true">
      <div className="inline-block size-icon-lg border-2 border-border border-t-action rounded-full animate-spin mb-4" />
      <p className="text-body-sm font-ui-medium text-fg-secondary">
        Scanning status...
      </p>
    </div>
  );
}
