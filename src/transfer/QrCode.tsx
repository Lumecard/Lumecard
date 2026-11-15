import { useMemo } from "react";
import qrcode from "qrcode-generator";

/**
 * A real, scannable QR code. Dark squares on a white tile, because scanners need that contrast even
 * inside a dark app.
 */
export function QrCode({ value, size = 176 }: { value: string; size?: number }) {
  const { count, path } = useMemo(() => {
    const qr = qrcode(0, "M"); // type 0 picks the smallest size that fits; "M" survives some damage
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    }
    return { count: n, path: d };
  }, [value]);

  const quiet = 3; // the blank border a scanner needs
  const total = count + quiet * 2;
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code"
      className="rounded-xl bg-white"
    >
      <rect width={total} height={total} fill="#ffffff" />
      <path transform={`translate(${quiet} ${quiet})`} d={path} fill="#111113" />
    </svg>
  );
}
