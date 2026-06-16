import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { LinkSimple, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { AddSocialLinkDialog } from "@/components/business/social-media/add-social-link-dialog";
import { DeleteSocialLinkDialog } from "@/components/business/social-media/delete-social-link-dialog";
import { EditSocialLinkDialog } from "@/components/business/social-media/edit-social-link-dialog";
import {
  EMPTY_ADD_FORM,
  SOCIAL_LINKS,
  createDefaultSchedule,
  type AddLinkForm,
  type AddStep,
  type EditLinkForm,
  type ScheduleState,
  type SocialLink,
} from "@/components/business/social-media/social-media-data";
import { SocialLinksTable } from "@/components/business/social-media/social-links-table";

export const Route = createFileRoute("/_app/business/social-media")({
  component: SocialMediaLinksScreen,
});

function SocialMediaLinksScreen() {
  const [links, setLinks] = useState<SocialLink[]>(SOCIAL_LINKS);
  const [addOpen, setAddOpen] = useState(false);
  const [addStep, setAddStep] = useState<AddStep>("credentials");
  const [form, setForm] = useState<AddLinkForm>(EMPTY_ADD_FORM);
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<ScheduleState>({});
  const [editTarget, setEditTarget] = useState<SocialLink | null>(null);
  const [editForm, setEditForm] = useState<EditLinkForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialLink | null>(null);

  const resetAddFlow = () => {
    setAddOpen(false);
    setAddStep("credentials");
    setForm(EMPTY_ADD_FORM);
    setSelectedPageIds([]);
    setSchedules({});
  };

  const openEdit = (link: SocialLink) => {
    const schedule = createDefaultSchedule();
    schedule.mode = link.status === "Part time" ? "partial" : "full";
    setEditTarget(link);
    setEditForm({
      business: link.business,
      appId: link.appId,
      appSecret: link.appSecret,
      page: link.page,
      pageId: link.pageId,
      status: link.status,
      schedule,
    });
  };

  const onSubmitEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget || !editForm) return;
    setLinks((current) =>
      current.map((link) =>
        link.id === editTarget.id
          ? {
              ...link,
              business: editForm.business,
              appId: editForm.appId,
              appSecret: editForm.appSecret,
              status: editForm.status,
            }
          : link,
      ),
    );
    setEditTarget(null);
    setEditForm(null);
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    setLinks((current) => current.filter((link) => link.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <BusinessPageShell
      title="Social Media Links"
      description="Manage social pages connected to each business profile."
      icon={LinkSimple}
      className="max-w-7xl"
    >
      <Tabs defaultValue="facebook" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-fit border border-brand-100 bg-surface">
            <TabsTrigger
              value="facebook"
              className="min-w-32 data-[state=active]:bg-brand-700 data-[state=active]:text-white"
            >
              Facebook
            </TabsTrigger>
            <TabsTrigger
              value="tiktok"
              className="min-w-32 data-[state=active]:bg-brand-700 data-[state=active]:text-white"
            >
              TikTok
            </TabsTrigger>
          </TabsList>
          <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add Link
          </Button>
        </div>

        <SocialLinksTable platform="facebook" links={links} onEdit={openEdit} onDelete={setDeleteTarget} />
        <SocialLinksTable platform="tiktok" links={links} onEdit={openEdit} onDelete={setDeleteTarget} />
      </Tabs>

      <AddSocialLinkDialog
        open={addOpen}
        step={addStep}
        form={form}
        selectedPageIds={selectedPageIds}
        schedules={schedules}
        setForm={setForm}
        setSelectedPageIds={setSelectedPageIds}
        setSchedules={setSchedules}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddFlow();
        }}
        onStepChange={setAddStep}
        onReset={resetAddFlow}
      />

      <EditSocialLinkDialog
        target={editTarget}
        form={editForm}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
            setEditForm(null);
          }
        }}
        onFormChange={setEditForm}
        onSubmit={onSubmitEdit}
      />

      <DeleteSocialLinkDialog
        target={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />
    </BusinessPageShell>
  );
}
