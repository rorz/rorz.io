import { useId } from "react";

const InkOutline = ({
  className,
  field = false,
}: {
  readonly className: string;
  readonly field?: boolean;
}) => {
  const filterId = useId();
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 -z-10 size-full overflow-visible ${className}`}
    >
      <defs>
        <filter height="140%" id={filterId} width="120%" x="-10%" y="-20%">
          <feTurbulence
            baseFrequency="0.035 0.08"
            numOctaves="2"
            result="ink"
            seed="8"
            type="fractalNoise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="ink"
            scale="2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <rect
        filter={`url(#${filterId})`}
        height="calc(100% - 3px)"
        rx={field ? "30.5" : "20.5"}
        strokeWidth="1.25"
        width="calc(100% - 3px)"
        x="1.5"
        y="1.5"
      />
    </svg>
  );
};

export { InkOutline };
