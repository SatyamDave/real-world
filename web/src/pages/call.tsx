import { DailyQuestion } from "../DailyQuestion";

export const title = "Call it";

export default function Call() {
  return (
    <div className="call">
      <section className="thesis" aria-labelledby="call-title">
        <h1 id="call-title">Call it</h1>
        <p>
          One question a day, the same for everyone. The AI has already called it, and its call is
          sealed before you answer. Make your call, then see who was closer when it resolves.
        </p>
      </section>
      <DailyQuestion tiers={[]} />
    </div>
  );
}
