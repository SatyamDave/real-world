import { ApiError, type Population } from "@real-world/sdk";
import { useState } from "react";
import { ApiCall } from "../ApiCall";
import { Disclosure, Empty, LoadError, Loading, pct, plural, TierBadge, useLoad } from "../App";
import { rw } from "../api";
import { Bars } from "../Chart";
import { Method } from "../Method";

export const title = "World";

type PopCountry = Population["countries"][number];
type PopTopic = PopCountry["topics"][number];

const RUBRIC = [
  ["population", "Population"],
  ["attitudes", "Attitudes"],
  ["markets", "Markets"],
  ["news", "News"],
  ["ground_truth", "Ground truth"],
] as const;

const ratio = (v: number) => v.toFixed(2);
const logit = (v: number) => v.toFixed(3);
const range = ([lo, hi]: number[]) => `${lo} to ${hi}`;

/** Tier first, then name, so the best-covered countries read first. */
const byTier = (a: PopCountry, b: PopCountry) =>
  a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name);

function AuditStamp({ t }: { t: PopTopic }) {
  if (t.in_band === null) return <span className="stamp plain">Not audited</span>;
  return t.in_band ? (
    <span className="stamp good">In band</span>
  ) : (
    <span className="stamp">Out of band</span>
  );
}

function Topic({ t, n, band }: { t: PopTopic; n: number; band: number[] }) {
  return (
    <article className="world-topic">
      <h3>
        {t.label} <AuditStamp t={t} />
      </h3>
      <Bars
        title={`${t.label}: published share and simulated share with p10 to p90`}
        domain={[0, 1]}
        format={pct}
        reference={t.calibrated_share}
        rows={[
          {
            label: "Published",
            value: t.calibrated_share,
            note: `survey sd ${logit(t.survey_sd_logit)} logit`,
          },
          {
            label: "Simulated",
            value: t.share,
            low: t.p10,
            high: t.p90,
            note: `median ${pct(t.p50)}`,
          },
        ]}
      />
      <p className="muted small world-audit">
        {t.ratio === null || t.sim_sd_logit === null ? (
          <>Spread audit has not run for this day.</>
        ) : (
          <>
            SD ratio <span className="mono">{ratio(t.ratio)}</span> = simulated sd{" "}
            <span className="mono">{logit(t.sim_sd_logit)}</span> / survey sd{" "}
            <span className="mono">{logit(t.survey_sd_logit)}</span>, band{" "}
            <span className="mono">{range(band)}</span>.{" "}
          </>
        )}
        n = {plural(n, "agent")}; marginal from <span className="mono">{t.source_id}</span>.
      </p>
    </article>
  );
}

function CountryPanel({ c, p }: { c: PopCountry; p: Population }) {
  const floor = p.tier_floors[c.tier];
  const widest = Math.max(...c.segments.map((s) => s.agent_count));
  return (
    <section className="card world-country" aria-labelledby={`country-${c.iso3}`}>
      <div className="world-head">
        <h2 id={`country-${c.iso3}`}>{c.name}</h2>
        <TierBadge tier={c.tier} />
        {c.experimental && <span className="stamp">Experimental</span>}
      </div>
      <p className="muted small">
        {plural(c.agent_count, "agent")} in {plural(c.segments.length, "segment")}. Coverage score{" "}
        <span className="mono">{c.rubric.score}</span> of 100:{" "}
        {floor === undefined
          ? `tier ${c.tier} is below the lowest floor`
          : `tier ${c.tier} starts at ${floor}`}
        .{c.experimental && " The simulated spread was outside the band on the latest audit."}
      </p>
      <Bars
        title={`${c.name}: agents per segment`}
        domain={[0, widest]}
        format={(v) => Math.round(v).toLocaleString()}
        rows={c.segments.map((s) => ({
          label: `${s.age_band} · ${s.education}`,
          value: s.agent_count,
        }))}
      />
      <div className="world-topics">
        {c.topics.map((t) => (
          <Topic key={t.topic} t={t} n={c.agent_count} band={p.settings_used.spread_band} />
        ))}
      </div>
    </section>
  );
}

