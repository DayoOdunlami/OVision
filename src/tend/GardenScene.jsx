import { useEffect, useId, useRef, useState } from "react";
import "./garden-scene.css";

// The garden is a place to rest, not a score. Flowers remember visits; nothing dies.
const SPRIGS = [
  [89, 130, -34, 0.98],
  [133, 92, -15, 1.05],
  [177, 70, 12, 0.92],
  [222, 95, 30, 0.97],
  [267, 127, 58, 0.94],
  [300, 167, 72, 0.84],
  [267, 202, 111, 0.91],
  [216, 209, 149, 0.95],
  [156, 206, 174, 0.85],
  [105, 188, 205, 0.93],
  [65, 171, 239, 0.77],
  [119, 144, 23, 1.02],
  [166, 124, 43, 0.98],
  [209, 144, 81, 0.97],
  [248, 161, 142, 0.89],
  [171, 168, 196, 0.89],
  [83, 104, -13, 0.7],
  [238, 70, 35, 0.64],
];
const FLOWERS = [
  [92, 463, -12],
  [126, 449, 10],
  [154, 465, 7],
  [62, 450, -7],
  [111, 484, -12],
  [181, 448, 13],
  [207, 475, -5],
  [53, 482, 9],
  [144, 490, -6],
  [231, 455, 8],
  [76, 503, -10],
  [174, 504, 10],
  [252, 477, 3],
  [222, 501, -7],
  [42, 508, 6],
  [132, 516, 4],
];

function OliveSprig({ x, y, turn, scale, id }) {
  return (
    <use
      href={`#${id}`}
      transform={`translate(${x} ${y}) rotate(${turn}) scale(${scale})`}
    />
  );
}

function Koi({ kind = 0 }) {
  const body = kind === 2 ? "#caa34d" : "#f2e4cd";
  return (
    <g className="garden-scene__koi-body">
      <path
        d="M-21 0C-15-4-13-7-8-8L-13-15Q-4-14 3-7Q17-8 24-1Q27 2 21 6Q9 13-5 7L-13 15L-10 6L-22 2L-34 10L-30 0L-35-9Z"
        fill={body}
      />
      {kind === 0 && (
        <>
          <path d="M10-7Q20-5 23 0L16 4L9 1Z" fill="#ae4e34" />
          <path d="M-5-7L4-7L1 5L-8 4Z" fill="#bc5a3f" />
        </>
      )}
      {kind === 1 && (
        <>
          <path d="M4-7Q13-8 18-3L10 5L2 3Z" fill="#354c43" />
          <path d="M-13-5L-5-8L-2-2L-7 6L-13 4Z" fill="#b65d43" />
        </>
      )}
      {kind === 2 && (
        <path
          d="M-17-1Q-3-4 13-2"
          fill="none"
          stroke="#ead48f"
          strokeWidth="2"
          opacity=".8"
        />
      )}
      <path
        d="M-12 0L15 0"
        fill="none"
        stroke="#6e6a4b"
        strokeWidth=".6"
        opacity=".34"
      />
      <circle cx="21" cy="-1.5" r="1.15" fill="#243b33" />
    </g>
  );
}

