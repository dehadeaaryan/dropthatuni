<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { ArrowUpRight, Layers, ClipboardCheck, CalendarDays, CircleCheck, ArrowRight } from 'lucide-svelte';
  import SiteHeader from '$lib/components/SiteHeader.svelte';
  import { workspace, loadWorkspace, saveWorkspace, snapshot } from '$lib/workspace.svelte';
  onMount(() => { void loadWorkspace(); });
  $effect(() => {
    const data = snapshot();
    if (workspace.loaded && workspace.user) { const timer = setTimeout(() => saveWorkspace(data), 250); return () => clearTimeout(timer); }
  });
  async function visit(event: MouseEvent, path: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!workspace.user || await saveWorkspace(snapshot())) window.location.assign(path);
  }
  const steps = [{ label: 'Shortlist', icon: Layers }, { label: 'Prepare', icon: ClipboardCheck }, { label: 'Apply', icon: CalendarDays }, { label: 'Decide', icon: CircleCheck }];
</script>
<svelte:head>
  <title>DropThatUni · Master’s applications</title>
  <meta name="description" content="Track your master's applications, deadlines, documents, fees and decisions in one personal workspace." />
  <link rel="canonical" href={page.url.origin + page.url.pathname} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={page.url.origin + page.url.pathname} />
  <meta property="og:title" content="DropThatUni · Master’s applications" />
  <meta property="og:description" content="Track your master's applications, deadlines, documents, fees and decisions in one personal workspace." />
  <meta property="og:image" content={page.url.origin + '/og-preview.png?v=orange-glass-v1'} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="DropThatUni master’s application tracker preview" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="DropThatUni · Master’s applications" />
  <meta name="twitter:description" content="Track your master's applications, deadlines, documents, fees and decisions in one personal workspace." />
  <meta name="twitter:image" content={page.url.origin + '/og-preview.png?v=orange-glass-v1'} />
</svelte:head>
<div class="ambient" aria-hidden="true"></div>
<SiteHeader />
<main class="landing-page" inert={!workspace.loaded}>
  <section class="landing-hero">
    <div class="landing-copy">
      <h1>One place to manage all your applications<span class="text-accent">.</span></h1>
      <div class="landing-actions">
        <a class="primary-btn" href="/workspace" onclick={(e) => void visit(e, '/workspace')}>Open workspace<ArrowUpRight size={19} /></a>
        <a class="secondary-btn" href="/demo" onclick={(e) => void visit(e, '/demo')}>Try demo<ArrowRight size={17} /></a>
      </div>
    </div>
    <div class="landing-flow glass" aria-label="Application process">
      <ol class="landing-steps">
        {#each steps as step, i}<li><span class="landing-step-number">{i + 1}</span><span class="landing-step-symbol"><step.icon size={23} strokeWidth={1.5} /></span><strong>{step.label}</strong></li>{/each}
      </ol>
    </div>
  </section>
</main>
<footer class="landing-footer">
  <div><p>© {new Date().getFullYear()} DropThatUni</p><nav aria-label="Footer navigation"><a href="/about" onclick={(e) => void visit(e, '/about')}>About</a><a href="/import" onclick={(e) => void visit(e, '/import')}>Import</a><a href="https://aaryandehade.com" target="_blank" rel="noopener noreferrer">Aaryan Dehade ↗</a></nav></div>
</footer>
