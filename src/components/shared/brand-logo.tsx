import Image from "next/image";

import {
 PRODUCT_LOGO_ALT,
 PRODUCT_LOGO_HEIGHT,
 PRODUCT_LOGO_SRC,
 PRODUCT_LOGO_WIDTH,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * The TCC logo, everywhere it appears. Size it by height (`h-9`); the
 * width follows the logo's own proportions. On a dark surface it picks
 * up a faint warm glow so the black "T" keeps its edge.
 */
export function BrandLogo({
 className,
 priority = false,
 decorative = false,
 sizes = "160px",
}: {
 className?: string;
 priority?: boolean;
 /** Next to the product name already: hide it from screen readers. */
 decorative?: boolean;
 sizes?: string;
}) {
 return (
 <Image
 src={PRODUCT_LOGO_SRC}
 alt={decorative ? "" : PRODUCT_LOGO_ALT}
 width={PRODUCT_LOGO_WIDTH}
 height={PRODUCT_LOGO_HEIGHT}
 priority={priority}
 sizes={sizes}
 className={cn(
 "h-9 w-auto shrink-0 select-none object-contain drop-shadow-[0_2px_6px_rgba(120,20,10,0.18)] dark:drop-shadow-[0_0_10px_rgba(255,190,90,0.22)]",
 className,
 )}
 draggable={false}
 />
 );
}