function Countries({
  countries,
  selected,
  onSelect,
}: {
  countries: PopCountry[];
  selected: string;
  onSelect: (iso3: string) => void;
}) {
  return (
    <section className="card" aria-labelledby="world-countries">
      <h2 id="world-countries">Countries</h2>
      <p className="muted small">
        Sorted by coverage tier, then name. The five rubric parts read{" "}
        {RUBRIC.map(([, name]) => name.toLowerCase()).join(", ")}; hover a row's parts for their
        names. Select a country to read its segments and topics.
      </p>
      <div className="table-wrap">
        <table className="world-table">
          <thead>
            <tr>
              <th>Country</th>
              <th>Tier</th>
              <th>Region</th>
              <th>Agents</th>
              <th>Segments</th>
              <th>Rubric</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((c) => (
              <tr key={c.iso3}>
                <td data-label="Country">
                  <button
                    type="button"
                    className="link"
                    aria-pressed={c.iso3 === selected}
                    onClick={() => onSelect(c.iso3)}
                  >
                    {c.name}
                  </button>
                  {c.experimental && <span className="stamp">Experimental</span>}
                </td>
                <td data-label="Tier">
                  <TierBadge tier={c.tier} />
                </td>
                <td data-label="Region">{c.region}</td>
                <td data-label="Agents" className="num">
                  {c.agent_count.toLocaleString()}
                </td>
                <td data-label="Segments" className="num">
                  {c.segments.length}
                </td>
                <td
                  data-label="Rubric"
                  className="num"
                  title={RUBRIC.map(([key, name]) => `${name} ${c.rubric[key]}`).join(", ")}
                >
                  {RUBRIC.map(([key]) => c.rubric[key]).join(" · ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Computed({ p }: { p: Population }) {
  const u = p.settings_used;
  const [a, b] = u.stubbornness_beta;
  return (
    <Method
      source="engine/rw/population.py"
      paper={{
        title: "Unequally Known",
        href: "https://github.com/SatyamDave/real-world/tree/main/papers/global-population",
      }}
    >
      <p>
        Sampling (<code>population.sample_population</code>): each country gets a share of the{" "}
        {plural(p.agents, "agent")} in proportion to its population, never below{" "}
        {pct(u.country_floor_share)}. Each agent draws a demographic cell with the cell's share. Its
        starting belief on each topic is{" "}
        <code>b0 = logit(mean_share) + segment effects + N(0, survey_sd_logit)</code>, the published
        marginal plus one shift per trait and the survey's own spread. Stubbornness is Beta({a}, {b}
        ) and the per-agent offset is N(0, {u.offset_sd_logit}).
      </p>
      <p>
        Shown shares: simulated share is the mean of <code>sigmoid(b)</code> over a country's
        agents, and p10, p50 and p90 are quantiles of the same values. Published is the marginal in{" "}
        <code>data/sample/attitudes.csv</code>.
      </p>
      <p>
        Spread audit: <code>ratio = sd(b) / survey_sd_logit</code> per country and topic. A ratio in{" "}
        {range(u.spread_band)} is in band; a country with a topic outside it is experimental for the
        day.
      </p>
      <p>
        Coverage tier: the rubric parts sum to a score from 0 to 100 and a tier starts at its floor,
        as the engine applies it:{" "}
        {Object.entries(p.tier_floors).map(([t, f]) => (
          <span key={t} className="world-floor">
            <TierBadge tier={t} /> {f} or more
          </span>
        ))}
        <span className="world-floor">
          <TierBadge tier="D" /> below {Math.min(...Object.values(p.tier_floors))}
        </span>
        . See{" "}
        <a href="https://github.com/SatyamDave/real-world/blob/main/research/data/099-country-coverage-tiers.md">
          country coverage tiers
        </a>
        .
      </p>
      <p>
        Parameters as used: <span className="mono">{plural(p.agents, "agent")}</span> in this
        snapshot, <code>WORLD_AGENTS</code>{" "}
        <span className="mono">{u.world_agents.toLocaleString()}</span>, <code>WORLD_SEED</code>{" "}
        <span className="mono">{u.world_seed}</span>, <code>SPREAD_BAND</code>{" "}
        <span className="mono">{range(u.spread_band)}</span>. The model is called once per segment,
        never per agent.
      </p>
      <p>
        Provenance:{" "}
        {p.sources.map((s) => (
          <span key={s.source_id}>
            <span className="mono">{s.source_id}</span>, kind {s.kind}, commercial use{" "}
            {s.commercial_use}, checked <span className="mono">{s.checked_on}</span>.
            {s.kind === "fixture" &&
              " These marginals are illustrative samples written for this repository, not survey data."}
          </span>
        ))}
      </p>
    </Method>
  );
}

function World({ p }: { p: Population }) {
  const countries = [...p.countries].sort(byTier);
  const [selected, setSelected] = useState(countries[0]?.iso3 ?? "");
  const current = countries.find((c) => c.iso3 === selected);
  const csv = p.countries.flatMap((c) =>
    c.topics.map((t) => ({
      iso3: c.iso3,
      name: c.name,
      tier: c.tier,
      agents: c.agent_count,
      topic: t.topic,
      published_share: t.calibrated_share,
      simulated_share: t.share,
      p10: t.p10,
      p50: t.p50,
      p90: t.p90,
      sd_ratio: t.ratio,
      in_band: t.in_band,
    })),
  );
  return (
    <div className="world">
      <section className="hero">
        <h1>The simulated population</h1>
        <p className="muted">
          World of <span className="mono">{p.date}</span>: {plural(p.agents, "agent")} in{" "}
          {plural(p.segments, "segment")} across {p.countries.length} countries. Agents are rows of
          numbers. The model is called once per segment, never per agent.
        </p>
      </section>
      <Countries countries={countries} selected={selected} onSelect={setSelected} />
      {current && <CountryPanel c={current} p={p} />}
      <Computed p={p} />
      <ApiCall
        path="/v1/world/population"
        sdk="population()"
        data={p}
        csv={csv}
        filename="world-population"
      />
      <p className="world-next">
        <a href="/cycle">See today's cycle</a>
      </p>
      <Disclosure tiers={p.countries.map((c) => c.tier)} />
    </div>
  );
}

export default function Page() {
  const r = useLoad(() => rw.population());
  if (r.error instanceof ApiError && r.error.status === 404)
    return <Empty>No world snapshot yet. The first daily cycle creates one.</Empty>;
  if (r.error)
    return <LoadError what="the population" error={r.error} retry={r.retry} shape="rows" />;
  if (!r.data) return <Loading what="the population" shape="rows" />;
  return <World p={r.data} />;
}
