import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ImageTextBlock } from "@/application/use-cases/get-saas-landing-data";
import { cn } from "@/lib/cn";

interface ImageTextSectionProps {
  block: ImageTextBlock;
}

export function ImageTextSection({ block }: ImageTextSectionProps) {
  const imageFirst = block.imagePosition === "left";
  const imageObjectPositionClass =
    block.imageObjectPosition === "top"
      ? "object-top"
      : block.imageObjectPosition === "bottom"
        ? "object-bottom"
        : "object-center";

  return (
    <section className="animate-fade-up">
      <div
        className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${
          imageFirst ? "" : "lg:[&>*:first-child]:order-2"
        }`}
      >
        {/* Image */}
        <div className="relative mx-auto w-full max-w-[22rem] overflow-hidden rounded-[1.5rem] border-2 border-foreground shadow-xl sm:mx-0 sm:max-w-full">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={block.imageUrl}
              alt={block.imageAlt}
              fill
              className={cn("object-cover", imageObjectPositionClass)}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Text */}
        <div className="min-w-0 space-y-5">
          <Badge variant="outline" className="bg-white/70 text-foreground/70">
            {block.tag}
          </Badge>

          <h2 className="font-display text-4xl uppercase leading-[1.06] tracking-tight text-secondary sm:text-5xl">
            {block.title}
          </h2>

          <p className="max-w-lg text-base leading-relaxed text-foreground/75 sm:text-lg">
            {block.body}
          </p>

          {block.bullets ? (
            <ul className="space-y-2.5 pt-1">
              {block.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {block.cta ? (
            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="h-12 w-full max-w-full px-5 text-sm sm:w-auto sm:px-7 sm:text-base"
              >
                <Link href={block.cta.href}>
                  {block.cta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
