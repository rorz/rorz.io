import { StarHalfIcon, StarIcon } from "@phosphor-icons/react/dist/ssr";
import type { FC } from "react";
import { cn } from "@/lib/cn/index.ts";

const DEFAULT_OUT_OF = 5;

type StarRatingProps = {
  value: number;
  outOf?: number;
  className?: string;
};

export const StarRating: FC<StarRatingProps> = ({ value, outOf, className }) => {
  const [whole, remainder] = value.toFixed(1).split(".");

  const total = outOf ?? DEFAULT_OUT_OF;
  const wholeStars = Number(whole);
  const hasHalfStar = Number(remainder) !== 0;
  const emptyStars = Number(Math.max(total - (wholeStars + +hasHalfStar), 0));

  return (
    <div className={cn("flex items-center gap-0.5 text-base", className)}>
      {[
        ...new Array(wholeStars),
      ].map((v) => (
        <StarIcon key={`whole-star--${v}`} weight="fill" />
      ))}
      {hasHalfStar ? <StarHalfIcon key="half-star" weight="fill" /> : null}
      {[
        ...new Array(emptyStars),
      ].map((v) => (
        <StarIcon key={`empty-star--${v}`} weight="bold" />
      ))}
    </div>
  );
};
