import { useState, useEffect, useRef } from "react";
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2,
  Star,
  Pencil,
  Check,
  X,
  Loader2,
  Shield,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  profileApi,
  addressApi,
  type CustomerProfile,
  type CustomerAddress,
  type CreateAddressPayload,
} from "@/api/customer";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when profile is saved so sidebar can update displayed name */
  onProfileUpdated?: (profile: CustomerProfile) => void;
}

type Tab = "profile" | "addresses";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAddress(addr: CustomerAddress): string {
  const parts = [addr.line1, addr.city, addr.state, addr.country].filter(
    Boolean,
  );
  return parts.join(", ");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getApiError(err: unknown): string {
  return (
    (err as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? "Something went wrong. Please try again."
  );
}

// ─── Address Form ─────────────────────────────────────────────────────────────

interface AddressFormProps {
  initial?: Partial<CreateAddressPayload>;
  onSave: (payload: CreateAddressPayload) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: string;
  submitLabel?: string;
}

function AddressForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
  submitLabel = "Save Address",
}: AddressFormProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [line1, setLine1] = useState(initial?.line1 ?? "");
  const [line2, setLine2] = useState(initial?.line2 ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? "");
  const [country, setCountry] = useState(initial?.country ?? "");
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave({
      label: label.trim() || undefined,
      line1: line1.trim(),
      line2: line2.trim() || undefined,
      city: city.trim(),
      state: state.trim() || undefined,
      postal_code: postalCode.trim() || undefined,
      country: country.trim().toUpperCase(),
      is_default: isDefault,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Label <span className="font-normal">(e.g. Home, Office)</span>
        </Label>
        <Input
          placeholder="Office"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* Line 1 */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Street Address <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="123 Main Street"
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          required
          className="h-8 text-sm"
        />
      </div>

      {/* Line 2 */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">
          Apt / Suite / Unit
        </Label>
        <Input
          placeholder="Suite 4B"
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="New York"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            State / Province
          </Label>
          <Input
            placeholder="NY"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Postal + Country */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Postal Code</Label>
          <Input
            placeholder="10001"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Country <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="US"
            value={country}
            onChange={(e) =>
              setCountry(e.target.value.toUpperCase().slice(0, 2))
            }
            maxLength={2}
            required
            className="h-8 text-sm font-mono uppercase"
          />
        </div>
      </div>

      {/* Set as default */}
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <div
          onClick={() => setIsDefault((v) => !v)}
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
            isDefault
              ? "bg-orange-500 border-orange-500"
              : "border-border group-hover:border-orange-400",
          )}
        >
          {isDefault && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          Set as default delivery address
        </span>
      </label>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={
            saving ||
            !line1.trim() ||
            !city.trim() ||
            country.trim().length !== 2
          }
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function CustomerProfileModal({
  open,
  onClose,
  onProfileUpdated,
}: CustomerProfileModalProps) {
  const [tab, setTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Address state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<CustomerAddress | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Load data when modal opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError("");
    setEditing(false);
    setShowAddForm(false);
    setEditingAddr(null);

    Promise.all([profileApi.get(), addressApi.list()])
      .then(([p, a]) => {
        setProfile(p);
        setFullName(p.full_name);
        setPhone(p.phone ?? "");
        setCompanyName(p.company_name ?? "");
        setAddresses(a);
      })
      .catch(() => setLoadError("Failed to load profile. Please try again."))
      .finally(() => setLoading(false));
  }, [open]);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // ── Profile save ────────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!profile) return;
    setProfileError("");
    setSavingProfile(true);
    try {
      const updated = await profileApi.update({
        full_name: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        company_name: companyName.trim() || undefined,
      });
      setProfile(updated);
      setEditing(false);
      setProfileSaved(true);
      onProfileUpdated?.(updated);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setProfileError(getApiError(err));
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelEdit() {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setCompanyName(profile.company_name ?? "");
    setProfileError("");
    setEditing(false);
  }

  // ── Address handlers ────────────────────────────────────────────────────────

  async function handleAddAddress(payload: CreateAddressPayload) {
    setAddrError("");
    setSavingAddr(true);
    try {
      const newAddr = await addressApi.add(payload);
      // If set as default, clear existing defaults
      setAddresses((prev) =>
        [
          ...(payload.is_default
            ? prev.map((a) => ({ ...a, is_default: false }))
            : prev),
          newAddr,
        ].sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0)),
      );
      setShowAddForm(false);
    } catch (err) {
      setAddrError(getApiError(err));
    } finally {
      setSavingAddr(false);
    }
  }

  async function handleUpdateAddress(
    id: string,
    payload: CreateAddressPayload,
  ) {
    setAddrError("");
    setSavingAddr(true);
    try {
      const updated = await addressApi.update(id, payload);
      setAddresses((prev) =>
        prev.map((a) => (a.customer_address_id === id ? updated : a)),
      );
      setEditingAddr(null);
    } catch (err) {
      setAddrError(getApiError(err));
    } finally {
      setSavingAddr(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    setDeletingId(id);
    try {
      await addressApi.delete(id);
      setAddresses((prev) => {
        const remaining = prev.filter((a) => a.customer_address_id !== id);
        // If the deleted one was default and there are others, the backend already promoted the next
        // Re-fetch to get accurate state, or just mark the first remaining as default
        const hadDefault = prev.find(
          (a) => a.customer_address_id === id,
        )?.is_default;
        if (hadDefault && remaining.length > 0) {
          remaining[0] = { ...remaining[0], is_default: true };
        }
        return remaining;
      });
    } catch {
      // silent — unlikely to fail after confirmation
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetDefault(id: string) {
    setSettingDefaultId(id);
    try {
      await addressApi.setDefault(id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.customer_address_id === id,
        })),
      );
    } catch {
      // silent
    } finally {
      setSettingDefaultId(null);
    }
  }

  // ── Render guard ────────────────────────────────────────────────────────────

  if (!open) return null;

  const initials = (profile?.full_name ?? "C")[0].toUpperCase();

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
    >
      <div
        className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl ring-1 ring-foreground/10 overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="relative bg-zinc-950 px-6 pt-8 pb-6 overflow-hidden">
          {/* subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>

          <div className="relative z-10 flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30 shrink-0">
              <span className="text-white font-bold text-xl">{initials}</span>
            </div>

            <div className="min-w-0">
              <p className="text-white font-semibold text-lg leading-tight truncate">
                {profile?.full_name ?? "—"}
              </p>
              <p className="text-zinc-400 text-sm truncate mt-0.5">
                {profile?.email}
              </p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {profile?.customer_type && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {profile.customer_type === "business" ? (
                      <Building2 className="w-2.5 h-2.5" />
                    ) : (
                      <User className="w-2.5 h-2.5" />
                    )}
                    {profile.customer_type}
                  </span>
                )}
                {profile?.status && (
                  <span
                    className={cn(
                      "inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full",
                      profile.status === "active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {profile.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="relative z-10 flex gap-1 mt-5">
            {(["profile", "addresses"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setShowAddForm(false);
                  setEditingAddr(null);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors",
                  tab === t
                    ? "bg-orange-500 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5",
                )}
              >
                {t}
                {t === "addresses" && addresses.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded-full">
                    {addresses.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[420px] overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading profile…
            </div>
          ) : loadError ? (
            <div className="flex items-center gap-2 m-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {loadError}
            </div>
          ) : tab === "profile" ? (
            // ── Profile tab ──────────────────────────────────────────────────
            <div className="p-6 space-y-5">
              {/* Success flash */}
              {profileSaved && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Profile updated
                  successfully.
                </div>
              )}

              {/* Error */}
              {profileError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {profileError}
                </div>
              )}

              {editing ? (
                /* ── Edit mode ── */
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-9"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Phone
                    </Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      className="h-9"
                    />
                  </div>
                  {profile?.customer_type === "business" && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Company Name
                      </Label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCancelEdit}
                      disabled={savingProfile}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleSaveProfile}
                      disabled={savingProfile || !fullName.trim()}
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <>
                  <div className="space-y-3">
                    {/* Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Full Name
                        </p>
                        <p className="text-sm font-medium truncate">
                          {profile?.full_name}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Email
                        </p>
                        <p className="text-sm font-medium truncate">
                          {profile?.email}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                        read-only
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Phone
                        </p>
                        <p className="text-sm font-medium">
                          {profile?.phone ?? (
                            <span className="text-muted-foreground italic">
                              not set
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Company (business only) */}
                    {profile?.customer_type === "business" && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            Company
                          </p>
                          <p className="text-sm font-medium">
                            {profile?.company_name ?? (
                              <span className="text-muted-foreground italic">
                                not set
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Meta info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          Member Since
                        </p>
                      </div>
                      <p className="text-xs font-medium">
                        {formatDate(profile?.created_at ?? null)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          2-Factor Auth
                        </p>
                      </div>
                      <p
                        className={cn(
                          "text-xs font-medium",
                          profile?.mfa_enabled
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {profile?.mfa_enabled ? "Enabled" : "Not enabled"}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          ) : (
            // ── Addresses tab ─────────────────────────────────────────────────
            <div className="p-6 space-y-4">
              {/* Edit form */}
              {editingAddr && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
                  <p className="text-sm font-semibold mb-3 text-foreground">
                    Edit Address
                  </p>
                  <AddressForm
                    initial={{
                      label: editingAddr.label ?? "",
                      line1: editingAddr.line1,
                      line2: editingAddr.line2 ?? "",
                      city: editingAddr.city,
                      state: editingAddr.state ?? "",
                      postal_code: editingAddr.postal_code ?? "",
                      country: editingAddr.country,
                      is_default: editingAddr.is_default,
                    }}
                    onSave={(payload) =>
                      handleUpdateAddress(
                        editingAddr.customer_address_id,
                        payload,
                      )
                    }
                    onCancel={() => {
                      setEditingAddr(null);
                      setAddrError("");
                    }}
                    saving={savingAddr}
                    error={addrError}
                    submitLabel="Update Address"
                  />
                </div>
              )}

              {/* Add form */}
              {showAddForm && !editingAddr && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
                  <p className="text-sm font-semibold mb-3 text-foreground">
                    New Address
                  </p>
                  <AddressForm
                    onSave={handleAddAddress}
                    onCancel={() => {
                      setShowAddForm(false);
                      setAddrError("");
                    }}
                    saving={savingAddr}
                    error={addrError}
                  />
                </div>
              )}

              {/* Address list */}
              {addresses.length === 0 && !showAddForm ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No addresses yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Add a delivery address to start placing orders.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowAddForm(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => {
                    const isDeleting = deletingId === addr.customer_address_id;
                    const isSettingDefault =
                      settingDefaultId === addr.customer_address_id;
                    return (
                      <div
                        key={addr.customer_address_id}
                        className={cn(
                          "rounded-xl border p-4 transition-colors",
                          addr.is_default
                            ? "border-orange-500/30 bg-orange-500/5"
                            : "border-border bg-card hover:bg-accent/30",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                addr.is_default
                                  ? "bg-orange-500/15"
                                  : "bg-muted",
                              )}
                            >
                              <MapPin
                                className={cn(
                                  "w-3.5 h-3.5",
                                  addr.is_default
                                    ? "text-orange-500"
                                    : "text-muted-foreground",
                                )}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {addr.label && (
                                  <span className="text-sm font-semibold">
                                    {addr.label}
                                  </span>
                                )}
                                {addr.is_default && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] border-0 bg-orange-500/15 text-orange-600 dark:text-orange-400 font-medium py-0"
                                  >
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                {addr.line1}
                                {addr.line2 ? `, ${addr.line2}` : ""}
                                <br />
                                {[addr.city, addr.state, addr.postal_code]
                                  .filter(Boolean)
                                  .join(", ")}
                                {" · "}
                                {addr.country}
                              </p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!addr.is_default && (
                              <button
                                onClick={() =>
                                  handleSetDefault(addr.customer_address_id)
                                }
                                disabled={!!settingDefaultId}
                                title="Set as default"
                                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-colors disabled:opacity-40"
                              >
                                {isSettingDefault ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Star className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingAddr(addr);
                                setShowAddForm(false);
                                setAddrError("");
                              }}
                              title="Edit"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteAddress(addr.customer_address_id)
                              }
                              disabled={!!deletingId}
                              title="Delete"
                              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add another */}
                  {!showAddForm && !editingAddr && (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full flex items-center gap-2 justify-center rounded-xl border border-dashed border-border hover:border-orange-500/40 hover:bg-orange-500/5 py-3 text-sm text-muted-foreground hover:text-orange-500 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add another address
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                profile?.status === "active"
                  ? "bg-emerald-500"
                  : "bg-muted-foreground",
              )}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {profile?.status ?? "loading"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Close <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}