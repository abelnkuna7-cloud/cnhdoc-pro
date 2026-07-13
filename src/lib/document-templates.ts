// Document template library for the NexDocs AI landing page gallery.
// This is a static seed; the Admin Panel can move these to Cloud later
// without changing consumers (shape stays the same).

export type DocumentCategory =
  | "HR"
  | "Legal"
  | "Finance"
  | "Compliance"
  | "Construction"
  | "Cleaning"
  | "Logistics"
  | "Retail"
  | "Hospitality"
  | "Technology";

export type DocumentTemplate = {
  id: string;
  title: string;
  category: DocumentCategory;
  icon: string;
  description: string;
  generationTime: string; // e.g. "Ready in 30 seconds"
  aiSupported: boolean;
  popular?: boolean;
  aiPrompt: string; // seed prompt when opening in AI Assistant
  pages: string[]; // each string = one page of markdown-ish plain text
};

const SIG_BLOCK = `

──────────────────────────────
Signed at ______________________ on this ____ day of ____________ 20____

For and on behalf of the Company:      For and on behalf of the Client:

_______________________________        _______________________________
Name:                                  Name:
Designation:                           Designation:
`;

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "employment-contract",
    title: "Employment Contract",
    category: "HR",
    icon: "📄",
    description: "BCEA-compliant permanent employment contract with probation, leave and termination.",
    generationTime: "Ready in 30 seconds",
    aiSupported: true,
    popular: true,
    aiPrompt: "Draft a BCEA-compliant South African permanent employment contract. Ask me for employer, employee, position, salary, start date and probation period.",
    pages: [
      `EMPLOYMENT CONTRACT
Document No: EMP-2026-00184
Date: 12 July 2026

BETWEEN
Acme Trading (Pty) Ltd (Reg No: 2018/123456/07)
("the Employer")

AND
Ms Nomvula S. Dlamini (ID: 9203145098083)
("the Employee")

1. APPOINTMENT
1.1  The Employer appoints the Employee to the position of Operations Coordinator with effect from 1 August 2026.
1.2  The Employee accepts the appointment on the terms of this contract, the BCEA (Act 75 of 1997), the LRA and the Employer's HR policies.

2. PROBATION
2.1  The first three (3) months constitute a probation period during which either party may terminate on one week's written notice.
2.2  Performance will be assessed in month 2 and confirmed in writing at the end of month 3.

3. HOURS OF WORK
3.1  Ordinary hours: 45 per week, Monday to Friday, 08:00 – 17:00 with a one-hour unpaid lunch.
3.2  Overtime by prior written arrangement, remunerated per BCEA section 10.`,
      `4. REMUNERATION
4.1  Gross monthly salary of R 22 500,00 (twenty-two thousand five hundred rand), payable on the 25th of each month by EFT.
4.2  Statutory deductions: PAYE, UIF (1%) and any court-ordered deductions.
4.3  Annual performance review each March; increases at the Employer's discretion.

5. LEAVE
5.1  Annual leave: 15 working days per completed 12-month cycle (BCEA s20).
5.2  Sick leave: 30 working days per 36-month cycle (BCEA s22).
5.3  Family responsibility leave: 3 days per year (BCEA s27).
5.4  Maternity leave: 4 consecutive months (BCEA s25).

6. CONFIDENTIALITY & POPIA
6.1  The Employee will keep all client, financial and personal information confidential during and after employment.
6.2  Personal information is processed lawfully in accordance with the Protection of Personal Information Act, 2013.

7. TERMINATION
7.1  After probation, either party may terminate on one calendar month's written notice.
7.2  Summary dismissal remains available for serious misconduct after a fair hearing (LRA Schedule 8).
${SIG_BLOCK}
NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "quotation",
    title: "Quotation",
    category: "Finance",
    icon: "📑",
    description: "VAT-ready professional quotation with line items, terms and expiry.",
    generationTime: "Ready in 20 seconds",
    aiSupported: true,
    popular: true,
    aiPrompt: "Create a professional South African quotation with 15% VAT. Ask me for client, line items, unit prices, quantities and validity.",
    pages: [
      `QUOTATION
Quote No: Q-2026-00421
Date: 12 July 2026
Valid until: 26 July 2026

FROM
Acme Trading (Pty) Ltd
VAT No: 4123456789
12 Rivonia Road, Sandton, 2196
hello@acme.co.za · +27 11 555 0100

TO
Blue Ridge Logistics (Pty) Ltd
Attn: Mr T. van der Merwe
5 Marine Drive, Durban, 4001

LINE ITEMS
────────────────────────────────────────────────
No   Description                    Qty   Unit (R)     Total (R)
1    Fleet branding – decal sets     8    1 250,00      10 000,00
2    Vehicle wrap, full body         2    9 500,00      19 000,00
3    On-site installation (day)      3    2 400,00       7 200,00
4    Project management fee          1    3 500,00       3 500,00
────────────────────────────────────────────────
Subtotal                                            R 39 700,00
VAT @ 15%                                           R  5 955,00
TOTAL                                               R 45 655,00

TERMS
• 50% deposit on acceptance, balance on completion.
• Banking: FNB, Acme Trading, 622 123 45678, branch 250655.
• Quote valid 14 days. E&OE.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "invoice",
    title: "Tax Invoice",
    category: "Finance",
    icon: "🧾",
    description: "SARS-compliant tax invoice with ZAR, 15% VAT and banking details.",
    generationTime: "Ready in 20 seconds",
    aiSupported: true,
    popular: true,
    aiPrompt: "Create a SARS-compliant South African tax invoice with 15% VAT. Ask me for client, line items and payment terms.",
    pages: [
      `TAX INVOICE
Invoice No: INV-2026-01088
Date: 12 July 2026
Due date: 11 August 2026 (30 days)

FROM
Acme Trading (Pty) Ltd
VAT No: 4123456789 · Reg No: 2018/123456/07
12 Rivonia Road, Sandton, 2196

TO
Blue Ridge Logistics (Pty) Ltd
VAT No: 4987654321
5 Marine Drive, Durban, 4001

────────────────────────────────────────────────
Description                                Amount (R)
Fleet branding – decal sets (8)             10 000,00
Vehicle wrap, full body (2)                 19 000,00
On-site installation (3 days)                7 200,00
Project management fee                       3 500,00
────────────────────────────────────────────────
Subtotal                                    39 700,00
VAT @ 15%                                    5 955,00
TOTAL DUE                                 R 45 655,00

BANKING
FNB · Acme Trading · 622 123 45678 · Branch 250655
Reference: INV-2026-01088

Thank you for your business.
NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "sla",
    title: "Service Level Agreement",
    category: "Legal",
    icon: "🤝",
    description: "SLA covering services, response times, penalties and POPIA.",
    generationTime: "Ready in 45 seconds",
    aiSupported: true,
    aiPrompt: "Draft a South African Service Level Agreement. Ask me for the service provider, client, services, response times and duration.",
    pages: [
      `SERVICE LEVEL AGREEMENT
Document No: SLA-2026-00057
Effective date: 1 August 2026

PARTIES
Service Provider: Acme Trading (Pty) Ltd
Client: Coastal Retail Group (Pty) Ltd

1. SERVICES
1.1  The Service Provider will provide the following services to the Client:
     a) On-site maintenance of retail signage.
     b) Quarterly refresh of promotional decals.
     c) 24-hour emergency call-out for damaged branding.

