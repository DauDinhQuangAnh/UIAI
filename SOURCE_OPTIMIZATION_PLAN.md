# Source Optimization Plan: Business And Permission Screens

## Scope

This plan only covers the screens visible in the current sidebar screenshot:

- Business Management
  - `src/routes/_app/business/information.tsx`
  - `src/routes/_app/business/social-media.tsx`
- Permission Management
  - `src/routes/_app/roles/index.tsx`
  - `src/routes/_app/permissions/features.tsx`
  - `src/routes/_app/permissions/pages.tsx`
  - `src/routes/_app/permissions/actions.tsx`

Do not refactor or behavior-change these screens in this plan:

- Agents pages and related hooks/components.
- Conversation, knowledge, graph, analytics pages.
- `page-actions.tsx` and `role-permissions.tsx`, because they are not visible in the requested screenshot even though they are part of permission work.

## Non-Negotiables

- Do not change the current UI layout, colors, copy, visible controls, routes, or API contracts.
- Do not change business behavior unless a bug is found and explicitly approved.
- Keep frontend permission checks as UX only; backend remains the source of truth.
- Keep Social Media token/secret safety rules:
  - Do not log, persist, or expose raw `appSecret` or `pageAccessToken`.
  - Keep masked App Secret behavior unless the backend explicitly returns a safe value.
- Preserve the current create/update/delete flows.
- Run `npm.cmd run typecheck` and `npm.cmd run build` after each phase.

## Current Findings

### 1. Social Media Route Is Too Large

`src/routes/_app/business/social-media.tsx` is the largest hotspot. It currently contains:

- Route shell and permissions.
- Business/integration fetching.
- Create wizard state.
- OAuth resume logic.
- Page selection logic.
- Bot schedule draft logic.
- Manage integration dialog.
- Refresh token dialog.
- Delete integration dialog.
- Table rendering.
- API payload adapters.
- Validation helpers.
- Display helpers.

This makes the file hard to review and risky to change. The main goal is to split it into domain components and utility helpers without changing behavior.

### 2. Permission Screens Repeat CRUD Structure

Role List, Feature Config, Page Config, and Action Config share repeated patterns:

- Shell header.
- Toolbar with keyword/status filters.
- Loading/error/empty states.
- Table action buttons.
- Add/edit dialogs.
- Delete confirmation.
- Toast and API error handling.

The existing shared `src/components/permissions/permission-ui.tsx` is useful, but route files still contain sizable table/dialog code.

### 3. Display Order Logic Is Duplicated

Feature Config and Page Config both implement:

- Auto-generated `displayOrder`.
- Read-only by default.
- Manual unlock.
- Duplicate validation.

This should be extracted into small helpers to reduce future drift.

### 4. Business Information Is Already Reasonable

`src/routes/_app/business/information.tsx` already delegates form dialogs and table rendering to components under `src/components/business/information`. This page should be used as the style and structure reference, not heavily refactored.

## Target Architecture

### Business Information

Keep current structure. Only apply tiny cleanup if needed:

- Keep `information.tsx` as page orchestration.
- Keep dialogs/table/data helpers in `src/components/business/information`.
- Do not move unless required by shared utility extraction.

### Social Media

Proposed structure:

```text
src/routes/_app/business/social-media.tsx
src/components/business/social-media/social-media-create-dialog.tsx
src/components/business/social-media/social-media-manage-dialog.tsx
src/components/business/social-media/social-media-refresh-token-dialog.tsx
src/components/business/social-media/social-media-delete-dialog.tsx
src/components/business/social-media/social-media-table.tsx
src/components/business/social-media/bot-status-editor.tsx
src/components/business/social-media/schedule-editor.tsx
src/components/business/social-media/social-media-models.ts
src/components/business/social-media/social-media-utils.ts
```

Responsibilities:

- `social-media.tsx`
  - Route registration.
  - Permission checks.
  - Query/mutation orchestration.
  - Dialog open/close state.
  - Submit handlers that call hooks.
- `social-media-create-dialog.tsx`
  - App Config / Page / Bot Schedule wizard UI.
  - Receives current form, errors, loading flags, and handlers from route.
- `social-media-manage-dialog.tsx`
  - Current detail/update popup.
  - App Secret masked editing.
  - Bot status editor embedding.
- `social-media-refresh-token-dialog.tsx`
  - Popup opened from "Lam moi token lien ket".
  - Saves app config without redirecting to Facebook.
- `social-media-delete-dialog.tsx`
  - Confirms soft delete integration only.
