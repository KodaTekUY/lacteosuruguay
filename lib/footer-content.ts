import { HOME_SECTION_IDS } from "@/lib/home-layout"
import { getBrandName } from "@/lib/seo/site"

export interface FooterLink {
  href: string
  label: string
}

export interface FooterWhatsappContact {
  displayNumber: string
  href: string
  label: string
}

export interface FooterDetail {
  label: string
  value: string
}

const WHATSAPP_COUNTRY_CODE = "598"
const WHATSAPP_CONTACTS = [
  { label: "WhatsApp 1", number: "099857600" },
  { label: "WhatsApp 2", number: "092412286" },
] as const

function buildWhatsappHref(localNumber: string): string {
  const normalizedNumber = localNumber.replace(/\D/g, "").replace(/^0/, "")
  return `https://wa.me/${WHATSAPP_COUNTRY_CODE}${normalizedNumber}`
}

export function getFooterDescription(): string {
  return `${getBrandName()} reúne lácteos, insumos y ofertas por cantidad para resolver pedidos rápidos, retiros coordinados y consultas comerciales por WhatsApp.`
}

export function getFooterWhatsappContacts(): FooterWhatsappContact[] {
  return WHATSAPP_CONTACTS.map((contact) => ({
    label: contact.label,
    displayNumber: contact.number,
    href: buildWhatsappHref(contact.number),
  }))
}

export function getFooterQuickLinks(): FooterLink[] {
  return [
    { label: "Inicio", href: "/" },
    { label: "Promociones", href: `/#${HOME_SECTION_IDS.deals}` },
    { label: "Categorías", href: `/#${HOME_SECTION_IDS.categories}` },
    { label: "Productos", href: `/#${HOME_SECTION_IDS.products}` },
  ]
}

export function getFooterDeliveryDetails(): FooterDetail[] {
  return [
    { label: "Ubicados en", value: "Ecilda Paullier, San José" },
    { label: "Envíos y retiros", value: "En la zona, todos los días, de 8:00 a 12:00 y de 14:00 a 18:30." },
    { label: "Envíos a Montevideo", value: "Envíos a Montevideo y alrededores dos fines de semana al mes." },
  ]
}
