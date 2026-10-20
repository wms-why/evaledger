import { Link, createFileRoute, getRouteApi } from "@tanstack/react-router";
import { localeHead } from "@/features/seo/seo";
import { getOrigin } from "@/features/seo/seo.fns";
import { getOptionalUser } from "@/features/auth/middleware";
import { SiteNav } from "@/components/marketing/site-nav";
import { Footer } from "@/components/marketing/footer";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/features/i18n/provider";
import { dictionaries, type Locale } from "@/features/i18n/locale";
import { getReleases } from "@/features/releases/releases.fns";
import { sortByReleasedAt } from "@/features/releases/select";
import { releasePriceRows, releaseScoreTable } from "@/features/releases/data";
import { releaseVendorLabel } from "@/features/releases/components/ReleaseFactSheet";
import { fmtDate } from "@/lib/format-date";
import { formatReleasePrice } from "@/features/releases/format";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/{-$locale}/releases/")({
  loader: async ({ params }) => {
    const locale = ((params as { locale?: string }).locale ?? "en") as Locale;
    const [origin, user, entries] = await Promise.all([
      getOrigin(),
      getOptionalUser(),
      getReleases({ data: locale }),
    ]);
    return { origin, loggedIn: !!user, entries: sortByReleasedAt(entries) };
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? "";
    const locale = ((params as { locale?: string }).locale ?? "en") as Locale;
    const dict = dictionaries[locale];
    const { meta, links } = localeHead({
      origin,
      locale,
      path: "/releases",
      title: dict.releases.title,
      description: dict.releases.subtitle,
    });
    return { meta, links };
  },
  component: ReleasesIndex,
});

function ReleasesIndex() {
  const { theme } = rootRoute.useLoaderData();
  const { loggedIn, entries } = Route.useLoaderData();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav theme={theme} loggedIn={loggedIn} />
      <main className="mx-auto max-w-4xl px-5 py-14 md:px-7 md:py-20">
        <header className="mb-10 max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-3">
            {t("releases.kicker")}
          </p>
          <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">
            {t("releases.title")}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-2">
            {t("releases.subtitle")}
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="text-[14px] text-fg-3">{t("releases.empty")}</p>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const price = releasePriceRows(entry)[0];
              const scores = releaseScoreTable(entry);
              return (
                <article
                  key={entry.path}
                  className="rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-fg-3">
                    <span className="font-medium text-fg-2">
                      {releaseVendorLabel(t, entry.vendor)}
                    </span>
                    {entry.releasedAt && (
                      <>
                        <span>·</span>
                        <span>
                          {t("releases.releasedOn")} {fmtDate(entry.releasedAt)}
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.01em]">
                    <Link
                      to="/{-$locale}/releases/$slug"
                      params={{ slug: entry.slug }}
                      className="hover:text-primary"
                    >
                      {entry.title}
                    </Link>
                  </h2>

                  {entry.description && (
                    <p className="mt-2 text-[14px] leading-relaxed text-fg-2">
                      {entry.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {price && (
                      <Badge className="tabular-nums">
                        {formatReleasePrice(price.inputPricePer1M)} /{" "}
                        {formatReleasePrice(price.outputPricePer1M)}
                      </Badge>
                    )}
                    {scores ? (
                      <Badge>
                        {t("releases.scoreCount", { n: scores.rows.length })}
                      </Badge>
                    ) : (
                      <Badge>{t("releases.noScores")}</Badge>
                    )}
                    <Link
                      to="/{-$locale}/releases/$slug"
                      params={{ slug: entry.slug }}
                      className="text-[13px] font-medium text-primary underline decoration-dotted underline-offset-2 hover:text-foreground"
                    >
                      {t("releases.readMore")} →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer theme={theme} />
    </div>
  );
}
