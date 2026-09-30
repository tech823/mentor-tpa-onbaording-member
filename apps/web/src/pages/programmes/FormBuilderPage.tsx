import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Lock,
  EyeOff,
} from "lucide-react";
import type { SubjectType } from "@mentor/shared";
import { useProgramme } from "@/features/programmes/programmes.hooks";
import { useFormConfig, useDeleteField, useReorderFields, useUpdateField } from "@/features/forms/forms.hooks";
import { useAuth } from "@/features/auth/useAuth";
import type { FormField } from "@/features/forms/forms.api";
import { FIELD_TYPE_LABELS } from "@/features/forms/field-utils";
import { PageHeader } from "@/components/PageHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FieldEditorDialog } from "./builder/FieldEditorDialog";
import { FormPreview } from "./builder/FormPreview";
import { OnboardingLinkCard } from "./builder/OnboardingLinkCard";
import { DocumentsConfig } from "./builder/DocumentsConfig";

export function FormBuilderPage() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const canManage = hasRole("SUPER_ADMIN", "ADMIN");

  const { data: programmeRes } = useProgramme(id);
  const { data: configRes, isLoading } = useFormConfig(id);
  const deleteField = useDeleteField(id!);
  const reorderFields = useReorderFields(id!);
  const updateField = useUpdateField(id!);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormField | null>(null);
  const [newFieldSubject, setNewFieldSubject] = useState<SubjectType>("MEMBER");

  const programme = programmeRes?.data;
  const config = configRes?.data;

  const openNew = (subject: SubjectType) => {
    setEditingField(null);
    setNewFieldSubject(subject);
    setEditorOpen(true);
  };
  const openEdit = (field: FormField) => {
    setEditingField(field);
    setEditorOpen(true);
  };

  const move = (orderedIds: string[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= orderedIds.length) return;
    const next = [...orderedIds];
    [next[index], next[target]] = [next[target]!, next[index]!];
    reorderFields.mutate(next);
  };

  if (isLoading || !config || !programme) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const allIds = config.fields.map((f) => f.id);
  const groups: { subject: SubjectType; title: string }[] = [
    { subject: "MEMBER", title: "Member Fields" },
    { subject: "FAMILY_MEMBER", title: "Family Member Fields" },
  ];

  return (
    <div>
      <Link to="/programmes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Programmes
      </Link>
      <PageHeader
        title={programme.name}
        subtitle={`${programme.corporate.name} · ${programme.corporate.shortCode}`}
        actions={
          canManage && (
            <Button asChild variant="outline">
              <Link to={`/programmes/${id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit programme
              </Link>
            </Button>
          )
        }
      />

      <Tabs defaultValue="fields">
        <TabsList>
          <TabsTrigger value="fields">Form Fields</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="link">Onboarding Link</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Fields */}
        <TabsContent value="fields" className="space-y-6">
          {groups.map((group) => {
            const fields = config.fields.filter((f) => f.subjectType === group.subject);
            return (
              <Card key={group.subject}>
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h3 className="font-semibold">{group.title}</h3>
                  {canManage && (
                    <Button size="sm" onClick={() => openNew(group.subject)}>
                      <Plus className="h-4 w-4" /> Add field
                    </Button>
                  )}
                </div>
                <CardContent className="p-0">
                  {fields.length === 0 && (
                    <p className="p-6 text-center text-sm text-muted-foreground">No fields yet.</p>
                  )}
                  {fields.map((field) => {
                    const globalIndex = allIds.indexOf(field.id);
                    return (
                      <div key={field.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        <div className={`min-w-0 flex-1 ${!field.isActive ? "opacity-50" : ""}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{field.label}</span>
                            {field.isRequired && (
                              <Badge variant="outline" className="border-destructive/40 text-[10px] text-destructive">
                                required
                              </Badge>
                            )}
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              {field.fieldKey}
                            </code>
                            {field.isSystem && (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Lock className="h-3 w-3" /> built-in
                              </Badge>
                            )}
                            {!field.isActive && (
                              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                                <EyeOff className="h-3 w-3" /> hidden
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {FIELD_TYPE_LABELS[field.fieldType]}
                            {field.options.length > 0 && ` · ${field.options.length} options`}
                          </div>
                        </div>
                        {canManage && (
                          <div className="flex shrink-0 items-center gap-1">
                            <div className="mr-1 flex items-center gap-1.5" title={field.isActive ? "Shown on form — turn off to hide" : "Hidden from form — turn on to show"}>
                              <Switch
                                checked={field.isActive}
                                disabled={updateField.isPending}
                                onCheckedChange={(checked) => updateField.mutate({ id: field.id, input: { isActive: checked } })}
                              />
                            </div>
                            <Button variant="ghost" size="icon" disabled={globalIndex <= 0 || reorderFields.isPending} onClick={() => move(allIds, globalIndex, -1)}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" disabled={globalIndex >= allIds.length - 1 || reorderFields.isPending} onClick={() => move(allIds, globalIndex, 1)}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(field)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(field)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsConfig config={config} canManage={canManage} />
        </TabsContent>

        <TabsContent value="link">
          <div className="max-w-2xl">
            <OnboardingLinkCard programme={programme} />
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <FormPreview config={config} />
        </TabsContent>
      </Tabs>

      {canManage && (
        <FieldEditorDialog
          programmeId={id!}
          field={editingField}
          defaultSubjectType={newFieldSubject}
          open={editorOpen}
          onOpenChange={setEditorOpen}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete field?"
        description={
          deleteTarget
            ? `"${deleteTarget.label}" and its data will be permanently removed. Tip: use the on/off switch to just hide it instead.`
            : undefined
        }
        destructive
        confirmLabel="Delete"
        loading={deleteField.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteField.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
        }
      />
    </div>
  );
}
