/**
 * Shows how much of an item's review interval has been used up.
 * Green = fresh, amber = interval passed, red = twice the interval or more.
 */
const ReviewMeter = ({ days, interval }) => {
  const ratio = interval > 0 ? days / interval : 0;
  const width = Math.min(100, Math.round(ratio * 100));
  const color = ratio >= 2 ? 'bg-alarm-600' : ratio >= 1 ? 'bg-dust-400' : 'bg-pine-600';

  return (
    <div className="w-full min-w-[8rem]">
      <div
        className="h-2 overflow-hidden rounded-full bg-ink/10"
        role="img"
        aria-label={`${days} of ${interval} review days used`}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(width, 4)}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {days} of {interval} days
      </p>
    </div>
  );
};

export default ReviewMeter;