- `social-media-table.tsx`
  - Provider table and row actions.
- `bot-status-editor.tsx`
  - Three-state editor:
    - Inactive.
    - Full time.
    - Part time with weekdays and time range.
- `schedule-editor.tsx`
  - Shared create wizard schedule editor.
- `social-media-models.ts`
  - Local UI-only types:
    - `ProviderFilter`
    - `CreateStep`
    - `ScheduleMode`
    - `ManageBotMode`
    - `PageScheduleDraft`
    - `SocialMediaCreateForm`
    - `SocialMediaCreatePageDraft`
    - `ManageConfigForm`
    - `RefreshTokenForm`
    - `SocialMediaIntegrationRow`
    - `SocialMediaTableRow`
- `social-media-utils.ts`
  - Constants:
    - `DEFAULT_TIMEZONE`
    - `FULL_TIME_START`
    - `FULL_TIME_END`
    - `DEFAULT_PART_TIME_START`
    - `DEFAULT_PART_TIME_END`
    - `APP_SECRET_MASK`
  - Adapters:
    - `createPageDraftFromManagedPage`
    - `defaultCreateForm`
    - `buildSocialMediaTableRows`
    - `integrationPages`
    - `displayPageName`
    - `displayDeleteTargetName`
    - `providerCode`
    - `isFacebookIntegration`
    - `appSecretDisplayValue`
    - `isEditedAppSecret`
    - `manageBotModeFromPage`
    - `scheduleDraftFromPage`
    - `managePagePayload`
    - `schedulesFromDraft`
    - `botScheduleFromDraft`
  - Validators:
    - `validateCreateConfig`
    - `validateCreatePages`
    - `validateCreateSchedules`
    - `validateCreateForm`
    - `validateCreateUntilStep`
    - `validateScheduleDraft`
    - `isValidScheduleTime`

### Permission Screens

Proposed structure:

```text
src/components/permissions/roles/role-dialog.tsx
src/components/permissions/roles/role-table.tsx
src/components/permissions/features/feature-dialog.tsx
src/components/permissions/features/feature-table.tsx
src/components/permissions/pages/page-dialog.tsx
src/components/permissions/pages/page-table.tsx
src/components/permissions/actions/action-dialog.tsx
src/components/permissions/actions/action-table.tsx
src/components/permissions/display-order.ts
```

Route files remain responsible for:

- Query params.
- Calling hooks.
- Holding modal targets.
- Submit/delete handlers.

Component files handle:

- Dialog markup.
- Table markup.
- Small field groups.

## Phase 1: Social Media Decomposition

### Goal

Reduce `src/routes/_app/business/social-media.tsx` from a large all-in-one file into a route orchestrator plus focused components/utilities.

### Files To Add

- `src/components/business/social-media/social-media-models.ts`
- `src/components/business/social-media/social-media-utils.ts`
- `src/components/business/social-media/schedule-editor.tsx`
- `src/components/business/social-media/bot-status-editor.tsx`
- `src/components/business/social-media/social-media-create-dialog.tsx`
- `src/components/business/social-media/social-media-manage-dialog.tsx`
- `src/components/business/social-media/social-media-refresh-token-dialog.tsx`
- `src/components/business/social-media/social-media-delete-dialog.tsx`
- `src/components/business/social-media/social-media-table.tsx`

### Files To Edit

- `src/routes/_app/business/social-media.tsx`

### Step-By-Step Work

1. Create `social-media-models.ts`.
   - Move local types and interfaces from route.
   - Export only types needed by components and route.
   - Keep API types imported from `src/api/social-media-types`.

2. Create `social-media-utils.ts`.
   - Move constants, normalizers, adapters, validation helpers.
   - Keep functions pure.
   - Do not import React here.
   - Keep API payload functions strongly typed.

3. Extract `ScheduleEditor`.
   - Move the create wizard schedule editor exactly as-is.
   - Props should remain simple:
     - `schedule`
     - `disabled`
     - `onChange`
   - Preserve existing class names.

4. Extract `BotStatusEditor`.
   - Move the three-state manage popup editor.
   - Preserve exact labels and styling.
   - Ensure it never sends API calls itself; it only emits state changes.

5. Extract `SocialMediaCreateDialog`.
   - Move wizard UI.
   - Keep submit orchestration in route.
   - Props:
     - `open`
     - `step`
     - `form`
     - `errors`
     - `businesses`
     - `managedPages`
     - `pagesLoading`
     - `pagesError`
     - `loading`
     - `onOpenChange`
     - `onStepChange`
     - `onFormChange`
     - `onRetryPages`
     - `onSubmit`

