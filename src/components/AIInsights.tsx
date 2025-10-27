import React, { useMemo, useState } from 'react';
import { Sparkles, Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface AIInsightsProps {
  insights: string[];
  title?: string;
}

// Basic parser: pulls leading emoji if present and normalizes content
function parseInsight(line: string) {
  const trimmed = line.trim();
  // Try to capture a leading emoji or icon-like character (with optional variation selector)
  const match = trimmed.match(/^([\p{Extended_Pictographic}\p{Emoji_Presentation}](?:\uFE0F)?)\s*(.*)$/u);
  if (match) {
    return { emoji: match[1], content: match[2] || '' };
  }
  // Fallback: match against a small set of common emoji at start
  const common = trimmed.match(/^(🧠|💡|🎉|🍲|📋|🌿|⚡️|👍|📝)\s*(.*)$/);
  if (common) {
    return { emoji: common[1], content: common[2] || '' };
  }
  // Default fallback
  return { emoji: '✨', content: trimmed };
}

const defaultRecommendations = [
  'Prioritize whole foods and high-quality protein sources.',
  'Distribute protein intake across 3–5 meals for better synthesis.',
  'Stay hydrated: target 2–3L water daily, adjust with activity.',
  'Plan meals around workouts to optimize energy and recovery.',
];

export default function AIInsights({ insights, title }: AIInsightsProps) {
  const [expanded, setExpanded] = useState(false);

  const parsed = useMemo(() => insights.map(parseInsight), [insights]);
  const primary = parsed.slice(0, 4); // show first set
  const extra = parsed.slice(4);

  return (
    <div className="ai-insights space-y-4">
      <div className="insights-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h4 className="text-lg font-semibold">{title ?? 'AI-Powered Insights'}</h4>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              Hide more <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show more <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Primary insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {primary.map((item, idx) => (
          <div key={idx} className="border rounded-lg p-3 bg-muted/40">
            <div className="flex items-start gap-2">
              <span className="text-xl leading-none">{item.emoji}</span>
              <p className="text-sm text-muted-foreground">{item.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional recommendations */}
      <div className="space-y-2">
        <h5 className="text-sm font-semibold">Additional Recommendations</h5>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          {defaultRecommendations.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* AI learning notice */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
        <Brain className="h-5 w-5 text-primary" />
        <div className="text-sm text-muted-foreground">
          This AI adapts over time. As you log meals and progress,
          recommendations will become more personalized to your preferences and goals.
        </div>
      </div>

      {/* Expanded insights */}
      {expanded && extra.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {extra.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-3 bg-muted/40">
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none">{item.emoji}</span>
                <p className="text-sm text-muted-foreground">{item.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}