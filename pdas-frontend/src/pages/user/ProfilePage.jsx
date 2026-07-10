import { Camera, Loader2, Save, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { userService } from "../../services/userService";

export default function ProfilePage() {
  const { user, refreshSession } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [avatarSrc, setAvatarSrc] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!user?.avatar_url) return undefined;
    let active = true;
    userService.getAvatar(user.avatar_url).then((url) => active && setAvatarSrc(url)).catch(() => {});
    return () => { active = false; };
  }, [user?.avatar_url]);
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try { await userService.updateProfile({ full_name: fullName.trim() }); await refreshSession(); toast.success("Profile updated.", { id: "profile-updated" }); }
    catch { toast.error("Could not update profile.", { id: "profile-update-error" }); }
    finally { setSaving(false); }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const response = await userService.uploadAvatar(file); const src = await userService.getAvatar(response.avatar_url); setAvatarSrc(src); await refreshSession(); toast.success("Avatar updated.", { id: "avatar-updated" }); }
    catch { toast.error("Could not upload avatar.", { id: "avatar-update-error" }); }
    finally { setUploading(false); event.target.value = ""; }
  };
  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-6"><h1 className="text-3xl font-extrabold dark:text-white">Profile</h1><p className="mt-2 text-slate-500">Manage your identity and account details.</p></div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-6 border-b border-slate-100 pb-8 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl bg-cyber-50 text-cyber-600">{avatarSrc ? <img src={avatarSrc} alt="Current avatar" className="h-full w-full object-cover" /> : <UserRound size={42} />}</div>
          <div><h2 className="font-extrabold dark:text-white">Profile photo</h2><p className="mt-1 text-sm text-slate-500">PNG or JPEG, up to the server upload limit.</p><label className="mt-4 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"><input type="file" accept="image/png,image/jpeg" onChange={upload} className="sr-only" disabled={uploading} />{uploading ? <Loader2 className="animate-spin" size={17} /> : <Camera size={17} />}Upload avatar</label></div>
        </div>
        <form onSubmit={save} className="mt-8 space-y-5">
          <label className="block text-sm font-bold">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={100} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 outline-none focus:border-cyber-500 focus:ring-4 focus:ring-cyber-500/10 dark:border-slate-700 dark:bg-slate-950" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Email<input value={user?.email || ""} disabled className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-slate-500 dark:border-slate-700 dark:bg-slate-800" /></label><label className="block text-sm font-bold">Username<input value={user?.username || ""} disabled className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-slate-500 dark:border-slate-700 dark:bg-slate-800" /></label></div>
          <button disabled={saving || !fullName.trim()} className="flex min-h-11 items-center gap-2 rounded-xl bg-cyber-600 px-5 font-bold text-white hover:bg-cyber-700 disabled:opacity-50">{saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}Save changes</button>
        </form>
      </div>
    </section>
  );
}
