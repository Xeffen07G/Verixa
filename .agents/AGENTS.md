# VeriXa V2: Core Product & Design Principles

## Core Principles

1. **Evidence First**: Evidence comes before conclusions. The interface should encourage users to inspect evidence rather than blindly accept AI outputs. 
2. **Conversation is the Primary Interface**: Every major workflow should naturally transition into a conversation.
3. **Complexity Behind the Interface**: Users should never see implementation details such as embeddings, vector search, chunking, semantic indexing, or internal retrieval modes.
4. **Whitespace is a Feature**: The interface should never feel crowded. Empty space improves trust and readability.
5. **Clear Call to Action**: Every screen should answer one question: *"What should the user do next?"* If that answer isn't obvious, simplify the interface.
6. **Explain & ground**: AI should explain. Never simply provide an answer. Always explain why and always show supporting evidence whenever available.
7. **Motion Communicates State**: Animations are not decoration. Every animation should indicate progress, transition, or interaction.
8. **Consistency Over Creativity**: Every VeriXa product should feel like it belongs to the same operating system.
9. **Hierarchy of Needs**: Evidence first. Conversation second. Reports third.
10. **Trust is the Product**: Users should leave believing the result—not because AI said so—but because the evidence was clear.

---

## Directives (What to Avoid)

- **Never** introduce dashboards unless absolutely necessary.
- **Never** expose backend terminology.
- **Never** add features that require explanation.
- **Never** fill empty space just because it exists.
- **Never** use animations that don't communicate state or progression.
- **Never** add cards inside cards (nested containers).
- **Never** let secondary UI elements compete with the conversation.
- **Never** make users think about the underlying technical architecture.
- **Never** hide the primary action.
- **Never** sacrifice clarity for aesthetics.
