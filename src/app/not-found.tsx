import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-page-gutter max-w-content-max mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-page-title font-ui-bold text-fg-primary mb-4">
        Page Not Found
      </h1>
      <p className="text-body text-fg-secondary mb-6 max-w-md">
        The page you are looking for does not exist, or the decision record could not be found.
      </p>
      <Link
        href="/"
        className="inline-flex h-control items-center justify-center rounded-control bg-action px-6 text-body-sm font-ui-semibold text-surface transition-colors duration-fast ease-standard hover:bg-action-hover focus-visible:outline-focus"
      >
        Go to Home
      </Link>
    </div>
  );
}
