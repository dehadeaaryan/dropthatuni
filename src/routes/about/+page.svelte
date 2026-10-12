<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeft } from 'lucide-svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import { workspace, loadWorkspace, saveWorkspace, snapshot } from '$lib/workspace.svelte';
  onMount(() => { void loadWorkspace(); });
  $effect(() => {
    const data = snapshot();
    if (workspace.loaded && workspace.user) { const timer = setTimeout(() => saveWorkspace(data), 250); return () => clearTimeout(timer); }
  });
</script>
<svelte:head><title>DropThatUni · About</title></svelte:head>
<div class="ambient" aria-hidden="true"></div>
<SiteHeader />
<main class="import-page" inert={!workspace.loaded}>
  <div class="page-heading"><h1>About<span class="text-accent">.</span></h1><a class="secondary-btn" href="/workspace"><ArrowLeft size={15} />Workspace</a></div>
  <section class="glass import-card">
    <h2 class="mb-5">DropThatUni</h2>
    <div class="text-sm text-muted leading-relaxed">
      <p>A personal workspace for your master’s applications.</p>
      <p class="mt-4">Track programs, deadlines, requirements, fees, documents and decisions.</p>
      <p class="mt-4">Your workspace is saved to your account.</p>
      <p class="mt-4">Check admissions information against official sources.</p>
      <a href="https://aaryandehade.com" target="_blank" rel="noopener noreferrer" class="text-btn mt-5">More by Aaryan ↗</a>
    </div>
  </section>
</main>
