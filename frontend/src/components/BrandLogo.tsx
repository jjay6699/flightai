import Image from "next/image";
import clsx from "clsx";

export default function BrandLogo({
  className,
  priority = false
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/flight-logo.png"
      alt="FlightAI"
      width={220}
      height={56}
      priority={priority}
      className={clsx("h-9 w-auto object-contain", className)}
    />
  );
}
