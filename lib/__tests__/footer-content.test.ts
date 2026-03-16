import { describe, expect, it } from "vitest"
import {
  getFooterDeliveryDetails,
  getFooterQuickLinks,
  getFooterWhatsappContacts,
} from "@/lib/footer-content"

describe("footer content", () => {
  it("builds WhatsApp contact links for both configured numbers", () => {
    expect(getFooterWhatsappContacts()).toEqual([
      {
        label: "WhatsApp 1",
        displayNumber: "099857600",
        href: "https://wa.me/59899857600",
      },
      {
        label: "WhatsApp 2",
        displayNumber: "092412286",
        href: "https://wa.me/59892412286",
      },
    ])
  })

  it("returns quick links to home sections", () => {
    expect(getFooterQuickLinks()).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Promociones", href: "/#promociones" },
      { label: "Categorías", href: "/#categorias" },
      { label: "Productos", href: "/#productos" },
    ])
  })

  it("returns structured delivery details for the footer", () => {
    expect(getFooterDeliveryDetails()).toEqual([
      { label: "Ubicados en", value: "Ecilda Paullier, San José" },
      { label: "Envíos y retiros", value: "En la zona, todos los días, de 8:00 a 12:00 y de 14:00 a 18:30." },
      { label: "Envíos a Montevideo", value: "Envíos a Montevideo y alrededores dos fines de semana al mes." },
    ])
  })
})
