export type LessonSection = {
  title: string;
  body: string;
  bullets?: string[];
  actions?: { label: string; to: string }[];
};
export type Lesson = {
  slug: string;
  title: string;
  description: string;
  topics: string[];
  advanced?: boolean;
  sections: LessonSection[];
  checklist: string[];
  warning: string;
  sources: { label: string; url: string }[];
  related: string[];
  actions: { label: string; to: string }[];
};
const build = (category?: string) => ({
  label: category
    ? `Choose ${category === "ram" ? "memory" : category}`
    : "Open builder",
  to: category ? `/build?category=${category}` : "/build",
});
const prebuilts = { label: "Explore prebuilts", to: "/prebuilts" };
const manual = {
  label: "Intel: assembling a PC",
  url: "https://www.intel.com/content/www/us/en/gaming/resources/how-to-build-a-gaming-pc.html",
};
const memory = {
  label: "Intel: memory capacity and specifications",
  url: "https://www.intel.com/content/www/us/en/gaming/resources/how-much-ram-gaming.html",
};
const tuning = {
  label: "AMD Ryzen Master documentation",
  url: "https://docs.amd.com/r/en-US/68886-ryzen-master-user-guide",
};
const cables = {
  label: "CORSAIR: modular cable compatibility",
  url: "https://www.corsair.com/ww/cf/explorer/diy-builder/power-supply-units/are-psu-cable-universal/",
};
const windows = {
  label: "Microsoft: creating installation media",
  url: "https://www.microsoft.com/en-us/software-download/windows11",
};
const section = (
  title: string,
  body: string,
  bullets?: string[],
): LessonSection => ({ title, body, bullets });
export const lessons: Lesson[] = [
  {
    slug: "getting-started",
    title: "Start Here: Your First PC Plan",
    description:
      "Understand the parts, navigate RetroForge, and turn a virtual build into a real checklist.",
    topics: ["Site basics", "Terminology", "Next steps"],
    sections: [
      section(
        "What each part does",
        "The processor (CPU) runs instructions. The graphics card (GPU) draws images and accelerates supported workloads. The motherboard connects the parts and determines many upgrade options. Memory (RAM) holds active work; storage keeps files when power is off. The power supply (PSU) converts wall power for the components. The case houses the assembly. A CPU cooler, fans, display, keyboard, operating system, and networking may also be needed even though they are not all selectable here.",
      ),
      section(
        "Start from your goal",
        "Write down what you will do with the computer, the programs you use, your display resolution, and your complete budget. A gaming machine, quiet office PC, and video-editing workstation have different priorities. If you are unsure where to begin, open Prebuilts and read the intended use of each configuration. Loading one replaces your current working build; save any work you want to keep first.",
      ),
      section(
        "Navigate the builder",
        "Add parts opens the catalogue on a phone. Choose a category, search a product name, and open a card to read its specifications. Install changes the assembly; Remove reverses it. Your build shows selected parts, power estimates, issues, and save controls. On desktop, those areas are side panels. Zen opens more space for the 3D view; edge controls reveal the panels. Help replays the tour and explains the keyboard controls.",
      ),
      section(
        "Understand the checks",
        "An error identifies a known conflict, while a warning asks you to review a choice. An incomplete build may have no errors because there is not enough information to check it yet. Estimated draw and recommended PSU wattage are different numbers: the recommendation includes headroom and available GPU vendor recommendations. Product models may be illustrative, and even a matching model is not a physical clearance test.",
      ),
      section(
        "What the website cannot promise",
        "Catalogue prices are estimates, not live retailer offers. The site does not sell parts, benchmark your system, or guarantee exact BIOS support, power connector availability, CPU cooler fit, shared motherboard lanes, or a complete finished parts list. Verify exact product names, revision numbers, manuals, support lists, and retailer availability before purchasing. Saved builds are local to this browser; clearing its data can remove them.",
      ),
      section(
        "Your next steps",
        "Save a named draft, resolve known issues, and create a separate purchase checklist including cooling, cables, software, and peripherals. Read the relevant component guides, compare exact-model manuals, and confirm warranties and return policies. Then assemble using the assembly guide and your hardware instructions. After first boot, check temperatures and stability before making performance changes.",
      ),
    ],
    checklist: [
      "Write down workload, display, and budget",
      "Save your draft before replacing it",
      "Verify exact models and missing accessories",
      "Read assembly and first-boot guides",
    ],
    warning:
      "A clean compatibility panel is a useful screening result, not a purchasing guarantee.",
    sources: [],
    related: [
      "budget-and-workload",
      "compatibility-first",
      "first-build-sequence",
    ],
    actions: [prebuilts, build()],
  },
  {
    slug: "budget-and-workload",
    title: "Budget for the Whole Computer",
    description:
      "Choose a balanced system around your actual tasks, including costs outside the tower.",
    topics: ["Budget", "Resolution", "Priorities"],
    sections: [
      section(
        "Define success before choosing parts",
        "Name the programs you will run, the projects you will work on, and any target frame rate, render time, or noise limit. A specification such as “fast gaming PC” is too vague to help choose hardware. If you already own a display, record its resolution and refresh rate. If you need a new display, include it in the budget instead of spending the entire amount on the tower.",
      ),
      section(
        "Separate total cost from parts subtotal",
        "RetroForge adds the prices of selected catalogue components. Your real budget also includes a CPU cooler if needed, extra fans, an operating-system licence where applicable, a display, input devices, networking, shipping, taxes, and tools or installation help. Keep a small allowance for an unexpected adapter or replacement. Compare completed baskets from actual retailers rather than assuming the displayed subtotal is the final price.",
      ),
      section(
        "Match spending to your workload",
        "GPU performance matters for many games and GPU-accelerated creative tasks. CPU performance matters for simulation, compilation, and applications that spend time on processor work. RAM capacity matters when the working set is large. Storage capacity matters when projects or game libraries outgrow the drive. Read benchmarks for your actual applications at comparable settings; a synthetic score alone does not describe the experience you will get.",
      ),
      section(
        "Avoid misleading bottleneck percentages",
        "A system does not have one permanent bottleneck. It changes with the application, resolution, scene, and background work. Buying a stronger graphics card may help a high-resolution game but do little for a CPU-heavy task. A larger RAM kit can prevent running out of memory without raising frame rate when capacity was already sufficient. Identify the constraint using measurements instead of an online percentage calculator.",
      ),
      section(
        "Compare alternatives on equal terms",
        "Use a prebuilt configuration as a starting point, then change one significant choice at a time. Compare total cost, expected workload performance, power requirements, noise, features, and upgrade limits. Do not reduce the PSU or cooling budget simply to afford a more expensive GPU. A modest, reliable build that meets the goal is often more useful than a machine with one impressive component and neglected supporting parts.",
      ),
      section(
        "Example: a constrained gaming budget",
        "Suppose the budget also needs a monitor and Wi-Fi. First reserve those costs and check whether the motherboard includes the network feature you need. Choose CPU and GPU candidates using benchmarks at the planned resolution. Select compatible RAM and enough storage for the initial library. Finally price the PSU, case, and cooler and revise the draft if the complete cost exceeds your limit.",
      ),
    ],
    checklist: [
      "Include peripherals, software, and shipping",
      "Compare benchmarks for your own tasks",
      "Check networking and display connections",
      "Price the complete basket",
    ],
    warning:
      "A higher model number or larger score does not automatically make a better-value system for your workload.",
    sources: [
      {
        label: "Intel: understanding workload bottlenecks",
        url: "https://www.intel.com/content/www/us/en/gaming/resources/what-is-bottlenecking-my-pc.html",
      },
    ],
    related: ["cpu-and-gpu", "power-without-guessing"],
    actions: [prebuilts, build()],
  },
  {
    slug: "cpu-and-gpu",
    title: "Choose Your Processor and Graphics",
    description:
      "Read performance specifications without confusing marketing numbers with application results.",
    topics: ["CPU", "GPU", "Benchmarks"],
    sections: [
      section(
        "CPU cores, threads, and clock speed",
        "A core performs processing work; hardware threads let supported processors schedule additional work. Extra cores help applications that can use them, but not every task scales evenly. Clock speed measures cycles per second, not work accomplished per cycle. Comparing gigahertz across unrelated generations can be misleading. Use application benchmarks and sustained behavior, not just core count or peak boost.",
      ),
      section(
        "CPU platform affects the rest of the build",
        "Choose the processor together with its socket, motherboard, memory generation, and cooling requirements. A low-cost processor can become a costly choice if it requires an expensive board or memory kit. Check whether an included cooler exists and suits your noise and temperature goals. Integrated graphics can provide a useful display fallback, but support depends on the exact processor and board.",
      ),
      section(
        "GPU memory and rendering performance",
        "Video memory stores resources used by the graphics workload. More VRAM is not the same as a faster GPU, although insufficient capacity can cause problems for demanding settings or large projects. Compare rendering performance at the intended resolution, memory use, and the features your software supports. Upscaling and frame generation results should be distinguished from native rendering benchmarks.",
      ),
      section(
        "Read the exact graphics-card model",
        "A GPU chip name does not determine the entire board. Different card manufacturers can use different lengths, cooler thicknesses, power limits, connector arrangements, and display outputs. Verify the complete model designation before buying. RetroForge checks recorded length but does not fully validate slot thickness, cable bending clearance, or every adjacent expansion-card conflict.",
      ),
      section(
        "Balance performance, power, and noise",
        "A faster component may require more cooling and a stronger PSU. Read reviews that describe sustained temperatures and fan behavior as well as performance. A card that fits by length can still leave insufficient space around its power cable. Confirm your PSU provides the required approved cables and that your monitor can connect to the selected outputs.",
      ),
      section(
        "Make a comparison you can explain",
        "Choose two candidates and write the price difference, the measured advantage in your main task, and any supporting upgrades each requires. If you cannot explain the extra cost in terms of a requirement you actually have, reconsider it. Build both configurations and review the power and compatibility results before settling on one.",
      ),
    ],
    checklist: [
      "Confirm CPU support and cooling",
      "Compare relevant application benchmarks",
      "Verify exact GPU dimensions and outputs",
      "Check PSU connectors and cable clearance",
    ],
    warning:
      "The visual model is not evidence that the selected graphics card fits or uses the connectors shown.",
    sources: [manual],
    related: ["compatibility-first", "power-without-guessing"],
    actions: [build("cpu"), build("gpu")],
  },
  {
    slug: "compatibility-first",
    title: "Compatibility First",
    description:
      "Check the platform, firmware, memory, enclosure, and details a simple socket match cannot settle.",
    topics: ["Sockets", "BIOS", "Form factors"],
    sections: [
      section(
        "Start with the socket, then verify support",
        "A CPU socket is the mechanical and electrical interface between processor and motherboard. Matching its name is a necessary first check, but it does not establish support by itself. Find the exact CPU on the motherboard manufacturer’s support list and note the required firmware version. Board revisions can have different support pages. Confirm how the retailer identifies the shipped firmware, or whether the board can update without an already supported CPU.",
      ),
      section(
        "Understand chipset and motherboard features",
        "The chipset and board design determine features such as expansion, storage connectivity, USB, and firmware options. Compare the ports you actually need: network connectivity, display outputs when using integrated graphics, fan headers, front-panel connections, and enough storage slots. A more expensive chipset is not automatically useful. Read the exact board manual rather than assuming every board with that chipset has the same layout.",
      ),
      section(
        "Match the memory generation",
        "DDR4 and DDR5 are different memory generations with incompatible layouts. Pick the generation the exact board supports. Then check module count, supported capacity, and any memory support guidance. The motherboard’s tested memory list can help narrow choices, but a listed kit and profile do not eliminate every stability variable. Mixing unrelated kits introduces additional uncertainty.",
      ),
      section(
        "Fit the motherboard and GPU in the case",
        "ATX, Micro ATX, and Mini ITX describe common motherboard sizes. Confirm the case supports the actual board form factor and correct standoff positions. For the GPU, check length, thickness, and height plus cable space. Front radiators, drive cages, and fans can reduce usable clearance. Treat the site’s recorded size checks as screening, then verify the manufacturer’s configuration-specific dimensions.",
      ),
      section(
        "Check connections and shared resources",
        "Count power, fan, storage, and front-panel connections. Some motherboard storage slots share lanes or disable another connection when used. Read the manual’s population tables, not just the advertised total number of sockets. Confirm the PSU and case support the required formats. Cooler mounting support, height, RAM clearance, and radiator positions also need separate checking.",
      ),
      section(
        "Turn a check result into evidence",
        "Keep a list of exact product identifiers and the manual pages you used. Resolve reported errors before purchase unless you have authoritative evidence the catalogue data is wrong. Warnings should become a deliberate review step. A build with missing components cannot be fully assessed. Recheck after replacements; changing a motherboard can affect memory, storage, firmware, and case fit at once.",
      ),
    ],
    checklist: [
      "Match CPU socket and support-list firmware",
      "Match RAM generation and kit arrangement",
      "Verify board, GPU, and cooling clearances",
      "Read shared-lane and connector tables",
    ],
    warning:
      "No detected errors does not mean every physical, firmware, or electrical dependency has been checked.",
    sources: [manual],
    related: [
      "memory-explained",
      "storage-without-confusion",
      "airflow-that-makes-sense",
    ],
    actions: [build("motherboard")],
  },
  {
    slug: "memory-explained",
    title: "Memory Without Marketing Confusion",
    description:
      "Choose capacity and a kit arrangement, then understand speed profiles and their limits.",
    topics: ["Capacity", "Channels", "XMP / EXPO"],
    sections: [
      section(
        "RAM and storage solve different problems",
        "RAM holds information programs are actively using; storage holds files persistently. Running out of RAM can cause the operating system to move work through slower storage, reducing responsiveness. Extra unused RAM does not automatically make a program faster. Measure your existing workload when possible and read the requirements of the applications you intend to use.",
      ),
      section(
        "Capacity comes before aggressive tuning",
        "Choose enough capacity for your simultaneous work and a realistic growth allowance. A game with a browser open differs from video editing or large scientific datasets. Avoid treating a single capacity recommendation as universal. If the budget is constrained, stable adequate capacity is usually a more useful target than a small kit with unusually high advertised speed.",
      ),
      section(
        "Choose a matched kit and the correct slots",
        "A kit contains modules sold to work together at the stated specification. Buying two separately packaged kits with matching marketing names does not guarantee equivalent chips or profile behavior. Follow the motherboard manual’s recommended slots; common two-module arrangements are not universal. Do not infer electrical channel support from the number of physical slots alone.",
      ),
      section(
        "Read speed and latency together",
        "DDR transfer rate is commonly expressed in MT/s. CAS latency is a number of clock cycles, so comparing only the CL number across different rates can mislead. Overall memory performance depends on the controller, timings, capacity, and application. Verify the supported DDR generation first; faster DDR5 cannot be installed into a DDR4-only board.",
      ),
      section(
        "XMP and EXPO are profile choices",
        "Memory can boot at a conservative default different from the advertised profile. XMP and EXPO provide preconfigured tuning on supported platforms. Enabling one is still a performance setting that can affect stability; motherboard, processor, module count, and firmware matter. First prove the system works at defaults, then enable the appropriate supported profile and test again.",
      ),
      section(
        "Recover from a failed profile",
        "Record working settings before changing them. If memory errors, crashes, or failed boot appear, revert the profile and retest at defaults. Consult the board manual for its supported recovery process if the system will not enter firmware setup. Do not copy another person’s voltage settings without exact platform guidance. Treat memory errors as a data-integrity problem, not merely an inconvenient benchmark result.",
      ),
    ],
    checklist: [
      "Choose capacity for simultaneous tasks",
      "Use one appropriate matched kit",
      "Install modules in the manual’s order",
      "Verify stability at defaults and after profiles",
    ],
    warning:
      "Advertised profile speed is not a guarantee that every CPU, motherboard, and module arrangement will run it stably.",
    sources: [memory, tuning],
    related: ["compatibility-first", "performance-tuning"],
    actions: [build("ram")],
  },
  {
    slug: "power-without-guessing",
    title: "Power Without Guessing",
    description:
      "Understand the wattage estimate, real PSU quality, connector requirements, and headroom.",
    topics: ["Watts", "Headroom", "Connectors"],
    sections: [
      section(
        "Watts describe capacity, not quality",
        "PSU wattage describes its rated output capacity. It does not tell you everything about protection behavior, regulation, noise, build quality, or suitability for short load excursions. Efficiency labels describe conversion efficiency under defined test conditions; they are not a complete quality ranking. Choose a well-reviewed exact model with the connections and physical format your system requires.",
      ),
      section(
        "How RetroForge estimates a system",
        "The estimate uses recorded CPU sizing budgets and GPU board-power figures, plus allowances for the motherboard, selected memory kit, drives, and cooling. Current allowances are 50 W for a board, 20 W for a RAM kit, 10 W per SSD, 25 W per HDD, and 30 W for cooling when a CPU or board is present. These are planning assumptions, not measurements of your particular hardware.",
      ),
      section(
        "Understand the two wattage checks",
        "The recommended wattage uses 25% headroom above the estimated load and respects a recorded GPU vendor PSU floor when available. A selected PSU below estimated demand produces a capacity error. A PSU that covers the estimate but falls below the recommendation produces a warning. Incomplete metadata can also generate a warning. The recommendation can change after replacing a part or adding another drive.",
      ),
      section(
        "TDP is not universal wall power",
        "A CPU thermal rating is not always its maximum electrical demand. Turbo behavior and configured power limits can change consumption. GPU power figures describe a different component and measurement context. The site uses stock-oriented budgets where available; it does not simulate unrestricted motherboard settings, overclocking, every accessory, or power measured at the wall.",
      ),
      section(
        "Verify every cable and connector",
        "Check motherboard main power, CPU power, graphics-card requirements, and drive connections against both manuals. Some connections look similar while serving different purposes. Seat connectors fully and follow the graphics-card maker’s cable-routing and bending guidance. Modular PSU-side pinouts can differ between models; use the supplied cable set or a cable explicitly approved for that exact PSU.",
      ),
      section(
        "Choose enough room without pretending precision",
        "Consider credible measured reviews, vendor guidance, planned additions, and the system’s operating configuration. Recalculate after upgrades. An estimate is useful for rejecting obviously undersized choices but cannot establish all transient-load behavior or connector compatibility. If a build requires special high-power adapters or an unusual configuration, verify manufacturer guidance directly.",
      ),
    ],
    checklist: [
      "Review estimated load and recommendation separately",
      "Check exact-model reviews and protections",
      "Verify approved cables and connectors",
      "Reassess after tuning or upgrades",
    ],
    warning:
      "Never open a PSU. Never assume modular cables are interchangeable because the plugs fit.",
    sources: [
      cables,
      {
        label: "Intel: processor power specifications",
        url: "https://www.intel.com/content/www/us/en/products/details/processors.html",
      },
    ],
    related: ["cpu-and-gpu", "performance-tuning"],
    actions: [build("psu")],
  },
  {
    slug: "storage-without-confusion",
    title: "Storage Without Confusion",
    description:
      "Separate physical formats from protocols and plan usable capacity, connections, and backups.",
    topics: ["M.2", "SATA", "NVMe"],
    sections: [
      section(
        "Capacity is one decision, interface is another",
        "Capacity determines how much you can store. Performance, endurance, physical format, and connection determine how a drive behaves and where it can be installed. Plan space for the operating system, applications, active projects, and growth. Reported usable capacity can differ from the box’s decimal figure and will fall further after formatting and system files.",
      ),
      section(
        "M.2 is a shape; NVMe is a protocol",
        "An M.2 module has a compact physical layout, but M.2 alone does not establish whether it communicates through SATA or PCIe/NVMe. The slot and drive must support the same interface. Length designations such as 2280 describe module dimensions. A SATA drive in a 2.5-inch housing needs a compatible bay, a data connection, and power.",
      ),
      section(
        "Read motherboard slot notes",
        "Count suitable connections, not merely all sockets. Consult slot population tables for shared lanes, disabled SATA ports, supported module sizes, and any restrictions involving CPU choice. RetroForge checks recorded connector/protocol support and total capacity, but its model does not capture every board’s lane-sharing rules. An advertised slot can exist without supporting your planned arrangement.",
      ),
      section(
        "Choose performance around actual work",
        "Large sequential transfer claims do not describe every small-file or application workload. Game loading, project scratch data, and archive storage have different needs. Check sustained behavior, thermal requirements, warranty, and endurance for your workload. A fast drive can become less useful if capacity is too small or if its temperature causes throttling.",
      ),
      section(
        "Install with care",
        "Use the board’s specified screw, latch, or mounting hardware. Avoid overtightening or bending a module. Follow heatsink instructions, including protective film removal where directed. For SATA devices, route data and power cables without excessive strain. Check the firmware detects the device before assuming an operating-system installation failure means the drive itself is faulty.",
      ),
      section(
        "Plan backups before moving data",
        "Multiple internal drives are not automatically a backup: deletion, malware, theft, or power damage can affect them together. Keep an independent copy of important files and test restoration. Before operating-system installation or drive replacement, identify the correct target by model and capacity. Formatting the wrong disk can destroy existing data.",
      ),
    ],
    checklist: [
      "Match physical format and protocol",
      "Check lane-sharing tables",
      "Provide SATA data and power where needed",
      "Back up and verify the installation target",
    ],
    warning:
      "A second drive in the same machine is not sufficient protection against every data-loss scenario.",
    sources: [
      manual,
      {
        label: "Samsung: storage support and manuals",
        url: "https://semiconductor.samsung.com/consumer-storage/support/",
      },
    ],
    related: ["compatibility-first", "first-boot-and-software"],
    actions: [build("storage")],
  },
  {
    slug: "airflow-that-makes-sense",
    title: "Cooling and Airflow That Make Sense",
    description:
      "Check mounting, clearance, airflow paths, and sustained temperatures before chasing aesthetics.",
    topics: ["Coolers", "Airflow", "Clearance"],
    sections: [
      section(
        "Every processor needs an appropriate cooling path",
        "A CPU cooler transfers heat from the processor into the surrounding air or a liquid loop. Select mounting hardware for the exact socket and enough thermal capability for the configured power. Included coolers are not universal; check the processor package and your intended operating limits. RetroForge does not currently select a CPU cooler, so it belongs on your separate purchase checklist.",
      ),
      section(
        "Verify clearance as an arrangement",
        "Check air-cooler height, memory-module clearance, GPU dimensions, radiator length and thickness, and fan placement. The case’s stated radiator support may depend on other components and where the radiator is mounted. Compare diagrams for the planned arrangement. A 3D preview with generic dimensions cannot settle these questions.",
      ),
      section(
        "Create a understandable airflow path",
        "Identify intended intake and exhaust directions using fan markings and case guidance. Avoid arranging fans so they immediately oppose each other or recirculate hot exhaust. Keep filters and vents clear. More fans are not automatically better: placement, speed, obstructions, and noise all matter. Plan where warm GPU air and radiator exhaust will go.",
      ),
      section(
        "Connect and control fans correctly",
        "Use the appropriate headers and respect their electrical limits. A splitter does not increase the header’s allowed current. Follow pump instructions for its power connection and operating mode. Fan curves adjust speed with temperature; use a relevant sensor and avoid overly abrupt changes that repeatedly accelerate and slow the fans. Verify each required device actually runs after assembly.",
      ),
      section(
        "Measure after assembly",
        "Check idle and sustained-load temperatures using suitable monitoring tools and compare them with the manufacturer’s operating limits. Watch for throttling, unexpected shutdowns, and excessive noise. If behavior is poor, check protective films, mounting pressure, cooler contact, airflow, fan operation, and configured power before buying another fan.",
      ),
      section(
        "Keep cooling maintainable",
        "Leave access for filters, dust removal, and important cable connections. Dust buildup and blocked intakes can reduce cooling over time. Clean only with appropriate power isolation and care; avoid letting compressed air overspin fans. Custom loops add maintenance and leak considerations that deserve their own planning guide.",
      ),
    ],
    checklist: [
      "Verify socket mounting and cooler clearance",
      "Plan intake and exhaust",
      "Check header limits and pump instructions",
      "Measure sustained temperature and noise",
    ],
    warning:
      "Case radiator support and cooler height numbers are configuration-dependent; verify the whole arrangement.",
    sources: [manual],
    related: ["custom-liquid-cooling", "first-build-sequence"],
    actions: [build("case")],
  },
  {
    slug: "first-build-sequence",
    title: "Your First Build Sequence",
    description:
      "Prepare, assemble, connect, and inspect a real PC in a deliberate order.",
    topics: ["Assembly", "Connections", "Inspection"],
    sections: [
      section(
        "Prepare the workspace and instructions",
        "Use a stable, clean workspace, suitable lighting, the correct screwdriver, and organized containers for screws. Download the exact case, board, PSU, and cooler manuals before starting. Keep packaging and record serial numbers. Handle boards by their edges and use suitable electrostatic-discharge precautions. Do not work on energized hardware or use conductive packaging as a powered test surface.",
      ),
      section(
        "Inspect and install the core components",
        "Inspect the socket and parts before fitting them. Align the CPU according to its markings and the socket instructions; never force it. Install memory into the manual’s recommended slots and storage using the correct retention hardware. Follow cooler instructions for thermal interface material, brackets, film removal, and tightening sequence. Take photographs of uncertain connections before covering them.",
      ),
      section(
        "Prepare the case and mount the board",
        "Check the case’s standoffs against the actual motherboard holes. Extra standoffs in the wrong place can create shorts. Fit any separate rear I/O shield before mounting the board if the design requires it. Support the board while fastening it and avoid excessive force. Route cables thoughtfully while preserving access to the connections you will need next.",
      ),
      section(
        "Install graphics and power",
        "Fit the graphics card into its specified slot, secure the rear bracket, and use any required support. Install the PSU in its intended orientation with ventilation unobstructed. Connect motherboard main power, CPU power, graphics power, and drive power according to exact manuals. Use only approved PSU cables. A connector that almost fits is a reason to stop and identify it, not push harder.",
      ),
      section(
        "Connect the small but essential cables",
        "The front-panel power switch, USB, audio, case fans, and lighting connections are easy to miss. Use the board’s pin diagram instead of guessing from cable colors. Keep incompatible lighting standards separate. Check that no cables can touch moving fan blades. Connect a display to the GPU when using one, or to a supported motherboard output when intentionally using integrated graphics.",
      ),
      section(
        "Inspect before first power",
        "Check retention, loose screws, unconnected power plugs, cooler and pump power, and cable strain. Confirm mains settings and PSU switches only as directed by the manual. Have access to the power switch and a plan to stop if there is smoke, a burning smell, or liquid. Once firmware starts, inspect detected components and temperatures before tidying cables or enabling tuning profiles.",
      ),
    ],
    checklist: [
      "Read exact manuals before opening packages",
      "Check standoffs, socket alignment, and cooler installation",
      "Verify every power and front-panel connection",
      "Inspect firmware detection and temperatures",
    ],
    warning:
      "Disconnect mains power before handling internal hardware; never open the power supply.",
    sources: [manual, cables],
    related: ["first-boot-and-software", "troubleshooting"],
    actions: [build()],
  },
  {
    slug: "first-boot-and-software",
    title: "First Boot, Firmware, and Software",
    description:
      "Establish a stable default configuration, install software, and verify the finished system.",
    topics: ["UEFI", "OS installation", "Drivers"],
    sections: [
      section(
        "Allow the first initialization to finish",
        "A new platform can take time to initialize or train memory. Consult the board’s documented behavior and indicator lights before repeatedly interrupting it. If there is no display, check monitor input and the correct output first. Record diagnostic indicators rather than guessing. A system entering firmware setup without an operating system installed is an expected stage, not necessarily a failure.",
      ),
      section(
        "Check firmware information at defaults",
        "Verify the detected CPU, memory capacity, and storage devices. Check CPU temperature and fan or pump operation. If temperature rises rapidly, stop and inspect cooling. Leave performance settings at defaults while confirming basic operation. Check CPU support requirements before deciding a firmware update is necessary; an update should follow the exact board’s procedure and use the correct revision file.",
      ),
      section(
        "Prepare official installation media",
        "Create installation media using the operating-system publisher’s instructions. Confirm supported hardware requirements, licence needs, and any firmware requirements before beginning. Boot the installer through the board’s documented boot-menu process. Identify the intended destination drive by model and size. Disconnect or protect unrelated data drives if that helps eliminate an accidental formatting risk.",
      ),
      section(
        "Install platform and device software",
        "Use official motherboard, CPU/chipset, graphics, and operating-system sources. Match downloads to the exact hardware and supported operating system. Avoid random driver-updater applications. Network access may require a driver available on another device, so plan ahead. Apply updates, check device detection, and confirm audio, networking, and display behavior before considering the installation complete.",
      ),
      section(
        "Establish a baseline",
        "Check idle and sustained-load temperature, component detection, and application behavior at defaults. Run representative workloads and an appropriate memory test. Watch for hardware error reports, crashes, visual corruption, or unexpected shutdowns. Save baseline results so future changes can be judged against something real. A benchmark completing once is not proof of long-term stability.",
      ),
      section(
        "Finish with recovery and backups",
        "Keep installation media, the applicable recovery-key information, and a separate copy of important files. Document working firmware settings and installed hardware. Enable a supported memory profile only after the default configuration is stable, then retest. Create a restoration plan before installing large projects or performing advanced tuning.",
      ),
    ],
    checklist: [
      "Verify detection, temperature, and fans",
      "Use official installation and driver sources",
      "Identify the correct destination drive",
      "Record a stable baseline and backup plan",
    ],
    warning:
      "Installing or formatting an operating system can erase data. Firmware updates require exact-model instructions and reliable power.",
    sources: [windows, manual],
    related: ["troubleshooting", "performance-tuning"],
    actions: [build()],
  },
  {
    slug: "troubleshooting",
    title: "Troubleshoot Without Random Swapping",
    description:
      "Classify symptoms, collect evidence, and change one thing at a time.",
    topics: ["POST", "Crashes", "Diagnostics"],
    sections: [
      section(
        "Describe the symptom precisely",
        "Separate no power, power without display, failed firmware initialization, failed OS boot, and crashes under load. Record what happened, when it began, and the last change. Note indicator LEDs, beep codes, temperatures, and error messages. Photograph cable placement when needed. “It does not work” cannot distinguish a loose front-panel lead from unstable memory.",
      ),
      section(
        "Start with external and reversible checks",
        "Confirm wall power, the PSU switch, monitor power and input, and the correct display connection. Check that the power button is connected according to the board manual. Disconnect power before reseating internal parts. Inspect required main, CPU, and GPU power connections. Never test unknown modular cables or open a PSU to investigate.",
      ),
      section(
        "Use the board’s diagnostics",
        "Read the exact manual for diagnostic LED meanings and initialization time. A light can indicate a stage where initialization stopped, not necessarily a conclusively failed component. Reduce the configuration only using supported arrangements: a single memory module in the specified slot, required cooling, and a valid graphics path. Confirm the selected CPU actually provides integrated graphics before removing a discrete GPU.",
      ),
      section(
        "Return performance settings to defaults",
        "If a system boots but crashes, undo recent tuning, memory profiles, or power-limit changes before replacing hardware. Follow the manual’s firmware reset or recovery process if needed and preserve any settings required to access existing storage. Retest the original symptom. Changing several settings together destroys the evidence needed to identify the cause.",
      ),
      section(
        "Investigate load-specific failures",
        "Compare CPU-heavy, GPU-heavy, memory, and storage workloads while monitoring behavior. A failure under one workload narrows the investigation but does not prove the named part is defective. Look for thermal limits, power issues, driver errors, and hardware error reports. Back up files before extensive testing of a system that may corrupt data. Stop testing when there is evidence of electrical or physical damage.",
      ),
      section(
        "Escalate with useful information",
        "Prepare the full parts list, firmware version, exact symptom, diagnostic codes, and tests already performed. Follow warranty support instructions and use known-good substitutions only when compatible and safe. Record each change and its result. A controlled test that disproves a theory is progress; repeated random swaps are expensive guesswork.",
      ),
    ],
    checklist: [
      "Classify and record the symptom",
      "Check simple connections first",
      "Retest at supported defaults",
      "Change one variable and log the result",
    ],
    warning:
      "Stop powering a system with smoke, burning smells, damaged connectors, or coolant leakage; seek qualified help.",
    sources: [manual, tuning],
    related: ["first-boot-and-software", "power-without-guessing"],
    actions: [build()],
  },
  {
    slug: "performance-tuning",
    title: "Tuning With Measurements and Recovery",
    description:
      "Understand overclocking, undervolting, and memory profiles without copying unsafe settings.",
    topics: ["Overclocking", "Undervolting", "Stability"],
    advanced: true,
    sections: [
      section(
        "Establish prerequisites and a reason",
        "Start with a correctly assembled, backed-up, stable default system. Know the exact processor, motherboard, cooler, PSU, firmware, and supported tuning tools. Decide whether the goal is more performance, less noise, or lower consumption. If the default system already fails tests, tuning adds another variable and can hide the original fault. Read manufacturer guidance and understand warranty implications before changing operating limits.",
      ),
      section(
        "Understand what you are changing",
        "Overclocking changes operation beyond a defined stock configuration. Undervolting aims to operate with less voltage under a chosen behavior, but insufficient voltage can cause errors. Power limits, boost behavior, temperature, voltage, frequency, and workload interact. A setting that works for another unit of the same product is not automatically valid for yours. Memory profiles likewise depend on the complete platform.",
      ),
      section(
        "Measure an honest baseline",
        "Record performance in your actual applications along with temperature, noise, and power measurements where available. Keep the same test duration and ambient conditions for comparisons. Peak clock speed alone can disguise throttling or lower effective performance. Note crashes and hardware error reports. Preserve baseline settings and know the firmware recovery procedure before applying a change.",
      ),
      section(
        "Change one supported control at a time",
        "Use the platform manufacturer’s current documentation and supported controls. Make small changes within guidance, save a named profile if supported, and retest before proceeding. Do not combine CPU tuning, GPU tuning, and memory changes in one step. Avoid universal voltage recipes and unofficial assumptions about safe limits. Keep a record that lets you reproduce both the change and its reversal.",
      ),
      section(
        "Test more than a short benchmark",
        "Include sustained load, memory testing, your real workloads, and light or idle conditions where relevant. Instability can appear in different operating states. Watch for calculation errors, hardware error reports, visual artifacts, crashes, and corrupted output. A passing benchmark does not justify ignoring a failure elsewhere. Compare the practical benefit against the added heat, noise, and maintenance burden.",
      ),
      section(
        "Recover, then keep only worthwhile changes",
        "If behavior deteriorates, return to the last known-good configuration and repeat the failing test. If the machine cannot reach firmware setup, use the board’s documented recovery procedure. Restore backups if data has been affected. Recheck after firmware, driver, or major hardware changes. RetroForge’s stock-oriented PSU estimate does not account for your tuning, so reassess power and cooling independently.",
      ),
    ],
    checklist: [
      "Prove default stability and back up data",
      "Read exact-platform guidance and recovery steps",
      "Log one change at a time",
      "Test real workloads and multiple operating states",
    ],
    warning:
      "Operation outside manufacturer specifications can cause instability or damage and may affect warranty coverage. No universal voltage recommendation belongs in this guide.",
    sources: [
      tuning,
      {
        label: "Intel: overclocking overview",
        url: "https://www.intel.com/content/www/us/en/gaming/resources/overclocking-your-intel-processor.html",
      },
    ],
    related: ["memory-explained", "troubleshooting", "power-without-guessing"],
    actions: [build()],
  },
  {
    slug: "custom-liquid-cooling",
    title: "Plan a Maintainable Custom Loop",
    description:
      "Assess fit, materials, testing, and service access before choosing water-cooling components.",
    topics: ["Loop planning", "Leak testing", "Maintenance"],
    advanced: true,
    sections: [
      section(
        "Decide whether the added complexity is worthwhile",
        "A custom loop uses separately chosen blocks, pump, reservoir, radiators, fittings, tubing, and coolant. It adds assembly work, maintenance, and possible leak points. Compare the goal with a good air cooler or sealed liquid cooler before committing. RetroForge does not select or simulate custom-loop hardware; write a separate bill of materials and verify it against exact manuals.",
      ),
      section(
        "Match blocks to exact hardware",
        "A CPU block needs suitable socket mounting hardware. A graphics-card block must match the actual card PCB, not merely the GPU chip name; manufacturer revisions can matter. Confirm supported materials, coolant chemistry, and connector standards. Mixing inappropriate metals or fluids can create problems over time. Do not assume a brand name alone establishes compatibility across every product.",
      ),
      section(
        "Plan the loop on paper first",
        "Draw component locations, tubing routes, fill and drain access, and how parts can be removed for service. Check radiator and fan thickness with motherboard, RAM, GPU, and cable clearances. Choose fittings for the exact tubing dimensions and follow bend-radius requirements. Keep the pump supplied as its manufacturer directs and avoid layouts that make maintenance require dismantling the whole machine.",
      ),
      section(
        "Prepare and assemble according to manuals",
        "Follow cleaning, flushing, fitting, and block-mounting instructions for each product. Check seals and retention, and avoid overtightening. Do not run a pump dry. Protect components from spills during filling and inspect every connection. A pressure test can complement other checks only when its method and limits are appropriate for the products being tested.",
      ),
      section(
        "Leak-test before normal operation",
        "Use the cooling manufacturer’s specified isolated testing method and duration. The procedure should allow testing the loop without powering sensitive computer components as directed. Inspect fittings, blocks, radiators, and tubing repeatedly; a brief leak-free period is not the whole test. CORSAIR’s cited block manual recommends at least 24 hours for that system. Other products may have different instructions.",
      ),
      section(
        "Maintain and recover safely",
        "Record the coolant, materials, assembly date, and service interval from product guidance. Watch for contamination, unusual pump noise, falling fluid level, and changing temperatures. Plan safe draining before hardware upgrades. If a leak occurs, disconnect power safely, follow manufacturer recovery guidance, and inspect for damage before any restart. The absence of visible water does not establish that electronics are safe to energize.",
      ),
    ],
    checklist: [
      "Verify exact blocks, tubing, fittings, and materials",
      "Plan fill, drain, and service access",
      "Follow isolated leak-testing instructions",
      "Document coolant and maintenance schedule",
    ],
    warning:
      "Coolant leaks can damage powered hardware. Do not improvise pump power, pressure limits, or restart procedures.",
    sources: [
      {
        label: "CORSAIR: XC9 block installation and leak testing",
        url: "https://assets.corsair.com/image/upload/corsairmedia/sys_master/productcontent/WW_HXS_XC9_Gen2_RGB_AA.pdf",
      },
    ],
    related: ["airflow-that-makes-sense", "troubleshooting"],
    actions: [build("case")],
  },
  {
    slug: "upgrades-and-maintenance",
    title: "Upgrade and Maintain With a Plan",
    description:
      "Measure your constraint, preserve data, and recheck the dependencies affected by an upgrade.",
    topics: ["Upgrades", "Cleaning", "Backups"],
    sections: [
      section(
        "Upgrade the constraint you can demonstrate",
        "Measure what is limiting your actual workload before buying a part. Check CPU and GPU usage, memory pressure, storage capacity, temperatures, and application behavior. More expensive hardware will not necessarily solve software configuration, insufficient cooling, or a slow network. Compare the benefit with replacing the entire platform when an old socket or memory generation limits options.",
      ),
      section(
        "Recheck the whole dependency chain",
        "A new processor may require firmware support and different cooling. A GPU upgrade may require more PSU capacity, different approved power connections, and extra physical space. Adding storage can affect shared motherboard resources. Replacing a case affects mounting and airflow. Load your saved build, change the proposed component, and inspect issues; then verify details outside the site’s checks.",
      ),
      section(
        "Protect data and record working settings",
        "Make a separate backup and test access to important files before modifying hardware or storage. Record exact product names, firmware settings, and any recovery-key information relevant to encrypted storage. Keep installation media available. Understand whether a motherboard replacement can affect operating-system activation or storage access before dismantling the working system.",
      ),
      section(
        "Clean with appropriate isolation",
        "Shut down, disconnect mains power, and follow component instructions before opening the system. Clear accessible filters and vents without forcing debris into connectors. Prevent fans from overspinning during compressed-air cleaning and avoid unsuitable fluids. Do not open the PSU. Inspect damaged connectors or unusual discoloration rather than simply cleaning around them.",
      ),
      section(
        "Recommission after a change",
        "Check detection, temperature, fan operation, and connections after the upgrade. Start from a supported configuration and repeat the workload that motivated the change. Confirm the expected improvement and investigate new errors. Reassess tuning rather than assuming old profiles remain appropriate with a different processor, memory kit, firmware, or graphics card.",
      ),
      section(
        "Keep a useful maintenance record",
        "Record purchase dates, warranties, driver or firmware changes, and repeatable baseline results. Back up the parts list outside browser-local storage. Periodically check that backups can actually restore files. Maintenance should respond to environment and manufacturer guidance, not a ritual of replacing thermal material or updating firmware without a reason.",
      ),
    ],
    checklist: [
      "Measure the actual constraint",
      "Recheck power, fit, firmware, and connections",
      "Back up and retain recovery information",
      "Retest after changing hardware",
    ],
    warning:
      "Save and back up before replacing a working configuration. Browser-local builds are not an independent backup of your data.",
    sources: [manual, windows],
    related: ["budget-and-workload", "troubleshooting"],
    actions: [build()],
  },
];
