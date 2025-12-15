import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { formatRgb, parse } from "culori";

function cssColorToRgb(color: string): string | null {
  try {
    const parsed = parse(color);
    if (!parsed) return null;
    return formatRgb(parsed);
  } catch {
    return null;
  }
}

function normalizeColorFunctions(value: string): string {
  if (!value) return value;
  // Replace modern color() functions that html2canvas doesn't understand.
  // Examples: lab(...), lch(...), oklab(...), oklch(...)
  return value.replace(
    /(oklch\([^)]*\)|oklab\([^)]*\)|lab\([^)]*\)|lch\([^)]*\))/gi,
    (match) => cssColorToRgb(match) ?? match
  );
}

function stripUnsupportedGradientHints(value: string): string {
  if (!value) return value;
  // Some browsers output gradients like: linear-gradient(in oklab, ...)
  // html2canvas cannot parse the "in <colorspace>" hint.
  return value.replace(/\bin\s+(oklab|oklch|lab|lch)\b/gi, "");
}

function shouldDropComplexPaint(value: string): boolean {
  return (
    /\b(oklch|oklab|lab|lch)\(/i.test(value) ||
    /\bin\s+(oklab|oklch|lab|lch)\b/i.test(value) ||
    /\bcolor-mix\(/i.test(value)
  );
}

function fallbackColorForProp(prop: keyof CSSStyleDeclaration): string {
  // Conservative, print-friendly defaults.
  switch (prop) {
    case "backgroundColor":
      return "#ffffff";
    case "color":
      return "#111111";
    case "textDecorationColor":
      return "#111111";
    default:
      // borders/outline
      return "#222222";
  }
}

function normalizeElementColors(root: HTMLElement) {
  const colorProps: Array<keyof CSSStyleDeclaration> = [
    "color",
    "backgroundColor",
    "borderTopColor",
    "borderRightColor",
    "borderBottomColor",
    "borderLeftColor",
    "outlineColor",
    "textDecorationColor",
  ];

  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))];
  for (const el of all) {
    const computed = getComputedStyle(el);

    for (const prop of colorProps) {
      const value = computed[prop] as unknown as string;
      if (!value) continue;

      // If the browser keeps advanced CSS in computed styles (e.g. color-mix(in lab, ...)),
      // force a safe fallback so html2canvas won't crash.
      if (shouldDropComplexPaint(value) || /\bvar\(/i.test(value)) {
        (el.style as any)[prop] = fallbackColorForProp(prop);
        continue;
      }

      const normalized = normalizeColorFunctions(value);
      if (normalized !== value && !shouldDropComplexPaint(normalized)) {
        (el.style as any)[prop] = normalized;
      }
    }

    // box-shadow can also contain unsupported colors
    const boxShadow = computed.boxShadow;
    if (boxShadow && /\b(oklch|oklab|lab|lch)\(/i.test(boxShadow)) {
      el.style.boxShadow = normalizeColorFunctions(boxShadow);
    }

    // text-shadow can also contain unsupported colors
    const textShadow = computed.textShadow;
    if (textShadow && /\b(oklch|oklab|lab|lch)\(/i.test(textShadow)) {
      el.style.textShadow = normalizeColorFunctions(textShadow);
    }

    // Filters may include drop-shadow(lab(...))
    const filter = computed.filter;
    if (filter && /\b(oklch|oklab|lab|lch)\(/i.test(filter)) {
      el.style.filter = normalizeColorFunctions(filter);
    }

    // Background images/gradients sometimes encode colorspaces (in lab/oklab)
    // that html2canvas can't parse.
    const backgroundImage = computed.backgroundImage;
    if (backgroundImage && backgroundImage !== "none") {
      if (shouldDropComplexPaint(backgroundImage)) {
        // safest fallback: remove complex gradient rather than crash
        el.style.backgroundImage = "none";
      } else {
        const normalized = stripUnsupportedGradientHints(
          normalizeColorFunctions(backgroundImage)
        );
        if (normalized !== backgroundImage)
          el.style.backgroundImage = normalized;
      }
    }

    // Background shorthand can also contain gradients/colors
    const background = computed.background;
    if (background && background !== "none") {
      const normalized = stripUnsupportedGradientHints(
        normalizeColorFunctions(background)
      );
      if (normalized !== background) el.style.background = normalized;
      if (shouldDropComplexPaint(normalized)) {
        el.style.background = "none";
        el.style.backgroundColor = "#ffffff";
      }
    }
  }
}

export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string
) {
  const exportId = `pdf-export-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
  element.setAttribute("data-pdf-export-id", exportId);

  // Render DOM to canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (doc) => {
      // Force document backgrounds to a safe value (Tailwind v4 may use oklch/lab on :root/body)
      if (doc.documentElement) {
        (doc.documentElement as HTMLElement).style.background = "none";
        (doc.documentElement as HTMLElement).style.backgroundColor = "#ffffff";
      }
      if (doc.body) {
        (doc.body as HTMLElement).style.background = "none";
        (doc.body as HTMLElement).style.backgroundColor = "#ffffff";
      }

      const cloned = doc.querySelector<HTMLElement>(
        `[data-pdf-export-id="${exportId}"]`
      );
      if (!cloned) return;

      // Ensure a white base so we don't depend on theme/background.
      cloned.style.backgroundColor = "#ffffff";
      cloned.style.backgroundImage = "none";

      // Convert any lab/oklch/etc colors to rgb so html2canvas can parse.
      normalizeElementColors(cloned);
    },
  });

  element.removeAttribute("data-pdf-export-id");

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight; // negative offset to show next slice
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}
