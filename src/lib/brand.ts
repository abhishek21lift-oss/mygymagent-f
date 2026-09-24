export const PRODUCT_NAME = "THE CULT CLIENT";

/**
 * The product mark, already cropped to a circle with a transparent
 * surround, so a round frame is the image's own shape rather than an
 * `overflow-hidden` wrapper that a glow behind it would then be clipped
 * by.
 *
 * Served from `public/` instead of the base64 data URI this used to be:
 * the artwork is ~40KB, and inlining it put that, plus a third again in
 * base64 overhead, into a module the root layout, the sidebar and the
 * sign-in screen all import — so every page paid for it in JavaScript.
 * As a file the browser fetches it once and caches it, and `next/image`
 * can resize it for the 40px sidebar slot.
 */
export const PRODUCT_LOGO_SRC = "/brand/the-cult-client.webp";

/** PNG, for the places that are not `next/image`: browser tabs, an
 * iOS home-screen icon. Both understand WebP now, but a PNG is the one
 * that is never the reason an icon fails to draw. */
export const PRODUCT_LOGO_ICON_SRC = "/brand/the-cult-client-192.png";

export const PRODUCT_LOGO_ALT = "THE CULT CLIENT";
