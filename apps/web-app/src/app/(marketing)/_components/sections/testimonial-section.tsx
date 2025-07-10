import { SectionHeader } from '~/app/(marketing)/_components/section-header';
import { SocialProofTestimonials } from '~/app/(marketing)/_components/testimonial-scroll';
import { siteConfig } from '~/app/(marketing)/_lib/config';

export function TestimonialSection() {
  const { testimonials } = siteConfig;

  return (
    <section
      className="flex flex-col items-center justify-center w-full"
      id="testimonials"
    >
      <SectionHeader>
        <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-center text-balance">
          Trusted by AI Teams Worldwide
        </h2>
        <p className="text-muted-foreground text-center text-balance font-medium">
          See how engineering teams are simplifying their LLM observability
          stack and saving time with Untrace.
        </p>
      </SectionHeader>
      <SocialProofTestimonials testimonials={testimonials} />
    </section>
  );
}
