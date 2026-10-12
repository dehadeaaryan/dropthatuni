<script lang="ts">
  import { onMount } from 'svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import { authClient } from '$lib/auth-client';
  import { workspace, loadWorkspace, saveWorkspace, snapshot } from '$lib/workspace.svelte';
  let { data } = $props();
  let mode = $state<'login' | 'signup'>('login'), name = $state(''), email = $state(''), password = $state(''), keepWorkspace = $state(true), busy = $state(false), message = $state('');
  onMount(() => { void loadWorkspace(); });
  async function submit() {
    busy = true; message = '';
    try {
      const result = mode === 'signup' ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password }) : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) { message = result.error.message || 'Could not log in.'; return; }
      const loaded = await loadWorkspace(mode === 'signup' && keepWorkspace);
      if (!loaded || !workspace.user || !await saveWorkspace(snapshot())) { message = 'Could not load your workspace. Please try again.'; return; }
      window.location.replace(data.next);
    } catch { message = 'Could not connect. Please try again.'; }
    finally { busy = false; }
  }
</script>
<svelte:head><title>DropThatUni · Log in</title></svelte:head>
<div class="ambient" aria-hidden="true"></div>
<SiteHeader />
{#if workspace.loaded}
<main class="login-page">
  <section class="glass import-card">
    <h1 class="text-2xl font-bold mb-7">{mode === 'login' ? 'Log in' : 'Create account'}<span class="text-accent">.</span></h1>
    <form class="grid gap-5" onsubmit={(e) => { e.preventDefault(); void submit(); }}>
      {#if mode === 'signup'}<label class="field-label">Name<input class="field-input" bind:value={name} required autocomplete="name" maxlength="100" /></label>{/if}
      <label class="field-label">Email<input class="field-input" type="email" bind:value={email} required autocomplete="email" maxlength="254" /></label>
      <label class="field-label">Password<input class="field-input" type="password" bind:value={password} required minlength={mode === 'signup' ? 10 : 1} maxlength="128" autocomplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>
      {#if mode === 'signup' && workspace.applications.length}<label class="flex items-center gap-2 text-xs text-muted"><input type="checkbox" bind:checked={keepWorkspace} />Import previous browser workspace</label>{/if}
      <button class="primary-btn justify-center" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
      <button type="button" class="text-btn justify-center" disabled={busy} onclick={() => { mode = mode === 'login' ? 'signup' : 'login'; message = ''; }}>{mode === 'login' ? 'Create an account' : 'Already have an account? Log in'}</button>
      {#if message}<p class="form-error" role="alert">{message}</p>{/if}
    </form>
  </section>
</main>

{/if}
