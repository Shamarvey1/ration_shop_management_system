import "./Skeleton.css";

export function Skeleton({ width = "100%", height = "16px", borderRadius, style, className = "" }) {
  const customStyle = {
    width,
    height,
    ...(borderRadius ? { borderRadius } : {}),
    ...style,
  };

  return <div className={`skeleton-pulse ${className}`} style={customStyle} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-card-top">
        <Skeleton width="90px" height="14px" />
        <Skeleton width="38px" height="38px" borderRadius="10px" />
      </div>
      <Skeleton width="130px" height="26px" />
      <Skeleton width="110px" height="12px" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }) {
  return (
    <div className="skeleton-table-row">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === 0 ? "28%" : i === cols - 1 ? "14%" : "18%"}
          height="16px"
          borderRadius="4px"
        />
      ))}
    </div>
  );
}

export default Skeleton;
