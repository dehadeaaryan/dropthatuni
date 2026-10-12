<script lang="ts">
  import { UserRound, LogOut } from 'lucide-svelte';
  import { authClient } from '$lib/auth-client';
  import { workspace, snapshot, saveWorkspace } from '$lib/workspace.svelte';
  import Dialog from './Dialog.svelte';
  import ReminderSettings from './ReminderSettings.svelte';
  import Documents from './Documents.svelte';
  let tab = $state('profile'), busy = $state(false), message = $state('');
  function open() {
    if (!workspace.user) { window.location.assign('/login?next=' + encodeURIComponent(window.location.pathname === '/import' ? '/import' : '/workspace')); return; }
    workspace.modal = 'profile'; message = '';
  }
  async function logout() {
    busy = true; message = '';
    try {
      if (!await saveWorkspace(snapshot())) { message = 'Save your changes before logging out.'; return; }
      workspace.loaded = false;
      const result = await authClient.signOut();
      if (result.error) { message = 'Could not log out. Please try again.'; workspace.loaded = true; return; }
      workspace.user = null; workspace.modal = null; window.location.replace('/');
    } catch { message = 'Could not connect. Please try again.'; workspace.loaded = true; }
    finally { busy = false; }
  }
</script>
<button class="profile-button" aria-label="Profile" title={workspace.user?.name || 'Log in'} onclick={open}>
  {#if workspace.user}<span>{workspace.user.name.trim().slice(0, 1).toUpperCase()}</span>{:else}<UserRound size={18} />{/if}
</button>
{#if workspace.user && workspace.modal === 'profile'}
  <Dialog title="Profile" close={() => { if (!busy) workspace.modal = null; }}>
    <div class="dialog-content">
      <div class="segmented mb-6"><button class:active={tab === 'profile'} onclick={() => tab = 'profile'}>Profile</button><button class:active={tab === 'documents'} onclick={() => tab = 'documents'}>Documents</button></div>
      {#if tab === 'documents'}<Documents />{:else}
        <div class="profile-identity"><span class="profile-initial">{workspace.user.name.slice(0, 1).toUpperCase()}</span><div><h3>{workspace.user.name}</h3><p>{workspace.user.email}</p></div></div>
        <ReminderSettings />
        <button class="secondary-btn w-full justify-center mt-7" disabled={busy} onclick={logout}><LogOut size={16} />{busy ? 'Logging out…' : 'Log out'}</button>
      {/if}
      {#if message}<p class="form-error mt-4" role="alert">{message}</p>{/if}
    </div>
  </Dialog>
{/if}
