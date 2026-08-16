import { Mail, MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ContactForm } from "@/components/site/contact-form";

export const metadata = { title: "Contact" };

const FAQS = [
  {
    q: "How do I enroll in a course?",
    a: "Browse the course catalog, open a course you like, and click \"Enroll now\" on any open section. You'll be asked to log in or create a free student account first.",
  },
  {
    q: "How does the AI engine work?",
    a: "It looks at your attendance, assignment scores, and exam grades, then asks Claude to identify weak subjects and generate personalized study recommendations — visible on your My Progress page.",
  },
  {
    q: "I'm a teacher — how do I get a course assigned to me?",
    a: "Register with the Teacher role, then ask an admin to assign you to a course and class from the Admin console.",
  },
  {
    q: "Can I download my performance report?",
    a: "Yes — your My Progress page has a \"Download report\" button that exports a PDF summary of your grades, attendance, and AI recommendations.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Get in touch</h1>
        <p className="text-muted-foreground">Questions about enrollment, courses, or your account? We're here to help.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Support info</h3>
              <div className="flex items-start gap-3 text-sm">
                <Mail className="mt-0.5 size-4 text-primary" />
                <span>support@eduportal.app</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Phone className="mt-0.5 size-4 text-primary" />
                <span>Mon–Fri, 9am–5pm</span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 size-4 text-primary" />
                <span>Online-first — support available worldwide</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-4 text-xl font-semibold">Frequently asked questions</h2>
        <Accordion type="single" collapsible>
          {FAQS.map((faq, i) => (
            <AccordionItem key={faq.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
