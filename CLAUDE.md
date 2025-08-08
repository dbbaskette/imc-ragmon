# Combined Prompt

---

# Project Context

Refer to the user-provided 'PROJECT.md' file for specific project goals, tech stack, and architecture. That file is the primary source of truth for project-specific context.

---

# From: prompt/_base/core_prompt.md

# Core Prompt (Base)

## Purpose
This document provides unified rules for AI code assistants (Cursor, Windsurf, Claude, Gemini). The goal is to ensure all generated code is high-quality, secure, and easy to integrate.

## Prime Directive: Safety and Accuracy
- **Your #1 rule is to not hallucinate.**
- You must only provide solutions when you have strong evidence, understand the full context, and are confident the answer is correct and safe.
- If context is missing or a request is ambiguous, you **must** pause and ask clarifying questions before proceeding.

## Interaction Workflow
1.  **Clarify:** Ask questions to resolve ambiguity before generating code.
2.  **Reason & Plan (Chain-of-Thought):** For any non-trivial request, you must use Chain-of-Thought (CoT) reasoning. Before producing code, outline a detailed, structured plan. This includes breaking down the problem, considering trade-offs, and identifying edge cases. For significant architectural design, complex integrations, or unfamiliar APIs, this reasoning must be comprehensive. **Wait for approval on the plan before generating code.**
3.  **Generate:** Create minimal, idiomatic code. Add comments only for complex logic.
4.  **Self-Correct:** Before finalizing your response, review your work against this checklist:
    *   Does the code meet all requirements?
    *   Is it idiomatic for the language and framework?
    *   Is it secure? (See Security section below).
    *   Does it include necessary tests?
    *   Are file paths and explanations clear?

## Output Formatting
- Use Markdown.
- Use language-tagged code blocks.
- When creating a new file, **always** state its full intended path.
- When modifying an existing file, present the changes in a `diff` format.
- When creating multiple files, show a file tree first, then each file's content.

## General Code Quality
- **Immutability:** Prefer immutable data structures and objects where practical.
- **Constants:** Avoid "magic strings" and "magic numbers." Use named constants.

## Security & Compliance
- Do not include secrets in examples.
- Redact creds and tokens.
- Flag insecure patterns and propose safe alternatives.

## Testing & Validation
- Provide unit or integration test examples for all new business logic.
- Include a simple command to run the tests (e.g., `mvn test`, `npm test`).

## Token & Output Efficiency
- **Always be mindful of token consumption and cost.** This is especially critical for: logs, responses from other LLMs, network requests, and CLI printouts.
- Minimize unnecessary output and avoid repetition. Keep responses, especially JSON or config files, tight and concise.
- Use logging (`log.debug`, `System.out.println`) judiciously and only where it adds significant value for debugging.
- When asked to summarize or explain, offer a “concise” and an “expanded” version if appropriate.
- If the request involves prompt engineering for another LLM, include advice on token budgeting.

## Tool-Specific Notes
- **Cursor/Windsurf**: Can reference multiple files; keep prompts modular.
- **Claude/Gemini**: Prefer a single consolidated context (`combined_prompt.md`), or upload the same modular files.

---

# From: prompt/spring_boot_service/spring_prompt.md

# Spring Boot Application Prompt

## Purpose
You are assisting with the development of a Spring Boot application.

## Rules
1. Use annotations such as `@RestController`, `@Service`, and `@Repository` appropriately.
2. Structure code with clear separation of concerns (Controller, Service, Repository).
3. Use constructor injection (no field injection).
4. Prefer `ResponseEntity<?>` for REST responses and include relevant HTTP status codes.
5. Externalize configuration in `application.yml`. Show example snippets when adding new props.
6. Provide tests (JUnit + Testcontainers when DBs are involved).

## Dependencies
- Spring Boot 3.x
- Maven or Gradle

## Deliverables (when asked)
- Controller, Service, Repository code
- DTOs + validation
- `application.yml` updates
- Unit / integration tests

---

# From: prompt/app_web/web_app_prompt.md

🚀 AI Code Assistant: Web Application Prompt
Objective: Build a production-ready, modern web application.

I. FOUNDATION
This prompt inherits all principles from _base/core_prompt.md. Adhere to all Prime Directives and development workflows defined there.

II. TECHNICAL STACK & PRACTICES
Framework: Use React with functional components and Hooks.

Styling: Use Tailwind CSS for all styling. Do not write custom CSS files unless absolutely necessary for complex animations.

Structure: Create small, reusable components. Use App as the main, default-exported component.

State Management: For simple to moderate complexity, use React Context. For complex applications, use Zustand.

Responsiveness: All components and layouts MUST be fully responsive and tested on mobile, tablet, and desktop viewport sizes. Use Tailwind's responsive prefixes (sm:, md:, lg:) extensively.

III. USER EXPERIENCE (UX)
Layout: Center the main application container on the page. Use generous padding and whitespace.

Feedback: For asynchronous actions, provide immediate user feedback with loading spinners or skeleton loaders. Display success or error messages in non-disruptive modals or toast notifications.

Accessibility: Use semantic HTML5 tags. Ensure all images have alt attributes and all form inputs have associated labels.
