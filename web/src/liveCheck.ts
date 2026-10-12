// The production build refuses to ship fixture questions (product/web-app.md); vite.config.ts runs this.
import { Client } from "@real-world/sdk";

export type ShownQuestion = { id: string; text: string; resolution_source: string };

export function fixtureLeaks(questions: ShownQuestion[]): string[] {
  const leaks = questions.flatMap((q) => {
    const host = new URL(q.resolution_source).hostname;
    const bad = [];
    if (q.id.startsWith("fx-")) bad.push(`${q.id}: fixture id`);
    if (q.text.startsWith("FIXTURE:")) bad.push(`${q.id}: fixture text`);
    if (host === "example.com" || host.endsWith(".example.com"))
      bad.push(`${q.id}: source host ${host}`);
    return bad;
  });
  return [...new Set(leaks)];
}

// Every question the app can show: today's daily question and each receipt day's forecasts.
export async function shownQuestions(
  rw: Pick<Client, "daily" | "receipts" | "receipt_day">,
): Promise<ShownQuestion[]> {
  const shown: ShownQuestion[] = [(await rw.daily()).question];
  for (const day of (await rw.receipts()).days) {
    for (const e of (await rw.receipt_day(day.date)).entries) {
      if (e.question)
        shown.push({
          id: String(e.entry.question_id),
          text: e.question.text,
          resolution_source: e.question.resolution_source,
        });
    }
  }
  return shown;
}

export async function fixtureLeaksAt(apiUrl: string): Promise<string[]> {
  return fixtureLeaks(await shownQuestions(new Client(apiUrl)));
}
