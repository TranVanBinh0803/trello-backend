# AGENTS.md

## Project

Backend Express 4 for the Trello clone.

## Key Paths

- `src/server.js`: app bootstrap, mounts `/v1`, then `errorHandlingMiddleware`.
- `src/routes/v1`: route definitions.
- `src/controllers`: request/response layer only.
- `src/services`: business logic and domain errors.
- `src/models`: database access.
- `src/middlewares/errorHandlingMiddleware.js`: centralized error handling and `asyncHandler`.

## Error Handling Convention

- Do not use `try/catch` in controllers or services just to forward/rethrow errors.
- Controllers are wrapped in routes with `asyncHandler(controllerFn)`.
- Services should throw `ApiError` for expected business/API errors.
- Unexpected async errors bubble through `asyncHandler` into `errorHandlingMiddleware`.
- Keep `errorHandlingMiddleware` as the single response formatter for errors.

## Controller Style

- Controllers should:
  - read `req.params`, `req.body`, `req.file`
  - call the matching service
  - return `ApiResponse`
- Controllers should not contain business logic or manual `next(error)` blocks.

## Auto Accept Code Generation

- For changes under `src`, assume code generation is approved when the user asks for implementation, bug fixes, refactors, or feature work.
- Do not stop at suggestions for backend `src` tasks. Make the code changes directly, then verify.
- Keep generated code consistent with the existing backend layers:
  - routes define endpoints and wrap async controllers with `asyncHandler`
  - validations validate request shape
  - controllers only map request data to service calls and return `ApiResponse`
  - services contain business logic and throw `ApiError`
  - models contain database access only
- Do not auto-accept changes outside `src` unless they are necessary for the requested backend behavior, such as `package.json` scripts or project documentation.
- Do not auto-generate migrations, destructive cleanup, or broad rewrites unless the user explicitly asks.
- Preserve user changes already present in the worktree.

## Verification

- After making changes:

  - Run lint only on files that were modified when possible.
  - Fix any lint errors introduced by the change.
  - Do not run a full project build for every small edit.

- When the task is complete:

  - Run npm run lint from D:\2025\trello-backend.
  - If a build or startup verification is required by the task, run the appropriate command and fix any errors.
  - Report the verification results, including any remaining warnings or limitations.