6. Extract `SocialMediaManageDialog`.
   - Move detail/update popup.
   - Keep API save handler in route.
   - Keep App Secret mask behavior.
   - Props:
     - `row`
     - `businesses`
     - `canUpdate`
     - `canReauthorize`
     - `saving`
     - `onOpenChange`
     - `onSaveConfig`
     - `onRefreshToken`

7. Extract `RefreshSocialMediaTokenDialog`.
   - Move refresh popup.
   - Keep handler in route.
   - Preserve behavior: save app config only, no Facebook redirect.

8. Extract `DeleteSocialMediaIntegrationDialog`.
   - Move delete confirmation.
   - Preserve soft-delete integration copy and behavior.

9. Extract `SocialMediaIntegrationsTable`.
   - Move table and row components.
   - Keep callbacks:
     - `onManage`
     - `onDelete`

10. Clean route imports.
    - `social-media.tsx` should mostly import hooks, permissions, dialogs/table, and utils.
    - Remove unused ReactNode/Table/Dialog imports from route after extraction.

### Risks

- Accidentally changing wizard state reset behavior.
- Accidentally breaking OAuth resume behavior after callback.
- Accidentally sending masked App Secret to backend.
- Accidentally changing delete from integration soft delete to page delete.
- Accidentally changing schedule payload from API doc 5.7.

### Guardrails

- Move code first; do not rewrite behavior.
- Keep component props close to the old local state names.
- After each extraction, run `npm.cmd run typecheck`.
- After full phase, run `npm.cmd run build`.

### Acceptance Criteria

- Social Media UI looks the same.
- Add link wizard still opens at App Config.
- OAuth start behavior for add link is unchanged.
- OAuth callback resume still opens Page step.
- Page selection and bot schedule saving still work.
- Manage popup still saves:
  - App Secret if edited.
  - Bot status/schedule via page update.
- Refresh token popup still saves app config and does not redirect to Facebook.
- Delete still calls integration soft delete endpoint.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.

## Phase 2: Permission Screens Cleanup

### Goal

Reduce route file size and duplication for Role List, Feature Config, Page Config, and Action Config without changing UX.

### Files To Add

- `src/components/permissions/roles/role-dialog.tsx`
- `src/components/permissions/roles/role-table.tsx`
- `src/components/permissions/features/feature-dialog.tsx`
- `src/components/permissions/features/feature-table.tsx`
- `src/components/permissions/pages/page-dialog.tsx`
- `src/components/permissions/pages/page-table.tsx`
- `src/components/permissions/actions/action-dialog.tsx`
- `src/components/permissions/actions/action-table.tsx`

### Files To Edit

- `src/routes/_app/roles/index.tsx`
- `src/routes/_app/permissions/features.tsx`
- `src/routes/_app/permissions/pages.tsx`
- `src/routes/_app/permissions/actions.tsx`

### Step-By-Step Work

1. Extract Role dialog.
   - Move `RoleDialog`.
   - Keep `RoleForm` type export local or move to a role model file if needed.
   - Keep route submit handlers unchanged.

2. Extract Role table.
   - Move table markup and role row actions.
   - Props:
     - `items`
     - `canUpdate`
     - `canDelete`
     - `canViewRolePermissions`
     - `onEdit`
     - `onDelete`
     - `onPermissions`
   - Keep route navigation in route handler, not table internals.

3. Extract Feature dialog and table.
   - Move `FeatureDialog`.
   - Move feature table row markup.
   - Preserve displayOrder unlock UI exactly.
   - Preserve system-defined tooltips.

4. Extract Page dialog and table.
   - Move `PageDialog`.
   - Move `FeatureSelect` if only page-specific, or keep local to page component.
   - Preserve `useSystemPageDefinitions` location carefully:
     - Prefer keeping it inside `PageDialog` if current behavior depends on selected feature.
     - Do not create extra API calls in route.

5. Extract Action dialog and table.
   - Move `ActionDialog`.
   - Move action table markup.
   - Preserve system-defined warning titles.

6. Clean route files.
   - Route files should only manage state, hooks, submit/delete handlers, and render high-level components.
   - Remove unused UI imports after extraction.

### Risks

- Accidentally changing permission guard logic.
- Accidentally changing page displayOrder recalculation.
- Accidentally moving `useSystemPageDefinitions` incorrectly and causing hook rule issues.
- Accidentally changing Role permission navigation.

