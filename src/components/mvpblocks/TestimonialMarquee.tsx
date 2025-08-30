"use client";

import { Marquee } from "./internal/Marquee";

const quotes = [
	{ q: "Best dilution modeling UX I've used.", a: "Seed Founder" },
	{ q: "Replaced 4 brittle spreadsheets.", a: "Startup COO" },
	{ q: "Explains SAFE math to new angels perfectly.", a: "Angel Investor" },
	{ q: "Instant what-if rounds = huge time saver.", a: "Founder / CEO" },
	{ q: "Audit drawer builds trust with the board.", a: "CFO" },
];

export function TestimonialMarquee() {
	return (
		<section className="py-14 md:py-20 border-y bg-muted/30 dark:bg-muted/10">
			<div className="container mx-auto max-w-6xl px-4">
				<Marquee pauseOnHover className="[--duration:55s]">
					{quotes.map((t) => (
						<div key={t.q} className="mx-4 w-80 shrink-0">
							<div className="h-full rounded-xl border border-border/50 bg-muted/40 dark:bg-background/50 p-5 backdrop-blur-sm shadow-sm">
								<h3 className="text-sm font-semibold tracking-tight mb-1 text-primary">{t.a}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">“{t.q}”</p>
							</div>
						</div>
					))}
				</Marquee>
			</div>
		</section>
	);
}
