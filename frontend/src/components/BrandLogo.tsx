import clsx from "clsx";

export default function BrandLogo({
  className
}: {
  className?: string;
}) {
  return (
    <img
      src="/flight-logo.png"
      alt="FlightAI"
      className={clsx("h-9 w-auto object-contain", className)}
    />
  );
}