### Guardrails

- Preserve current props and state names while moving.
- Do not create generic CRUD abstraction in this phase.
- Do not alter permission constants or button disabled logic.
- Run typecheck after each screen extraction.

### Acceptance Criteria

- Role List CRUD still works.
- Role permission button still navigates correctly.
- Feature Config create/edit/delete still works.
- Feature displayOrder behavior remains:
  - auto-generated
  - read-only until unlock
  - duplicate validation
- Page Config create/edit/delete still works.
- Page displayOrder remains feature-scoped.
- Action Config create/edit/delete still works.
- Missing permission users still see disabled buttons with titles.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.

## Phase 3: Shared Logic And Final Hardening

### Goal

After files are smaller and stable, extract only the small shared logic that is clearly duplicated. Do not over-abstract.

### Files To Add

- `src/components/permissions/display-order.ts`
- Optional:
  - `src/components/permissions/crud-messages.ts`
  - `src/components/business/social-media/social-media-errors.ts`

### Files To Edit

- `src/routes/_app/permissions/features.tsx`
- `src/routes/_app/permissions/pages.tsx`
- `src/components/permissions/features/feature-dialog.tsx`
- `src/components/permissions/pages/page-dialog.tsx`
- `src/routes/_app/business/social-media.tsx`
- Social Media utility files created in Phase 1.

### Step-By-Step Work

1. Extract displayOrder helpers.
   - `nextDisplayOrder(items)`
   - `nextDisplayOrderWithinGroup(items, groupId, getGroupId)`
   - `validatePositiveIntegerDisplayOrder(value)`
   - `validateDuplicateDisplayOrder(items, value, currentId?)`
   - `validateDuplicateDisplayOrderWithinGroup(items, groupId, value, currentId?)`

2. Replace Feature Config local helper usage.
   - Keep error messages exactly the same.
   - Keep field behavior exactly the same.

3. Replace Page Config local helper usage.
   - Keep feature-scoped duplicate validation.
   - Keep recalculation when selected feature changes and order is not unlocked.

4. Review Social Media utility functions.
   - Ensure adapters are pure.
   - Ensure masked App Secret is never sent.
   - Ensure full-time schedule conversion remains clear.

5. Review API error helper usage.
   - Do not create a large global error framework.
   - If there is duplicate local fallback formatting, extract small helpers only.

6. Final cleanup.
   - Remove unused exports.
   - Run `rg` for unused old component/function names.
   - Run typecheck and build.

### Risks

- Over-generalizing displayOrder and making it harder to read.
- Accidentally changing Vietnamese validation messages.
- Accidentally changing feature/page duplicate scope.

### Guardrails

- Extract tiny pure helpers only.
- Keep existing error strings unless a separate copy cleanup is approved.
- Do not touch route paths or generated route tree.

### Acceptance Criteria

- Feature/Page displayOrder behavior remains unchanged.
- Route files are meaningfully smaller.
- No generic abstraction hides resource-specific behavior.
- `npm.cmd run typecheck` passes.
- `npm.cmd run build` passes.

## Suggested Phase Commit Messages

- Phase 1: `refactor: split social media screen components`
- Phase 2: `refactor: split permission management screen components`
- Phase 3: `refactor: share display order helpers`

## Manual Regression Checklist

### Business Information

- List loads.
- Search/status filter works.
- Add business works.
- Edit business works.
- Delete business behavior unchanged.

### Social Media

- Facebook/TikTok tabs render the same.
- Add link opens App Config step.
- Add link still starts OAuth from App Config submit.
- OAuth callback still resumes Page step.
- Page list step can select multiple pages.
- Bot schedule step supports full time and part time.
- Manage popup layout unchanged.
- App Secret masked value is not submitted unless edited.
- Bot status editor supports:
  - inactive
  - full time
  - part time weekdays/time range
- Refresh token popup saves app config only.
- Delete integration calls integration soft delete endpoint.

### Role List

- Pagination still works.
- Add/edit/delete still work.
- Permission button still navigates to role permission page.
- Missing permissions still disable correct buttons.

### Feature Config

- Filter/search works.
- Add/edit/delete work.
- displayOrder auto-generation works.
- duplicate displayOrder validation works.

### Page Config

- Feature filter works.
- Menu/status filters work.
- Add/edit/delete work.
- displayOrder auto-generation per selected feature works.
- duplicate displayOrder validation within feature works.

### Action Config

- Filter/search works.
- Add/edit/delete work.
- System-defined warning titles remain.

