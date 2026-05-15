"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Camera,
  Loader2,
  UserCircle,
  Lock,
  BadgeCheck,
  CalendarDays,
  Mail,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// ── Schemas ───────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Informe a senha atual"),
    new_password: z.string().min(8, "Mínimo 8 caracteres"),
    confirm_password: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(value?: string): string {
  if (!value) return "Nao informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getUserLevelLabel(level?: string): string {
  if (level === "admin") return "Administrador";
  if (level === "premium") return "Premium";
  return "Gratuita";
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
): Promise<string> {
  const image = new Image();
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    400,
    400,
  );

  // Comprime iterativamente até ficar abaixo de 5 MB
  const maxBase64Len = Math.ceil((5 * 1024 * 1024 * 4) / 3); // ~6.67 MB em base64
  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > maxBase64Len && quality > 0.1) {
    quality = Math.max(0.1, +(quality - 0.1).toFixed(2));
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const { user, refreshUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Crop dialog
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // Profile form
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "" },
  });

  // Password form
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Preenche form quando os dados do usuário chegam
  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.name });
      setAvatarPreview(user.avatar ?? null);
    }
  }, [user, profileForm]);

  // ── Avatar upload ────────────────────────────────────────────────────────────

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 50 MB");
      return;
    }

    // Abre o dialog de recorte
    const dataUrl = await readFileAsDataURL(file);
    setCropSrc(dataUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCropDialogOpen(true);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCropConfirm() {
    if (!cropSrc || !croppedAreaPixels || !user) return;
    setAvatarLoading(true);
    try {
      const base64 = await getCroppedImg(cropSrc, croppedAreaPixels);
      setCropDialogOpen(false);
      setAvatarPreview(base64);
      await api.put(`/users/${user.id}`, { avatar: base64 });
      await refreshUser();
      toast.success("Foto atualizada");
    } catch {
      toast.error("Erro ao atualizar foto");
    } finally {
      setAvatarLoading(false);
    }
  }

  // ── Profile save ─────────────────────────────────────────────────────────────

  async function onProfileSubmit(values: ProfileValues) {
    if (!user) return;
    try {
      await api.put(`/users/${user.id}`, { name: values.name });
      await refreshUser();
      toast.success("Perfil atualizado");
    } catch {
      toast.error("Erro ao atualizar perfil");
    }
  }

  // ── Password save ────────────────────────────────────────────────────────────

  async function onPasswordSubmit(values: PasswordValues) {
    if (!user) return;
    try {
      await api.patch(`/users/${user.id}/password`, {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      toast.success("Senha alterada com sucesso");
      passwordForm.reset();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Erro ao alterar senha";
      toast.error(msg);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <div className="h-px w-full bg-gradient-to-r from-white/40 via-white/15 to-transparent" />
        <div className="p-5 text-center sm:text-left">
          <h1 className="font-display text-4xl uppercase leading-none tracking-wide text-white sm:text-5xl">
            Perfil
          </h1>
          <p className="mt-0.5 text-[12px] text-white/40">
            Gerencie suas informações pessoais e senha
          </p>
        </div>
      </div>

      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4 text-primary" />
            Foto de perfil
          </CardTitle>
          <CardDescription>
            Clique na foto para alterar e ajustar o recorte. Formatos aceitos:
            JPG, PNG, WebP (máx. 50 MB — a imagem será comprimida
            automaticamente).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          {/* Avatar clicável */}
          <div className="relative group">
            <Avatar className="h-24 w-24 ring-2 ring-border ring-offset-2 ring-offset-background">
              {avatarPreview && (
                <AvatarImage
                  src={avatarPreview}
                  alt={user?.name}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>

            {/* Overlay de câmera */}
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
            >
              {avatarLoading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <Button
              variant="ghost"
              size="sm"
              className="border border-white/15 bg-white/[0.06] text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
            >
              <Camera className="mr-2 h-3.5 w-3.5" />
              Alterar foto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-4 w-4 text-primary" />
            Informações pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-4"
            >
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* E-mail read-only */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  E-mail
                </label>
                <Input
                  value={user?.email ?? ""}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={profileForm.formState.isSubmitting}
                >
                  {profileForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar alterações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Sobre a conta
          </CardTitle>
          <CardDescription>
            Detalhes de seguranca e informacoes gerais do seu acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                Criada em
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {formatDate(user?.created_at)}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-3">
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verificacao
              </div>
              <p className="mt-1 text-sm font-medium text-emerald-200">
                {user?.email_verified ? "Conta verificada" : "Verificacao pendente"}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                E-mail de acesso
              </div>
              <p className="mt-1 break-all text-sm font-medium text-foreground">
                {user?.email ?? "Nao informado"}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Tipo de conta
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {getUserLevelLabel(user?.user_level)}
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            O acesso esta protegido por autenticacao com senha ou codigo enviado
            por e-mail. Contas verificadas podem recuperar o acesso com codigo
            sem depender da senha.
          </p>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            Alterar senha
          </CardTitle>
          <CardDescription>
            Use uma senha forte com ao menos 8 caracteres.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha atual</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nova senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  {passwordForm.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Alterar senha
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* ── Crop Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={cropDialogOpen}
        onOpenChange={(open) => {
          if (!open) setCropDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar foto de perfil</DialogTitle>
          </DialogHeader>

          {/* Área do cropper — deve ter position: relative e altura fixa */}
          <div
            className="relative w-full overflow-hidden rounded-md bg-muted"
            style={{ height: 300 }}
          >
            {cropSrc && (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          {/* Zoom controles */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Zoom</span>
              <span className="tabular-nums font-medium text-foreground">
                {zoom.toFixed(1)}×
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Diminuir zoom"
                disabled={zoom <= 1}
                onClick={() =>
                  setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <div className="relative flex-1">
                {/* trilho colorido de progresso */}
                <div className="absolute inset-y-0 left-0 flex items-center w-full pointer-events-none">
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${((zoom - 1) / 2) * 100}%` }}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="relative w-full appearance-none bg-transparent cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-primary
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-background
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-webkit-slider-track]:h-1.5
                    [&::-webkit-slider-track]:rounded-full
                    [&::-webkit-slider-track]:bg-transparent
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-primary
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-background
                    [&::-moz-range-thumb]:shadow-md"
                />
              </div>

              <button
                type="button"
                aria-label="Aumentar zoom"
                disabled={zoom >= 3}
                onClick={() =>
                  setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCropDialogOpen(false)}
              disabled={avatarLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleCropConfirm} disabled={avatarLoading}>
              {avatarLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar recorte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
