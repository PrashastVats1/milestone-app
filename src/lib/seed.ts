import { formatInr } from "./format";
import type { Milestone, PersistedState, Project } from "./types";

const discovery: Milestone = {
  id: "seed-m-discovery",
  title: "Discovery and sitemap",
  description: "Agree the pages and the content before any visual design starts.",
  deliverables: [
    "Notes from two stakeholder calls",
    "Sitemap and final page list",
    "Content outline for each page",
  ],
  acceptanceCriteria: [
    "Page list covers home, about, collection, product, and contact",
    "Client confirms the sitemap in writing",
    "Visual design is not part of this milestone",
  ],
  amount: 30000,
  deadline: "2026-11-14",
  source: "original",
};

const design: Milestone = {
  id: "seed-m-design",
  title: "Visual design",
  description: "Design the catalog experience from the approved sitemap.",
  deliverables: [
    "Homepage and collection page designs",
    "Product page design",
    "Color, type, and component notes",
  ],
  acceptanceCriteria: [
    "Designs are shown for desktop and mobile",
    "Client approves the direction in writing before build starts",
    "One revision round is included. Further rounds are a change",
  ],
  amount: 75000,
  deadline: "2026-12-02",
  source: "original",
};

const build: Milestone = {
  id: "seed-m-build",
  title: "Build and launch",
  description: "Build the approved designs and launch the catalog on the studio domain.",
  deliverables: [
    "Responsive site built from the approved designs",
    "Enquiry form that emails the studio",
    "Launch on the studio domain",
  ],
  acceptanceCriteria: [
    "Pages match the approved designs",
    "Enquiry form delivers a test message",
    "Site is live on the production domain",
  ],
  amount: 75000,
  deadline: "2026-12-18",
  source: "original",
};

const hindi: Milestone = {
  id: "seed-m-hindi",
  title: "Hindi festive catalog",
  description:
    "Add a Hindi version of the festive collection: translated names for 24 pieces and a festive landing page. Photography and new products are not included.",
  deliverables: [
    "Hindi names and short descriptions for 24 festive pieces",
    "Language toggle between English and Hindi",
    "Festive collection landing page",
  ],
  acceptanceCriteria: [
    "Client reviews the 24 Hindi descriptions",
    "Toggle works on home, collection, and product pages",
    "Festive page is linked from the homepage",
  ],
  amount: 35000,
  deadline: "2026-12-28",
  source: "change",
  changeRequestId: "seed-cr-hindi",
};