2. SERVICE LEVELS
2.1  Response times:
     • Priority 1 (branding down): on-site within 8 business hours.
     • Priority 2 (damaged but visible): on-site within 3 business days.
     • Priority 3 (cosmetic): scheduled within 10 business days.
2.2  Reporting: monthly SLA report by the 5th of each month.
2.3  Penalties: 5% of monthly fee credited for each missed Priority 1 response.`,
      `3. FEES
3.1  Monthly retainer: R 18 500,00 excluding VAT.
3.2  Ad-hoc call-outs invoiced at R 950,00 per hour, excluding VAT.

4. TERM
4.1  Initial term of 24 months, auto-renewing for 12 months unless terminated on 60 days' notice.

5. CONFIDENTIALITY & POPIA
5.1  Both parties will process personal information in accordance with POPIA (Act 4 of 2013).
5.2  Any data breach must be reported to the other party within 48 hours.

6. DISPUTE RESOLUTION
6.1  Disputes referred to mediation, then arbitration under AFSA rules, seated in Johannesburg.

7. GOVERNING LAW
7.1  This agreement is governed by the laws of the Republic of South Africa.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "risk-assessment",
    title: "Risk Assessment",
    category: "Construction",
    icon: "⚠️",
    description: "OHSA-compliant Hazard Identification & Risk Assessment (HIRA).",
    generationTime: "Ready in 40 seconds",
    aiSupported: true,
    popular: true,
    aiPrompt: "Draft an OHSA-compliant South African Hazard Identification and Risk Assessment (HIRA). Ask me for the site, activity and equipment involved.",
    pages: [
      `HAZARD IDENTIFICATION & RISK ASSESSMENT (HIRA)
Document No: HIRA-2026-00212
Date: 12 July 2026 · Revision: 1.0
Site: Umhlanga Ridge Office Tower · Client: Coastal Retail Group

Compiled by: J. Mokoena (SAMTRAC) · Approved by: SHEQ Manager

1. SCOPE
Installation of exterior signage at height on a live retail site.

2. LEGAL FRAMEWORK
OHS Act 85 of 1993 · Construction Regs 2014 · SANS 10085 (scaffolding).

3. RISK MATRIX
Likelihood (1–5) × Severity (1–5) = Rating
Low 1–6 · Medium 7–14 · High 15–25`,
      `4. HAZARDS
────────────────────────────────────────────────
# Hazard              Risk   Controls                     Residual
1 Falls from height    20    Full-body harness, edge         6
                             protection, permit to work.
2 Falling objects      15    Barricading, no-go zone,        5
                             tool tethers.
3 Electrical shock     12    Isolate circuit, LOTO,          4
                             qualified electrician.
4 Public interaction   10    Signage, marshals, PPE.         3
5 Manual handling       8    Two-person lift, trolley.       3
────────────────────────────────────────────────

5. PPE
Hard hat · High-visibility vest · Safety boots · Full-body harness · Gloves.

6. EMERGENCY
On-site first-aider: T. Naidoo (07:00–17:00).
Emergency numbers: 10111 (SAPS) · 10177 (EMS).
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "method-statement",
    title: "Method Statement",
    category: "Construction",
    icon: "🏗",
    description: "Safe Work Method Statement (SWMS) with step-by-step procedure.",
    generationTime: "Ready in 40 seconds",
    aiSupported: true,
    aiPrompt: "Draft a South African Safe Work Method Statement (SWMS). Ask me for the activity, site, equipment and personnel.",
    pages: [
      `SAFE WORK METHOD STATEMENT
Document No: SWMS-2026-00097
Activity: Exterior signage installation at height
Site: Umhlanga Ridge Office Tower
Date: 12 July 2026

1. PROJECT DETAILS
Client: Coastal Retail Group (Pty) Ltd
Contractor: Acme Trading (Pty) Ltd
Site supervisor: J. Mokoena · Cell: +27 82 555 0199

2. SEQUENCE OF WORK
Step 1  Site walk-down and toolbox talk (15 min).
Step 2  Barricade drop zone; install signage & marshals.
Step 3  Erect mobile scaffold per SANS 10085; inspect and tag.
Step 4  Hoist sign panels; secure with tethered lifting straps.
Step 5  Fix panels using rated anchors; torque check.
Step 6  Electrical connection by qualified electrician; test.
Step 7  Housekeeping and scaffold dismantle.
Step 8  Client sign-off and site handover.

3. PLANT & EQUIPMENT
Mobile scaffold · Torque wrench · Cordless drills · Rigging straps · MEWP (if req).

4. PERSONNEL & COMPETENCIES
2× Working-at-Height certified riggers · 1× SAMTRAC supervisor · 1× Qualified electrician.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "disciplinary-notice",
    title: "Disciplinary Notice",
    category: "HR",
    icon: "📝",
    description: "LRA-compliant notice of disciplinary hearing with rights and charges.",
    generationTime: "Ready in 25 seconds",
    aiSupported: true,
    aiPrompt: "Draft an LRA-compliant Notice of Disciplinary Hearing. Ask me for the employee, charges, date, time and venue.",
    pages: [
      `NOTICE OF DISCIPLINARY HEARING
Document No: DH-2026-00034
Date issued: 12 July 2026

TO:  Mr S. Khumalo (Employee No: 00417)
FROM: HR Department, Acme Trading (Pty) Ltd

You are hereby required to attend a disciplinary hearing on the following:

Date:   Friday, 19 July 2026
Time:   10:00
Venue:  Boardroom 2, 12 Rivonia Road, Sandton

CHARGES
1. Gross insubordination – refusal to carry out a lawful and reasonable instruction from your supervisor on 8 July 2026.
2. Absence without leave – failure to report for duty on 9 and 10 July 2026 without notification.

YOUR RIGHTS (LRA Schedule 8)
• To be represented by a fellow employee or shop steward.
• To call witnesses and cross-examine the employer's witnesses.
• To have an interpreter if required.
• To state your case in mitigation before sanction.
• To appeal any finding within 5 working days.

Please confirm receipt by signing below.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "popia-policy",
    title: "POPIA Policy",
    category: "Compliance",
    icon: "🛡",
    description: "Protection of Personal Information Act policy for staff and clients.",
    generationTime: "Ready in 45 seconds",
    aiSupported: true,
    popular: true,
    aiPrompt: "Draft a South African POPIA (Act 4 of 2013) privacy policy for a business. Ask me for the company name and the types of data collected.",
    pages: [
      `PROTECTION OF PERSONAL INFORMATION (POPIA) POLICY
Document No: POL-POPIA-2026-01
Effective date: 1 August 2026 · Owner: Information Officer

1. PURPOSE
Acme Trading (Pty) Ltd ("Acme") is committed to protecting personal information in line with the Protection of Personal Information Act, 2013 (POPIA).

2. INFORMATION OFFICER
The Managing Director is the Information Officer as required by section 55 of POPIA. Deputy Information Officers may be designated in writing.

3. TYPES OF PERSONAL INFORMATION
• Employee data (ID, banking, tax, next-of-kin).
• Client data (contact details, VAT numbers, purchase history).
• Supplier data (BEE certificates, banking, tax clearance).
• Website visitor data (IP, cookies, form submissions).`,
      `4. LAWFUL PROCESSING (Section 11)
Personal information is processed only where:
a) The data subject has consented; or
b) Processing is required by contract, law, or legitimate interest.

