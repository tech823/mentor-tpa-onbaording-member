import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users as UsersIcon, Plus, UserPlus, Pencil, KeyRound, Copy, Check } from "lucide-react";
import { ROLES, createUserSchema, updateUserSchema, type CreateUserInput, type UpdateUserInput } from "@mentor/shared";
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
  corporateIds: string[];
}

const roleVariant: Record<string, "default" | "secondary" | "success"> = {
  SUPER_ADMIN: "default",
  ADMIN: "secondary",
  CORPORATE_ADMIN: "success",
};

export function UsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
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
              <TableHead className="text-end">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setResetTarget(u)} title="Reset password">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(u)} title="Edit role & access">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <NewUserDialog open={open} onOpenChange={setOpen} />
      <EditUserDialog user={editing} onClose={() => setEditing(null)} />
      <ResetPasswordDialog user={resetTarget} onClose={() => setResetTarget(null)} />
    </div>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPassword("");
      setDone(false);
      setErr(null);
      setCopied(false);
    }
  }, [user]);

  const generate = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
    const arr = new Uint32Array(14);
    crypto.getRandomValues(arr);
    setPassword(Array.from(arr, (n) => chars[n % chars.length]).join(""));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const reset = useMutation({
    mutationFn: () => api.put(`/users/${user!.id}/password`, { password }),
    onSuccess: () => setDone(true),
  });

  const submit = async () => {
    setErr(null);
    if (password.length < 8) {
      setErr("Password must be at least 8 characters.");
      return;
    }
    try {
      await reset.mutateAsync();
    } catch (e) {
      setErr(e instanceof ApiRequestError ? e.message : "Something went wrong");
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Reset password
          </DialogTitle>
          <DialogDescription>
            Set a new password for {user?.fullName} ({user?.email}). No email is sent — share it with the user yourself.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              Password updated. Share this with the user:
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">{password}</code>
              <Button variant="outline" size="icon" onClick={copy} title="Copy">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>New password</Label>
              <div className="flex gap-2">
                <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Type or generate" />
                <Button type="button" variant="outline" onClick={generate}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters. The user can change it after logging in.</p>
            </div>
            {err && <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</div>}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={reset.isPending || password.length < 8}>
                {reset.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Reset password
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
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

function EditUserDialog({ user, onClose }: { user: UserRow | null; onClose: () => void }) {
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
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { fullName: "", role: "ADMIN", corporateIds: [] },
  });

  // Prefill the form whenever a different user is opened.
  useEffect(() => {
    if (user) {
      reset({ fullName: user.fullName, role: user.role as UpdateUserInput["role"], corporateIds: user.corporateIds ?? [] });
      setServerError(null);
    }
  }, [user, reset]);

  const role = watch("role");
  const selected = watch("corporateIds") ?? [];

  const update = useMutation({
    mutationFn: (input: UpdateUserInput) => api.put(`/users/${user!.id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      onClose();
    },
  });

  const onSubmit = async (values: UpdateUserInput) => {
    setServerError(null);
    try {
      await update.mutateAsync(values);
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
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" /> Edit user
          </DialogTitle>
          <DialogDescription>
            Change this user's role and corporate access. {user?.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select {...register("role")} className="flex h-11 w-full rounded-lg border border-input bg-card px-3 text-sm">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                ))}
              </select>
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
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
