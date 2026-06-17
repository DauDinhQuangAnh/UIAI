import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, FloppyDisk, ShieldChevron, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { PermissionPageShell, apiErrorMessage } from "@/components/permissions/permission-ui";
import {
  useCopyRolePermissions,
  usePatchRolePermissions,
  useReplaceRolePermissions,
  useRolePermissionMatrix,
  useRoles,
} from "@/api/hooks/roles";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

export const Route = createFileRoute("/_app/permissions/role-permissions")({
  validateSearch: (search: Record<string, unknown>) => ({
    roleId: typeof search.roleId === "string" ? search.roleId : undefined,
  }),
  component: RolePermissionConfigScreen,
});

function RolePermissionConfigScreen() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const can = usePermissionSet();
  const [selectedRoleId, setSelectedRoleId] = useState(search.roleId ?? "");
  const [sourceRoleId, setSourceRoleId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const roles = useRoles({ isActive: true, pageNumber: 1, pageSize: 100 });
  const matrix = useRolePermissionMatrix(selectedRoleId || undefined);
  const replacePermissions = useReplaceRolePermissions();
  const patchPermissions = usePatchRolePermissions();
  const copyPermissions = useCopyRolePermissions();
  const roleItems = roles.data?.items ?? [];
  const selectedRole = roleItems.find((role) => role.id === selectedRoleId);
  const sourceRoles = roleItems.filter((role) => role.id !== selectedRoleId);
  const selectedCount = selectedIds.size;
  const originalGrantedIds = useMemo(() => new Set(matrix.data?.grantedPageActionIds ?? []), [matrix.data]);
  const grantPageActionIds = useMemo(
    () => Array.from(selectedIds).filter((id) => !originalGrantedIds.has(id)),
    [originalGrantedIds, selectedIds],
  );
  const revokePageActionIds = useMemo(
    () => Array.from(originalGrantedIds).filter((id) => !selectedIds.has(id)),
    [originalGrantedIds, selectedIds],
  );
  const hasPartialChanges = grantPageActionIds.length > 0 || revokePageActionIds.length > 0;
  const totalActions = useMemo(
    () => matrix.data?.features.reduce((featureTotal, feature) => featureTotal + feature.pages.reduce((pageTotal, page) => pageTotal + page.actions.length, 0), 0) ?? 0,
    [matrix.data],
  );

  useEffect(() => {
    if (search.roleId && search.roleId !== selectedRoleId) setSelectedRoleId(search.roleId);
  }, [search.roleId, selectedRoleId]);

  useEffect(() => {
    if (!matrix.data) return;
    setSelectedIds(new Set(matrix.data.grantedPageActionIds));
  }, [matrix.data]);

  const chooseRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    setSourceRoleId("");
    navigate({ to: "/permissions/role-permissions", search: { roleId } });
  };

  const toggleAction = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const save = () => {
    if (!selectedRoleId) return;
    replacePermissions.mutate(
      { roleId: selectedRoleId, body: { pageActionIds: Array.from(selectedIds) } },
      {
        onSuccess: (result) => {
          toast.success(`Đã lưu ${result.totalGrantedPermissions} quyền cho role.`);
          matrix.refetch();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể lưu quyền cho role.")),
      },
    );
  };

  const saveChanges = () => {
    if (!selectedRoleId) return;
    if (!hasPartialChanges) {
      toast.info("Chưa có thay đổi quyền để lưu.");
      return;
    }
    patchPermissions.mutate(
      { roleId: selectedRoleId, body: { grantPageActionIds, revokePageActionIds } },
      {
        onSuccess: (result) => {
          toast.success(`Đã lưu thay đổi, role hiện có ${result.totalGrantedPermissions} quyền.`);
          matrix.refetch();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể lưu thay đổi quyền cho role.")),
      },
    );
  };

  const copy = () => {
    if (!selectedRoleId || !sourceRoleId) return;
    copyPermissions.mutate(
      { targetRoleId: selectedRoleId, sourceRoleId },
      {
        onSuccess: (result) => {
          toast.success(`Đã copy ${result.totalGrantedPermissions} quyền.`);
          matrix.refetch();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể copy quyền từ role khác.")),
      },
    );
  };

  return (
    <PermissionPageShell
      title="Cấu hình quyền theo role"
      description="Chọn role, xem ma trận feature/page/action và lưu toàn bộ quyền bằng API role permissions."
      icon={ShieldChevron}
    >
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 rounded-md border border-border bg-surface p-3 xl:grid-cols-[1fr_1fr_auto_auto_auto]">
          <Select value={selectedRoleId} disabled={roles.isLoading} onValueChange={chooseRole}>
            <SelectTrigger aria-label="Chọn role">
              <SelectValue placeholder="Chọn role cần phân quyền" />
            </SelectTrigger>
            <SelectContent>
              {roleItems.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name} ({role.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceRoleId} disabled={!selectedRoleId || copyPermissions.isPending} onValueChange={setSourceRoleId}>
            <SelectTrigger aria-label="Copy quyền từ role">
              <SelectValue placeholder="Copy quyền từ role khác" />
            </SelectTrigger>
            <SelectContent>
              {sourceRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name} ({role.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="secondary" disabled={!can(PERMISSIONS.rolePermissions.update) || !selectedRoleId || !sourceRoleId} loading={copyPermissions.isPending} onClick={copy}>
            <Copy className="size-4" aria-hidden />
            Copy quyền
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!can(PERMISSIONS.rolePermissions.update) || !selectedRoleId || matrix.isError || !hasPartialChanges}
            loading={patchPermissions.isPending}
            onClick={saveChanges}
          >
            <FloppyDisk className="size-4" aria-hidden />
            Lưu thay đổi
          </Button>
          <Button type="button" disabled={!can(PERMISSIONS.rolePermissions.update) || !selectedRoleId || matrix.isError} loading={replacePermissions.isPending} onClick={save}>
            <FloppyDisk className="size-4" aria-hidden />
            Lưu toàn bộ
          </Button>
        </div>

        {selectedRole && (
          <div className="rounded-md border border-border bg-surface p-4 text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{selectedRole.name}</span> đang có {selectedCount}/{totalActions} quyền được chọn.
          </div>
        )}

        {!selectedRoleId ? (
          <EmptyState icon={ShieldCheck} title="Chọn role để phân quyền" description="Danh sách role được tải từ API /api/roles." />
        ) : matrix.isLoading ? (
          <div className="rounded-md border border-border bg-surface p-8 text-center text-sm text-text-secondary">Đang tải ma trận quyền...</div>
        ) : matrix.isError ? (
          <EmptyState
            icon={ShieldChevron}
            title="Không tải được ma trận quyền"
            description={apiErrorMessage(matrix.error, "Vui lòng thử lại sau.")}
            action={<Button type="button" variant="secondary" onClick={() => matrix.refetch()}>Tải lại</Button>}
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            {matrix.data?.features.map((feature) => (
              <div key={feature.id || feature.code} className="border-b border-border last:border-b-0">
                <div className="bg-surface-2 px-4 py-3">
                  <div className="font-semibold text-text-primary">{feature.name || feature.code}</div>
                  {feature.code && <div className="font-mono text-xs text-text-secondary">{feature.code}</div>}
                </div>
                <div className="divide-y divide-border">
                  {feature.pages.map((page) => (
                    <div key={page.id || page.code} className="grid gap-3 p-4 lg:grid-cols-[18rem_1fr]">
                      <div className="min-w-0">
                        <div className="font-medium text-text-primary">{page.name || page.code}</div>
                        <div className="truncate font-mono text-xs text-text-secondary">{page.route || page.code}</div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {page.actions.map((action) => (
                          <label
                            key={action.id}
                            className="flex min-h-12 items-start gap-2 rounded-md border border-border bg-bg px-3 py-2 text-sm text-text-primary"
                          >
                            <input
                              type="checkbox"
                              className="mt-1 size-4 accent-primary"
                              checked={selectedIds.has(action.id)}
                              disabled={!can(PERMISSIONS.rolePermissions.update) || !action.isActive}
                              onChange={(event) => toggleAction(action.id, event.target.checked)}
                            />
                            <span className="min-w-0">
                              <span className="block font-medium">{action.name || action.code}</span>
                              <span className="block truncate font-mono text-xs text-text-secondary">{action.permissionCode}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PermissionPageShell>
  );
}
