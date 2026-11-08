import { cn } from "@/lib/utils";

type PageIntroProps = {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageIntroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/60 bg-muted/30",
        className,
      )}
    >
      <div className="absolute inset-0 soft-glow opacity-80" aria-hidden="true" />
      <div
        className="absolute inset-0 brand-grid opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden="true"
      />
      <div className="container-page relative py-12 lg:py-16">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-heading text-4xl font-normal leading-[1.08] tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground text-pretty">
              {description}
            </p>
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </section>
  );
}
