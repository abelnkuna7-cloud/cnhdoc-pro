import jsPDF from "jspdf";
import { cleanGeneratedDocument } from "./generate-doc.functions";

const GOLD = [212, 175, 55] as const;
const BLACK = [0, 0, 0] as const;
const CHARCOAL = [26, 26, 26] as const;

export type PdfBrand = {
  companyName?: string;
  companyLogo?: string;
  watermarkLogo?: string;
  email?: string;
  phone?: string;
  website?: string;
};

export function companyLogoForName(companyName?: string): string {
  const name = companyName?.toLowerCase() ?? "";
  if (name.includes("construction")) return "/logos/cossa-construction-logo.png";
  if (name.includes("facility")) return "/logos/cossa-facility-logo.png";
  if (name.includes("store")) return "/logos/cossa-store-logo.png";
  if (name.includes("tech")) return "/logos/cossa-tech-logo.png";
  if (name.includes("cuisine")) return "/logos/cossa-cuisine-logo.png";
  if (name.includes("legal")) return "/logos/sa-legal-logo.png";
  return "/logos/nexdocs-logo.png";
}

function imageDataUrl(src: string, opacity = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Unable to prepare the document logo."));
        return;
      }
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = opacity;
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error(`Unable to load branding asset: ${src}`));
    image.src = src;
  });
}

function safeFileName(name: string): string {
  return (
    name
      .replace(/[^a-z0-9\s_-]+/gi, "")
      .trim()
      .replace(/\s+/g, "_") || "NexDocs_Document"
  );
}

export async function downloadBrandedPdf({
  title,
  content,
  brand,
}: {
  title: string;
  content: string;
  brand: PdfBrand;
}): Promise<void> {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 42;
  const top = 126;
  const bottom = 54;
  const bodyWidth = pageWidth - margin * 2;
  const companyName = brand.companyName?.trim() || "NexDocs";
  const companyLogo = await imageDataUrl(
    brand.companyLogo || companyLogoForName(companyName),
  ).catch(() => "");
  const watermarkLogo = await imageDataUrl(
    brand.watermarkLogo || "/logos/cossa-nexus-holdings-logo.png",
    0.055,
  ).catch(() => "");

  const contactLine = [brand.phone, brand.email, brand.website]
    .filter(Boolean)
    .join("  |  ");

  const drawPage = (pageNumber: number) => {
    pdf.setFillColor(...BLACK);
    pdf.rect(0, 0, pageWidth, 104, "F");
    pdf.setFillColor(...GOLD);
    pdf.rect(0, 104, pageWidth, 5, "F");

    if (companyLogo) {
      pdf.addImage(companyLogo, "PNG", margin, 14, 76, 76);
    }

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(companyName.toUpperCase(), pageWidth - margin, 32, { align: "right" });
    pdf.setTextColor(...GOLD);
    pdf.setFontSize(20);
    pdf.text(title.toUpperCase().slice(0, 52), pageWidth - margin, 61, {
      align: "right",
    });
    pdf.setTextColor(220, 220, 220);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("PROFESSIONAL BUSINESS DOCUMENT", pageWidth - margin, 79, {
      align: "right",
    });

    if (watermarkLogo) {
      const watermarkWidth = 250;
      const watermarkHeight = 250;
      pdf.addImage(
        watermarkLogo,
        "PNG",
        (pageWidth - watermarkWidth) / 2,
        (pageHeight - watermarkHeight) / 2 + 25,
        watermarkWidth,
        watermarkHeight,
      );
    }

    pdf.setDrawColor(...GOLD);
    pdf.line(margin, pageHeight - 38, pageWidth - margin, pageHeight - 38);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(90, 90, 90);
    pdf.text(
      contactLine || `${companyName}  |  Generated with NexDocs`,
      margin,
      pageHeight - 23,
    );
    pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 23, {
      align: "right",
    });
  };

  let pageNumber = 1;
  drawPage(pageNumber);
  let y = top;
  const sourceLines = cleanGeneratedDocument(content).split(/\r?\n/);

  for (const sourceLine of sourceLines) {
    const line = sourceLine.trimEnd();
    const isHeading =
      line.length > 0 &&
      line.length < 70 &&
      line === line.toUpperCase() &&
      /[A-Z]/.test(line);
    const wrapped = line
      ? pdf.splitTextToSize(line, bodyWidth)
      : [""];
    const lineHeight = isHeading ? 16 : 13.5;
    const requiredHeight = wrapped.length * lineHeight + (isHeading ? 5 : 0);

    if (y + requiredHeight > pageHeight - bottom) {
      pdf.addPage();
      pageNumber += 1;
      drawPage(pageNumber);
      y = top;
    }

    if (isHeading) {
      pdf.setFillColor(...CHARCOAL);
      pdf.roundedRect(margin, y - 11, bodyWidth, 18, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(...GOLD);
      pdf.text(wrapped, margin + 7, y + 1);
      y += requiredHeight;
      continue;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(32, 32, 32);
    if (line) {
      pdf.text(wrapped, margin, y);
    }
    y += requiredHeight;
  }

  pdf.save(`${safeFileName(title)}.pdf`);
}
