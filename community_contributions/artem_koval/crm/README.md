# crm

A domain-agnostic CRM engine with domain packs. The engine runs a backoffice
queue. AI case workers read each case and decide it against the policy
documents. A human signs off large awards, and then the engine pays them.
The packs under `domains/` hold the words, the rules, and the seed data of
each domain: `insurance/` (a fictional travel insurer), `helpdesk/` (FastFix
IT support), `opsdemo/` (Nimbus OpsDesk), `library/` (Northgate Public
Library, whose loan desk works loan requests against the membership rules),
and `garage/` (AutoFix Vehicle Repair, whose repair desk routes jobs to
garages and authorizes the repair against the service agreement rules).
`CRM_DOMAIN` names the active pack; the default is insurance.

This folder is a community contribution. The engine grew out of the week one
milestones of this repository. It keeps the generic names: case, contract,
award, worker, decision. Each pack carries the domain words in its content,
and the one seam at `domains/loader.py` keeps the engine code free of domain
nouns. A new domain is a new pack folder, and the engine stays unchanged.

## Run it

You need Python 3.12 or newer, Node 22 or newer, and uv.

```bash
uv sync && npm install
cp .env.example .env   # the key is optional
npm run seed           # build crm.db from the active pack
npm run dev            # backend on 8000, dashboard on 5173
```

## Visit after launch

| Address | What runs there |
| --- | --- |
| `http://localhost:5173` | The dashboard — the queue, cases, scoreboard, settings |
| `http://localhost:8000/api/health` | The backend's health check |
| `http://127.0.0.1:8080` | The agent's service |
| `http://127.0.0.1:8081` | The copilot |
| `http://127.0.0.1:8006/mcp` | The context server |
| `http://127.0.0.1:8004` | The dev auth service |

**Sign in** at the dashboard with a worker email of the active pack and the
dev password `crm-dev` (`AUTH_DEV_PASSWORD`).

| Pack | Approves over the limit | Cannot |
| --- | --- | --- |
| insurance | `dana.whitfield@undercover.example` | `marcus.oyelaran@undercover.example` |
| helpdesk | `priya.nair@fastfix.example` | `marcus.bell@fastfix.example` |
| opsdemo | `ida.sorensen@nimbusops.example` | `tomas.rivera@nimbusops.example` |
| library | `rosa.meridian@northgate.example` | `iris.bonnell@northgate.example` |
| garage | `gordon.vale@autofix.example` | `tara.ellison@autofix.example` |

## Switch the domain

```bash
CRM_DOMAIN=library npm run seed && CRM_DOMAIN=library npm run dev
```

The variable reaches the seed and every service of `npm run dev`. The
screens speak the pack's words: the library queue shows loans and renewals,
the garage queue shows repair jobs and authorizations.

## Work a case with the agent

```bash
uv run -m agent CLM-1001
```

The `OPENROUTER_API_KEY` variable names no key in a fresh clone. The tests
and the e2e never call a model. A dev run without a key fails on the first
decision. Put a key in `.env` to work real cases.

## Examine it

```bash
npm run check                            # ruff, pyright, pytest, prettier, eslint, tsc, vitest, e2e
CRM_DOMAIN=library npx playwright test   # the loan desk flow on the library pack
CRM_DOMAIN=garage npx playwright test    # the repair desk flow on the garage pack
uv run python validate.py library        # the pack validator, from crm/
uv run python smoke.py library           # the pack smoke run, from crm/
```

The Python suite is hermetic: a stub model stands in for OpenRouter, and
every test gets its own seeded SQLite file. The e2e specs start their own
backend and dashboard on their own ports and post decisions through the
API, so they need no model either.

## Screenshots

`docs/screenshots/<pack>/` holds a captured desk for each pack: the sign-in
page, the queue, one case, the scoreboard, and the settings. Capture them
again with the stack stopped:

```bash
bash e2e/capture_domains.sh
```

The script seeds and starts the dev stack per pack, signs in the pack's
senior worker, captures the five shots into `docs/screenshots/<pack>/`, and
stops the stack.

## Demo on the public address

`deploy/demo_up.sh` runs the whole stack for a demo: the floci emulator,
the wiring gate, the library pack, and every port bound for the web. It
takes `--host ADDR` and `--emulator`. `deploy/demo_down.sh` tears it down
and closes the ports. `docs/demo_runbook.md` is the demo script, with the
click path and the code tour.

## Layout

| Path | What it holds |
| --- | --- |
| `backend/` | The FastAPI app, the database, and the seed |
| `agent/` | The harness, the tools, and the stub model |
| `auth/` | The dev auth service |
| `context/` | The context server the agent reads documents through |
| `dashboard/` | The React queue, case, scoreboard, and settings pages |
| `e2e/` | The Playwright specs, the stand-ins, and the capture script |
| `domains/insurance/` | The travel insurer pack |
| `domains/helpdesk/` | The FastFix IT support pack |
| `domains/opsdemo/` | The Nimbus OpsDesk pack |
| `domains/library/` | The Northgate Public Library loan desk pack |
| `domains/garage/` | The AutoFix Vehicle Repair repair desk pack |
| `domains/loader.py` | The one seam between the engine and the packs |
| `runtime/`, `agentcore/`, `deploy/` | The AWS invoke path, the CDK stack, and the compose files |
| `docs/` | The product documents |
| `port/` | The tool that ports the next upstream milestones |
| `.devcontainer/` | The dev container |

## Documents

`docs/BRIEF.md` states what the product does. `docs/HARNESS.md` states how
the agent works the queue. `docs/PROCESS.md` gives the commands and the
rules of work. `docs/TECH_STACK.md` names the stack. `docs/STATUS.md`
tracks the state of the engine.
