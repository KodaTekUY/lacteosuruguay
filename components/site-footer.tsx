import Link from "next/link"
import {
  getFooterDeliveryDetails,
  getFooterDescription,
  getFooterQuickLinks,
  getFooterWhatsappContacts,
} from "@/lib/footer-content"
import { getBrandName } from "@/lib/seo/site"

export function SiteFooter() {
  const brandName = getBrandName()
  const deliveryDetails = getFooterDeliveryDetails()
  const quickLinks = getFooterQuickLinks()
  const whatsappContacts = getFooterWhatsappContacts()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border/70 bg-card/40">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="space-y-3">
            <p className="text-lg font-semibold tracking-tight text-foreground">{brandName}</p>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">{getFooterDescription()}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contacto</p>
            <ul className="space-y-2 text-sm">
              {whatsappContacts.map((contact) => (
                <li key={contact.href}>
                  <a
                    href={contact.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-foreground transition hover:text-primary"
                  >
                    <span className="font-medium">{contact.label}</span>
                    <span className="text-muted-foreground">{contact.displayNumber}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Retiros y envíos
            </p>
            <dl className="space-y-3 text-sm">
              {deliveryDetails.map((detail) => (
                <div key={detail.label} className="space-y-1">
                  <dt className="font-medium text-foreground">{detail.label}</dt>
                  <dd className="leading-6 text-muted-foreground">{detail.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Links rápidos
              </p>
              <ul className="space-y-2 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-foreground transition hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Gestión</p>
              <Link href="/admin" className="inline-flex text-sm text-foreground transition hover:text-primary">
                Panel de administración
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          © {year} {brandName}. Pedidos, consultas y gestión centralizados desde la tienda.
        </div>
      </div>
    </footer>
  )
}
