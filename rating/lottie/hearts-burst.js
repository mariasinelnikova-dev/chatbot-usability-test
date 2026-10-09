/**
 * Разлёт сердечек — веб-реализация без Lottie.
 * Парная к hearts-burst.css. Полный аналог hearts-burst.json, см. HANDOFF.md.
 *
 * Разметка, которую ждёт playHeartsBurst:
 *   <span class="hearts-burst">
 *     <svg class="hearts-burst__icon" viewBox="0 0 24 24">…</svg>
 *     <span class="hearts-burst__particles"></span>
 *   </span>
 *
 * Иконку можно нарисовать самим или взять из createHeartIcon().
 * Вызывать playHeartsBurst строго в момент появления шита.
 */

const HEART_PATH =
  "M4.3824 5.42128C3.44658 6.38219 2.98143 7.65284 3.00084 8.91933C3.00012 8.94592 2.99976 " +
  "8.97283 2.99976 9.00007C2.99976 12.6001 8.66642 18.5001 11.4998 21.0001H12.5004C15.3337 " +
  "18.5001 21.0004 12.6001 21.0004 9.00007C21.0004 8.97283 21 8.94592 20.9993 8.91933C21.0187 " +
  "7.65284 20.5535 6.38219 19.6177 5.42128C17.6271 3.37731 14.3523 3.56354 12.6128 5.81964L12.0001 " +
  "6.61444L11.3873 5.81964C9.64784 3.56354 6.37303 3.37731 4.3824 5.42128Z";

const SVG_NS = "http://www.w3.org/2000/svg";

const PARTICLE_COUNT = 22;

/* Эллипс разлёта. Радиусы подобраны под шит шириной 374: в стороны места много,
   а сверху над сердцем всего ~60px, поэтому центр смещён вниз на 4px.
   Те же числа запечены в hearts-burst.json — менять только синхронно. */
const RADIUS_X = 178;
const RADIUS_Y = 34;
const CENTER_SHIFT_Y = -4;

const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function createHeartSvg(className) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", className);

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", HEART_PATH);
  svg.append(path);

  return svg;
}

/** Иконка сердца — то же сердце, что пульсирует в анимации. */
export function createHeartIcon() {
  return createHeartSvg("hearts-burst__icon");
}

/**
 * Проигрывает разлёт один раз. Повторный вызов перезапускает анимацию с нуля.
 *
 * @param {HTMLElement} root элемент с классом hearts-burst
 */
export function playHeartsBurst(root) {
  const particles = root.querySelector(".hearts-burst__particles");
  if (!particles) throw new Error("hearts-burst: не найден слой .hearts-burst__particles");

  particles.replaceChildren();

  root.classList.remove("is-bursting");
  void root.offsetWidth; /* рестарт CSS-анимации при повторном показе */
  root.classList.add("is-bursting");

  if (prefersReducedMotion()) return;

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const angle = (360 / PARTICLE_COUNT) * i + (Math.random() * 12 - 6);
    const radians = (angle * Math.PI) / 180;

    /* 0 — мелкое и прозрачное, 1 — крупное и плотное */
    const weight = Math.random();
    const spread = 0.8 + weight * 0.35;

    const particle = createHeartSvg("hearts-burst__particle");
    const style = particle.style;
    style.setProperty("--tx", `${Math.cos(radians) * RADIUS_X * spread}px`);
    style.setProperty("--ty", `${Math.sin(radians) * RADIUS_Y * spread + CENTER_SHIFT_Y}px`);
    style.setProperty("--rot", `${Math.random() * 100 - 50}deg`);
    style.setProperty("--size", `${7 + weight * 19}px`);
    style.setProperty("--peak-opacity", (0.22 + weight * 0.78).toFixed(2));
    style.setProperty("--duration", `${950 + Math.random() * 450}ms`);
    /* Сердечки вылетают на пике пульсации — это 44% от её тысячи миллисекунд */
    style.setProperty("--delay", `${400 + Math.random() * 160}ms`);

    particles.append(particle);
  }
}
