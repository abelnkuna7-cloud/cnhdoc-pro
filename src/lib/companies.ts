// Company branding configuration
// Production-ready version using local assets from /public/logos

export const CNH_LOGO = "/logos/cossa-nexus-holdings-logo.png";

export type Company = {
  id: string;
  name: string;
  tagline: string;
  logo: string;
  documents: string[];
};

export const COMPANIES: Company[] = [
  {
    id: "construction",
    name: "Cossa Construction & DIY",
    tagline: "Your Home, Our Expertise",
    logo: "/logos/cossa-construction-logo.png",
    documents: [
      "Construction Quotation",
      "Building Contract",
      "Site Safety Plan",
      "Risk Assessment",
      "Method Statement",
      "Materials List",
      "Sub-contractor Agreement",
      "Variation Order",
      "Progress Report",
      "Snag List",
      "Practical Completion Certificate",
      "Final Account Statement",
      "Warranty Document",
      "Maintenance Schedule",
    ],
  },
  {
    id: "facility",
    name: "Cossa Facility Services",
    tagline: "Cleaning & Facility Management",
    logo: "/logos/cossa-facility-logo.png",
    documents: [
      "Cleaning Service Agreement",
      "Site Inspection Report",
      "Cleaning Schedule",
      "SLA Document",
      "Incident Report",
    ],
  },
  {
    id: "store",
    name: "Cossa Store",
    tagline: "Lifestyle & Fashion",
    logo: "/logos/cossa-store-logo.png",
    documents: [
      "Sales Invoice",
      "Refund / Return Form",
    ],
  },
  {
    id: "tech",
    name: "Cossa Tech",
    tagline: "Technology Solutions",
    logo: "/logos/cossa-tech-logo.png",
    documents: [
      "Software Development Quote",
      "SaaS Subscription Agreement",
      "IT Service Contract",
      "Maintenance Agreement",
      "NDA",
      "Project Scope Document",
      "Acceptance Testing Report",
      "Hosting Agreement",
    ],
  },
  {
    id: "cuisine",
    name: "Cossa Cuisine",
    tagline: "Professional Catering & Hospitality",
    logo: "/logos/cossa-cuisine-logo.png",
    documents: [
      "Catering Quotation",
      "Event Booking Confirmation",
      "Menu Proposal",
      "Catering Service Agreement",
      "Dietary Requirements Form",
      "Event Brief",
      "Post-Event Report",
    ],
  },
  {
    id: "legal",
    name: "SA Legal & Labour",
    tagline: "South African Legal & Labour Documents",
    logo: "/logos/sa-legal-logo.svg",
    documents: [
      "Employment Contract (SA)",
      "Independent Contractor Agreement",
      "Letter of Appointment",
      "Disciplinary Hearing Notice",
      "Warning Letter",
      "Retrenchment Letter",
      "Leave Application",
      "POPIA Privacy Notice",
      "BBBEE Affidavit",
      "Confidentiality Agreement",
      "Termination Letter",
      "UIF Declaration",
    ],
  },
];
