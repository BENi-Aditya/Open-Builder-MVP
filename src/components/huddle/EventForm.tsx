import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays, Image as ImageIcon, Loader2, MapPin, Plus, Rocket, Save, Sparkles, Trash2, Users, UserPlus, Ticket, ExternalLink, GripVertical, ChevronUp, ChevronDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { uploadEventMedia } from "@/lib/upload";
import {
  browserTimezone, getTimezones, zonedToUtcIso, utcIsoToZoned, getDirectionsUrl, GUEST_ROLES, GUEST_ROLE_LABEL, type HuddleEvent,
} from "@/lib/huddle";

type GuestDraft = {
  key: string;
  name: string;
  image_url: string | null;
  designation: string;
  organization: string;
  role: string;
  uploading?: boolean;
};

type GalleryDraft = { key: string; url: string | null; uploading: boolean; name?: string };

type SaveTarget = "draft" | "published" | "keep";

export function EventForm({
  mode,
  initial,
  onSaved,
}: {
  mode: "create" | "edit";
  initial?: HuddleEvent;
  onSaved: (eventId: string) => void;
}) {
  const { user } = useAuth();
  const [eventId] = useState(() => initial?.id ?? crypto.randomUUID());
  const tzList = useMemo(() => getTimezones(), []);

  const initialTz = initial?.timezone ?? browserTimezone();
  const initStart = initial ? utcIsoToZoned(initial.starts_at, initialTz) : { date: "", time: "17:00" };
  const initEnd = initial ? utcIsoToZoned(initial.ends_at, initialTz) : { date: "", time: "20:00" };
  const initDeadline = initial?.registration_deadline ? utcIsoToZoned(initial.registration_deadline, initialTz) : { date: "", time: "" };

  // basics
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  // time
  const [timezone, setTimezone] = useState(initialTz);
  const [date, setDate] = useState(initStart.date);
  const [startTime, setStartTime] = useState(initStart.time);
  const [endTime, setEndTime] = useState(initEnd.time);
  const [endDate, setEndDate] = useState(initEnd.date && initEnd.date !== initStart.date ? initEnd.date : "");
  const [deadlineDate, setDeadlineDate] = useState(initDeadline.date);
  const [deadlineTime, setDeadlineTime] = useState(initDeadline.time || "23:59");
  // location
  const [venue, setVenue] = useState(initial?.venue_name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [stateName, setStateName] = useState(initial?.state ?? "");
  const [country, setCountry] = useState(initial?.country ?? "India");
  const [lat, setLat] = useState(initial?.latitude != null ? String(initial.latitude) : "");
  const [lng, setLng] = useState(initial?.longitude != null ? String(initial.longitude) : "");
  const [mapsUrl, setMapsUrl] = useState(initial?.maps_url ?? "");
  // media
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.cover_image_url ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryDraft[]>(
    (initial?.images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ key: i.id, url: i.image_url, uploading: false })),
  );
  // guests
  const [guests, setGuests] = useState<GuestDraft[]>(
    (initial?.guests ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((g) => ({
      key: g.id, name: g.name, image_url: g.image_url, designation: g.designation ?? "", organization: g.organization ?? "", role: g.role,
    })),
  );
  // registration
  const [capacity, setCapacity] = useState(initial?.capacity != null ? String(initial.capacity) : "");
  const [registrationEnabled, setRegistrationEnabled] = useState(initial?.registration_enabled ?? true);
  const [saving, setSaving] = useState<SaveTarget | null>(null);

  const anyUploading = coverUploading || gallery.some((g) => g.uploading) || guests.some((g) => g.uploading);

  const locationPreview = useMemo(
    () => ({
      venue_name: venue, address, city, state: stateName, country,
      latitude: lat ? Number(lat) : null, longitude: lng ? Number(lng) : null, maps_url: mapsUrl || null,
    }),
    [venue, address, city, stateName, country, lat, lng, mapsUrl],
  );

  // ---------------------------------------------------------------- uploads
  const pickCover = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Cover must be an image");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
    setCoverUploading(true);
    try {
      const url = await uploadEventMedia(file, eventId, "cover");
      setCoverUrl(url);
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  const addGallery = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, 12);
    const drafts: GalleryDraft[] = list.map((f) => ({ key: crypto.randomUUID(), url: null, uploading: true, name: f.name }));
    setGallery((g) => [...g, ...drafts]);
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const key = drafts[i].key;
      try {
        const url = await uploadEventMedia(f, eventId, "gallery");
        setGallery((g) => g.map((x) => (x.key === key ? { ...x, url, uploading: false } : x)));
      } catch (e) {
        toast.error(`${f.name}: ${(e as Error).message || "upload failed"}`);
        setGallery((g) => g.filter((x) => x.key !== key));
      }
    }
  };

  const moveGallery = (idx: number, dir: -1 | 1) =>
    setGallery((g) => {
      const next = g.slice();
      const j = idx + dir;
      if (j < 0 || j >= next.length) return g;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const addGuest = () =>
    setGuests((g) => [...g, { key: crypto.randomUUID(), name: "", image_url: null, designation: "", organization: "", role: "mentor" }]);

  const updateGuest = (key: string, patch: Partial<GuestDraft>) => setGuests((g) => g.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const pickGuestPhoto = async (key: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Photo must be an image");
    updateGuest(key, { uploading: true });
    try {
      const url = await uploadEventMedia(file, eventId, "guests");
      updateGuest(key, { image_url: url, uploading: false });
    } catch (e) {
      toast.error((e as Error).message || "Upload failed");
      updateGuest(key, { uploading: false });
    }
  };

  const moveGuest = (idx: number, dir: -1 | 1) =>
    setGuests((g) => {
      const next = g.slice();
      const j = idx + dir;
      if (j < 0 || j >= next.length) return g;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  // ------------------------------------------------------------------- save
  const save = async (target: SaveTarget) => {
    if (!user) return;
    const publishing = target === "published" || (target === "keep" && initial?.status === "published");

    if (!title.trim()) return toast.error("Give the event a name");
    if (!date || !startTime || !endTime) return toast.error("Set the event date, start and end time");
    if (!venue.trim() || !address.trim() || !city.trim() || !country.trim()) return toast.error("Venue, address, city and country are required");
    if (publishing && !coverUrl) return toast.error("A cover image is required to publish");
    if (anyUploading) return toast.error("Wait for uploads to finish");
    for (const g of guests) if (!g.name.trim()) return toast.error("Every guest needs a name");

    const starts_at = zonedToUtcIso(date, startTime, timezone);
    const ends_at = zonedToUtcIso(endDate || date, endTime, timezone);
    if (new Date(ends_at) <= new Date(starts_at)) return toast.error("End time must be after start time");
    const registration_deadline = deadlineDate ? zonedToUtcIso(deadlineDate, deadlineTime || "23:59", timezone) : null;
    if (registration_deadline && new Date(registration_deadline) > new Date(starts_at)) return toast.error("Registration deadline must be before the event starts");
    if (capacity && (!/^\d+$/.test(capacity) || Number(capacity) <= 0)) return toast.error("Capacity must be a positive number");
    if ((lat && isNaN(Number(lat))) || (lng && isNaN(Number(lng)))) return toast.error("Latitude / longitude must be numbers");

    const status = target === "keep" ? (initial?.status ?? "draft") : target;

    setSaving(target);
    try {
      const payload = {
        title: title.trim(),
        tagline: tagline.trim() || null,
        description: description.trim() || null,
        cover_image_url: coverUrl,
        starts_at,
        ends_at,
        timezone,
        registration_deadline,
        registration_enabled: registrationEnabled,
        capacity: capacity ? Number(capacity) : null,
        venue_name: venue.trim(),
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim() || null,
        country: country.trim(),
        latitude: lat ? Number(lat) : null,
        longitude: lng ? Number(lng) : null,
        maps_url: mapsUrl.trim() || null,
        status,
      };

      if (mode === "create") {
        const { error } = await supabase.from("events").insert({ id: eventId, organizer_id: user.id, ...payload });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").update(payload).eq("id", eventId);
        if (error) throw error;
      }

      // Guests + gallery: replace wholesale (small lists, keeps ordering simple).
      const [{ error: dg }, { error: di }] = await Promise.all([
        supabase.from("event_guests").delete().eq("event_id", eventId),
        supabase.from("event_images").delete().eq("event_id", eventId),
      ]);
      if (dg) throw dg;
      if (di) throw di;

      if (guests.length) {
        const { error } = await supabase.from("event_guests").insert(
          guests.map((g, i) => ({
            event_id: eventId, name: g.name.trim(), image_url: g.image_url, designation: g.designation.trim() || null,
            organization: g.organization.trim() || null, role: g.role, sort_order: i,
          })),
        );
        if (error) throw error;
      }
      const imgs = gallery.filter((g) => g.url);
      if (imgs.length) {
        const { error } = await supabase.from("event_images").insert(imgs.map((g, i) => ({ event_id: eventId, image_url: g.url!, sort_order: i })));
        if (error) throw error;
      }

      toast.success(status === "published" ? (mode === "create" ? "Huddle published 🔥" : "Changes saved") : "Draft saved");
      onSaved(eventId);
    } catch (e) {
      const msg = (e as Error).message || "Could not save";
      toast.error(/row-level security/i.test(msg) ? "You're not allowed to do that (organizer role required)" : msg);
    } finally {
      setSaving(null);
    }
  };

  const isPublished = initial?.status === "published";

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(isPublished ? "keep" : "published"); }} className="space-y-4">
      {/* ------------------------------------------------ basics */}
      <Section icon={<Sparkles className="h-4 w-4" />} title="Basic details">
        <Field label="Event name" required>
          <input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="brutal-input" placeholder="ex: Builders Meetup #04" />
        </Field>
        <Field label="Short tagline">
          <input maxLength={160} value={tagline} onChange={(e) => setTagline(e.target.value)} className="brutal-input" placeholder="one line — why should a builder show up?" />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="brutal-input min-h-[180px] resize-y" placeholder={"What's happening, who it's for, what to bring, schedule…"} />
        </Field>
      </Section>

      {/* ------------------------------------------------ date & time */}
      <Section icon={<CalendarDays className="h-4 w-4" />} title="Date & time">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Event date" required>
            <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="brutal-input" />
          </Field>
          <Field label="Start time" required>
            <input required type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="brutal-input" />
          </Field>
          <Field label="End time" required>
            <input required type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="brutal-input" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="End date (only if multi-day)">
            <input type="date" value={endDate} min={date || undefined} onChange={(e) => setEndDate(e.target.value)} className="brutal-input" />
          </Field>
          <Field label="Timezone" required>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="brutal-input">
              {!tzList.includes(timezone) && <option value={timezone}>{timezone}</option>}
              {tzList.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Registration deadline">
              <input type="date" value={deadlineDate} max={date || undefined} onChange={(e) => setDeadlineDate(e.target.value)} className="brutal-input" />
            </Field>
            <Field label="Deadline time">
              <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="brutal-input" disabled={!deadlineDate} />
            </Field>
          </div>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Times are entered in the event's timezone and stored as UTC. Leave the deadline empty to keep registration open until the event starts.
        </p>
      </Section>

      {/* ------------------------------------------------ location */}
      <Section icon={<MapPin className="h-4 w-4" />} title="Location">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Venue name" required>
            <input required value={venue} onChange={(e) => setVenue(e.target.value)} className="brutal-input" placeholder="ex: 91springboard, Koramangala" />
          </Field>
          <Field label="Full address" required>
            <input required value={address} onChange={(e) => setAddress(e.target.value)} className="brutal-input" placeholder="street, landmark, pincode" />
          </Field>
          <Field label="City" required>
            <input required value={city} onChange={(e) => setCity(e.target.value)} className="brutal-input" placeholder="Bangalore" />
          </Field>
          <Field label="State">
            <input value={stateName} onChange={(e) => setStateName(e.target.value)} className="brutal-input" placeholder="Karnataka" />
          </Field>
          <Field label="Country" required>
            <input required value={country} onChange={(e) => setCountry(e.target.value)} className="brutal-input" />
          </Field>
          <Field label="Google Maps link (optional override)">
            <input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} className="brutal-input" placeholder="https://maps.app.goo.gl/…" />
          </Field>
          <Field label="Latitude (optional)">
            <input value={lat} onChange={(e) => setLat(e.target.value)} className="brutal-input" placeholder="12.9352" inputMode="decimal" />
          </Field>
          <Field label="Longitude (optional)">
            <input value={lng} onChange={(e) => setLng(e.target.value)} className="brutal-input" placeholder="77.6245" inputMode="decimal" />
          </Field>
        </div>
        {(venue || address || city) && (
          <a href={getDirectionsUrl(locationPreview)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> test the generated directions link
          </a>
        )}
      </Section>

      {/* ------------------------------------------------ media */}
      <Section icon={<ImageIcon className="h-4 w-4" />} title="Media">
        <Field plain label="Cover image (required to publish)">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative aspect-[16/7] overflow-hidden border-2 border-white/20 bg-ink">
              {coverUrl ? <img src={coverUrl} alt="" className="h-full w-full object-cover" /> : (
                <div className="grid h-full place-items-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">no cover yet</div>
              )}
              {coverUploading && (
                <div className="absolute inset-0 grid place-items-center bg-black/70">
                  <div className="flex items-center gap-2 font-mono text-xs uppercase"><Loader2 className="h-4 w-4 animate-spin text-primary" /> uploading…</div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="brutal-btn brutal-btn-ghost w-full justify-center text-xs">
                <ImageIcon className="h-4 w-4" /> {coverUrl ? "Replace cover" : "Upload cover"}
                <input type="file" accept="image/*" hidden onChange={(e) => pickCover(e.target.files?.[0] ?? null)} />
              </label>
              {coverUrl && (
                <button type="button" onClick={() => setCoverUrl(null)} className="brutal-btn brutal-btn-ghost w-full justify-center text-[10px] text-destructive">
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              )}
              <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">16:9 works best · max 10MB</p>
            </div>
          </div>
        </Field>

        <Field plain label={`Gallery (optional) · ${gallery.filter((g) => g.url).length} image${gallery.length === 1 ? "" : "s"}`}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {gallery.map((g, i) => (
              <div key={g.key} className="group relative aspect-square overflow-hidden border-2 border-white/20 bg-ink">
                {g.url ? <img src={g.url} alt="" className="h-full w-full object-cover" /> : (
                  <div className="grid h-full place-items-center"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
                )}
                {g.url && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => moveGallery(i, -1)} className="p-0.5 hover:text-primary" aria-label="Move earlier"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setGallery((x) => x.filter((y) => y.key !== g.key))} className="p-0.5 hover:text-destructive" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => moveGallery(i, 1)} className="p-0.5 hover:text-primary" aria-label="Move later"><ChevronDown className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
            <label className="grid aspect-square cursor-pointer place-items-center border-2 border-dashed border-white/30 text-muted-foreground hover:border-primary hover:text-primary">
              <Plus className="h-5 w-5" />
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { addGallery(e.target.files); e.currentTarget.value = ""; }} />
            </label>
          </div>
          {gallery.some((g) => g.uploading) && (
            <div className="mt-2">
              <div className="h-1.5 w-full border border-white/20 bg-ink">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.round((gallery.filter((g) => g.url).length / gallery.length) * 100)}%` }} />
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                uploading {gallery.filter((g) => g.url).length}/{gallery.length}
              </div>
            </div>
          )}
        </Field>
      </Section>

      {/* ------------------------------------------------ guests */}
      <Section
        icon={<Users className="h-4 w-4" />}
        title="Special guests & mentors"
        action={<button type="button" onClick={addGuest} className="brutal-btn brutal-btn-ghost px-3 py-1.5 text-[10px]"><UserPlus className="h-3.5 w-3.5" /> Add person</button>}
      >
        {guests.length === 0 ? (
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">No guests yet. Add mentors, speakers, chief guests, panelists…</p>
        ) : (
          <div className="space-y-3">
            {guests.map((g, i) => (
              <div key={g.key} className="grid gap-3 border-2 border-white/15 bg-ink/40 p-3 md:grid-cols-[88px_1fr_auto]">
                <label className="relative block h-[88px] w-[88px] cursor-pointer overflow-hidden border-2 border-white/30 bg-ink">
                  {g.image_url ? <img src={g.image_url} alt="" className="h-full w-full object-cover" /> : (
                    <div className="grid h-full place-items-center text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
                  )}
                  {g.uploading && <div className="absolute inset-0 grid place-items-center bg-black/70"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>}
                  <input type="file" accept="image/*" hidden onChange={(e) => pickGuestPhoto(g.key, e.target.files?.[0] ?? null)} />
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input required value={g.name} onChange={(e) => updateGuest(g.key, { name: e.target.value })} className="brutal-input py-2 text-xs" placeholder="Full name *" />
                  <select value={g.role} onChange={(e) => updateGuest(g.key, { role: e.target.value })} className="brutal-input py-2 text-xs">
                    {GUEST_ROLES.map((r) => <option key={r} value={r}>{GUEST_ROLE_LABEL[r]}</option>)}
                  </select>
                  <input value={g.designation} onChange={(e) => updateGuest(g.key, { designation: e.target.value })} className="brutal-input py-2 text-xs" placeholder="Designation (Senior AI Engineer)" />
                  <input value={g.organization} onChange={(e) => updateGuest(g.key, { organization: e.target.value })} className="brutal-input py-2 text-xs" placeholder="Organization (Google)" />
                </div>
                <div className="flex items-start gap-1 md:flex-col">
                  <GripVertical className="hidden h-4 w-4 text-muted-foreground md:block" />
                  <button type="button" onClick={() => moveGuest(i, -1)} className="border-2 border-white/20 p-1 hover:border-white" aria-label="Move up"><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => moveGuest(i, 1)} className="border-2 border-white/20 p-1 hover:border-white" aria-label="Move down"><ChevronDown className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => setGuests((x) => x.filter((y) => y.key !== g.key))} className="border-2 border-white/20 p-1 text-destructive hover:border-destructive" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ------------------------------------------------ registration */}
      <Section icon={<Ticket className="h-4 w-4" />} title="Registration">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Maximum capacity (blank = unlimited)">
            <input value={capacity} onChange={(e) => setCapacity(e.target.value)} className="brutal-input" placeholder="100" inputMode="numeric" />
          </Field>
          <label className="flex items-center gap-3 self-end border-2 border-white/20 p-3">
            <input type="checkbox" checked={registrationEnabled} onChange={(e) => setRegistrationEnabled(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">Registration enabled</span>
          </label>
        </div>
      </Section>

      {/* ------------------------------------------------ publish */}
      <div className="sticky bottom-[calc(5.8rem+env(safe-area-inset-bottom))] z-10 md:bottom-4">
        <div className="brutal-card-flat flex flex-col gap-2 border-white bg-card/95 p-3 backdrop-blur-sm sm:flex-row">
          {isPublished ? (
            <>
              <button type="submit" disabled={!!saving || anyUploading} className="brutal-btn flex-1 justify-center py-3">
                {saving === "keep" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
              </button>
              <button type="button" disabled={!!saving || anyUploading} onClick={() => save("draft")} className="brutal-btn brutal-btn-ghost justify-center py-3 text-xs">
                Unpublish to draft
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={!!saving || anyUploading} onClick={() => save("draft")} className="brutal-btn brutal-btn-ghost flex-1 justify-center py-3">
                {saving === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
              </button>
              <button type="submit" disabled={!!saving || anyUploading} className="brutal-btn flex-1 justify-center py-3">
                {saving === "published" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Publish event
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

function Section({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="brutal-card-flat space-y-4 p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-black uppercase tracking-tight">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, required, plain }: { label: string; children: React.ReactNode; required?: boolean; plain?: boolean }) {
  const Tag: "label" | "div" = plain ? "div" : "label";
  return (
    <Tag className="block">
      <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}{required && <span className="text-primary">*</span>}
      </span>
      {children}
    </Tag>
  );
}