export default function GardenScene({
  compact = false,
  interactive = false,
  planted = 0,
  season = "autumn",
  night = false,
}) {
  const uid = useId().replace(/:/g, "");
  const frame = useRef(null);
  const resetFeed = useRef(null);
  const [feeding, setFeeding] = useState(null);
  const [paused, setPaused] = useState(false);
  const flowers = Math.min(FLOWERS.length, Math.max(0, Number(planted) || 0));
  const autumn = season === "autumn";
  const winter = season === "winter";
  const canopy = winter ? "#788977" : autumn ? "#738562" : "#6d896b";

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) =>
            setPaused(!entry.isIntersecting || document.hidden),
          );
    if (frame.current) observer?.observe(frame.current);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(resetFeed.current);
    };
  }, []);

  const feed = (point = { x: 466, y: 423 }) => {
    setFeeding(point);
    clearTimeout(resetFeed.current);
    resetFeed.current = setTimeout(() => setFeeding(null), 7600);
  };
  const touchPond = (event) => {
    if (!interactive) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: ((event.clientX - bounds.left) * 640) / bounds.width,
      y: ((event.clientY - bounds.top) * 560) / bounds.height,
    };
    if (point.x > 327 && point.x < 583 && point.y > 371 && point.y < 491)
      feed(point);
  };

  return (
    <div
      ref={frame}
      className={`garden-scene${compact ? " garden-scene--compact" : ""}${night ? " garden-scene--night" : ""}${interactive ? " garden-scene--interactive" : ""}${feeding ? " garden-scene--feeding" : ""}`}
      data-paused={paused ? "true" : undefined}
    >
      <svg
        viewBox="0 0 640 560"
        role="img"
        aria-label={
          interactive
            ? "A walled garden with an olive tree, climbing plants and three koi. Tap the pond or use Feed the koi."
            : "An illustrated walled garden: olive tree, stone terraces and a quiet pond."
        }
        onPointerDown={touchPond}
      >
        <defs>
          <pattern
            id={`${uid}-hatch`}
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(30)"
          >
            <path
              d="M0 0V7"
              stroke="currentColor"
              strokeWidth=".6"
              opacity=".11"
            />
          </pattern>
          <pattern
            id={`${uid}-stone`}
            width="90"
            height="43"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 1H90M0 42H90M29 0L26 20L0 22M26 20L68 22L70 0M68 22L65 43"
              fill="none"
              stroke="#9b9f88"
              strokeWidth="1.2"
            />
            <path
              d="M4 7L20 5M35 28L52 27M77 29L85 27"
              stroke="#f1eedc"
              strokeWidth="1.4"
              opacity=".7"
            />
          </pattern>
          <pattern
            id={`${uid}-paper`}
            width="31"
            height="23"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="4" cy="8" r=".65" fill="#67745c" opacity=".16" />
            <circle cx="22" cy="19" r=".5" fill="#67745c" opacity=".16" />
            <path
              d="M17 5L21 4M7 20L9 19"
              stroke="#faf7ea"
              strokeWidth=".6"
              opacity=".45"
            />
          </pattern>
          <g id={`${uid}-sprig`}>
            <path
              d="M0 35Q1 4 11-27M1 17L-15-4M5 2L27-11M9-15L-7-34"
              fill="none"
              stroke="#67735a"
              strokeWidth="1.5"
            />
            <path
              d="M-15-4Q-37-17-24-28Q-8-23-15-4M-8 7Q-27-3-28 12Q-18 22-8 7M27-11Q42-31 47-13Q40 2 27-11M15 10Q36-3 37 13Q28 24 15 10M-7-34Q-26-48-11-55Q3-44-7-34M11-27Q10-51 25-48Q31-33 11-27M2 26Q-21 20-15 37Q-2 43 2 26M14 24Q32 13 36 29Q27 41 14 24"
              fill="currentColor"
            />
            <path
              d="M-24-24L-15-5M42-18L28-11M-13-50L-7-34M23-45L12-28"
              stroke="#e9e7c9"
              strokeWidth=".7"
              opacity=".5"
            />
          </g>
          <clipPath id={`${uid}-pond`}>
            <path d="M322 407C333 366 386 350 432 363C468 373 472 398 515 394C568 388 600 415 584 451C569 487 495 509 430 491C370 476 307 454 322 407Z" />
          </clipPath>
        </defs>

        <path
          d="M38 311C15 228 52 116 151 71C258 22 407 76 491 121C571 165 624 269 621 384C630 487 521 549 357 548C190 561 49 505 38 311Z"
          fill={night ? "#2c423b" : "#e7e7d4"}
        />
        <path
          d="M40 307C81 279 141 273 213 281L418 339L601 431L571 522Q409 568 228 527L49 468Z"
          fill={night ? "#485347" : "#c6cbb0"}
        />
        <path
          d="M232 205Q402 153 603 221L604 390Q432 329 228 363Z"
          fill={night ? "#6b7465" : "#d6d7c0"}
        />
        <path
          d="M232 205Q402 153 603 221L604 390Q432 329 228 363Z"
          fill={`url(#${uid}-stone)`}
          opacity=".75"
        />
        <path
          d="M230 204Q401 151 605 220L607 231Q398 166 230 217Z"
          fill={night ? "#8c9581" : "#e4e3cc"}
        />
        <path
          d="M493 295V244Q492 208 523 214Q554 220 555 255V314Z"
          fill={night ? "#253f38" : "#9bb3a5"}
        />
        <path
          d="M491 296V244Q490 207 523 213Q557 220 557 256V315"
          fill="none"
          stroke={night ? "#959c86" : "#ece7d0"}
          strokeWidth="9"
        />
        <path
          d="M521 220V305M495 260L552 273"
          fill="none"
          stroke="#6a7b67"
          strokeWidth="1.3"
          opacity=".65"
        />
        <path
          d="M232 349Q411 309 604 381L608 405Q409 336 230 373Z"
          fill={night ? "#86907a" : "#dce0c4"}
        />
        <path
          d="M264 363C316 348 353 359 376 380C408 414 399 458 454 493L399 529C335 483 354 426 321 408C300 394 275 399 246 411Z"
          fill={night ? "#777b62" : "#e8dec0"}
        />
        <path
          d="M279 372L313 379M318 396L339 400M345 430L365 426M360 460L378 450M375 484L394 474"
          stroke={night ? "#494e40" : "#bbb696"}
          strokeWidth="1"
          opacity=".75"
        />
        <path
          d="M49 383Q137 355 259 391L255 428Q139 401 47 419Z"
          fill={night ? "#68745e" : "#b2bf95"}
        />
        <path
          d="M47 419Q144 399 255 428L254 447Q144 422 49 438Z"
          fill={night ? "#7e806c" : "#d2d0b3"}
        />
        <path
          d="M54 424L53 436M84 418L84 431M123 416L121 430M163 417L163 432M206 422L207 437M239 429L238 443"
          stroke="#9b9e82"
          strokeWidth="1.1"
        />

        <g className="garden-scene__tree">
          <path
            d="M179 397Q203 348 192 304Q191 282 171 254Q160 236 165 217M196 310Q211 273 218 239Q228 218 250 204M199 283Q189 237 203 194Q211 157 202 131M197 273Q166 264 146 242Q120 225 102 202M209 235Q247 228 273 204M204 211Q170 205 150 178M206 192Q230 169 242 143M201 170Q168 150 161 127"
            fill="none"
            stroke={night ? "#9c9477" : "#a59371"}
            strokeWidth="11"
            strokeLinecap="round"
          />
          <path
            d="M184 397Q209 347 199 305Q196 271 183 250M202 286Q212 262 217 239M202 206Q197 177 204 152"
            fill="none"
            stroke={night ? "#c0b38e" : "#cfbd94"}
            strokeWidth="3.3"
            strokeLinecap="round"
          />
          <path
            d="M148 240Q117 244 89 223M161 216Q125 192 125 163M217 236Q250 251 275 235M210 190Q240 201 264 187M201 157Q177 123 182 98M204 173Q245 143 254 115"
            fill="none"
            stroke={night ? "#a49b7c" : "#a59371"}
            strokeWidth="3.3"
            strokeLinecap="round"
          />
          <g className="garden-scene__canopy" style={{ color: canopy }}>
            {SPRIGS.map(([x, y, turn, scale], index) => (
              <OliveSprig
                key={index}
                x={x}
                y={y}
                turn={turn}
                scale={scale}
                id={`${uid}-sprig`}
              />
            ))}
            <g style={{ color: night ? "#a2ac86" : "#a2af87" }} opacity=".9">
              <OliveSprig
                x={111}
                y={112}
                turn={-18}
                scale={0.65}
                id={`${uid}-sprig`}
              />
              <OliveSprig
                x={197}
                y={90}
                turn={38}
                scale={0.67}
                id={`${uid}-sprig`}
              />
              <OliveSprig
                x={263}
                y={169}
                turn={115}
                scale={0.65}
                id={`${uid}-sprig`}
              />
              <OliveSprig
                x={151}
                y={185}
                turn={194}
                scale={0.66}
                id={`${uid}-sprig`}
              />
            </g>
            <g fill={night ? "#4e624c" : "#475f49"}>
              <ellipse cx="94" cy="160" rx="3" ry="4" />
              <ellipse cx="164" cy="89" rx="3" ry="4" />
              <ellipse cx="243" cy="180" rx="3" ry="4" />
              <ellipse cx="219" cy="204" rx="3" ry="4" />
            </g>
          </g>
        </g>

        <g
          fill="none"
          stroke={night ? "#8d9a70" : "#72865f"}
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M576 360Q582 319 570 278Q566 251 580 230Q593 207 578 180M573 290Q553 284 541 272M575 315Q598 303 605 286M576 258Q592 256 602 240" />
        </g>
        <g fill={night ? "#78906d" : "#799465"}>
          <path d="M580 234Q565 213 558 225Q563 240 580 234M577 215Q590 190 599 201Q595 218 577 215M577 254Q562 239 552 250Q559 266 577 254M576 279Q587 262 599 274Q593 289 576 279M573 303Q549 286 546 303Q555 315 573 303M582 332Q600 308 610 324Q603 339 582 332M570 272Q548 262 543 272Q555 286 570 272M591 255Q604 238 616 248Q610 263 591 255" />
          <path
            d="M578 181Q558 170 558 184Q567 197 578 181M573 345Q552 326 545 339Q551 354 573 345"
            fill={autumn ? "#b38750" : "#a2ac73"}
          />
        </g>
        <path
          d="M552 355L594 359L586 396Q571 402 558 392Z"
          fill={night ? "#9d6750" : "#bc7855"}
        />
        <path
          d="M549 353Q571 346 596 357L594 363Q569 354 550 360Z"
          fill={night ? "#bd8b69" : "#d6a17b"}
        />
        <path
          d="M562 367L566 389M578 368L576 393"
          stroke="#8c5d43"
          strokeWidth="1"
          opacity=".45"
        />

        <path
          d="M316 405C329 359 386 341 435 356C473 367 477 392 515 387C574 381 610 413 591 455C573 497 495 518 428 499C364 482 300 455 316 405Z"
          fill={night ? "#a2a589" : "#e2ddbe"}
        />
        <path
          d="M322 407C333 366 386 350 432 363C468 373 472 398 515 394C568 388 600 415 584 451C569 487 495 509 430 491C370 476 307 454 322 407Z"
          fill={night ? "#325e59" : "#719e96"}
        />
        <g clipPath={`url(#${uid}-pond)`}>
          <path
            d="M311 418Q404 373 494 425Q550 447 607 418V515H310Z"
            fill={night ? "#386b64" : "#91b3a4"}
            opacity=".6"
          />
          <path
            d="M346 395Q381 373 413 383M491 469Q538 480 559 452M364 439Q390 450 409 446"
            fill="none"
            stroke={night ? "#71988a" : "#d4e1c6"}
            strokeWidth="1.2"
            opacity=".65"
          />
          {[0, 1, 2].map((kind) => (
            <g
              key={kind}
              className={`garden-scene__fish garden-scene__fish--${kind}`}
              style={
                feeding
                  ? {
                      transform: `translate(${feeding.x + (kind - 1) * 24}px, ${feeding.y + (kind % 2 ? 14 : -7)}px) rotate(${kind * 53 - 32}deg) scale(${kind === 2 ? 0.76 : 1})`,
                    }
                  : undefined
              }
            >
              <Koi kind={kind} />
            </g>
          ))}
          <g fill={night ? "#6b8c65" : "#4c7d61"}>
            <path d="M539 403C519 402 520 384 535 382C551 380 560 394 549 401L541 393Z" />
            <path d="M350 433C336 434 331 420 342 414C355 409 366 418 358 429L350 422Z" />
          </g>
          {feeding && (
            <g
              className="garden-scene__feed"
              key={`${feeding.x}-${feeding.y}`}
              transform={`translate(${feeding.x} ${feeding.y})`}
            >
              <circle
                className="garden-scene__ripple"
                r="7"
                fill="none"
                stroke="#e4dfb7"
                strokeWidth="1.2"
              />
              <g fill="#e7c58a">
                <circle cx="-5" cy="-3" r="1.8" />
                <circle cx="4" cy="2" r="1.6" />
                <circle cx="0" cy="-6" r="1.8" />
                <circle cx="-1" cy="5" r="1.5" />
              </g>
            </g>
          )}
        </g>
        <path
          d="M320 407C331 365 385 349 431 362"
          fill="none"
          stroke={night ? "#bac0a1" : "#f0e9ca"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g
          stroke={night ? "#83916a" : "#73845d"}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M302 409Q284 391 290 374M302 409Q301 382 310 368M309 415Q318 391 327 387M293 403Q277 397 270 384" />
          <path d="M577 485Q580 466 592 459M577 485Q590 480 598 486M575 485Q563 475 562 466" />
        </g>

        <path
          d="M33 463Q117 421 234 455L274 519Q142 552 41 516Z"
          fill={night ? "#7c6b50" : "#c5af83"}
        />
        <path
          d="M33 463Q117 421 234 455L274 519Q142 552 41 516Z"
          fill={`url(#${uid}-paper)`}
        />
        <path
          d="M43 500Q149 460 251 500M48 512Q151 473 259 512"
          stroke={night ? "#998568" : "#d9c699"}
          strokeWidth="2"
          fill="none"
          opacity=".65"
        />
        {FLOWERS.slice(0, flowers).map(([x, y, turn], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${turn})`}>
            <path
              d="M0 7V-13M0-1Q-12-11-10-2Q-6 3 0 4M0-5Q11-17 12-7Q6-3 0-1"
              fill={night ? "#71886a" : "#637c53"}
              stroke={night ? "#71886a" : "#637c53"}
              strokeWidth="1.5"
            />
            <path
              d="M0-13C-15-10-12-25-4-22C-5-34 9-31 8-22C20-22 16-9 7-11C7 0-6-2-3-12Z"
              fill={
                i % 3 === 0 ? "#c88a61" : i % 3 === 1 ? "#ece2bd" : "#ad674e"
              }
            />
            <circle cy="-16" r="3" fill="#d9b65f" />
          </g>
        ))}
        <g fill={night ? "#828d6b" : "#90a17b"}>
          <path d="M81 390Q54 367 67 356Q84 361 81 390M87 390Q83 356 96 350Q111 365 87 390M96 392Q115 366 123 377Q126 391 96 392" />
          <path d="M217 405Q199 380 210 376Q226 385 217 405M222 406Q232 374 243 382Q244 399 222 406" />
        </g>
        <path
          d="M29 319L45 320M36 312L35 328M598 152L610 154M605 147L603 160"
          stroke={night ? "#697861" : "#b6bc9d"}
          strokeWidth="1"
        />
        <path
          d="M70 518Q90 529 118 527M461 526Q492 531 519 519"
          stroke={night ? "#62765f" : "#aeb796"}
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M45 311L33 399M605 236L612 383M56 493L63 523"
          stroke={`url(#${uid}-hatch)`}
          strokeWidth="12"
        />
      </svg>
      {interactive && (
        <div className="garden-scene__feeding-tools">
          <span className="garden-scene__feed-status" aria-live="polite">
            {feeding
              ? "A few crumbs. A quiet moment."
              : "A little time by the water."}
          </span>
          <button
            type="button"
            className="garden-scene__feed-button"
            onClick={() => feed()}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M3 16Q12 21 21 16M6 12Q12 15 18 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="8" cy="6" r="1.2" fill="currentColor" />
              <circle cx="15" cy="8" r="1.2" fill="currentColor" />
              <circle cx="13" cy="3" r="1" fill="currentColor" />
            </svg>
            Feed the koi
          </button>
        </div>
      )}
    </div>
  );
}
