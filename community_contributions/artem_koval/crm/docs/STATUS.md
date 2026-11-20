# Status

The port of the UnderCover week one milestones is complete. The engine grew
past them into a domain-agnostic engine with five domain packs.

## In place

- The pilot: the backend with the queue, cases, decisions, the award limit,
  sign-off, and payment, with the dashboard pages and the agent.
- The harness: queue runs with a cap, the to-do list, one fresh subagent per
  case, section lookup in the wording and the manual, the failure path with
  one retry, and the check for missed cases.
- Five domain packs: insurance, helpdesk, opsdemo, library, and garage. Each
  pack carries its manifest, seed data, policy documents, instructions,
  context files, and eval sets, and a validator and a smoke run check it.
- The deterministic award engine: each pack carries pure award rules, and
  the engine resolves the award before the agent records the decision.
- The sign-in, the dispatch panel, the scoreboard, the settings, and the
  self-improvement rounds.
- The AWS targets under the local emulator, with the wiring gate.
- The dev container.

## Not in place

- The money format renders the dollar sign for every pack, so a pound pack
  shows dollars on engine surfaces.
- The garage pack's capacity facts sit in the reference data as static
  numbers. No engine surface counts live free slots.
- The AWS paths in this folder target the local emulator and a demo host. A
  real-account rollout has no guide here.
- The upstream week two milestones: durable state and the swarm.
