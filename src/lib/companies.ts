import cnh from "@/assets/cnh-logo.asset.json";
import construction from "@/assets/construction.asset.json";
import cfs from "@/assets/cfs.asset.json";
import store from "@/assets/store.asset.json";
import tech from "@/assets/tech.asset.json";
import cuisine from "@/assets/cuisine.asset.json";

export const CNH_LOGO = cnh.url;

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
    logo: construction.url,
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
    logo: cfs.url,
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
    logo: store.url,
    documents: ["Sales Invoice", "Refund / Return Form"],
  },
  {
    id: "tech",
    name: "Cossa Tech",
    tagline: "Technology Solutions",
    logo: tech.url,
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
    tagline: "We bring your imagination to reality",
    logo: cuisine.url,
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
    logo: "",
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
