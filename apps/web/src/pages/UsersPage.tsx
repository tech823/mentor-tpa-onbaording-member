import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users as UsersIcon, Plus, UserPlus } from "lucide-react";
import { ROLES, createUserSchema, type CreateUserInput } from "@mentor/shared";
import { api, ApiRequestError } from "@/lib/api";
import { useCorporates } from "@/features/corporates/corporates.hooks";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const roleVariant: Record<string, "default" | "secondary" | "success"> = {
  SUPER_ADMIN: "default",
  ADMIN: "secondary",
  CORPORATE_ADMIN: "success",
};

export function UsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => api.get<UserRow[]>("/users") });
  const rows = data?.data ?? [];

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.put(`/users/${id}/active`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Admin accounts and their access"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New User
          </Button>
        }
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Last login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <UsersIcon className="mx-auto mb-2 h-8 w-8 opacity-40" /> No users
                </TableCell>
              </TableRow>
            )}
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant={roleVariant[u.role] ?? "secondary"}>{u.role.replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={u.isActive}
                    onCheckedChange={(v) => toggleActive.mutate({ id: u.id, isActive: v })}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <NewUserDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function NewUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { data: corporatesRes } = useCorporates({ page: 1, pageSize: 100 });
  const corporates = corporatesRes?.data ?? [];
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "ADMIN", corporateIds: [] },
  });

  const role = watch("role");
  const selected = watch("corporateIds") ?? [];

  const create = useMutation({
    mutationFn: (input: CreateUserInput) => api.post("/users", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      reset();
      onOpenChange(false);
    },
  });

  const onSubmit = async (values: CreateUserInput) => {
    setServerError(null);
    try {
      await create.mutateAsync(values);
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    }
  };

  const toggleCorp = (id: string) => {
    setValue("corporateIds", selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id], {
      shouldValidate: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Create user
          </DialogTitle>
          <DialogDescription>Add an admin and assign the corporates they can access.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select {...register("role")} className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Temporary password</Label>
              <Input type="text" {...register("password")} placeholder="min 8 characters" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          {role !== "SUPER_ADMIN" && (
            <div className="space-y-1.5">
              <Label>Assigned corporates</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {corporates.length === 0 && <p className="p-2 text-xs text-muted-foreground">No corporates yet.</p>}
                {corporates.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleCorp(c.id)} />
                    {c.name} <span className="text-xs text-muted-foreground">({c.shortCode})</span>
                  </label>
                ))}
              </div>
              {errors.corporateIds && <p className="text-xs text-destructive">{errors.corporateIds.message as string}</p>}
            </div>
          )}

          {serverError && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</div>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
