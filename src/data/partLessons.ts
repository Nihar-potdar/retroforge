export const partLessons = [
  {
    id: "cpu",
    name: "Processor",
    short: "CPU",
    image: "cpu",
    title: "The one that thinks.",
    description:
      "Your processor follows instructions and does the everyday computing: opening apps, running game logic, and keeping things moving.",
    analogy:
      "Think of it as the cook. It follows the recipe and gets the work done.",
    check:
      "Match its socket to the motherboard. Plan for a compatible cooler, too.",
    guide: "compatibility-first",
  },
  {
    id: "gpu",
    name: "Graphics",
    short: "GPU",
    image: "gpu",
    title: "A little visual magic.",
    description:
      "The graphics processor draws the images on your screen. A dedicated graphics card handles demanding games, 3D scenes, and many creative workloads.",
    analogy: "The artist of the team, turning calculations into pictures.",
    check:
      "Check the card’s length against your case and choose a suitable power supply.",
    guide: "compatibility-first",
  },
  {
    id: "ram",
    name: "Memory",
    short: "RAM",
    image: "ram",
    title: "Room to think.",
    description:
      "Memory holds the things your computer is working on right now. More capacity helps when several apps or large projects need space at once.",
    analogy:
      "Your desk: a bigger surface lets you spread out more work. It is cleared when the power goes off.",
    check:
      "Your memory generation, such as DDR4 or DDR5, must match your motherboard.",
    guide: "compatibility-first",
  },
  {
    id: "storage",
    name: "Storage",
    short: "SSD / HDD",
    image: null,
    title: "Keep the good stuff.",
    description:
      "Storage keeps your operating system, apps, games, and files—even when the computer is off. An SSD usually opens files much faster than a hard drive.",
    analogy:
      "The bookshelf beside your desk. Storage keeps things; memory keeps them ready to use.",
    check:
      "Check the drive’s connector, supported protocol, and available motherboard slots.",
    guide: "storage-without-confusion",
  },
  {
    id: "motherboard",
    name: "Motherboard",
    short: "Mainboard",
    image: "motherboard",
    title: "Everyone, connected.",
    description:
      "The motherboard is the main circuit board. It connects the processor, memory, storage, and graphics so they can communicate.",
    analogy:
      "The roads between the team. Every part needs the right connection.",
    check:
      "Match the CPU socket, memory generation, and board size to your other parts.",
    guide: "compatibility-first",
  },
  {
    id: "psu",
    name: "Power supply",
    short: "PSU",
    image: "psu",
    title: "Power the whole idea.",
    description:
      "Your power supply converts power from the wall into the voltages your components need. It needs enough capacity and the right connectors.",
    analogy:
      "The power station. Reliable delivery matters as much as the number on the label.",
    check:
      "Review estimated load and recommended headroom. Verify connectors and physical fit separately.",
    guide: "power-without-guessing",
  },
  {
    id: "case",
    name: "Case",
    short: "Chassis",
    image: "case",
    title: "A home for it all.",
    description:
      "The case holds and protects your components. Its size, layout, and airflow affect which parts fit and how you keep them cool.",
    analogy:
      "The workshop: everything needs a place, and enough room to breathe.",
    check:
      "Check motherboard size, graphics clearance, and cooling support before buying.",
    guide: "airflow-that-makes-sense",
  },
] as const;
