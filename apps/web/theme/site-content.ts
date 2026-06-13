/**
 * Texter och kontaktuppgifter för kundwebben.
 * Justera här utan att röra komponentkod.
 */

export const siteContent = {
  brand: {
    name: "Forshälla Alltjänst",
    legalName: "Forshälla Alltjänst AB",
    taglineShort: "Uthyrning",
  },
  meta: {
    title: "Uthyrning — boka online",
    description:
      "Hyr det du behöver enkelt online i Uddevalla och närliggande områden. Släpkärra, maskiner, utrustning och mer — välj period och boka smidigt.",
  },
  nav: {
    catalogLabel: "Utbud",
    catalogHref: "/#utbud",
    bookCta: "Boka online",
    seeCatalog: "Se utbud",
  },
  home: {
    heroTitle: "Hyr det du behöver — enkelt och tryggt",
    heroSubtitle:
      "Släpkärra, maskiner, utrustning och annat vi har i sortimentet. Välj vad du vill hyra, ange period och slutför bokningen online. Beloppet reserveras på kortet tills vi godkänt.",
    productsHeading: "Vårt utbud",
    productsIntro:
      "Alla priser är per dygn. Mängdrabatt vid längre hyra. Utbudet uppdateras löpande.",
    productsEmpty:
      "Inget att visa just nu. Kontakta oss så berättar vi vad som finns tillgängligt.",
    contactIntro:
      "Osäker på vad som passar? Hör av dig — vi hjälper dig hitta rätt.",
    howItWorksIntro: "Tre enkla steg från val till färdig bokning.",
    trustPoints: [
      "Reserverat belopp — debiteras först efter godkännande",
      "Bekräftelse via e-post",
      "Leverans eller upphämtning när det behövs",
    ],
  },
  howItWorks: [
    {
      step: 1,
      title: "Välj i utbudet",
      text: "Bläddra bland det vi hyr ut och välj det som passar ditt behov.",
    },
    {
      step: 2,
      title: "Boka online",
      text: "Ange period och dina uppgifter. Godkänn hyresvillkoren och reservera beloppet på kortet.",
    },
    {
      step: 3,
      title: "Vi ordnar resten",
      text: "Efter godkännande bekräftar vi bokningen. Leverans eller avhämtning sker enligt vad som gäller för objektet.",
    },
  ],
  booking: {
    backToCatalog: "Tillbaka till utbudet",
    unavailableBooked:
      "Objektet är redan bokat under delar av den valda perioden. Välj andra datum.",
  },
  contact: {
    email: "forshalla.alltjanst@gmail.com",
    phone: "070-123 45 67",
    phoneHref: "+46701234567",
    addressLines: ["Skeppsbron 1", "451 00 Uddevalla"],
  },
  footer: {
    tagline:
      "Uthyrning i Uddevalla och närliggande områden. Boka smidigt online — vi sköter resten.",
    bookCta: "Boka online",
  },
} as const;
