export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background py-24">
      <div className="container mx-auto max-w-3xl px-6">
        <h1 className="text-4xl font-bold tracking-tight text-center">Contact</h1>
        <p className="mt-4 text-center text-muted-foreground max-w-xl mx-auto">Questions, ideas, or feedback? We'd love to hear from you. Drop us a line and we'll respond quickly.</p>
        <form className="mx-auto mt-12 max-w-xl space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input id="name" className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" type="email" className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="msg" className="text-sm font-medium">Message</label>
            <textarea id="msg" rows={5} className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm" placeholder="How can we help?" />
          </div>
          <button type="submit" className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Send Message</button>
        </form>
      </div>
    </div>
  )
}