export function createSeedProject(): Project {
  return {
    id: "seed-northwind",
    name: "Northwind Ceramics — catalog website",
    description:
      "Design and build a catalog site for Northwind's studio ceramics: homepage, collection pages, product pages, and an enquiry form. Payment stays off the site. Product photography, Hindi copy, packaging, and extra collections are outside this agreement unless added as a change.",
    clientName: "Meera Kapoor",
    clientEmail: "meera@northwind.studio",
    totalAmount: 180000,
    startDate: "2026-11-03",
    expectedCompletion: "2026-12-28",
    status: "accepted",
    milestones: [discovery, design, build, hindi],
    originalAgreement: {
      acceptedAt: "2026-11-08T11:00:00+05:30",
      projectName: "Northwind Ceramics — catalog website",
      description:
        "Design and build a catalog site for Northwind's studio ceramics: homepage, collection pages, product pages, and an enquiry form. Payment stays off the site. Product photography, Hindi copy, packaging, and extra collections are outside this agreement unless added as a change.",
      clientName: "Meera Kapoor",
      clientEmail: "meera@northwind.studio",
      totalAmount: 180000,
      startDate: "2026-11-03",
      expectedCompletion: "2026-12-18",
      milestones: [
        { ...discovery, deliverables: [...discovery.deliverables], acceptanceCriteria: [...discovery.acceptanceCriteria] },
        { ...design, deliverables: [...design.deliverables], acceptanceCriteria: [...design.acceptanceCriteria] },
        { ...build, deliverables: [...build.deliverables], acceptanceCriteria: [...build.acceptanceCriteria] },
      ],
    },
    changeRequests: [
      {
        id: "seed-cr-hindi",
        title: "Hindi festive catalog",
        description:
          "Add a Hindi version of the festive collection: translated names for 24 pieces and a festive landing page. Photography and new products are not included.",
        requestedAt: "2026-11-12T16:10:00+05:30",
        status: "approved",
        proposedCost: 35000,
        proposedDays: 10,
        proposalNote: "Translation and the landing page only. The shoot stays with the studio.",
        proposedDeliverables: [...hindi.deliverables],
        proposedCriteria: [...hindi.acceptanceCriteria],
        proposedAt: "2026-11-13T10:20:00+05:30",
        decidedAt: "2026-11-14T15:05:00+05:30",
        decisionNote: "Approved as proposed.",
        milestoneId: hindi.id,
      },
      {
        id: "seed-cr-photo",
        title: "Photography direction for 12 pieces",
        description:
          "A shot list, lighting notes, and crop guide so the studio photographer can match the catalog. The shoot itself stays with the studio.",
        requestedAt: "2026-11-18T12:40:00+05:30",
        status: "proposed",
        proposedCost: 22000,
        proposedDays: 6,
        proposalNote: "Direction only. No photography or retouching is included.",
        proposedDeliverables: [
          "Shot list for 12 products",
          "Lighting and background notes",
          "Crop guide for the catalog grid",
        ],
        proposedCriteria: [
          "Client approves the shot list before the shoot",
          "Guide covers square and portrait crops",
          "No photography or retouching is included",
        ],
        proposedAt: "2026-11-19T11:15:00+05:30",
      },
      {
        id: "seed-cr-insert",
        title: "Packaging insert for festive orders",
        description:
          "A single printed insert, front and back, for festive orders. Printing stays with the studio. Box dielines and extra inserts are not included.",
        requestedAt: "2026-11-20T17:45:00+05:30",
        status: "requested",
      },
    ],
    activity: [
      {
        id: "seed-a1",
        at: "2026-11-03T09:30:00+05:30",
        actor: "freelancer",
        message: "Created “Northwind Ceramics — catalog website” for Meera Kapoor.",
      },
      {
        id: "seed-a2",
        at: "2026-11-03T09:40:00+05:30",
        actor: "freelancer",
        message: `Defined three milestones and a contract total of ${formatInr(180000)}.`,
      },
      {
        id: "seed-a3",
        at: "2026-11-08T11:00:00+05:30",
        actor: "client",
        message: "Meera Kapoor accepted the agreement. The original scope is locked.",
      },
      {
        id: "seed-a4",
        at: "2026-11-12T16:10:00+05:30",
        actor: "client",
        message: "Requested a change: “Hindi festive catalog”.",
      },
      {
        id: "seed-a5",
        at: "2026-11-13T10:20:00+05:30",
        actor: "freelancer",
        message: `Proposed ${formatInr(35000)} and 10 extra days for “Hindi festive catalog”.`,
      },
      {
        id: "seed-a6",
        at: "2026-11-14T15:05:00+05:30",
        actor: "client",
        message: `Approved “Hindi festive catalog”. Added ${formatInr(35000)} and 10 extra days to the current scope.`,
      },
      {
        id: "seed-a7",
        at: "2026-11-18T12:40:00+05:30",
        actor: "client",
        message: "Requested a change: “Photography direction for 12 pieces”.",
      },
      {
        id: "seed-a8",
        at: "2026-11-19T11:15:00+05:30",
        actor: "freelancer",
        message: `Proposed ${formatInr(22000)} and 6 extra days for “Photography direction for 12 pieces”.`,
      },
      {
        id: "seed-a9",
        at: "2026-11-20T17:45:00+05:30",
        actor: "client",
        message: "Requested a change: “Packaging insert for festive orders”.",
      },
    ],
    createdAt: "2026-11-03T09:30:00+05:30",
    updatedAt: "2026-11-20T17:45:00+05:30",
  };
}

export function createSeedState(): PersistedState {
  return {
    role: "freelancer",
    projects: [createSeedProject()],
  };
}
