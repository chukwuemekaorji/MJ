import Link from 'next/link';
import { getDailyQuestion } from '@/lib/dailyQuestion';

const dailyQuestion = getDailyQuestion();

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__eyebrow">Daily Question</div>
        <h1>{dailyQuestion.question}</h1>
        <p className="hero__lede">{dailyQuestion.focus}</p>

        <div className="hero__panel">
          <span className="hero__label">Today</span>
          <p>{dailyQuestion.answerPrompt}</p>
        </div>

        <div className="hero__actions">
          <Link href="/api/daily" className="button button--primary">
            View JSON
          </Link>
          <Link href="/api/content/on-demand" className="button button--secondary">
            On-demand API
          </Link>
        </div>
      </section>

      <aside className="sidebar">
        <div className="card">
          <h2>How it works</h2>
          <ul>
            <li>The home page renders the shared daily question helper.</li>
            <li>The daily API returns the same payload in JSON.</li>
            <li>The on-demand API can generate fresh content from a prompt.</li>
          </ul>
        </div>

        <div className="card card--accent">
          <h2>Today&apos;s focus</h2>
          <p>{dailyQuestion.focus}</p>
        </div>
      </aside>
    </main>
  );
}
