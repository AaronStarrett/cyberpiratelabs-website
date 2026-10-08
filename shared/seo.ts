/** Public business facts only. Customer data, prices and unverified claims do not belong here. */
export const SITE_ORIGIN = "https://cyberpiratelabs.com";
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const SCHEMA_CONTEXT = "https://schema.org";

export function organizationSchema() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Cyber Pirate Labs",
    legalName: "Cyber Pirate Labs, LLC",
    url: `${SITE_ORIGIN}/`,
    logo: `${SITE_ORIGIN}/brand/cpl-logo.png`,
    description: "Cyber Pirate Labs solves business problems with software solutions, including custom process automation and ten core services. Tools and integrations are chosen around customer needs, existing systems and an agreed scope.",
  };
}

interface ServiceSchemaInput {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
}

export function serviceSchema({ name, description, path, serviceType }: ServiceSchemaInput) {
  const url = new URL(path, SITE_ORIGIN).href;
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Service",
    "@id": `${url}#service`,
    name,
    description,
    url,
    ...(serviceType ? { serviceType } : {}),
    provider: { "@id": ORGANIZATION_ID },
  };
}

interface BreadcrumbItem {
  name: string;
  path: string;
}

/** Call with the same ordered names and destinations as the visible breadcrumb. */
export function breadcrumbSchema(items: readonly BreadcrumbItem[]) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: new URL(path, SITE_ORIGIN).href,
    })),
  };
}
