# Разлёт сердечек — передача в разработку

Анимация из шита благодарности: сердце пульсирует, из него в стороны разлетаются сердечки
разного размера и прозрачности. Проигрывается один раз в момент появления шита.

## Что в папке

| Файл | Зачем |
| --- | --- |
| `hearts-burst.json` | Lottie. Основной ассет, годится и для веба, и для iOS, и для Android |
| `hearts-burst.css` + `hearts-burst.js` | Веб-реализация без Lottie, если тащить рантайм не хочется |
| `preview.html` | Превью: анимация отдельно и внутри макета шита, с переключателем обрезки |
| `generate-hearts.mjs` | Скрипт, которым собран JSON. Нужен только чтобы пересобрать ассет |

## Параметры

Композиция 440×120, сердце в центре — в точке (220, 60). В покое сердце 24×24.

Схема Lottie 5.9, 60 кадров в секунду, 114 кадров — это 1.9 секунды. Пульсация сердца
укладывается в первые 60 кадров, дальше доживают только частицы. Внутри 23 слоя: `Heart pump`
и `Heart particle 1…22`. Растровых ассетов нет, всё вектор, поэтому файл тянется без картинок
и масштабируется без потерь. Вес 35 КБ, в gzip — 2.6 КБ. Цвет один, `#0C73FE`.

Композиция обтягивает сам разлёт, а не шит: размеры шита зависят от устройства и длины текста,
привязываться к ним нельзя. Разлёт вписан в границы композиции с запасом 3 px, так что сам файл
ничего не обрезает.

## Чем открыть Lottie

Веб — `lottie-web` или `@lottiefiles/dotlottie-web`. iOS — `lottie-ios`. Android —
`lottie-android`. React Native — `lottie-react-native`. Файл один и тот же, конвертировать
ничего не нужно.

## Пять требований к интеграции

Без них ловятся баги, которых в превью не видно.

**Сердце входит в анимацию.** Отдельную статичную иконку под Lottie класть не надо, иначе будет
два сердца внахлёст. На первом и последнем кадре сердце стоит в масштабе 100% с полной
непрозрачностью, поэтому Lottie-вью можно повесить вместо иконки навсегда: в покое он рисует
обычное сердце, по команде — проигрывает пульсацию.

**Контейнер обязан обрезать содержимое.** `overflow: hidden` на вебе, `clipsToBounds` на iOS,
`clipChildren` на Android. Три частицы из двадцати двух улетают за боковые границы шита — до 27 px
влево и 15 px вправо — и без обрезки будут видны поверх затемнения. Как это выглядит, показывает
галочка «обрезка контейнером» в `preview.html`.

**Вью центрируется по иконке сердца, а не растягивается по шиту.** Растягивание исказит форму
сердец. Если иконка 24 pt, вью — ровно 440×120 pt; для другого размера иконки масштабируйте
пропорционально, коэффициент 440/24 по ширине и 120/24 по высоте.

**Анимация не интерактивна.** Отключите хит-тестинг, иначе вью перехватит нажатие на кнопку под
ним: `pointer-events: none` на вебе, `isUserInteractionEnabled = false` на iOS,
`android:clickable="false"` на Android.

**Уважайте «уменьшение движения».** При включённом `prefers-reduced-motion` на вебе, Reduce Motion
на iOS или нулевой шкале анимаций на Android анимацию не проигрывать — показывать статичное сердце.

Плюс общее: проигрывание однократное, без лупа и без автоплея, запуск ровно в момент появления шита.

## Подключение

Веб, `lottie-web`:

```js
const anim = lottie.loadAnimation({
  container: heartSlot, // 440×120, центрирован по иконке сердца
  renderer: "svg",
  loop: false,
  autoplay: false,
  path: "/assets/hearts-burst.json",
});

// в момент показа шита
anim.goToAndPlay(0, true);
```

iOS, `lottie-ios`:

```swift
let animationView = LottieAnimationView(name: "hearts-burst")
animationView.contentMode = .scaleAspectFit
animationView.loopMode = .playOnce
animationView.isUserInteractionEnabled = false
sheetView.clipsToBounds = true

animationView.play()
```

Android, `lottie-android`:

```kotlin
animationView.setAnimation(R.raw.hearts_burst)
animationView.repeatCount = 0
animationView.isClickable = false

animationView.playAnimation()
```

## Перекраска под тему

Цвет `#0C73FE` зашит в заливку. На всех 23 слоях лежит группа `Heart`, в ней контур `Path` и
заливка `Fill`, поэтому одним вайлдкард-кейпасом красятся сразу и сердце, и все частицы.

iOS:

```swift
animationView.setValueProvider(
    ColorValueProvider(UIColor.heartAccent.lottieColorValue),
    keypath: AnimationKeypath(keypath: "**.Fill.Color")
)
```

Android:

```kotlin
animationView.addValueCallback(KeyPath("**", "Fill"), LottieProperty.COLOR) {
    ContextCompat.getColor(context, R.color.heart_accent)
}
```

На вебе встроенного API для цвета нет, но SVG-рендерер рисует обычные `<path>`, и CSS-свойство
`fill` перебивает атрибут в разметке без `!important`:

```css
.hearts-burst-slot svg path { fill: var(--heart-accent); }
```

Это работает только с SVG-рендерером. Для canvas или `dotlottie-web` цвет придётся править в самом
JSON перед загрузкой: обойти слои и заменить `c.k`, там везде один массив
`[0.047, 0.451, 0.996, 1]` — это и есть `#0C73FE`.

## Веб без Lottie

Плеер `lottie-web` в минифицированном виде весит 236 КБ в SVG-сборке или 164 КБ в облегчённой
`lottie_light`, против 2.6 КБ самой анимации. Если Lottie в проекте уже используется, берите JSON
и получите совпадение с мобилкой кадр в кадр. Если нет и эта анимация единственная, в папке лежит
готовая реализация на CSS и ванильном JS — те же кейфреймы и те же числа разлёта, около 200 строк
на двоих вместе с комментариями, без зависимостей:

```html
<span class="hearts-burst" id="heart">
  <svg class="hearts-burst__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="…" /></svg>
  <span class="hearts-burst__particles"></span>
</span>
```

```js
import { playHeartsBurst } from "./hearts-burst.js";

playHeartsBurst(document.getElementById("heart"));
```

Одна разница в поведении: CSS-версия рандомит углы, размеры и задержки на каждом показе, поэтому
разлёт каждый раз чуть другой. В Lottie всё запечено с фиксированным сидом и проигрывается
одинаково. Если нужна полная идентичность веба и мобилки — берите Lottie везде.

## Как пересобрать JSON

Источник правды — CSS-кейфреймы и разброс частиц в самом прототипе, `generate-hearts.mjs` повторяет
их математику со seeded-генератором. После правки прототипа:

```sh
node rating/lottie/generate-hearts.mjs
```

Размеры композиции задаются константами `COMP_W`, `COMP_H` в начале скрипта; позиции частиц
считаются относительно центра, пересчитывать вручную ничего не нужно.
