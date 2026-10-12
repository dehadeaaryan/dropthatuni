<script lang="ts">
  import { onMount } from 'svelte';
  import { Copy, Upload, Download, ArrowLeft } from 'lucide-svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import WorkspaceDialogs from '$lib/components/WorkspaceDialogs.svelte';
  import { workspace, loadWorkspace, saveWorkspace, snapshot, restoreWorkspace, exportWorkspace } from '$lib/workspace.svelte';
  import { parseWorkspaceFile, mergeWorkspaces, createAiPrompt } from '$lib/import-workspace';
  import type { WorkspaceData } from '$lib/model';
  let prompt = createAiPrompt(), incoming = $state<WorkspaceData | null>(null), fileName = $state(''), mode = $state('merge'), message = $state(''), busy = $state(false), copied = $state(false);
  let input = $state<HTMLInputElement>();
  onMount(() => {
    void loadWorkspace();
    const recheck = (event: PageTransitionEvent) => { if (event.persisted) { workspace.loaded = false; void loadWorkspace(); } };
    window.addEventListener('pageshow', recheck);
    return () => window.removeEventListener('pageshow', recheck);
  });
  $effect(() => {
    const data = snapshot();
    if (workspace.loaded && workspace.user) { const timer = setTimeout(() => saveWorkspace(data), 250); return () => clearTimeout(timer); }
  });
  async function choose() {
    const file = input?.files?.[0]; incoming = null; message = '';
    if (!file) return;
    try { if (file.size > 2_000_000) throw new Error('Choose a JSON file up to 2 MB.'); incoming = parseWorkspaceFile(await file.text()); fileName = file.name; }
    catch (cause) { message = cause instanceof Error ? cause.message : 'Could not read the file.'; }
    if (input) input.value = '';
  }
  async function apply() {
    if (!incoming) return;
    busy = true; message = '';
    try {
      if (!await saveWorkspace(snapshot())) throw new Error('Save your current workspace before importing.');
      const current = parseWorkspaceFile(snapshot());
      const next = mode === 'merge' ? mergeWorkspaces(current, incoming) : incoming;
      if (mode === 'replace') exportWorkspace();
      if (!await restoreWorkspace(next)) throw new Error('Could not save the import. Your previous workspace has been restored.');
      incoming = null; message = 'Workspace imported.';
    } catch (cause) { message = cause instanceof Error ? cause.message : 'Import failed.'; }
    finally { busy = false; }
  }
  async function copyPrompt() { try { await navigator.clipboard.writeText(prompt); copied = true; } catch { message = 'Select and copy the prompt below.'; } }
</script>
<svelte:head><title>DropThatUni · Import</title></svelte:head>
<div class="ambient" aria-hidden="true"></div>
<SiteHeader />
{#if workspace.loaded && workspace.user}
<main class="import-page" inert={!workspace.loaded}>
  <div class="page-heading"><h1>Import<span class="text-accent">.</span></h1><a class="secondary-btn" href="/workspace"><ArrowLeft size={15} />Workspace</a></div>
  <section class="glass import-card">
    <div class="section-heading"><h2>AI prompt</h2><button class="secondary-btn" onclick={copyPrompt}><Copy size={15} />{copied ? 'Copied' : 'Copy prompt'}</button></div>
    <p class="text-sm text-muted mb-5">Give this prompt to your local AI, then upload its JSON file.</p>
    <textarea class="field-input ai-prompt" aria-label="Workspace AI prompt" readonly value={prompt}></textarea>
  </section>
  <section class="glass import-card">
    <div class="section-heading"><h2>Import or restore</h2><button class="text-btn" onclick={exportWorkspace}><Download size={15} />Export current</button></div>
    <input class="sr-only" bind:this={input} aria-label="Workspace JSON file" type="file" accept=".json,application/json" onchange={() => void choose()} />
    <button class="secondary-btn" disabled={busy} onclick={() => input?.click()}><Upload size={15} />Choose JSON file</button>
    {#if incoming}
      <div class="import-preview"><strong>{fileName}</strong><span>{incoming.applications.length} programs · {incoming.fields.length} fields · {incoming.fees?.length || 0} fees</span></div>
      <div class="flex gap-5 flex-wrap text-sm my-5"><label class="flex items-center gap-2"><input type="radio" bind:group={mode} value="merge" />Merge</label><label class="flex items-center gap-2"><input type="radio" bind:group={mode} value="replace" />Replace / restore</label></div>
      <p class="text-xs text-muted mb-5">{mode === 'merge' ? 'Matching programs are updated. Existing programs and document links are kept.' : 'Replaces programs, fees, fields and preferences. Your current workspace downloads as a backup. Documents stay in your library; application links require matching IDs.'}</p>
      <button class="primary-btn" disabled={busy} onclick={apply}>{busy ? 'Importing…' : mode === 'merge' ? 'Merge workspace' : 'Restore workspace'}</button>
    {/if}
    {#if message}<p class="text-sm mt-4" role="status">{message}</p>{/if}
    {#if workspace.notice}<p class="form-error mt-4" role="alert">{workspace.notice}</p>{/if}
  </section>
</main>
<WorkspaceDialogs />

{/if}

{#if workspace.loaded && !workspace.user && workspace.notice}
<main class="import-page"><section class="glass import-card"><p role="alert">{workspace.notice}</p><button class="secondary-btn mt-5" onclick={() => void loadWorkspace()}>Retry</button></section></main>
{/if}