5. DATA SUBJECT RIGHTS
Data subjects may:
• Request access to their information (Form 2).
• Request correction or deletion (Form 3).
• Object to direct marketing (Form 4).
• Lodge a complaint with the Information Regulator.

6. SECURITY SAFEGUARDS
• Role-based access control on all systems.
• Encryption in transit (TLS 1.2+) and at rest.
• Annual staff POPIA training and NDAs.
• 48-hour breach notification to the Regulator and affected data subjects.

7. RETENTION
Records are kept only as long as legally required (Tax Admin Act: 5 years; BCEA: 3 years). Records are then securely destroyed.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "meeting-minutes",
    title: "Meeting Minutes",
    category: "Legal",
    icon: "🗒",
    description: "Formal minutes with attendance, decisions and action items.",
    generationTime: "Ready in 20 seconds",
    aiSupported: true,
    aiPrompt: "Draft formal South African meeting minutes. Ask me for the meeting title, date, attendees and key discussion points.",
    pages: [
      `MEETING MINUTES
Document No: MIN-2026-00219
Meeting: Monthly Operations Review
Date: 12 July 2026 · Time: 09:00 – 10:45
Venue: Boardroom 1, 12 Rivonia Road, Sandton
Chair: N. Dlamini · Minutes: R. Pillay

1. ATTENDEES
Present: N. Dlamini, R. Pillay, T. van der Merwe, S. Khumalo, J. Mokoena.
Apologies: L. Botha (leave).

2. AGENDA
2.1  Minutes of previous meeting (14 June 2026) — approved without amendment.
2.2  Operations report — Q2 revenue R 3.42m (11% above target).
2.3  SHEQ update — zero LTIs, one first-aid case.
2.4  Client escalations — Coastal Retail Group SLA breach mitigated.
2.5  New business — Umhlanga Ridge signage roll-out approved.

3. RESOLUTIONS
R-2026-08  That the Umhlanga Ridge project proceed with a budget of R 620 000.
R-2026-09  That a monthly SHEQ dashboard be circulated to the exec by the 5th.

4. ACTION ITEMS
────────────────────────────────────────────────
# Action                       Owner       Due
1 Sign Coastal SLA addendum    T.v.d.M.    19/07/26
2 Publish SHEQ dashboard       J. Mokoena  05/08/26
3 Recruit 2× installers        R. Pillay   31/07/26
────────────────────────────────────────────────

Meeting closed at 10:45. Next meeting: 9 August 2026.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "safety-file",
    title: "Construction Safety File",
    category: "Construction",
    icon: "🦺",
    description: "Full CR2014 safety file index with all mandatory sections.",
    generationTime: "Ready in 60 seconds",
    aiSupported: true,
    aiPrompt: "Draft a South African Construction Regulations 2014 Safety File index (Section 1–20). Ask me for the contractor, client and project details.",
    pages: [
      `CONSTRUCTION SAFETY FILE
Document No: SF-2026-00061
Project: Umhlanga Ridge Office Tower – Signage Package
Principal Contractor: Acme Trading (Pty) Ltd
Client Agent: Coastal Retail Group (Pty) Ltd
Compiled by: J. Mokoena (SAMTRAC) · Date: 12 July 2026

INDEX (Construction Regulations, 2014)
Sect  Description                                Status
01    Notification of Construction Work (7(1))    ✔
02    Letter of Good Standing (COIDA)             ✔
03    Section 37(2) Mandatary Agreement           ✔
04    Health & Safety Plan                        ✔
05    Baseline Risk Assessment                    ✔
06    Task-specific Risk Assessments              ✔
07    Safe Work Method Statements                 ✔
08    Fall Protection Plan                        ✔
09    Emergency Preparedness Plan                 ✔
10    First Aid Register                          ✔`,
      `11    Incident/Accident Register              ✔
12    Toolbox Talk Register                       ✔
13    Induction Register                          ✔
14    PPE Issue Register                          ✔
15    Plant & Equipment Register (with COCs)      ✔
16    Scaffolding Inspection Register             ✔
17    Electrical CoC (installations)              ✔
18    Waste Management Plan                       ✔
19    COVID / Public Health Protocol              ✔
20    Site-specific SHE Policy                    ✔

DECLARATION
I, J. Mokoena, in my capacity as the appointed Construction Health & Safety Officer, declare that this Safety File is complete and complies with the Construction Regulations, 2014, promulgated under the OHS Act 85 of 1993.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "tender",
    title: "Tender Document",
    category: "Compliance",
    icon: "📋",
    description: "CIDB / PPPFA tender submission with company profile and pricing.",
    generationTime: "Ready in 60 seconds",
    aiSupported: true,
    aiPrompt: "Draft a South African CIDB / PPPFA tender submission cover pack. Ask me for the tender number, department, company profile and pricing.",
    pages: [
      `TENDER SUBMISSION
Tender No: RFP-CRG-2026-14
Issued by: Coastal Retail Group (Pty) Ltd
Closing: 26 July 2026 · 11:00
Submitted by: Acme Trading (Pty) Ltd
Date: 12 July 2026

1. COVER LETTER
We hereby submit our proposal in response to Tender RFP-CRG-2026-14 for the supply and installation of retail signage across 14 sites. Acme Trading confirms compliance with all technical and legal requirements set out in the tender pack.

2. COMPANY PROFILE
Registered name: Acme Trading (Pty) Ltd
Reg No: 2018/123456/07 · VAT No: 4123456789
CIDB Grading: 4SB · BBBEE Level 2 (135% procurement recognition)
Tax Compliance PIN: valid (attached)`,
      `3. TECHNICAL RESPONSE
3.1  Approach: phased roll-out of 3 sites per week over 5 weeks.
3.2  Team: 1 PM, 2 supervisors, 6 installers, 1 SHEQ officer.
3.3  Quality: ISO 9001-aligned inspection at handover of every site.

4. PRICING SUMMARY
────────────────────────────────────────────────
Item                                        Amount (R)
Supply of signage (14 sites)                  486 000,00
Installation & rigging                        212 000,00
Project management                             68 500,00
────────────────────────────────────────────────
Subtotal                                      766 500,00
VAT @ 15%                                     114 975,00
TOTAL TENDER PRICE                          R 881 475,00

5. ATTACHMENTS
CIPC registration · Tax compliance PIN · BBBEE certificate · CIDB certificate · Letter of Good Standing · Company profile · Reference letters (3).
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
  {
    id: "company-policy",
    title: "Company Policy",
    category: "HR",
    icon: "📘",
    description: "General workplace policy (leave, IT, dress code, discipline).",
    generationTime: "Ready in 30 seconds",
    aiSupported: true,
    aiPrompt: "Draft a South African general company policy (workplace conduct, leave, IT and discipline). Ask me for the company name and any specifics.",
    pages: [
      `COMPANY POLICY
Document No: POL-2026-011
Effective date: 1 August 2026
Owner: Human Resources Manager

1. PURPOSE & SCOPE
This policy sets out the standards of conduct expected of all employees of Acme Trading (Pty) Ltd and applies to permanent, temporary and contract staff.

2. WORKING HOURS & ATTENDANCE
2.1  Ordinary hours are 08:00 – 17:00, Monday to Friday.
2.2  Late arrivals of more than 15 minutes must be reported to a manager.
2.3  Time-and-attendance records are kept in terms of BCEA s31.

3. LEAVE
3.1  Annual, sick, family responsibility and maternity leave in line with BCEA.
3.2  Applications must be captured on the HR system at least 14 days in advance where practicable.

4. IT & ACCEPTABLE USE
4.1  Company systems are provided for business use; limited personal use is permitted.
4.2  Sharing of passwords, downloading of pirated content and accessing unlawful sites is prohibited.
4.3  All communications may be monitored in accordance with RICA and POPIA.

5. DISCIPLINE
5.1  The Employer applies progressive discipline in line with LRA Schedule 8.
5.2  Serious misconduct may result in summary dismissal after a fair hearing.
${SIG_BLOCK}NexDocs AI · Generated for Acme Trading (Pty) Ltd`,
    ],
  },
];

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "HR",
  "Legal",
  "Finance",
  "Compliance",
  "Construction",
  "Cleaning",
  "Logistics",
  "Retail",
  "Hospitality",
  "Technology",
];

export function getTemplateById(id: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find((t) => t.id === id);
}
